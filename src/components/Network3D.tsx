import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PhcNode, SupplyRouteEdge } from '../data/mockPhcData';
import { Eye, Layers, Compass, ZoomIn, ZoomOut, RotateCcw, AlertTriangle, CheckCircle, Truck } from 'lucide-react';

interface Network3DProps {
  nodes: PhcNode[];
  routes: SupplyRouteEdge[];
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  isDengueSurgeActive: boolean;
  isTransferInTransit: boolean;
}

export default function Network3D({
  nodes,
  routes,
  selectedNodeId,
  onSelectNode,
  isDengueSurgeActive,
  isTransferInTransit
}: Network3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<PhcNode | null>(null);
  const [showRoutes, setShowRoutes] = useState<boolean>(true);
  const [showHotspots, setShowHotspots] = useState<boolean>(true);
  const [cameraView, setCameraView] = useState<'overview' | 'maharashtra' | 'chandrapur'>('overview');

  // Three.js instances ref
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const nodeMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const pulseSpheresRef = useRef<THREE.Mesh[]>([]);
  const shockwaveRef = useRef<THREE.Mesh | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const prevMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Camera Target for lerping
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 7.5, 9.5));
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0.5));
  const currentLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0.5));

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // 1. Scene with clean light theme background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc); // Light slate-50
    scene.fog = new THREE.FogExp2(0xf8fafc, 0.035);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 7.5, 9.5);
    camera.lookAt(0, 0, 0.5);
    cameraRef.current = camera;

    // 3. Renderer with antialiasing
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting: Three-point studio lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(10, 15, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.4);
    fillLight.position.set(-10, 8, -5);
    scene.add(fillLight);

    // 5. Ground Grid Floor
    const gridHelper = new THREE.GridHelper(18, 36, 0x94a3b8, 0xe2e8f0);
    gridHelper.position.y = -0.05;
    scene.add(gridHelper);

    // State Territorial Bases (Subtle planar markers)
    // Maharashtra Base
    const mhGeo = new THREE.CylinderGeometry(2.8, 3.0, 0.08, 32);
    const mhMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.8,
      metalness: 0.1,
      transparent: true,
      opacity: 0.7
    });
    const mhMesh = new THREE.Mesh(mhGeo, mhMat);
    mhMesh.position.set(0.2, -0.04, 0.6);
    mhMesh.receiveShadow = true;
    scene.add(mhMesh);

    // Gujarat Base
    const gjGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.08, 24);
    const gjMat = new THREE.MeshStandardMaterial({
      color: 0xeff6ff,
      roughness: 0.8,
      metalness: 0.1,
      transparent: true,
      opacity: 0.7
    });
    const gjMesh = new THREE.Mesh(gjGeo, gjMat);
    gjMesh.position.set(-3.6, -0.04, -2.1);
    gjMesh.receiveShadow = true;
    scene.add(gjMesh);

    // Odisha Base
    const odGeo = new THREE.CylinderGeometry(1.5, 1.7, 0.08, 24);
    const odMat = new THREE.MeshStandardMaterial({
      color: 0xf0fdf4,
      roughness: 0.8,
      metalness: 0.1,
      transparent: true,
      opacity: 0.7
    });
    const odMesh = new THREE.Mesh(odGeo, odMat);
    odMesh.position.set(4.1, -0.04, 1.2);
    odMesh.receiveShadow = true;
    scene.add(odMesh);

    // 6. Dengue Outbreak Shockwave Ring
    const ringGeo = new THREE.RingGeometry(0.3, 0.45, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xe11d48,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0
    });
    const shockwave = new THREE.Mesh(ringGeo, ringMat);
    shockwave.rotation.x = -Math.PI / 2;
    shockwave.position.set(1.0, 0.06, 0.9);
    scene.add(shockwave);
    shockwaveRef.current = shockwave;

    // 7. Raycaster setup
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleMouseMove = (event: MouseEvent) => {
      if (!mountRef.current) return;
      const rect = mountRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Handle Orbiting when dragging
      if (isDraggingRef.current && cameraRef.current) {
        const deltaX = event.clientX - prevMousePos.current.x;
        const deltaY = event.clientY - prevMousePos.current.y;
        prevMousePos.current = { x: event.clientX, y: event.clientY };

        const cam = cameraRef.current;
        const radius = cam.position.distanceTo(targetLookAt.current);
        const theta = Math.atan2(cam.position.x - targetLookAt.current.x, cam.position.z - targetLookAt.current.z) - deltaX * 0.006;
        const phi = Math.max(0.2, Math.min(Math.PI / 2 - 0.05, Math.asin((cam.position.y - targetLookAt.current.y) / radius) + deltaY * 0.006));

        cam.position.x = targetLookAt.current.x + radius * Math.cos(phi) * Math.sin(theta);
        cam.position.z = targetLookAt.current.z + radius * Math.cos(phi) * Math.cos(theta);
        cam.position.y = targetLookAt.current.y + radius * Math.sin(phi);
        targetCamPos.current.copy(cam.position);
      }

      // Raycasting for hover
      raycaster.setFromCamera(mouse, camera);
      const meshes = Array.from(nodeMeshesRef.current.values());
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const found = nodes.find((n) => n.id === hit.userData.nodeId);
        setHoveredNode(found || null);
        mountRef.current.style.cursor = 'pointer';
      } else {
        setHoveredNode(null);
        if (!isDraggingRef.current) {
          mountRef.current.style.cursor = 'grab';
        }
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      isDraggingRef.current = true;
      prevMousePos.current = { x: event.clientX, y: event.clientY };
      if (mountRef.current) mountRef.current.style.cursor = 'grabbing';
    };

    const handleMouseUp = (event: MouseEvent) => {
      isDraggingRef.current = false;
      if (mountRef.current) mountRef.current.style.cursor = 'grab';

      // Check if it was a quick click to select
      if (!mountRef.current) return;
      const rect = mountRef.current.getBoundingClientRect();
      const clickMouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(clickMouse, camera);
      const meshes = Array.from(nodeMeshesRef.current.values());
      const intersects = raycaster.intersectObjects(meshes);
      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        if (hit.userData.nodeId) {
          onSelectNode(hit.userData.nodeId);
        }
      }
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (!cameraRef.current) return;
      const zoomFactor = event.deltaY * 0.005;
      const cam = cameraRef.current;
      const dir = cam.position.clone().sub(targetLookAt.current).normalize();
      const newPos = cam.position.clone().addScaledVector(dir, zoomFactor);
      const dist = newPos.distanceTo(targetLookAt.current);
      if (dist >= 3 && dist <= 20) {
        cam.position.copy(newPos);
        targetCamPos.current.copy(newPos);
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousemove', handleMouseMove);
    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    dom.addEventListener('wheel', handleWheel, { passive: false });

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current || !renderer || !camera) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth camera lerp
      if (cameraRef.current) {
        cameraRef.current.position.lerp(targetCamPos.current, 0.06);
        currentLookAt.current.lerp(targetLookAt.current, 0.06);
        cameraRef.current.lookAt(currentLookAt.current);
      }

      // Animate shockwave ring
      if (shockwaveRef.current) {
        if (isDengueSurgeActive) {
          const s = (elapsed * 1.5) % 2.5;
          shockwaveRef.current.scale.set(1 + s * 2.2, 1 + s * 2.2, 1);
          (shockwaveRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.7 - s * 0.3);
        } else {
          (shockwaveRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
        }
      }

      // Animate supply pulse spheres along curves
      pulseSpheresRef.current.forEach((sphere, index) => {
        const speed = isTransferInTransit ? 0.8 : 0.35;
        const progress = (elapsed * speed + index * 0.3) % 1;
        const curve = sphere.userData.curve as THREE.CatmullRomCurve3;
        if (curve) {
          const pt = curve.getPoint(progress);
          sphere.position.copy(pt);
          sphere.scale.setScalar(isTransferInTransit ? 1.4 : 1.0);
        }
      });

      // Animate node pulsing if critical
      nodeMeshesRef.current.forEach((mesh) => {
        if (mesh.userData.isCritical) {
          const bounce = 1.0 + Math.sin(elapsed * 4) * 0.08;
          mesh.scale.set(bounce, bounce, bounce);
        } else {
          mesh.scale.set(1, 1, 1);
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousemove', handleMouseMove);
      dom.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      dom.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update Nodes & Meshes in Three.js
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clear previous node meshes
    nodeMeshesRef.current.forEach((mesh) => scene.remove(mesh));
    nodeMeshesRef.current.clear();

    nodes.forEach((node) => {
      const isWarehouse = node.type === 'warehouse';
      const isSelected = node.id === selectedNodeId;

      let geom: THREE.BufferGeometry;
      let mat: THREE.Material;

      if (isWarehouse) {
        // Warehouse: Stepped Octahedron / Diamond Pin
        geom = new THREE.OctahedronGeometry(0.28, 0);
        mat = new THREE.MeshStandardMaterial({
          color: isSelected ? 0x0284c7 : 0x059669, // Sky-600 or Emerald-600
          roughness: 0.2,
          metalness: 0.6,
          wireframe: false
        });
      } else {
        // PHC Node: Sleek Cylinder Pin
        geom = new THREE.CylinderGeometry(0.18, 0.18, 0.35, 16);
        const color = node.isCritical
          ? 0xe11d48 // Rose-600 critical
          : node.currentStockDays < 7
          ? 0xd97706 // Amber-600 warning
          : 0x10b981; // Emerald-500 nominal

        mat = new THREE.MeshStandardMaterial({
          color: isSelected ? 0x4f46e5 : color,
          roughness: 0.3,
          metalness: 0.4
        });
      }

      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(node.coord3D[0], node.coord3D[1] + (isWarehouse ? 0.28 : 0.18), node.coord3D[2]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = {
        nodeId: node.id,
        isCritical: node.isCritical,
        isWarehouse
      };

      scene.add(mesh);
      nodeMeshesRef.current.set(node.id, mesh);

      // Add a small grounding beacon cylinder
      const baseBeaconGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.3, 8);
      const baseBeaconMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8, opacity: 0.6, transparent: true });
      const baseBeacon = new THREE.Mesh(baseBeaconGeo, baseBeaconMat);
      baseBeacon.position.set(node.coord3D[0], node.coord3D[1] / 2, node.coord3D[2]);
      scene.add(baseBeacon);
    });
  }, [nodes, selectedNodeId]);

  // Update Route Arcs & Pulse particles
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clear old route lines and pulses
    const oldRoutes = scene.children.filter((c) => c.userData.isRoute);
    oldRoutes.forEach((r) => scene.remove(r));
    pulseSpheresRef.current.forEach((p) => scene.remove(p));
    pulseSpheresRef.current = [];

    if (!showRoutes) return;

    routes.forEach((route) => {
      const srcNode = nodes.find((n) => n.id === route.sourceId);
      const tgtNode = nodes.find((n) => n.id === route.targetId);
      if (!srcNode || !tgtNode) return;

      const p1 = new THREE.Vector3(srcNode.coord3D[0], srcNode.coord3D[1] + 0.2, srcNode.coord3D[2]);
      const p2 = new THREE.Vector3(tgtNode.coord3D[0], tgtNode.coord3D[1] + 0.2, tgtNode.coord3D[2]);

      // Calculate midpoint with parabolic height arc
      const mid = p1.clone().lerp(p2, 0.5);
      const dist = p1.distanceTo(p2);
      mid.y += Math.max(0.6, dist * 0.35);

      const curve = new THREE.CatmullRomCurve3([p1, mid, p2]);
      const points = curve.getPoints(32);
      const curveGeo = new THREE.BufferGeometry().setFromPoints(points);

      const isRouteActiveTransfer =
        (route.sourceId === 'WH-WARDHA' && route.targetId === 'PHC-BALLARPUR') ||
        (route.sourceId === 'WH-WARDHA' && route.targetId === 'PHC-RAJURA');

      const curveMat = new THREE.LineBasicMaterial({
        color: isRouteActiveTransfer ? (isTransferInTransit ? 0x059669 : 0x0284c7) : 0x94a3b8,
        linewidth: isRouteActiveTransfer ? 2 : 1,
        transparent: true,
        opacity: isRouteActiveTransfer ? 0.9 : 0.45
      });

      const line = new THREE.Line(curveGeo, curveMat);
      line.userData = { isRoute: true };
      scene.add(line);

      // Add animated pulse along the route
      const sphereGeo = new THREE.SphereGeometry(isRouteActiveTransfer ? 0.08 : 0.05, 12, 12);
      const sphereMat = new THREE.MeshBasicMaterial({
        color: isRouteActiveTransfer ? 0x10b981 : 0x38bdf8
      });
      const pulseSphere = new THREE.Mesh(sphereGeo, sphereMat);
      pulseSphere.userData = { isRoute: true, curve };
      scene.add(pulseSphere);
      pulseSpheresRef.current.push(pulseSphere);
    });
  }, [routes, nodes, showRoutes, isTransferInTransit]);

  // Camera presets
  const setCameraPreset = (view: 'overview' | 'maharashtra' | 'chandrapur') => {
    setCameraView(view);
    if (view === 'overview') {
      targetCamPos.current.set(0, 8.5, 10.5);
      targetLookAt.current.set(0, 0, 0.5);
    } else if (view === 'maharashtra') {
      targetCamPos.current.set(0.5, 4.5, 5.0);
      targetLookAt.current.set(0.2, 0.2, 0.6);
    } else if (view === 'chandrapur') {
      targetCamPos.current.set(1.1, 2.5, 2.8);
      targetLookAt.current.set(0.9, 0.1, 0.9);
    }
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="relative w-full h-[520px] rounded-2xl border border-slate-200/90 bg-slate-50 overflow-hidden shadow-xs">
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab" />

      {/* Floating 3D HUD: Camera Presets & Layer Toggles */}
      <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md px-1.5 py-1 rounded-xl border border-slate-200 shadow-xs flex items-center gap-1">
          <button
            onClick={() => setCameraPreset('overview')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              cameraView === 'overview'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            National Overview
          </button>
          <button
            onClick={() => setCameraPreset('maharashtra')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              cameraView === 'maharashtra'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Maharashtra Hub
          </button>
          <button
            onClick={() => setCameraPreset('chandrapur')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              cameraView === 'chandrapur'
                ? 'bg-rose-600 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Chandrapur Hotspot
          </button>
        </div>

        <div className="bg-white/95 backdrop-blur-md px-2 py-1 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2 text-xs text-slate-600">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showRoutes}
              onChange={(e) => setShowRoutes(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span>Supply Arcs</span>
          </label>
        </div>
      </div>

      {/* Floating 3D HUD: Legend & Controls Guide */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200 shadow-xs text-xs space-y-1.5 pointer-events-auto">
        <div className="text-[11px] font-semibold text-slate-900 uppercase tracking-wider">Topological 3D Legend</div>
        <div className="flex items-center gap-4 text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-600"></span>
            <span>State/Regional Depot</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
            <span>PHC Nominal (&gt;7d)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-600"></span>
            <span>PHC Outbreak Shock</span>
          </div>
        </div>
        <div className="text-[10px] text-slate-400">
          Left-click drag to rotate · Scroll to zoom · Click pin to inspect details
        </div>
      </div>

      {/* Hover Tooltip */}
      {hoveredNode && !selectedNode && (
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-200 shadow-md text-xs w-64 pointer-events-none transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold">{hoveredNode.district} · {hoveredNode.state}</span>
            <span className={`text-[10px] font-semibold ${hoveredNode.isCritical ? 'text-rose-600' : 'text-emerald-700'}`}>
              {hoveredNode.isCritical ? 'Surge Critical' : 'Normal'}
            </span>
          </div>
          <h4 className="font-bold text-slate-900 mt-0.5 text-sm">{hoveredNode.name}</h4>
          <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-400 block">Stock Buffer:</span>
              <span className="font-mono font-bold text-slate-800">{hoveredNode.currentStockDays.toFixed(1)} days</span>
            </div>
            <div>
              <span className="text-slate-400 block">Stock-out Risk:</span>
              <span className="font-mono font-bold text-rose-600">{(hoveredNode.stockOutRisk * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Selected Node Inspector Drawer (Layered over canvas on top right) */}
      {selectedNode && (
        <div className="absolute top-4 right-4 bg-white/98 backdrop-blur-md p-4 rounded-xl border border-slate-200 shadow-lg text-xs w-80 pointer-events-auto space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-mono text-slate-500 uppercase">
              {selectedNode.type.toUpperCase()} · {selectedNode.district}
            </div>
            <button
              onClick={() => onSelectNode('')}
              className="text-slate-400 hover:text-slate-700 p-1 rounded"
              title="Close Inspector"
            >
              ✕
            </button>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-sm">{selectedNode.name}</h4>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
              <span>{selectedNode.state}</span>
              <span>·</span>
              <span className={selectedNode.connectivityStatus === 'online' ? 'text-emerald-700 font-medium' : 'text-amber-700 font-medium'}>
                {selectedNode.connectivityStatus} ({selectedNode.lastSyncMinutesAgo}m ago)
              </span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 text-center font-mono">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Buffer</span>
              <span className="font-bold text-slate-900 text-xs">{selectedNode.currentStockDays.toFixed(1)}d</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Risk</span>
              <span className="font-bold text-rose-600 text-xs">{(selectedNode.stockOutRisk * 100).toFixed(0)}%</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Doctors</span>
              <span className="font-bold text-slate-900 text-xs">{selectedNode.staffPresent}/{selectedNode.staffSanctioned}</span>
            </div>
          </div>

          {/* Live Inventory Preview */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Live Inventory Balances</div>
            <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
              {selectedNode.inventory.map((inv) => (
                <div key={inv.medicineId} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-100">
                  <span className="text-slate-700 truncate max-w-[150px]">{inv.medicineName}</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {inv.quantity.toLocaleString()} {inv.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {selectedNode.type === 'phc' && selectedNode.isCritical && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-900 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>
                <strong>Redistribution Required:</strong> Days of stock below 5-day delivery lead time buffer. Target donor: Wardha Regional Depot.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
