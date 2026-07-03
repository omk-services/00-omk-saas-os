import React from 'react';
import { PrefetchNavLink } from '@/components/PrefetchNavLink';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BookOpen,
  Settings,
  UserCog,
  CheckSquare,
  Scale,
  Rocket,
  ShieldCheck,
  ShoppingBag,
  Server,
  PanelLeftClose,
  Shield,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/auth/useAuth';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

interface NavLinkSpec {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  title: string;
  links: ReadonlyArray<NavLinkSpec>;
}

// Sidebar V2 (2026-07-03, Mavis/MC A3 Book) — Triptyque 1+2+Duo regroupé dans les 4 sections Digital Garden existantes.
// D4 append-only: legacy routes /people, /agents, /documents, /sop, /it-data remain live in App.tsx (canonical).
//   CULTIVATE = Triptyque 1 (foundation/backbone): People/Agents | Operations/Knowledge | IT Software Kernel
//   NURTURE   = day-to-day operations runway
//   BLOOM     = Triptyque 2 (GTM): Product | Growth | Sales Sanctum
//   ROOTS     = Duo (guard rails): Finance | Legal  + Settings (Mark-style arborescences per-user)
const NAV_GROUPS: ReadonlyArray<NavGroup> = [
  {
    title: 'CULTIVATE',
    links: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/people-agents', label: 'People / Agents', icon: UserCog },
      { to: '/operations-knowledge', label: 'Operations / Knowledge', icon: BookOpen },
      { to: '/it-software-kernel', label: 'IT Software Kernel', icon: Server }
    ]
  },
  {
    title: 'NURTURE',
    links: [
      { to: '/clients', label: 'Clients', icon: Users },
      { to: '/tasks', label: 'Tasks', icon: CheckSquare },
      { to: '/marketplace', label: 'Marketplace', icon: ShoppingBag }
    ]
  },
  {
    title: 'BLOOM',
    links: [
      { to: '/product', label: 'Product', icon: Rocket },
      { to: '/growth', label: 'Growth', icon: Rocket },
      { to: '/sales', label: 'Sales Sanctum', icon: ShieldCheck }
    ]
  },
  {
    title: 'ROOTS',
    links: [
      { to: '/finance', label: 'Finance', icon: CreditCard },
      { to: '/legal', label: 'Legal', icon: Scale },
      { to: '/settings', label: 'Settings', icon: Settings }
    ]
  }
];

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async (): Promise<void> => {
    await signOut();
    navigate('/login', { replace: true });
  };
  return (
    <aside
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } h-[calc(100vh-2rem)] fixed left-0 top-0 md:left-4 md:top-4 z-50 rounded-none md:rounded-2xl flex flex-col glass-panel shadow-soft transition-all duration-300 ease-in-out md:translate-x-0`}
    >
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm shrink-0">
            <Shield strokeWidth={2.5} className="w-6 h-6" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900 tracking-tight leading-tight truncate">OMK Services</h2>
              <span className="text-xs text-slate-500 font-medium tracking-wide">BUSINESS OS</span>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <button
            onClick={onToggle}
            aria-label="Collapse sidebar"
            className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white border border-stone-200 rounded-full flex items-center justify-center text-stone-500 hover:text-emerald-600 hover:border-emerald-300 shadow-sm transition-colors z-50"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        )}
        {isCollapsed && (
          <button
            onClick={onToggle}
            aria-label="Expand sidebar"
            className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white border border-stone-200 rounded-full flex items-center justify-center text-stone-500 hover:text-emerald-600 hover:border-emerald-300 shadow-sm transition-colors z-50"
          >
            <PanelLeftClose className="w-3.5 h-3.5 rotate-180" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-8 no-scrollbar">
        {NAV_GROUPS.map((group, idx) => (
          <div key={idx}>
            {!isCollapsed && (
              <h3 className="text-xs font-semibold text-slate-400 tracking-widest px-3 mb-3 uppercase">
                {group.title}
              </h3>
            )}
            {isCollapsed && <div className="h-px w-8 bg-stone-200 mx-auto mb-3" />}
            <div className="space-y-1">
              {group.links.map((link) => {
                const Icon = link.icon;
                return (
                  <PrefetchNavLink
                    key={link.to}
                    to={link.to}
                    title={isCollapsed ? link.label : undefined}
                    className={({ isActive }) =>
                      `w-full flex items-center ${isCollapsed ? '' : 'px-3'} py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-emerald-100/80 text-emerald-900 shadow-sm'
                          : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100/50'
                      } ${isCollapsed ? 'justify-center' : ''}`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={`w-4 h-4 ${isCollapsed ? '' : 'mr-3'} ${isActive ? 'text-emerald-600' : ''}`}
                        />
                        {!isCollapsed && <span className="truncate">{link.label}</span>}
                      </>
                    )}
                  </PrefetchNavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-stone-100 bg-white/40 rounded-b-2xl overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
            {(user?.email || 'GU').slice(0, 2).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user?.email?.split('@')[0] || 'Guest'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email || 'Not signed in'}</p>
            </div>
          )}
          {user && !isCollapsed && (
            <button
              type="button"
              onClick={() => void handleSignOut()}
              aria-label="Sign out"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
          {user && isCollapsed && (
            <button
              type="button"
              onClick={() => void handleSignOut()}
              aria-label="Sign out"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;