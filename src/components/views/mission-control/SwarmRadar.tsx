// src/components/views/mission-control/SwarmRadar.tsx
// HERMES — Swarm Radar signature component.
//
// One distinctive element that the Mission Control will be remembered by.
// Inspired by air traffic control radar + Impeccable motion principles:
//   - No bounce, no elastic, no spring overshoot.
//   - Sweep is LINEAR (constant angular velocity) — like a real radar dish.
//   - Agent blips fade in with ease-out-expo (firm, decisive landing).
//   - One thing moving at a time. No scattered orbs, no stacked twinkles.
//
// Used as the hero centerpiece on AgentRootView. The radar does NOT animate
// when the user has `prefers-reduced-motion: reduce`.

import { useMemo, type ReactElement } from 'react';
import type { HermesAgentCard } from './useHermesCards';

interface SwarmRadarProps {
  agents: ReadonlyArray<HermesAgentCard>;
  size?: number;
}

const ACCENT_BY_STATE: Record<HermesAgentCard['state'], string> = {
  EXECUTING: 'var(--color-signal)',
  THINKING: 'var(--color-alarm)',
  IDLE: 'oklch(0.55 0.012 70)',
  RETRY: 'oklch(0.60 0.22 25)',
  OFFLINE: 'oklch(0.40 0.012 60)',
};

const angleFor = (i: number, total: number): number => {
  // Even angular distribution around the dial.
  return (360 / Math.max(total, 1)) * i - 90; // start at top
};

const radiusFor = (state: HermesAgentCard['state']): number => {
  // Inner = idle/offline, outer = executing. Reads as distance from origin.
  switch (state) {
    case 'EXECUTING': return 0.78;
    case 'THINKING': return 0.62;
    case 'RETRY': return 0.50;
    case 'IDLE': return 0.42;
    case 'OFFLINE': return 0.30;
  }
};

export const SwarmRadar = ({ agents, size = 280 }: SwarmRadarProps): ReactElement => {
  const dots = useMemo(
    () =>
      agents.map((a, idx) => ({
        agent: a,
        angle: angleFor(idx, agents.length),
        radius: radiusFor(a.state),
      })),
    [agents],
  );

  const live = agents.filter((a) => a.state === 'EXECUTING' || a.state === 'THINKING').length;

  return (
    <svg
      role="img"
      aria-label={`Swarm radar · ${live} of ${agents.length} agents live`}
      width={size}
      height={size}
      viewBox="-50 -50 100 100"
      className="block overflow-visible"
    >
      <defs>
        {/* Sweep gradient — green at leading edge fading to transparent trail. */}
        <linearGradient id="swarm-sweep" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--color-signal)" stopOpacity="0" />
          <stop offset="0.85" stopColor="var(--color-signal)" stopOpacity="0.18" />
          <stop offset="1" stopColor="var(--color-signal)" stopOpacity="0.65" />
        </linearGradient>
        {/* Soft glow filter for the blips. */}
        <filter id="swarm-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.6" />
        </filter>
      </defs>

      {/* Concentric range rings — restrained, no fill, hairline strokes. */}
      {[0.25, 0.5, 0.75, 1].map((r) => (
        <circle
          key={`ring-${r}`}
          cx={0}
          cy={0}
          r={r * 44}
          fill="none"
          stroke="var(--color-cream)"
          strokeOpacity={0.10}
          strokeWidth={0.18}
          strokeDasharray={r === 1 ? undefined : '1.5 1.5'}
        />
      ))}

      {/* Crosshair. */}
      <line x1={-44} y1={0} x2={44} y2={0} stroke="var(--color-cream)" strokeOpacity={0.08} strokeWidth={0.12} />
      <line x1={0} y1={-44} x2={0} y2={44} stroke="var(--color-cream)" strokeOpacity={0.08} strokeWidth={0.12} />

      {/* Sweep arm — single rotating element. Linear timing. Reduced-motion aware. */}
      <g className="origin-center animate-[var(--animate-swarm-radar-sweep)] motion-reduce:animate-none">
        {/* Filled cone of trailing green. */}
        <path
          d={`M 0 0 L 44 0 A 44 44 0 0 0 ${44 * Math.cos(-Math.PI / 6)} ${44 * Math.sin(-Math.PI / 6)} Z`}
          fill="url(#swarm-sweep)"
        />
        {/* Leading edge line — bright pinhead. */}
        <line x1={0} y1={0} x2={44} y2={0} stroke="var(--color-signal)" strokeOpacity={0.95} strokeWidth={0.55} />
      </g>

      {/* Center core. */}
      <circle cx={0} cy={0} r={3.4} fill="var(--color-signal)" />
      <circle cx={0} cy={0} r={6} fill="none" stroke="var(--color-signal)" strokeOpacity={0.45} strokeWidth={0.4} />

      {/* Agent blips — placed by state, fade in on mount. */}
      {dots.map(({ agent, angle, radius }) => {
        const r = radius * 44;
        const x = Math.cos((angle * Math.PI) / 180) * r;
        const y = Math.sin((angle * Math.PI) / 180) * r;
        const color = ACCENT_BY_STATE[agent.state];
        const live = agent.state === 'EXECUTING' || agent.state === 'THINKING';
        return (
          <g key={agent.id} transform={`translate(${x} ${y})`}>
            <circle
              r={3}
              fill={color}
              className="animate-[var(--animate-swarm-blip-in)] motion-reduce:animate-none"
              style={{ animationDelay: `${(agent.code.charCodeAt(2) % 7) * 80}ms` }}
              filter="url(#swarm-glow)"
            />
            {live && (
              <circle
                r={6}
                fill="none"
                stroke={color}
                strokeWidth={0.35}
                className="animate-[var(--animate-swarm-blip-halo)] motion-reduce:animate-none"
                style={{ animationDelay: `${(agent.code.charCodeAt(3) % 5) * 200}ms` }}
              />
            )}
            {/* Initials label for the HQ-equivalent (orchestrator). */}
            {agent.code === 'A-00' && (
              <text
                y={-5}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize={2.6}
                fill="var(--color-cream)"
                opacity={0.85}
              >
                HQ
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

export default SwarmRadar;
