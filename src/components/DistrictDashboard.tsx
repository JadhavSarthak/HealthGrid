import React, { useState } from 'react';
import {
  Building2,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  ArrowRight,
  TrendingDown,
  Clock,
  Layers,
  Truck,
  Plus,
  ArrowUpRight,
  Shield,
  Activity
} from 'lucide-react';
import { PhcNode } from '../data/mockPhcData';

interface Props {
  nodes: PhcNode[];
  onSelectNode: (nodeId: string) => void;
  selectedNodeId: string | null;
  onOpenTransferModal: (targetNodeId?: string) => void;
  onTriggerShock: () => void;
  isShockActive: boolean;
}

export default function DistrictDashboard({
  nodes,
  onSelectNode,
  selectedNodeId,
  onOpenTransferModal,
  onTriggerShock,
  isShockActive
}: Props) {
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState<'all' | 'Maharashtra' | 'Gujarat' | 'Odisha'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'critical' | 'normal' | 'warehouse'>('all');

  const filteredNodes = nodes.filter((n) => {
    const matchesSearch =
      n.name.toLowerCase().includes(search.toLowerCase()) ||
      n.district.toLowerCase().includes(search.toLowerCase()) ||
      n.state.toLowerCase().includes(search.toLowerCase());

    const matchesState = filterState === 'all' || n.state === filterState;

    let matchesStatus = true;
    if (filterStatus === 'critical') matchesStatus = n.isCritical || n.currentStockDays < 7;
    else if (filterStatus === 'normal') matchesStatus = !n.isCritical && n.type !== 'warehouse';
    else if (filterStatus === 'warehouse') matchesStatus = n.type === 'warehouse';

    return matchesSearch && matchesState && matchesStatus;
  });

  const criticalCount = nodes.filter((n) => n.isCritical || n.currentStockDays < 7).length;
  const totalBedsOccupied = nodes.reduce((acc, curr) => acc + curr.bedsOccupied, 0);
  const totalBeds = nodes.reduce((acc, curr) => acc + curr.bedsTotal, 0);

  return (
    <div className="space-y-6">
      {/* Real DHO Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500 font-medium">Monitored Facilities</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">{nodes.length}</span>
            <span className="text-xs text-slate-500">PHC / CHC / Depots</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
            <span>3 States</span>
            <span>·</span>
            <span>Maharashtra / Gujarat / Odisha</span>
          </div>
        </div>

        <div className={`border rounded-xl p-4 transition-colors ${
          criticalCount > 0 ? 'bg-rose-50/50 border-rose-200' : 'bg-white border-slate-200'
        }`}>
          <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>At-Risk Facilities</span>
            {criticalCount > 0 && <span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse"></span>}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono ${criticalCount > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
              {criticalCount}
            </span>
            <span className="text-xs text-slate-500">Stock &lt; 7 Days</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {criticalCount > 0 ? 'Urgent replenishment required' : 'All buffer baselines nominal'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500 font-medium">Cluster Bed Occupancy</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {((totalBedsOccupied / (totalBeds || 1)) * 100).toFixed(0)}%
            </span>
            <span className="text-xs text-slate-500">{totalBedsOccupied} / {totalBeds} Beds</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Surge capacity monitored via federated network
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
          <div className="text-xs text-slate-500 font-medium">Quick Redistribution</div>
          <button
            onClick={() => onOpenTransferModal()}
            className="w-full mt-2 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <Truck className="h-3.5 w-3.5" />
            <span>Initiate Transfer</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search facility by name, district, or state..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* State Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {(['all', 'Maharashtra', 'Gujarat', 'Odisha'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterState(st)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  filterState === st ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'all' ? 'All States' : st}
              </button>
            ))}
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterStatus === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setFilterStatus('critical')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterStatus === 'critical' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Critical Risk
            </button>
            <button
              onClick={() => setFilterStatus('warehouse')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterStatus === 'warehouse' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Depots
            </button>
          </div>
        </div>
      </div>

      {/* Facilities List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNodes.map((node) => {
          const isSelected = selectedNodeId === node.id;
          const isCritical = node.isCritical || node.currentStockDays < 7;
          const isWarehouse = node.type === 'warehouse';

          return (
            <div
              key={node.id}
              onClick={() => onSelectNode(node.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer text-xs flex flex-col justify-between space-y-3 ${
                isSelected
                  ? 'border-emerald-600 bg-white ring-2 ring-emerald-500/20 shadow-sm'
                  : isCritical
                  ? 'border-rose-200 bg-rose-50/20 hover:border-rose-300'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-mono">{node.id}</span>
                  <div className="flex items-center gap-1.5">
                    <span>{node.district}</span>
                    <span>·</span>
                    <span>{node.state}</span>
                  </div>
                </div>

                <div className="mt-1 flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">{node.name}</h4>
                  <span className={`text-[10px] font-semibold uppercase ${
                    isWarehouse ? 'text-indigo-700' : isCritical ? 'text-rose-700' : 'text-emerald-700'
                  }`}>
                    {node.type}
                  </span>
                </div>
              </div>

              {/* Metrics strip */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 font-mono text-[11px]">
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">STOCK BUFFER</span>
                  <span className={`font-bold ${isCritical ? 'text-rose-600' : 'text-slate-900'}`}>
                    {node.currentStockDays}d
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">OUT RISK</span>
                  <span className={`font-bold ${isCritical ? 'text-rose-600' : 'text-slate-900'}`}>
                    {(node.stockOutRisk * 100).toFixed(0)}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">STAFF</span>
                  <span className="text-slate-700 font-medium">
                    {node.staffPresent}/{node.staffSanctioned}
                  </span>
                </div>
              </div>

              {/* Action row */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">
                  Last sync: {node.lastSyncMinutesAgo}m ago
                </span>

                {isCritical ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenTransferModal(node.id);
                    }}
                    className="text-xs font-semibold text-rose-700 hover:text-rose-800 flex items-center gap-1"
                  >
                    <span>Rebalance</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                ) : (
                  <span className="text-[11px] text-emerald-700 font-medium">Nominal</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
