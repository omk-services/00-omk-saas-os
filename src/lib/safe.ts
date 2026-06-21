// src/lib/safe.ts
// Zero Bug Sprint (D6 #95e/C2, C5) — Defensive read helpers.
//
// Use these anywhere a DB column might be null/undefined or a custom mapper
// might not have translated a column name. They NEVER throw — they return a
// safe fallback value.

export const safeArray = <T>(v: unknown): T[] => {
  return Array.isArray(v) ? (v as T[]) : [];
};

export const safeStr = (v: unknown, fallback = ''): string => {
  if (typeof v === 'string') return v;
  if (v == null) return fallback;
  return String(v);
};

export const safeNum = (v: unknown, fallback = 0): number => {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isNaN(n) ? fallback : n;
  }
  return fallback;
};

export const safeArrayAccess = <T>(arr: T[] | undefined, i: number, fallback: T): T => {
  if (!Array.isArray(arr)) return fallback;
  if (i < 0 || i >= arr.length) return fallback;
  return arr[i];
};

/**
 * Format an ISO timestamp (or null/undefined) for display in the UI.
 * Returns "—" for null/undefined to avoid displaying literal "Invalid Date".
 */
export const formatDate = (v: string | null | undefined, locale = 'en-US'): string => {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
};

/**
 * Format a numeric/decimal value (PostgREST returns numeric as string) as
 * a currency string. Avoids "NaN" / "undefined" in the UI.
 */
export const formatMoney = (v: string | number | null | undefined, currency = 'EUR'): string => {
  const n = safeNum(v, 0);
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
  } catch {
    return `${n}`;
  }
};