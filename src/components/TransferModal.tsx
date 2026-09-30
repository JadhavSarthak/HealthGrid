import React, { useState } from 'react';
import { X, Truck, Shield, AlertTriangle, CheckCircle2, RefreshCw, Lock } from 'lucide-react';
import { PhcNode } from '../data/mockPhcData';
import { executeTransferTransaction } from '../firebase/service';

interface Props {
  nodes: PhcNode[];
  initialTargetNodeId?: string;
  onClose: () => void;
  onSuccess: (targetDistrict: string, qty: number, hash: string) => void;
}

export default function TransferModal({ nodes, initialTargetNodeId, onClose, onSuccess }: Props) {
  const warehouses = nodes.filter((n) => n.type === 'warehouse');
  const phcs = nodes.filter((n) => n.type !== 'warehouse');

  const [sourceId, setSourceId] = useState<string>(warehouses[0]?.id || 'WH-WARDHA');
  const [targetId, setTargetId] = useState<string>(initialTargetNodeId || phcs[0]?.id || 'PHC-BALLARPUR');
  const [medicineId, setMedicineId] = useState<string>('MED-01');
  const [quantity, setQuantity] = useState<number>(1200);
  const [officerId, setOfficerId] = useState<string>('DR-VIKRAM-PATIL-DHO-0941');
  const [notes, setNotes] = useState<string>('Dengue surge response. Immediate dispatch via NH-353 corridor authorized.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sourceNode = nodes.find((n) => n.id === sourceId);
  const targetNode = nodes.find((n) => n.id === targetId);
  const sourceMed = sourceNode?.inventory.find((i) => i.medicineId === medicineId);

  // Donor safety buffer calculations
  const sourceCurrentQty = sourceMed?.quantity || 0;
  const sourceDailyConsumption = sourceMed?.consumptionPerDay || 100;
  const sourceBufferDaysBefore = sourceCurrentQty / sourceDailyConsumption;
  const sourceQtyAfter = sourceCurrentQty - quantity;
  const sourceBufferDaysAfter = sourceQtyAfter / sourceDailyConsumption;
  const isDonorBufferViolated = sourceBufferDaysAfter < 14;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDonorBufferViolated) {
      setErrorMessage(`Donor protection violation: Remaining buffer (${sourceBufferDaysAfter.toFixed(1)}d) is below the mandatory 14-day threshold.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const idempotencyKey = `IDEMP-TRANSFER-${Date.now()}`;
    const transferId = `TXN-${Date.now().toString().slice(-6)}`;

    try {
      const result = await executeTransferTransaction({
        transferId,
        sourceDepotId: sourceId,
        destinationDistrict: targetNode?.district || 'Chandrapur',
        medicineId,
        quantity,
        officerId,
        notes,
        idempotencyKey
      });

      onSuccess(targetNode?.district || 'Chandrapur', quantity, result.hash);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Transaction failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <span>CONSEQUENTIAL REDISTRIBUTION</span>
              <span>·</span>
              <span>OR-TOOLS & FIRESTORE TRANSACTION</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mt-1">
              Authorize Consequential Supply Transfer
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs flex-1">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Node Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Source Donor Warehouse
              </label>
              <select
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.district})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Recipient Health Centre
              </label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              >
                {phcs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.district}) - {p.currentStockDays}d left
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Medicine & Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Medicine Commodity
              </label>
              <select
                value={medicineId}
                onChange={(e) => setMedicineId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="MED-01">IV Normal Saline 500ml</option>
                <option value="MED-02">Paracetamol 650mg IP</option>
                <option value="MED-03">ORS Sachets (21.8g)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Transfer Quantity (Units)
              </label>
              <input
                type="number"
                min="100"
                max={sourceCurrentQty}
                step="50"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Donor Protection Safeguard Check */}
          <div className={`p-4 rounded-xl border space-y-2 font-mono ${
            isDonorBufferViolated
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
          }`}>
            <div className="flex items-center justify-between text-xs font-sans font-bold">
              <span className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-emerald-700" />
                Donor Protection Invariant (Section 35.8)
              </span>
              <span className={isDonorBufferViolated ? 'text-rose-700 font-bold' : 'text-emerald-700 font-bold'}>
                {isDonorBufferViolated ? 'VIOLATION' : 'VERIFIED'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-[10px] text-slate-500 block font-sans">CURRENT STOCK</span>
                <span>{sourceCurrentQty} units ({sourceBufferDaysBefore.toFixed(1)}d)</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-sans">RESERVED POST-TX</span>
                <span>{sourceQtyAfter} units</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-sans">BUFFER AFTER DISPATCH</span>
                <span className={`font-bold ${isDonorBufferViolated ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {sourceBufferDaysAfter.toFixed(1)} Days {isDonorBufferViolated ? '(<14d min)' : '(Safe)'}
                </span>
              </div>
            </div>
          </div>

          {/* Digital Signature */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Authorizing Officer Digital ID
              </label>
              <input
                type="text"
                value={officerId}
                onChange={(e) => setOfficerId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Consequential Transfer Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isDonorBufferViolated}
              className="py-2.5 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Committing Firestore Transaction...</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Digitally Sign & Lock Reservation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
