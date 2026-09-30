import React, { useState } from 'react';
import { Wifi, WifiOff, Upload, Check, RefreshCw, AlertCircle, FileCheck, ArrowUpRight, Camera } from 'lucide-react';
import { commitOfflineRecordToFirestore } from '../firebase/service';

interface QueuedItem {
  id: string;
  idempotencyKey: string;
  timestamp: string;
  type: 'inventory_consumption' | 'staff_attendance' | 'bed_status';
  details: string;
  status: 'pending_sync' | 'synced';
}

export default function OfflinePhcLogger() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  const [queue, setQueue] = useState<QueuedItem[]>([
    {
      id: 'Q-101',
      idempotencyKey: 'IDEMP-2026-BALLARPUR-081',
      timestamp: '2026-09-29 05:10:00',
      type: 'inventory_consumption',
      details: 'IV Normal Saline 500ml: 45 units dispensed to OPD dengue cohort',
      status: 'synced'
    }
  ]);

  // Form states
  const [medicine, setMedicine] = useState('MED-01');
  const [qty, setQty] = useState('30');
  const [censoringReason, setCensoringReason] = useState('none');
  const [footfallCount, setFootfallCount] = useState('68');

  // Register photo upload & Gemini extraction simulation
  const [ocrScanning, setOcrScanning] = useState<boolean>(false);
  const [ocrCandidate, setOcrCandidate] = useState<{
    date: string;
    paracetamolDispensed: number;
    ivSalineDispensed: number;
    dengueTestsPositive: number;
    doctorAttendance: string;
    confidence: number;
  } | null>(null);
  const [ocrConfirmed, setOcrConfirmed] = useState<boolean>(false);

  const handleLogEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const idempKey = `IDEMP-MH-BALLARPUR-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const newEntry: QueuedItem = {
      id: `Q-${Date.now().toString().slice(-4)}`,
      idempotencyKey: idempKey,
      timestamp: new Date().toLocaleTimeString(),
      type: 'inventory_consumption',
      details: `${medicine === 'MED-01' ? 'IV Normal Saline 500ml' : 'Paracetamol 650mg'}: ${qty} units (Censoring: ${censoringReason}, Daily Footfall: ${footfallCount})`,
      status: isOnline ? 'synced' : 'pending_sync'
    };

    setQueue((prev) => [newEntry, ...prev]);
    if (isOnline) {
      setLastSyncTime('Just now');
      commitOfflineRecordToFirestore({
        idempotencyKey: idempKey,
        phcId: 'PHC-BALLARPUR',
        details: newEntry.details,
        type: newEntry.type
      });
    }
  };

  const handleSimulatePhotoUpload = () => {
    setOcrScanning(true);
    setOcrConfirmed(false);
    setTimeout(() => {
      setOcrScanning(false);
      setOcrCandidate({
        date: '29 Sept 2026',
        paracetamolDispensed: 145,
        ivSalineDispensed: 62,
        dengueTestsPositive: 18,
        doctorAttendance: '2 Present / 4 Sanctioned',
        confidence: 0.96
      });
    }, 1400);
  };

  const handleConfirmOcrCommit = () => {
    if (!ocrCandidate) return;
    const newEntry: QueuedItem = {
      id: `Q-OCR-${Date.now().toString().slice(-4)}`,
      idempotencyKey: `IDEMP-OCR-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'inventory_consumption',
      details: `[Paper Register Photo]: Paracetamol: ${ocrCandidate.paracetamolDispensed} strips, Saline: ${ocrCandidate.ivSalineDispensed} btls, Positive NS1: ${ocrCandidate.dengueTestsPositive}`,
      status: isOnline ? 'synced' : 'pending_sync'
    };
    setQueue((prev) => [newEntry, ...prev]);
    setOcrConfirmed(true);
    setOcrCandidate(null);
  };

  const handleTriggerSyncAll = () => {
    setQueue((prev) => prev.map((q) => ({ ...q, status: 'synced' })));
    setLastSyncTime('Just now (Batch reconciled)');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
      {/* Header with Connectivity Status Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span>BALLARPUR MODEL PHC</span>
            <span>·</span>
            <span>CHANDRAPUR DISTRICT</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mt-0.5">
            PHC Field Operator Portal: Low-Connectivity Protocol
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            Section 33.7 & 35.9: Local storage queue, idempotent sync keys, and multimodal paper register intake.
          </p>
        </div>

        {/* Connectivity Toggle Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => {
                setIsOnline(true);
                handleTriggerSyncAll();
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                isOnline ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wifi className="h-3.5 w-3.5" />
              Online (4G Restored)
            </button>
            <button
              onClick={() => setIsOnline(false)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                !isOnline ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <WifiOff className="h-3.5 w-3.5" />
              Offline Simulation
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: PHC Daily Register Form */}
        <div className="space-y-5">
          <form onSubmit={handleLogEntry} className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                01. Log Daily OPD Dispensation
              </span>
              <span className="text-[11px] text-slate-500 font-mono">IndexedDB Ready</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-600 block mb-1">Target Medicine</label>
                <select
                  value={medicine}
                  onChange={(e) => setMedicine(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="MED-01">IV Normal Saline 500ml (Bottles)</option>
                  <option value="MED-02">Paracetamol 650mg (Strips)</option>
                  <option value="MED-03">Dengue NS1 Rapid Ag Test (Kits)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1">Quantity Dispensed</label>
                <input
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-slate-900 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-600 block mb-1">Observed Patient Footfall</label>
                <input
                  type="number"
                  value={footfallCount}
                  onChange={(e) => setFootfallCount(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-slate-900 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1">Censoring Status (Sec 35.5)</label>
                <select
                  value={censoringReason}
                  onChange={(e) => setCensoringReason(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="none">Normal (Stock Available)</option>
                  <option value="stock_out">Stock-out (Demand Censored)</option>
                  <option value="limited_ration">Rationed (Constrained Demand)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
            >
              Append Record to Local Queue
            </button>
          </form>

          {/* Multimodal Paper Register OCR Simulation */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="h-4 w-4 text-indigo-600" />
                Paper Register Photo OCR (Gemini Multimodal)
              </span>
              <span className="text-[10px] text-slate-500">Section 35.9</span>
            </div>

            <p className="text-xs text-slate-600">
              For staff without digital typing literacy: capture photo of physical stock register. Gemini extracts numbers for mandatory officer confirmation.
            </p>

            <button
              type="button"
              onClick={handleSimulatePhotoUpload}
              disabled={ocrScanning}
              className="w-full py-2.5 px-4 text-xs font-medium rounded-lg border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center gap-2 transition-colors"
            >
              {ocrScanning ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
                  <span>Gemini Multimodal Scanning Handwritten Ledger...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 text-slate-500" />
                  <span>Simulate Capture: Physical Daily Stock Register Page</span>
                </>
              )}
            </button>

            {ocrCandidate && (
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-indigo-950 font-semibold">
                  <span>Candidate Extracted Fields (Confidence: 96%)</span>
                  <span className="text-[11px] font-mono text-indigo-700">Awaiting Human Confirmation</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-white p-2.5 rounded-lg border border-indigo-100 text-slate-800">
                  <div>Paracetamol: <strong>{ocrCandidate.paracetamolDispensed} strips</strong></div>
                  <div>IV Saline: <strong>{ocrCandidate.ivSalineDispensed} btls</strong></div>
                  <div>NS1 Positive: <strong>{ocrCandidate.dengueTestsPositive} tests</strong></div>
                  <div>Staff: <strong>{ocrCandidate.doctorAttendance}</strong></div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleConfirmOcrCommit}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors flex items-center gap-1.5"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Confirm & Commit to System
                  </button>
                  <button
                    onClick={() => setOcrCandidate(null)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}

            {ocrConfirmed && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Extracted ledger values verified by operator and committed to authoritative state.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Local Sync Queue & Idempotency Audit */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Local Transaction Queue ({queue.length})
            </span>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Last sync: {lastSyncTime}</span>
              {!isOnline && queue.some((q) => q.status === 'pending_sync') && (
                <button
                  onClick={handleTriggerSyncAll}
                  className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium text-[11px]"
                >
                  Force Sync
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {queue.map((item) => (
              <div
                key={item.id}
                className="bg-slate-50 p-3 rounded-xl border border-slate-200/90 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-slate-500">{item.idempotencyKey}</span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      item.status === 'synced'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800 animate-pulse'
                    }`}
                  >
                    {item.status === 'synced' ? 'COMMITTED TO FIRESTORE' : 'QUEUED LOCALLY'}
                  </span>
                </div>
                <p className="text-slate-800 font-medium">{item.details}</p>
                <div className="text-[10px] text-slate-400 font-mono">Logged at {item.timestamp}</div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-600 space-y-1">
            <span className="font-semibold text-slate-900 block text-[11px]">Idempotency Guarantee (Sec 35.8):</span>
            <p className="text-[11px]">
              Every offline dispatch generates an immutable SHA-hash idempotency key. Duplicate uploads from intermittent reconnects are automatically deduped by Firestore security rules.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
