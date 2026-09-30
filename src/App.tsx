import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Truck,
  Cpu,
  Database,
  Shield,
  Layers,
  WifiOff,
  FileText,
  Globe,
  RefreshCw,
  Play,
  ArrowRight,
  Clock,
  Building2,
  Users,
  Check,
  X,
  ChevronRight,
  Info,
  Lock,
  BarChart3,
  Server,
  Network,
  RotateCcw,
  Search,
  Filter,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  Volume2,
  Sparkles,
  Camera
} from 'lucide-react';
import Network3D from './components/Network3D';
import OfflinePhcLogger from './components/OfflinePhcLogger';
import FederatedPanel from './components/FederatedPanel';
import HumanApprovalModal from './components/HumanApprovalModal';
import DistrictDashboard from './components/DistrictDashboard';
import FacilityDetailModal from './components/FacilityDetailModal';
import TransferModal from './components/TransferModal';
import WarehouseLogisticsView from './components/WarehouseLogisticsView';
import GroundedBriefingCard from './components/GroundedBriefingCard';
import PaperRegisterScanner from './components/PaperRegisterScanner';
import SimulationRunner from './components/SimulationRunner';
import {
  INITIAL_NODES,
  INITIAL_ROUTES,
  INITIAL_AUDIT_LOGS,
  PhcNode,
  SupplyRouteEdge,
  AuditRecord
} from './data/mockPhcData';
import {
  testFirestoreConnection,
  seedInitialFirestoreData,
  subscribeToPhcs,
  subscribeToAuditLogs,
  executeTransferTransaction,
  updateDengueShockInFirestore
} from './firebase/service';
import { generateGroundedBriefing, SupportedLanguage } from './services/geminiService';

export type UserRole = 'dho' | 'phc_nurse' | 'logistics';

