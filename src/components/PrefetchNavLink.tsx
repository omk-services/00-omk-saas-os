// src/components/PrefetchNavLink.tsx
// D6 #56 (2026-06-19): NavLink wrapper that prefetches the lazy-loaded view
// chunk on hover/focus. Reduces perceived navigation latency to ~0ms once
// the user has indicated intent (hover or keyboard focus).
//
// Browser caches the chunk after first fetch, so subsequent navigations
// are instant even if the user never hovered first.

import React, { useCallback, useRef } from 'react';
import { NavLink } from 'react-router-dom';

type RouteLoader = () => Promise<unknown>;

const ROUTE_PREFETCHERS: Record<string, RouteLoader> = {
  '/dashboard': () => import('@/components/views/DashboardView'),
  '/clients': () => import('@/components/views/ClientsView'),
  '/documents': () => import('@/components/views/DocumentsView'),
  '/agents': () => import('@/components/views/AgentsView'),
  '/finance': () => import('@/components/views/FinanceView'),
  '/sop': () => import('@/components/views/SOPLibraryView'),
  '/settings': () => import('@/components/views/SettingsView'),
  '/people': () => import('@/components/views/PeopleView'),
  '/tasks': () => import('@/components/views/TasksView'),
  '/legal': () => import('@/components/views/LegalView'),
  '/growth': () => import('@/components/views/GrowthView'),
  '/sales': () => import('@/components/views/SalesView'),
  '/marketplace': () => import('@/components/views/MarketplaceView'),
  '/it-data': () => import('@/components/views/ItDataView'),
};

interface PrefetchNavLinkProps {
  to: string;
  title?: string;
  className?: string | ((args: { isActive: boolean }) => string);
  children: React.ReactNode | ((args: { isActive: boolean }) => React.ReactNode);
}

export const PrefetchNavLink: React.FC<PrefetchNavLinkProps> = ({ to, title, className, children }) => {
  const prefetchedRef = useRef(false);

  const prefetch = useCallback((): void => {
    if (prefetchedRef.current) return;
    const loader = ROUTE_PREFETCHERS[to];
    if (loader) {
      prefetchedRef.current = true;
      void loader().catch(() => {
        // Network error during prefetch is non-fatal (chunk will be re-fetched on actual nav)
        prefetchedRef.current = false;
      });
    }
  }, [to]);

  return (
    <NavLink
      to={to}
      title={title}
      onMouseEnter={prefetch}
      onFocus={prefetch}
      onTouchStart={prefetch}
      className={className}
    >
      {children}
    </NavLink>
  );
};

export default PrefetchNavLink;
