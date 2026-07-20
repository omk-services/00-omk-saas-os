// src/components/views/mission-control/MissionOfficeView.tsx
// Hermes — Office sub-page (route /agent-root/office)
// Three.js "Empire" scene: 5 agent buildings (HQ + 4 specialists), lit windows,
// orbit-style camera, click-to-dossier. Built on three.js v0.169+.
//
// D4 forward-only. Heavy WebGL = lazy-loaded inside this view's effect.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Building2, Hexagon, Mouse, X } from 'lucide-react';
import type * as THREE from 'three';
import { agentsRepo } from '@/data/agents.repo';
import type { Agent } from '@/lib/types';
import { useHermesCards, type HermesAgentCard } from './useHermesCards';
import { EmptyState } from '@/components/EmptyState';

interface BuildingConfig {
  id: string;
  card: HermesAgentCard;
  position: [number, number, number];
  size: [number, number, number];
  floors: number;
  windowCols: number;
  isHQ: boolean;
}

const defaultConfigs: Array<Omit<BuildingConfig, 'card'>> = [
  { id: 'hq',     position: [0,    0,  0],   size: [4, 7, 4],   floors: 18, windowCols: 5, isHQ: true  },
  { id: 'scout',  position: [-7.5, 0, -5],  size: [2.6, 5.6, 2.6], floors: 14, windowCols: 4, isHQ: false },
  { id: 'scribe', position: [ 7.5, 0, -5],  size: [3.2, 4.4, 2.4], floors: 10, windowCols: 5, isHQ: false },
  { id: 'reach',  position: [-7.5, 0,  5],  size: [2.8, 4.8, 2.8], floors: 12, windowCols: 4, isHQ: false },
  { id: 'dev',    position: [ 7.5, 0,  5],  size: [2.6, 6.4, 2.6], floors: 16, windowCols: 4, isHQ: false },
];

