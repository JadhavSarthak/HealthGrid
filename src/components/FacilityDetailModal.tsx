import React from 'react';
import { X, Building2, Shield, Users, Bed, Wifi, Clock, AlertTriangle, Truck, CheckCircle2 } from 'lucide-react';
import { PhcNode } from '../data/mockPhcData';

interface Props {
  node: PhcNode | null;
  onClose: () => void;
  onInitiateTransfer: (nodeId: string) => void;
}

export default function FacilityDetailModal({ node, onClose, onInitiateTransfer }: Props) {
  if (!node) return null;

  const isCritical = node.isCritical || node.currentStockDays < 7;
  const isWarehouse = node.type === 'warehouse';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <span>{node.id}</span>
              <span>·</span>
              <span>{node.district}, {node.state}</span>
              <span>·</span>
              <span className="uppercase text-slate-700 font-bold">{node.type}</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mt-1">{node.name}</h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 flex-1 text-xs">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-sans">STOCK BUFFER</span>
              <span className={`text-base font-bold ${isCritical ? 'text-rose-600' : 'text-slate-900'}`}>
                {node.currentStockDays} Days
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-sans">STOCKOUT RISK</span>
              <span className={`text-base font-bold ${isCritical ? 'text-rose-600' : 'text-slate-900'}`}>
                {(node.stockOutRisk * 100).toFixed(0)}%
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-sans">STAFF ON DUTY</span>
              <span className="text-base font-bold text-slate-900">
                {node.staffPresent} / {node.staffSanctioned}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-sans">BED OCCUPANCY</span>
              <span className="text-base font-bold text-slate-900">
                {node.bedsOccupied} / {node.bedsTotal || 0}
              </span>
            </div>
          </div>

          {/* Operational Status */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                <Wifi className="h-4 w-4" />
              </div>
              <div>
                <div className="font-semibold text-slate-900 capitalize">
                  {node.connectivityStatus} Telemetry Connection
                </div>
                <div className="text-[11px] text-slate-500">
                  Last successful heartbeat sync: {node.lastSyncMinutesAgo} minutes ago
                </div>
              </div>
            </div>

            <span className={`font-semibold ${
              node.connectivityStatus === 'online' ? 'text-emerald-700' : 'text-amber-700'
            }`}>
              {node.connectivityStatus === 'online' ? 'Real-Time' : 'Local Queue'}
            </span>
          </div>

          {/* Medicine Inventory Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900">Facility Medicine Inventory</h4>
              <span className="text-[11px] text-slate-500">Live operational stock</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left font-mono">
                <thead className="bg-slate-50 text-slate-600 font-medium font-sans border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Medicine</th>
                    <th className="py-2.5 px-3 text-right">Available Qty</th>
                    <th className="py-2.5 px-3 text-right">Reserved</th>
                    <th className="py-2.5 px-3 text-right">Daily Use</th>
                    <th className="py-2.5 px-3 text-right">Buffer Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {node.inventory.map((inv) => {
                    const daysLeft = (inv.quantity / (inv.consumptionPerDay || 1)).toFixed(1);
                    const isLow = +daysLeft < 7;
                    return (
                      <tr key={inv.medicineId} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-sans font-medium text-slate-900">
                          {inv.medicineName}
                          <span className="block text-[10px] text-slate-400 font-mono">
                            {inv.medicineId} · Expiry: {inv.expiryDate}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          {inv.quantity} {inv.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-500">
                          {inv.reservedQuantity || 0}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600">
                          {inv.consumptionPerDay || 0}/day
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={`font-bold ${isLow ? 'text-rose-600' : 'text-emerald-700'}`}>
                            {daysLeft}d
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Node ID: <code className="font-mono text-slate-700">{node.id}</code>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onInitiateTransfer(node.id);
              }}
              className="py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Truck className="h-3.5 w-3.5" />
              <span>Initiate Stock Transfer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
