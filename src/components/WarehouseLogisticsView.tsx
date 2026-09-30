import React, { useState } from 'react';
import { Truck, AlertTriangle, CheckCircle2, Shield, Clock, MapPin, RefreshCw, ArrowRight } from 'lucide-react';
import { PhcNode, SupplyRouteEdge } from '../data/mockPhcData';

interface Props {
  warehouses: PhcNode[];
  routes: SupplyRouteEdge[];
  onOpenTransferModal: () => void;
  onBlockRoute: () => void;
  isRouteBlocked: boolean;
}

export default function WarehouseLogisticsView({
  warehouses,
  routes,
  onOpenTransferModal,
  onBlockRoute,
  isRouteBlocked
}: Props) {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(warehouses[0]?.id || 'WH-WARDHA');
  const selectedDepot = warehouses.find((w) => w.id === selectedWarehouseId) || warehouses[0];

  return (
    <div className="space-y-6">
      {/* Depots Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {warehouses.map((w) => {
          const isSelected = selectedWarehouseId === w.id;
          const totalStock = w.inventory.reduce((sum, i) => sum + i.quantity, 0);
          const reservedStock = w.inventory.reduce((sum, i) => sum + (i.reservedQuantity || 0), 0);

          return (
            <div
              key={w.id}
              onClick={() => setSelectedWarehouseId(w.id)}
              className={`p-5 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'border-emerald-600 bg-white ring-2 ring-emerald-500/20 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-mono">{w.id}</span>
                <span>{w.district}, {w.state}</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm mt-1">{w.name}</h4>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">AVAILABLE STOCK</span>
                  <span className="font-bold text-slate-900">{totalStock.toLocaleString()} units</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">RESERVED IN TRANSIT</span>
                  <span className="font-bold text-emerald-700">{reservedStock.toLocaleString()} units</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Depot Detail & Active Manifests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Depot Inventory Details */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 lg:col-span-2 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="text-xs text-slate-500 font-mono">REGIONAL SUPPLY DEPOT INVENTORY</div>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">{selectedDepot?.name}</h3>
            </div>

            <button
              onClick={onOpenTransferModal}
              className="py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Truck className="h-3.5 w-3.5" />
              <span>Dispatch Consignment</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-xs text-left font-mono">
              <thead className="bg-slate-50 text-slate-600 font-sans font-medium border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Item Name</th>
                  <th className="py-2.5 px-3 text-right">Physical Quantity</th>
                  <th className="py-2.5 px-3 text-right">Committed Reserved</th>
                  <th className="py-2.5 px-3 text-right">Available Surplus</th>
                  <th className="py-2.5 px-3 text-right">Protected Safety Buffer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedDepot?.inventory.map((inv) => {
                  const available = inv.quantity - (inv.reservedQuantity || 0);
                  const bufferDays = (inv.quantity / (inv.consumptionPerDay || 100)).toFixed(1);

                  return (
                    <tr key={inv.medicineId} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-sans font-medium text-slate-900">
                        {inv.medicineName}
                        <span className="block text-[10px] text-slate-400 font-mono">{inv.medicineId}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {inv.quantity.toLocaleString()} {inv.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-700 font-semibold">
                        {(inv.reservedQuantity || 0).toLocaleString()} {inv.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {available.toLocaleString()} {inv.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">
                        {bufferDays} Days
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Shield className="h-4 w-4 text-emerald-600" />
              <span>Donor buffer protection enforced automatically by OR-Tools linear solver.</span>
            </div>
            <span className="text-slate-400 font-mono text-[11px]">DEPOT-CAPACITY: 88.4%</span>
          </div>
        </div>

        {/* Route Status & Road Corridor Conditions */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900">Supply Route Corridors</h4>
            <span className="text-xs text-slate-500 font-mono">{routes.length} Active Arteries</span>
          </div>

          <div className="space-y-3">
            {routes.slice(0, 4).map((r) => {
              const isBlocked = r.status === 'blocked' || (r.id === 'R-WARDHA-BALLARPUR' && isRouteBlocked);

              return (
                <div
                  key={r.id}
                  className={`p-3 rounded-lg border text-xs space-y-1.5 transition-colors ${
                    isBlocked
                      ? 'border-rose-200 bg-rose-50/50 text-rose-900'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-semibold text-slate-900">{r.id}</span>
                    <span className={isBlocked ? 'text-rose-700 font-bold' : 'text-emerald-700 font-medium'}>
                      {isBlocked ? 'BLOCKED' : 'ACTIVE'}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>{r.distanceKm} km · Base ETA: {r.baseEtaHours}h</span>
                    <span className="capitalize">{r.roadQuality.replace('_', ' ')}</span>
                  </div>

                  {isBlocked && (
                    <div className="pt-1 text-[11px] text-rose-700 font-medium flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      <span>Monsoon landslide on NH-353. Reroute via State Highway 264.</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-2">
            {!isRouteBlocked ? (
              <button
                onClick={onBlockRoute}
                className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                <span>Simulate Monsoon Road Blockage (NH-353)</span>
              </button>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 space-y-1">
                <div className="font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Dynamic Replanning Triggered</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Alternative route selected: SH-264 via Rajura (+1.4 hours transit, 0 stockout breach).
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
