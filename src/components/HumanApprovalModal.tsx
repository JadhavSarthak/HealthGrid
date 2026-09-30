import React, { useState } from 'react';
import { Lock, Check, X, ShieldAlert, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

interface HumanApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (officerId: string, notes: string) => void;
  proposalDetails: {
    sourceDepot: string;
    destinationCluster: string;
    medicineName: string;
    quantity: number;
    unit: string;
    etaHours: number;
    donorBufferRemainingDays: number;
    projectedStockoutRiskDrop: string;
    idempotencyKey: string;
  };
}

export default function HumanApprovalModal({
  isOpen,
  onClose,
  onApprove,
  proposalDetails
}: HumanApprovalModalProps) {
  const [officerId, setOfficerId] = useState('DHO-MH-CHANDRAPUR-8492');
  const [officerName, setOfficerName] = useState('Dr. Vinayak Patil (District Health Officer)');
  const [notes, setNotes] = useState('Verified donor buffer in Wardha. Approved priority dispatch for Chandrapur cluster.');
  const [acknowledgedSafety, setAcknowledgedSafety] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acknowledgedSafety) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onApprove(officerId, notes);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">
                Section 35.2 Human Authority Rule
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Consequential Movement Authorization
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Warning Badge */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
          <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Legal Accountability Notice:</strong> In accordance with HealthGrid governance, AI agents cannot authorize physical stock transfers. Your authenticated digital sign-off commits physical vehicles and reserves donor stock in the warehouse ledger.
          </p>
        </div>

        {/* Transfer Proposal Parameters */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/90 space-y-2.5 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200 text-slate-700">
            <span>Donor Source:</span>
            <strong className="text-slate-900 font-mono">{proposalDetails.sourceDepot}</strong>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-200 text-slate-700">
            <span>Destination:</span>
            <strong className="text-slate-900 font-mono">{proposalDetails.destinationCluster}</strong>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-200 text-slate-700">
            <span>Commodity & Quantity:</span>
            <strong className="text-emerald-700 font-mono">
              {proposalDetails.quantity.toLocaleString()} {proposalDetails.unit} ({proposalDetails.medicineName})
            </strong>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-200 text-slate-700">
            <span>Donor Safety Buffer After Transfer:</span>
            <strong className="text-emerald-700 font-mono">{proposalDetails.donorBufferRemainingDays} Days (Compliant &gt;14d)</strong>
          </div>
          <div className="flex justify-between items-center text-slate-700">
            <span>Projected Risk Reduction:</span>
            <strong className="text-emerald-700 font-mono">{proposalDetails.projectedStockoutRiskDrop}</strong>
          </div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-600 block mb-1 font-medium">Signing Officer Designation</label>
            <input
              type="text"
              value={officerName}
              disabled
              className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2 text-slate-700 cursor-not-allowed font-medium"
            />
          </div>

          <div>
            <label className="text-slate-600 block mb-1 font-medium">Operational Authorization Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>

          <label className="flex items-start gap-2.5 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={acknowledgedSafety}
              onChange={(e) => setAcknowledgedSafety(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 mt-0.5"
            />
            <span className="text-[11px] text-slate-700 leading-snug">
              I certify that I have reviewed the counterfactual World Simulation and verified that Wardha depot retains $\ge 14$ days of reserve buffer.
            </span>
          </label>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!acknowledgedSafety || isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-white shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
            >
              <Check className="h-4 w-4" />
              {isSubmitting ? 'Committing Reservation...' : 'Authorize & Reserve Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
