import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  runTransaction,
  query,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db, testFirestoreConnection } from './config';
export { testFirestoreConnection };
import { PhcNode, AuditRecord, INITIAL_NODES, INITIAL_AUDIT_LOGS } from '../data/mockPhcData';

const PHCS_COLLECTION = 'phcs';
const AUDIT_COLLECTION = 'audit_ledger';
const TRANSFERS_COLLECTION = 'transfers';
const DEMAND_COLLECTION = 'demand_records';

/**
 * Seeds initial database collections in Firestore if currently empty.
 */
export async function seedInitialFirestoreData(): Promise<void> {
  try {
    const phcSnap = await getDocs(collection(db, PHCS_COLLECTION));
    if (phcSnap.empty) {
      console.log('[HealthGrid] Seeding initial PHC nodes to Firestore...');
      for (const node of INITIAL_NODES) {
        await setDoc(doc(db, PHCS_COLLECTION, node.id), node);
      }
    }

    const auditSnap = await getDocs(collection(db, AUDIT_COLLECTION));
    if (auditSnap.empty) {
      console.log('[HealthGrid] Seeding initial audit ledger to Firestore...');
      for (const log of INITIAL_AUDIT_LOGS) {
        await setDoc(doc(db, AUDIT_COLLECTION, log.eventId), log);
      }
    }
  } catch (err) {
    console.error('[HealthGrid] Error seeding initial Firestore data:', err);
  }
}

/**
 * Subscribe to real-time updates for all PHC nodes.
 */
export function subscribeToPhcs(callback: (nodes: PhcNode[]) => void) {
  const q = collection(db, PHCS_COLLECTION);
  return onSnapshot(
    q,
    (snapshot) => {
      if (!snapshot.empty) {
        const phcs: PhcNode[] = [];
        snapshot.forEach((d) => phcs.push(d.data() as PhcNode));
        callback(phcs);
      }
    },
    (err) => {
      console.warn('[HealthGrid] Firestore onSnapshot warning, fallback to local state:', err);
    }
  );
}

/**
 * Subscribe to real-time immutable audit ledger.
 */
export function subscribeToAuditLogs(callback: (logs: AuditRecord[]) => void) {
  const q = query(collection(db, AUDIT_COLLECTION), limit(25));
  return onSnapshot(
    q,
    (snapshot) => {
      if (!snapshot.empty) {
        const logs: AuditRecord[] = [];
        snapshot.forEach((d) => logs.push(d.data() as AuditRecord));
        // Sort descending
        logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        callback(logs);
      }
    },
    (err) => {
      console.warn('[HealthGrid] Firestore audit snapshot warning:', err);
    }
  );
}

/**
 * Transactional Consequential Stock Transfer & Reservation
 * Enforces Section 35.8 Concurrency & Transaction Safety:
 * Two officers cannot approve the same surplus twice.
 */
export async function executeTransferTransaction(params: {
  transferId: string;
  sourceDepotId: string;
  destinationDistrict: string;
  medicineId: string;
  quantity: number;
  officerId: string;
  notes: string;
  idempotencyKey: string;
}): Promise<{ success: boolean; hash: string }> {
  const sourceRef = doc(db, PHCS_COLLECTION, params.sourceDepotId);
  const transferRef = doc(db, TRANSFERS_COLLECTION, params.transferId);
  const auditRef = doc(db, AUDIT_COLLECTION, `EVT-${Date.now()}`);

  const eventHash = `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 6)}`;

  try {
    await runTransaction(db, async (txn) => {
      const sourceSnap = await txn.get(sourceRef);
      if (!sourceSnap.exists()) {
        throw new Error(`Source depot ${params.sourceDepotId} not found`);
      }

      const sourceData = sourceSnap.data() as PhcNode;
      const invItem = sourceData.inventory.find((i) => i.medicineId === params.medicineId);

      if (!invItem) {
        throw new Error(`Medicine ${params.medicineId} not found in donor depot`);
      }

      const availableQty = invItem.quantity - (invItem.reservedQuantity || 0);
      if (availableQty < params.quantity) {
        throw new Error(`Insufficient surplus: Requested ${params.quantity}, Available ${availableQty}`);
      }

      // Check donor protection (must retain at least safety buffer)
      const bufferDaysAfter = (invItem.quantity - params.quantity) / (invItem.consumptionPerDay || 100);
      if (bufferDaysAfter < 14) {
        throw new Error(`Donor protection violation: Remaining buffer (${bufferDaysAfter.toFixed(1)}d) below 14-day threshold.`);
      }

      // Update donor inventory with reserved quantity
      const updatedInventory = sourceData.inventory.map((i) => {
        if (i.medicineId === params.medicineId) {
          return {
            ...i,
            quantity: i.quantity - params.quantity,
            reservedQuantity: (i.reservedQuantity || 0) + params.quantity
          };
        }
        return i;
      });

      txn.update(sourceRef, {
        inventory: updatedInventory,
        currentStockDays: Math.max(14, +(sourceData.currentStockDays - 6.5).toFixed(1))
      });

      // Record Transfer
      txn.set(transferRef, {
        transferId: params.transferId,
        sourceId: params.sourceDepotId,
        destinationDistrict: params.destinationDistrict,
        medicineId: params.medicineId,
        quantity: params.quantity,
        status: 'approved',
        approvedBy: params.officerId,
        approvedAt: new Date().toISOString(),
        notes: params.notes,
        idempotencyKey: params.idempotencyKey
      });

      // Append immutable audit log
      txn.set(auditRef, {
        eventId: auditRef.id,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
        actor: params.officerId,
        role: 'District Public Health Officer',
        action: `Consequential transfer authorized: ${params.quantity} units to ${params.destinationDistrict}. Donor buffer preserved.`,
        modelIdentifier: 'healthgrid-ortools-v2.1',
        inputSnapshotId: 'SNAP-TRANSACTION-COMMITTED',
        outcome: 'Reservation locked transactionally in Firestore. Dispatch vehicle initiated.',
        hash: eventHash
      });
    });

    return { success: true, hash: eventHash };
  } catch (error) {
    console.error('[HealthGrid] Transaction failed:', error);
    throw error;
  }
}

/**
 * Commit low-connectivity PHC record to Firestore with idempotency key
 */
export async function commitOfflineRecordToFirestore(record: {
  idempotencyKey: string;
  phcId: string;
  details: string;
  type: string;
}) {
  try {
    const recordRef = doc(db, DEMAND_COLLECTION, record.idempotencyKey);
    await setDoc(recordRef, {
      ...record,
      committedAt: new Date().toISOString()
    });
    return true;
  } catch (err) {
    console.error('[HealthGrid] Error syncing offline record:', err);
    return false;
  }
}

/**
 * Push Dengue Shock to Firestore PHCs
 */
export async function updateDengueShockInFirestore(isSurge: boolean, nodesList: PhcNode[]) {
  try {
    for (const node of nodesList) {
      if (node.district === 'Chandrapur') {
        const phcRef = doc(db, PHCS_COLLECTION, node.id);
        await updateDoc(phcRef, {
          isCritical: isSurge,
          currentStockDays: isSurge ? 4.2 : 28.0,
          stockOutRisk: isSurge ? 0.78 : 0.04
        });
      }
    }
  } catch (err) {
    console.warn('[HealthGrid] Error updating shock to Firestore:', err);
  }
}
