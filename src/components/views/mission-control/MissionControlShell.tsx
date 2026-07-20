// src/components/views/mission-control/MissionControlShell.tsx
// Hermes Mission Control shell — sub-nav + outlet for nested routes.
//
// Wraps every sub-page (/agent-root, /agent-root/tasks, /agent-root/office,
// /agent-root/content, /agent-root/schedule, /agent-root/chat, /agent-root/docs).
// Sub-nav sits at the top with the same Hermes palette as AgentRootView.

import { NavLink, Outlet } from 'react-router-dom';
import {
  Radar,
  Cpu,
  CheckSquare,
  Building2,
  BookOpenText,
  CalendarClock,
  MessageSquare,
  FileText,
  Hexagon,
} from 'lucide-react';
import { BackButton } from '@/components/BackButton';

interface SubNavItem {
  to: string;
  label: string;
  end?: boolean;
  icon: typeof Radar;
}

const SUB_NAV: ReadonlyArray<SubNavItem> = [
  { to: '/agent-root',           label: 'Overview', end: true, icon: Radar },
  { to: '/agent-root/agents',    label: 'Agents',    icon: Cpu },
  { to: '/agent-root/tasks',     label: 'Tasks',     icon: CheckSquare },
  { to: '/agent-root/office',    label: 'Office',    icon: Building2 },
  { to: '/agent-root/content',   label: 'Content',   icon: BookOpenText },
  { to: '/agent-root/schedule',  label: 'Schedule',  icon: CalendarClock },
  { to: '/agent-root/chat',      label: 'Chat',      icon: MessageSquare },
  { to: '/agent-root/docs',      label: 'Docs',      icon: FileText },
];

export const MissionControlShell = (): React.ReactElement => {
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <BackButton />

      {/* Top brand strip */}
      <header className="flex items-center gap-3 px-1">
        <div className="size-9 rounded-xl bg-ink grid place-items-center shadow-soft">
          <Hexagon className="size-4 text-ember" strokeWidth={2.25} />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-display text-[20px] text-ink tracking-tight">
            Hermes<span className="text-ember">.</span>
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-her-muted">
            Mission Control · v1.0
          </span>
        </div>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.2em] text-her-muted">
          omk_saas · agents + missions
        </span>
      </header>

      {/* Sub-nav */}
      <nav
        aria-label="Mission Control sub-navigation"
        className="flex items-center gap-1 px-1 overflow-x-auto no-scrollbar"
      >
        {SUB_NAV.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `inline-flex items-center gap-2 px-3.5 h-9 rounded-full text-[12px] font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-ink text-cream shadow-soft'
                    : 'bg-cream text-her-muted hover:text-ink border border-her-border'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`size-3.5 ${isActive ? 'text-ember' : ''}`} strokeWidth={1.75} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <Outlet />
    </div>
  );
};

export default MissionControlShell;