export const MissionOfficeView = (): React.ReactElement => {
  const [agents, setAgents] = useState<Agent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<BuildingConfig | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const threeRef = useRef<{
    dispose: () => void;
  } | null>(null);

  const cards = useHermesCards(agents);

  const buildings = useMemo<BuildingConfig[]>(() => {
    const list = cards.length > 0 ? cards : null;
    return defaultConfigs.map((cfg, idx) => ({
      ...cfg,
      card: list?.[idx] ?? synthesizeFallbackCard(cfg.id, idx),
    }));
  }, [cards]);

  useEffect(() => {
    let cancelled = false;
    agentsRepo
      .list()
      .then((rows) => { if (!cancelled) setAgents(rows); })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (error || agents === null || agents.length === 0) return;
    const wrap = wrapRef.current;
    if (!wrap) return;

    let cancelled = false;
    let dispose: (() => void) | null = null;

    (async (): Promise<void> => {
      const THREE = await import('three');
      if (cancelled || !wrap) return;

      const scene = new THREE.Scene();
      scene.background = null;
      scene.fog = new THREE.Fog(0x0a0805, 18, 60);

      const camera = new THREE.PerspectiveCamera(45, wrap.clientWidth / Math.max(wrap.clientHeight, 1), 0.1, 200);
      camera.position.set(14, 12, 18);
      camera.lookAt(0, 4, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(wrap.clientWidth, wrap.clientHeight);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      wrap.appendChild(renderer.domElement);

      // Ground plane
      const ground = new THREE.Mesh(
        new THREE.CircleGeometry(40, 64),
        new THREE.MeshStandardMaterial({ color: 0x1a120c, roughness: 0.95, metalness: 0.05 }),
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.01;
      scene.add(ground);

      // Grid
      const grid = new THREE.GridHelper(80, 40, 0x442211, 0x221108);
      const gridMat = grid.material as THREE.Material & { opacity: number; transparent: boolean };
      gridMat.opacity = 0.45;
      gridMat.transparent = true;
      scene.add(grid);
      void THREE;

      // Lights
      const ambient = new THREE.AmbientLight(0xffe7c2, 0.32);
      scene.add(ambient);
      const sun = new THREE.DirectionalLight(0xffd6a0, 0.95);
      sun.position.set(12, 18, 8);
      scene.add(sun);
      const moon = new THREE.PointLight(0xff7a1a, 1.2, 60);
      moon.position.set(-6, 8, -8);
      scene.add(moon);

      // Buildings
      const clickable: Array<{ mesh: THREE.Mesh; config: BuildingConfig }> = [];
      const SPOT = 0xff5a18;
      const EMBER = 0xff6a2a;
      const buildingConfigs: BuildingConfig[] = defaultConfigs.map((cfg, idx) => ({
        ...cfg,
        card: cards[idx] ?? synthesizeFallbackCard(cfg.id, idx),
      }));

      for (const config of buildingConfigs) {
        const accent = config.isHQ ? SPOT : EMBER;
        const material = new THREE.MeshStandardMaterial({
          color: 0x0d0805,
          roughness: 0.55,
          metalness: 0.12,
        });
        const geo = new THREE.BoxGeometry(config.size[0], config.size[1], config.size[2]);
        const mesh = new THREE.Mesh(geo, material);
        mesh.position.set(config.position[0], config.size[1] / 2, config.position[2]);
        scene.add(mesh);

        // Roof accent
        const roof = new THREE.Mesh(
          new THREE.BoxGeometry(config.size[0] * 1.02, 0.18, config.size[2] * 1.02),
          new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.5 }),
        );
        roof.position.set(config.position[0], config.size[1] + 0.1, config.position[2]);
        scene.add(roof);

        // Windows
        const winW = config.size[0] / (config.windowCols + 1);
        const winH = config.size[1] / (config.floors + 1);
        const winMat = new THREE.MeshStandardMaterial({
          color: accent,
          emissive: accent,
          emissiveIntensity: config.isHQ ? 1.4 : 0.85,
        });
        for (let f = 1; f <= config.floors; f += 1) {
          for (let c = 1; c <= config.windowCols; c += 1) {
            // 4 sides of the building
            for (let side = 0; side < 4; side += 1) {
              const x = (c - (config.windowCols + 1) / 2) * winW;
              const y = (f - (config.floors + 1) / 2) * winH + config.size[1] / 2;
              const offset = config.size[0] / 2 + 0.02;
              const win = new THREE.Mesh(new THREE.PlaneGeometry(winW * 0.5, winH * 0.5), winMat);
              if (side === 0) { win.position.set(config.position[0] + x, y, config.position[2] + offset); }
              if (side === 1) { win.position.set(config.position[0] + x, y, config.position[2] - offset); win.rotation.y = Math.PI; }
              if (side === 2) { win.position.set(config.position[0] + offset, y, config.position[2] + x); win.rotation.y = Math.PI / 2; }
              if (side === 3) { win.position.set(config.position[0] - offset, y, config.position[2] + x); win.rotation.y = -Math.PI / 2; }
              scene.add(win);
            }
          }
        }
        clickable.push({ mesh, config });
      }

      // Camera orbit (very simple)
      let camRadius = 22;
      let camAngle = Math.PI * 0.18;
      const target = new THREE.Vector3(0, 4, 0);
      let isDragging = false;
      let prevX = 0;
      let prevY = 0;
      let autoSpin = true;
      const onPointerDown = (e: PointerEvent): void => {
        isDragging = true;
        autoSpin = false;
        prevX = e.clientX;
        prevY = e.clientY;
      };
      const onPointerMove = (e: PointerEvent): void => {
        if (!isDragging) return;
        const dx = e.clientX - prevX;
        const dy = e.clientY - prevY;
        camAngle -= dx * 0.005;
        camRadius = Math.max(10, Math.min(40, camRadius + dy * 0.02));
        prevX = e.clientX;
        prevY = e.clientY;
      };
      const onPointerUp = (): void => { isDragging = false; };
      const onWheel = (e: WheelEvent): void => {
        camRadius = Math.max(10, Math.min(40, camRadius + e.deltaY * 0.01));
      };
      const onClick = (e: PointerEvent): void => {
        // Use raycaster via Three's pointer math
        const rect = renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1,
        );
        const ray = new THREE.Raycaster();
        ray.setFromCamera(mouse, camera);
        const meshes = clickable.map((c) => c.mesh);
        const hit = ray.intersectObjects(meshes, false)[0];
        if (hit) {
          const found = clickable.find((c) => c.mesh === hit.object);
          if (found) setSelected(found.config);
        }
      };
      renderer.domElement.addEventListener('pointerdown', onPointerDown);
      renderer.domElement.addEventListener('pointermove', onPointerMove);
      renderer.domElement.addEventListener('pointerup', onPointerUp);
      renderer.domElement.addEventListener('pointerleave', onPointerUp);
      renderer.domElement.addEventListener('wheel', onWheel);
      renderer.domElement.addEventListener('click', onClick);

      const onResize = (): void => {
        if (!wrap) return;
        camera.aspect = wrap.clientWidth / Math.max(wrap.clientHeight, 1);
        camera.updateProjectionMatrix();
        renderer.setSize(wrap.clientWidth, wrap.clientHeight);
      };
      window.addEventListener('resize', onResize);

      let raf = 0;
      const tick = (): void => {
        if (autoSpin) camAngle += 0.0018;
        camera.position.x = Math.cos(camAngle) * camRadius;
        camera.position.z = Math.sin(camAngle) * camRadius;
        camera.position.y = 10 + Math.sin(camAngle * 0.5) * 2;
        camera.lookAt(target);
        renderer.render(scene, camera);
        raf = requestAnimationFrame(tick);
      };
      tick();

      dispose = (): void => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', onResize);
        renderer.domElement.removeEventListener('pointerdown', onPointerDown);
        renderer.domElement.removeEventListener('pointermove', onPointerMove);
        renderer.domElement.removeEventListener('pointerup', onPointerUp);
        renderer.domElement.removeEventListener('pointerleave', onPointerUp);
        renderer.domElement.removeEventListener('wheel', onWheel);
        renderer.domElement.removeEventListener('click', onClick);
        scene.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          const mat = mesh.material;
          if (mat) {
            if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
            else mat.dispose();
          }
        });
        renderer.dispose();
        if (renderer.domElement.parentElement === wrap) wrap.removeChild(renderer.domElement);
      };
      threeRef.current = { dispose: () => dispose?.() };
    })();

    return () => {
      cancelled = true;
      threeRef.current?.dispose();
      threeRef.current = null;
    };
  }, [cards, error, agents]);

  if (error !== null) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-lg text-rose-700" role="alert">
        <p className="font-semibold">Error loading Empire</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[28px] bg-ink animate-rise">
        <div className="relative z-10 p-6 md:p-8 flex flex-col lg:flex-row lg:items-end gap-6 justify-between text-cream">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] uppercase text-cream/60">
              <Hexagon className="size-3 text-ember" /> The Empire · Live skyline
            </div>
            <h1 className="font-display text-[44px] md:text-[64px] leading-[0.95] mt-3 tracking-tight">
              A city built by <span className="italic text-ember">agents.</span>
            </h1>
            <p className="font-sans text-cream/70 mt-3 max-w-xl text-[14px]">
              Every specialist owns a tower. The orchestrator runs HQ at the center. Lit windows
              mean live work. Drag to orbit, scroll to zoom, click a building to open its dossier.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-2xl bg-cream/5 border border-cream/10 px-4 py-3 backdrop-blur-sm">
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-cream/50">Buildings</div>
              <div className="font-display text-[34px] leading-none mt-1 tabular-nums">{buildings.length}</div>
            </div>
            <div className="rounded-2xl bg-cream/5 border border-cream/10 px-4 py-3 backdrop-blur-sm">
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-cream/50">Lights on</div>
              <div className="font-display text-[34px] leading-none mt-1 tabular-nums">
                {buildings.filter((b) => b.card.state === 'EXECUTING' || b.card.state === 'THINKING').length}
              </div>
            </div>
            <div className="rounded-2xl bg-cream/5 border border-cream/10 px-4 py-3 backdrop-blur-sm">
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-cream/50">Tasks</div>
              <div className="font-display text-[34px] leading-none mt-1 tabular-nums">
                {buildings.reduce((s, b) => s + b.card.tasksToday, 0)}
              </div>
            </div>
          </div>
        </div>

        <div className="relative h-[420px] sm:h-[520px] md:h-[600px] lg:h-[640px] w-full">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-ink to-transparent z-10" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink to-transparent z-10" />
          <div className="absolute top-4 right-4 z-20 hidden md:flex items-center gap-2 px-3 h-9 rounded-full bg-cream/8 border border-cream/15 backdrop-blur-sm">
            <Mouse className="size-3.5 text-cream/70" />
            <span className="font-mono text-[10px] tracking-wider uppercase text-cream/70">Drag · Scroll · Click</span>
          </div>
          {agents === null ? (
            <div className="absolute inset-0 grid place-items-center text-cream/70 font-mono text-[10px] uppercase tracking-[0.22em]">
              Loading Empire…
            </div>
          ) : (
            <div ref={wrapRef} className="absolute inset-0" />
          )}
          {selected && <DossierOverlay config={selected} onClose={() => setSelected(null)} />}
        </div>

        <div className="relative z-10 px-6 md:px-8 py-5 border-t border-cream/10 grid grid-cols-2 md:grid-cols-5 gap-4">
          {buildings.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setSelected(b)}
              className="flex items-center gap-3 text-left hover:bg-cream/5 p-2 -m-2 rounded-lg transition-colors"
            >
              <span className="size-3 rounded-full" style={{ background: b.isHQ ? '#ff5a18' : '#ff6a2a' }} />
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-cream/55">{b.id}</div>
                <div className="font-sans text-[13px] text-cream truncate">{b.card.name}</div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