export default function App() {
  // Navigation & Persona
  const [activeTab, setActiveTab] = useState<'command' | 'field' | 'warehouse' | 'simulation' | 'federated' | 'audit'>('command');
  const [activeRole, setActiveRole] = useState<UserRole>('dho');
  const [spatialViewMode, setSpatialViewMode] = useState<'map' | '3d'>('3d');

  // Application state
  const [nodes, setNodes] = useState<PhcNode[]>(INITIAL_NODES);
  const [routes, setRoutes] = useState<SupplyRouteEdge[]>(INITIAL_ROUTES);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>(INITIAL_AUDIT_LOGS);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('PHC-BALLARPUR');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [initialTransferTargetId, setInitialTransferTargetId] = useState<string | undefined>(undefined);
  const [isFirestoreLive, setIsFirestoreLive] = useState<boolean>(false);

  // Outbreak & Scenario state
  const [currentDemoStep, setCurrentDemoStep] = useState<number>(1);
  const [isDengueSurgeActive, setIsDengueSurgeActive] = useState<boolean>(false);
  const [isRouteBlocked, setIsRouteBlocked] = useState<boolean>(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState<boolean>(false);
  const [isApprovedByOfficer, setIsApprovedByOfficer] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('en');

  // Gemini Briefing State
  const [briefingText, setBriefingText] = useState<string>('');
  const [isGeneratingBrief, setIsGeneratingBrief] = useState<boolean>(false);

  // Initialize Firestore connection & real-time listeners
  useEffect(() => {
    testFirestoreConnection().then((connected: boolean) => {
      setIsFirestoreLive(connected);
      if (connected) {
        seedInitialFirestoreData();
      }
    });

    const unsubPhcs = subscribeToPhcs((freshPhcs) => {
      if (freshPhcs && freshPhcs.length > 0) {
        setNodes(freshPhcs);
      }
    });

    const unsubAudit = subscribeToAuditLogs((freshLogs) => {
      if (freshLogs && freshLogs.length > 0) {
        setAuditLogs(freshLogs);
      }
    });

    return () => {
      unsubPhcs();
      unsubAudit();
    };
  }, []);

  // Generate Gemini Briefing when language changes or Dengue shock triggers
  useEffect(() => {
    setIsGeneratingBrief(true);
    generateGroundedBriefing({
      district: 'Chandrapur',
      affectedPhcsCount: 11,
      stockoutProbabilityPercent: isDengueSurgeActive ? 78.3 : 4.2,
      hoursToStockout: isDengueSurgeActive ? 42.5 : 320,
      sourceDepot: 'Wardha Regional Warehouse',
      transferQuantity: 1200,
      unit: 'bottles (IV Normal Saline 500ml)',
      donorRemainingBufferDays: 18.5,
      language: selectedLanguage
    }).then((text) => {
      setBriefingText(text);
      setIsGeneratingBrief(false);
    });
  }, [selectedLanguage, isDengueSurgeActive, currentDemoStep]);

  // Dengue shock trigger
  const handleTriggerDengueShock = () => {
    setIsDengueSurgeActive(true);
    setCurrentDemoStep(2);

    setNodes((prev) =>
      prev.map((n) => {
        if (n.district === 'Chandrapur') {
          return {
            ...n,
            isCritical: true,
            currentStockDays: Math.max(1.8, +(n.currentStockDays * 0.45).toFixed(1)),
            stockOutRisk: Math.min(0.92, +(n.stockOutRisk * 1.35).toFixed(2))
          };
        }
        return n;
      })
    );

    updateDengueShockInFirestore(true, nodes);
  };

  // Reset scenario
  const handleResetScenario = () => {
    setIsDengueSurgeActive(false);
    setIsApprovedByOfficer(false);
    setIsRouteBlocked(false);
    setCurrentDemoStep(1);
    setNodes(INITIAL_NODES);
    setRoutes(INITIAL_ROUTES);
    updateDengueShockInFirestore(false, INITIAL_NODES);
  };

  // Block route to trigger replan
  const handleBlockRoute = () => {
    setIsRouteBlocked(true);
    setCurrentDemoStep(9);
    setRoutes((prev) =>
      prev.map((r) => {
        if (r.id === 'R-WARDHA-BALLARPUR') {
          return {
            ...r,
            status: 'blocked',
            blockedReason: 'Monsoon landslide on NH-353 corridor'
          };
        }
        return r;
      })
    );
  };

  // Select node for deep-dive
  const handleSelectNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setIsDetailModalOpen(true);
  };

  // Open transfer modal
  const handleOpenTransferModal = (targetNodeId?: string) => {
    setInitialTransferTargetId(targetNodeId);
    setIsTransferModalOpen(true);
  };

  // Consequential transfer success
  const handleTransferSuccess = (targetDistrict: string, qty: number, hash: string) => {
    setIsApprovedByOfficer(true);
    // Update local state for Wardha depot
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id === 'WH-WARDHA') {
          return {
            ...n,
            currentStockDays: 32.5,
            inventory: n.inventory.map((inv) =>
              inv.medicineId === 'MED-01'
                ? { ...inv, quantity: inv.quantity - qty, reservedQuantity: (inv.reservedQuantity || 0) + qty }
                : inv
            )
          };
        }
        return n;
      })
    );
  };

  // Persona switch helper
  const handleRoleChange = (role: UserRole) => {
    setActiveRole(role);
    if (role === 'dho') setActiveTab('command');
    else if (role === 'phc_nurse') setActiveTab('field');
    else if (role === 'logistics') setActiveTab('warehouse');
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];
  const warehouses = nodes.filter((n) => n.type === 'warehouse');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation Bar adhering to Universal Frontend Design Constitution */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Brand & Unboxed Metadata */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-xs">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-900">
                  HealthGrid
                </span>
                <span className="text-xs text-slate-400" aria-hidden="true">·</span>
                <span className="text-xs text-slate-600 font-medium">
                  India PHC Supply Resilience
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                <span>Ministry of Health & Family Welfare</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-700 font-medium">Firestore Connected</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-slate-400">Vertex AI Grounded</span>
              </div>
            </div>
          </div>

          {/* Persona Switcher & Role Selector */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => handleRoleChange('dho')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${activeRole === 'dho' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Dr. V. Patil (DHO)
              </button>
              <button
                onClick={() => handleRoleChange('phc_nurse')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${activeRole === 'phc_nurse' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Sister S. Gaikwad (PHC)
              </button>
              <button
                onClick={() => handleRoleChange('logistics')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${activeRole === 'logistics' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Sh. Deshmukh (Logistics)
              </button>
            </div>

            {/* Quick Outbreak Surge Action */}
            {!isDengueSurgeActive ? (
              <button
                onClick={handleTriggerDengueShock}
                className="py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors whitespace-nowrap"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Simulate Outbreak (+40%)</span>
              </button>
            ) : (
              <button
                onClick={handleResetScenario}
                className="py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Surge</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation Links */}
        <div className="max-w-7xl mx-auto mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('command')}
            className={`px-3.5 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${activeTab === 'command'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            District Command Center
          </button>
          <button
            onClick={() => setActiveTab('field')}
            className={`px-3.5 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${activeTab === 'field'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            PHC Field Station & Register
          </button>
          <button
            onClick={() => setActiveTab('warehouse')}
            className={`px-3.5 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${activeTab === 'warehouse'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Regional Depots & Corridors
          </button>
          <button
            onClick={() => setActiveTab('simulation')}
            className={`px-3.5 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${activeTab === 'simulation'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Outbreak Simulation Engine (9 Steps)
          </button>
          <button
            onClick={() => setActiveTab('federated')}
            className={`px-3.5 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${activeTab === 'federated'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Federated Hub
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${activeTab === 'audit'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Immutable Audit Ledger
          </button>
        </div>
      </header>

      {/* Main Real User Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* TAB 1: DISTRICT COMMAND CENTER (DHO PRIMARY WORKSPACE) */}
        {activeTab === 'command' && (
          <div className="space-y-6">
            {/* Grounded AI Briefing Strip */}
            <GroundedBriefingCard
              briefingText={briefingText}
              isGenerating={isGeneratingBrief}
              selectedLanguage={selectedLanguage}
              onSelectLanguage={setSelectedLanguage}
              onInitiateAction={() => handleOpenTransferModal('PHC-BALLARPUR')}
            />

            {/* Spatial Network Map / 3D Visualization */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                    <span>GEOSPATIAL SUPPLY TOPOLOGY</span>
                    <span>·</span>
                    <span>SECTION 33.6 GRAPH SPECIFICATION</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    District Supply Network & Road Corridors
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
                    <button
                      onClick={() => setSpatialViewMode('3d')}
                      className={`px-3 py-1 rounded-md font-medium transition-colors ${spatialViewMode === '3d' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      3D Spatial View
                    </button>
                    <button
                      onClick={() => setSpatialViewMode('map')}
                      className={`px-3 py-1 rounded-md font-medium transition-colors ${spatialViewMode === 'map' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      District GIS Matrix
                    </button>
                  </div>
                </div>
              </div>

              {spatialViewMode === '3d' ? (
                <div className="rounded-xl overflow-hidden border border-slate-200">
                  <Network3D
                    nodes={nodes}
                    routes={routes}
                    selectedNodeId={selectedNodeId}
                    onSelectNode={handleSelectNode}
                    isDengueSurgeActive={isDengueSurgeActive}
                    isTransferInTransit={isApprovedByOfficer}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  {['Maharashtra (Chandrapur & Wardha)', 'Gujarat (Amreli & Bhavnagar)', 'Odisha (Kalahandi & Rayagada)'].map((cluster, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                      <div className="font-bold text-slate-900">{cluster}</div>
                      <div className="text-slate-500">
                        {nodes.filter((n) => n.state === cluster.split(' ')[0]).length} facilities connected via National Highways & Rural Road corridors.
                      </div>
                      <div className="text-[11px] text-emerald-700 font-medium">
                        Deterministic Graph Connected
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Operational District Dashboard */}
            <DistrictDashboard
              nodes={nodes}
              onSelectNode={handleSelectNode}
              selectedNodeId={selectedNodeId}
              onOpenTransferModal={handleOpenTransferModal}
              onTriggerShock={handleTriggerDengueShock}
              isShockActive={isDengueSurgeActive}
            />
          </div>
        )}

        {/* TAB 2: PHC FIELD STATION & REGISTER (SISTER SUNITA WORKSPACE) */}
        {activeTab === 'field' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                    <span>PHC FIELD STATION</span>
                    <span>·</span>
                    <span>STATION OPERATOR: SISTER SUNITA GAIKWAD</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">
                    Ballarpur Primary Health Centre (Chandrapur District)
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Field-level stock entry, paper ledger digitization, and offline synchronization queue.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-sans">FACILITY CENSUS</span>
                    <span className="text-sm font-bold text-slate-900 font-mono">18 / 24 Beds Occupied</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Multimodal Paper Register Scanner */}
            <PaperRegisterScanner phcName="PHC-BALLARPUR" />

            {/* Offline-First Logger Component */}
            <OfflinePhcLogger />
          </div>
        )}

        {/* TAB 3: REGIONAL DEPOTS & SUPPLY LOGISTICS */}
        {activeTab === 'warehouse' && (
          <div className="space-y-6">
            <WarehouseLogisticsView
              warehouses={warehouses}
              routes={routes}
              onOpenTransferModal={() => handleOpenTransferModal()}
              onBlockRoute={handleBlockRoute}
              isRouteBlocked={isRouteBlocked}
            />
          </div>
        )}

        {/* TAB 4: OUTBREAK SIMULATION ENGINE (FROZEN 9-STEP KILLER SCRIPT) */}
        {activeTab === 'simulation' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                    <span>SECTION 12 & 33.11</span>
                    <span>·</span>
                    <span>FROZEN VERIFICATION SCRIPT</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">
                    End-to-End Dengue Outbreak Resilience Scenario
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Step-by-step verification of prediction, linear optimization, decoupled simulation, human authority sign-off, and dynamic replanning.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetScenario}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset Baseline
                  </button>
                  {currentDemoStep < 9 && (
                    <button
                      onClick={() => setCurrentDemoStep((prev) => Math.min(9, prev + 1))}
                      className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      Advance Step
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Step Tab Buttons */}
              <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
                {[
                  { n: 1, label: 'Baseline' },
                  { n: 2, label: 'Dengue Surge' },
                  { n: 3, label: 'ML Risk' },
                  { n: 4, label: 'OR-Tools' },
                  { n: 5, label: 'World Sim' },
                  { n: 6, label: 'Gemini Brief' },
                  { n: 7, label: 'Human Sign-off' },
                  { n: 8, label: 'Verification' },
                  { n: 9, label: 'Replanning' }
                ].map((s) => (
                  <button
                    key={s.n}
                    onClick={() => {
                      if (s.n === 1) handleResetScenario();
                      else if (s.n === 2) handleTriggerDengueShock();
                      else if (s.n === 9) handleBlockRoute();
                      setCurrentDemoStep(s.n);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${currentDemoStep === s.n
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-xs'
                        : currentDemoStep > s.n
                          ? 'bg-slate-50 border-slate-200 text-slate-700'
                          : 'bg-white border-slate-100 text-slate-400'
                      }`}
                  >
                    <span className="text-[10px] font-mono block text-slate-400">0{s.n}</span>
                    <span className="text-xs truncate block mt-0.5">{s.label}</span>
                  </button>
                ))}
              </div>

              {/* Step Detail Render */}
              <div className="pt-2 text-xs space-y-4">
                {currentDemoStep === 1 && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm">01. Baseline Operational Health</h4>
                    <p className="text-slate-600">
                      All 38 simulated Primary Health Centres across Maharashtra, Gujarat, and Odisha operate with normal buffer inventories (&gt;25 days of supply). Zero active stock-out alerts.
                    </p>
                    <button
                      onClick={handleTriggerDengueShock}
                      className="mt-2 px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-xs flex items-center gap-2"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Trigger Dengue Spike (+40% Footfall) in Chandrapur
                    </button>
                  </div>
                )}

                {currentDemoStep === 2 && (
                  <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-200 space-y-2 text-rose-950">
                    <h4 className="font-bold text-rose-900 text-sm">02. Exogenous Dengue Shock Injection</h4>
                    <p>
                      Monsoon vector-borne surge introduces a sudden +40% influx of acute febrile and dehydration cases in the Chandrapur district cluster (11 PHCs affected).
                    </p>
                    <div className="grid grid-cols-3 gap-2 font-mono pt-2 text-[11px]">
                      <div>
                        <span className="text-slate-500 block font-sans text-[10px]">DAILY CONSUMPTION</span>
                        <strong className="text-rose-700">120 → 210 btls/day</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block font-sans text-[10px]">BUFFER REMAINING</span>
                        <strong className="text-rose-700">4.2 Days (Rapid Drain)</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block font-sans text-[10px]">CENSORING HAZARD</span>
                        <strong className="text-rose-700">High Stockout Distortion</strong>
                      </div>
                    </div>
                  </div>
                )}

                {currentDemoStep === 3 && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm">03. Deterministic Machine Learning Risk Assessment</h4>
                    <p className="text-slate-600">
                      The predictive pipeline runs quantile regression with right-censoring correction, determining that Ballarpur and surrounding PHCs will deplete IV Normal Saline in 42.5 hours.
                    </p>
                    <div className="grid grid-cols-3 gap-2 font-mono pt-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block font-sans text-[10px]">RISK QUANTILE</span>
                        <strong className="text-rose-600">78.3% Imminent Failure</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-sans text-[10px]">TIME TO DEPLETION</span>
                        <strong className="text-rose-600">42.5 Hours Remaining</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-sans text-[10px]">STATUS</span>
                        <strong className="text-rose-600">CRITICAL PRIORITY</strong>
                      </div>
                    </div>
                  </div>
                )}

                {currentDemoStep === 4 && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm">04. OR-Tools Constrained Resource Redistribution</h4>
                    <p className="text-slate-600">
                      Google OR-Tools multi-commodity solver evaluates candidate donor warehouses. Wardha Depot is chosen because it maintains 18.5 days of safety stock even after donating 1,200 bottles.
                    </p>
                    <div className="grid grid-cols-4 gap-2 font-mono pt-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block font-sans text-[10px]">OPTIMAL DONOR</span>
                        <strong className="text-emerald-700">Wardha Depot</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-sans text-[10px]">TRANSFER QTY</span>
                        <strong className="text-slate-900">1,200 IV Bottles</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-sans text-[10px]">TRANSIT ROUTE</span>
                        <strong className="text-slate-900">NH-353 (7.2h ETA)</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-sans text-[10px]">DONOR BUFFER POST-TX</span>
                        <strong className="text-emerald-700">18.5 Days (&gt;14d min)</strong>
                      </div>
                    </div>
                  </div>
                )}

                {currentDemoStep === 5 && (
                  <SimulationRunner
                    initialQuantity={1200}
                    initialEta={7.2}
                    initialDrainRate={210}
                    initialBufferHours={42.5}
                  />
                )}

                {currentDemoStep === 6 && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="font-bold text-slate-900 text-sm">06. Vertex AI Multilingual Decision Briefing</h4>
                    <GroundedBriefingCard
                      briefingText={briefingText}
                      isGenerating={isGeneratingBrief}
                      selectedLanguage={selectedLanguage}
                      onSelectLanguage={setSelectedLanguage}
                    />
                  </div>
                )}

                {currentDemoStep === 7 && (
                  <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 space-y-3 text-amber-950">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-amber-900 text-sm">
                        07. Authenticated Human Consequential Sign-off
                      </h4>
                      <span className="text-xs font-mono font-semibold">
                        {isApprovedByOfficer ? 'AUTHORIZED' : 'PENDING SIGNATURE'}
                      </span>
                    </div>
                    <p className="text-xs">
                      Section 35.2 Invariant: The AI agent possesses zero write or dispatch authority. An authenticated medical officer must review constraints and digitally sign.
                    </p>
                    {!isApprovedByOfficer ? (
                      <button
                        onClick={() => handleOpenTransferModal('PHC-BALLARPUR')}
                        className="py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-xs"
                      >
                        <Lock className="h-4 w-4" />
                        <span>Digitally Sign & Commit Transfer via Firestore</span>
                      </button>
                    ) : (
                      <div className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>Transfer authorized and stock locked transactionally in Firestore.</span>
                      </div>
                    )}
                  </div>
                )}

                {currentDemoStep === 8 && (
                  <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-2 text-emerald-950">
                    <h4 className="font-bold text-emerald-900 text-sm">08. Transactional Reservation Verified</h4>
                    <p>
                      Wardha Regional Warehouse stock reduced from 9,400 to 8,200 bottles. 1,200 bottles are committed to transit consignment. Immutable audit record appended.
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={handleBlockRoute}
                        className="py-2 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center gap-2 shadow-xs"
                      >
                        <AlertTriangle className="h-4 w-4" />
                        <span>Inject Monsoon Landslide on NH-353 Corridor</span>
                      </button>
                    </div>
                  </div>
                )}

                {currentDemoStep === 9 && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm">09. Dynamic Replanning & Arterial Rerouting</h4>
                    <p className="text-slate-600">
                      When the primary NH-353 artery is blocked by monsoon mudslides, the system replans via State Highway 264 (Rajura route). Arrival ETA adjusts by +1.4 hours without breaching the PHC stockout threshold.
                    </p>
                    <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs font-mono">
                      <span>REROUTE: SH-264 via Rajura Bypass · New ETA: 8.6 Hours · Stockout Window Preserved</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: FEDERATED LEARNING PANEL */}
        {activeTab === 'federated' && (
          <FederatedPanel />
        )}

        {/* TAB 6: IMMUTABLE AUDIT LEDGER */}
        {activeTab === 'audit' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                  <span>CRYPTO-AUDIT LEDGER</span>
                  <span>·</span>
                  <span>FIRESTORE COLLECTION /audit_ledger</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Cryptographically Auditable Decision Ledger
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Append-only immutable record of all predictive inferences, OR-Tools allocations, and human approvals.
                </p>
              </div>

              <div className="text-xs text-slate-500 font-mono">
                {auditLogs.length} Verified Entries
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-xs text-left font-mono">
                <thead className="bg-slate-50 text-slate-600 font-sans font-medium border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Event ID</th>
                    <th className="py-2.5 px-3">Timestamp (UTC)</th>
                    <th className="py-2.5 px-3">Authorizing Actor</th>
                    <th className="py-2.5 px-3">Consequential Action</th>
                    <th className="py-2.5 px-3">Model Snapshot</th>
                    <th className="py-2.5 px-3">SHA Verification Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.eventId} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{log.eventId}</td>
                      <td className="py-2.5 px-3 text-slate-500">{log.timestamp}</td>
                      <td className="py-2.5 px-3 font-sans font-medium text-slate-900">
                        {log.actor}
                        <span className="block text-[10px] text-slate-400 font-mono">{log.role}</span>
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-700">{log.action}</td>
                      <td className="py-2.5 px-3 text-slate-500">{log.modelIdentifier}</td>
                      <td className="py-2.5 px-3 font-semibold text-emerald-700">{log.hash}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Facility Deep Dive Modal */}
      {isDetailModalOpen && (
        <FacilityDetailModal
          node={selectedNode}
          onClose={() => setIsDetailModalOpen(false)}
          onInitiateTransfer={(nodeId) => {
            setIsDetailModalOpen(false);
            handleOpenTransferModal(nodeId);
          }}
        />
      )}

      {/* Consequential Supply Transfer Modal */}
      {isTransferModalOpen && (
        <TransferModal
          nodes={nodes}
          initialTargetNodeId={initialTransferTargetId}
          onClose={() => setIsTransferModalOpen(false)}
          onSuccess={handleTransferSuccess}
        />
      )}
    </div>
  );
}