const DossierOverlay = ({ config, onClose }: { config: BuildingConfig; onClose: () => void }): React.ReactElement => {
  const { card } = config;
  return (
    <div className="absolute inset-0 z-30 grid place-items-end md:place-items-center p-6 bg-ink/40 backdrop-blur-sm">
      <article className="w-full max-w-md rounded-3xl bg-ink text-cream p-6 border border-cream/15 shadow-soft">
        <header className="flex items-start justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-cream/55">{card.code}</div>
            <h2 className="font-display text-[28px] leading-tight mt-1">{card.name}</h2>
            <p className="font-mono text-[11px] uppercase tracking-wider text-cream/65 mt-1">{card.role}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close dossier" className="size-8 rounded-full bg-cream/10 hover:bg-cream/15 grid place-items-center">
            <X className="size-4" />
          </button>
        </header>
        <p className="font-sans text-[13px] text-cream/80 mt-3 leading-snug">{card.task}</p>
        <dl className="mt-4 grid grid-cols-3 gap-3 font-mono text-[10px] uppercase tracking-wider">
          <div>
            <dt className="text-cream/55">Load</dt>
            <dd className="text-cream text-[16px] tabular-nums mt-0.5">{card.loadPct}%</dd>
          </div>
          <div>
            <dt className="text-cream/55">Tasks today</dt>
            <dd className="text-cream text-[16px] tabular-nums mt-0.5">{card.tasksToday}</dd>
          </div>
          <div>
            <dt className="text-cream/55">Success</dt>
            <dd className="text-cream text-[16px] tabular-nums mt-0.5">{card.successPct.toFixed(1)}%</dd>
          </div>
        </dl>
        <div className="mt-4 pt-4 border-t border-cream/10 font-mono text-[11px] flex items-center justify-between">
          <span className="text-cream/65">{card.channel}</span>
          <span className="text-ember">{card.defaultModel}</span>
        </div>
      </article>
    </div>
  );
};

const synthesizeFallbackCard = (code: string, index: number): HermesAgentCard => {
  const names: Record<string, string> = { hq: 'HQ', scout: 'Scout', scribe: 'Scribe', reach: 'Reach', dev: 'Dev' };
  const roles: Record<string, string> = {
    hq: 'Orchestrator',
    scout: 'Research',
    scribe: 'Writing',
    reach: 'Marketing',
    dev: 'Engineering',
  };
  return {
    id: `synth-${code}`,
    code: code === 'hq' ? 'A-00' : `A-0${index}`,
    initials: (names[code] ?? 'AG').slice(0, 2).toUpperCase(),
    name: names[code] ?? 'Agent',
    role: roles[code] ?? 'Operator',
    channel: code === 'hq' ? 'telegram' : `#${code}`,
    state: 'IDLE',
    task: 'Booting the Empire — connect real agents to populate live telemetry.',
    loadPct: 0,
    tokensToday: '—',
    latency: '—',
    successPct: 99,
    tasksToday: 0,
    sharePct: 0,
    defaultModel: 'claude-sonnet-4.5',
    raw: {} as Agent,
  };
};

export default MissionOfficeView;
