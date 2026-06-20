// src/components/views/FinanceView.tsx
// Zero Bug Sprint — rewritten to match omk_saas.invoices schema.
//
// Field changes (D6 #98):
//   - `inv.client` → `clientId` (no denormalized client name on invoices table;
//     would need a join to clients.name which is D2).
//   - `inv.service` → dropped (no DB column).
//   - `inv.amount` → string (PostgREST numeric → string) → formatted via formatMoney().
//   - `inv.due` → `inv.dueAt` → formatted via formatDate().
//   - Status enum translated via INVOICE_STATUS_LABEL.
// UX: <BackButton /> + <EmptyState /> + computed live KPIs from real data.

import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { invoicesRepo } from '@/data/invoices.repo';
import { Invoice } from '@/lib/types';
import { INVOICE_STATUS_LABEL } from '@/lib/statusLabels';
import { BarChart3, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { EmptyState } from '@/components/EmptyState';
import { formatDate, formatMoney, safeArray, safeNum } from '@/lib/safe';

const VARIANT_BY_STATUS: Record<Invoice['status'], 'success' | 'warning' | 'danger' | 'info'> = {
  paid: 'success',
  overdue: 'danger',
  sent: 'info',
  draft: 'info',
  cancelled: 'warning',
};

export const FinanceView: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    invoicesRepo.list()
      .then(setInvoices)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const list = safeArray<Invoice>(invoices);

  const stats = useMemo(() => {
    const paid = list.filter((i) => i.status === 'paid');
    const overdue = list.filter((i) => i.status === 'overdue');
    const pending = list.filter((i) => i.status === 'sent' || i.status === 'draft');
    const totalPaid = paid.reduce((sum, i) => sum + safeNum(i.amount, 0), 0);
    const totalPending = pending.reduce((sum, i) => sum + safeNum(i.amount, 0), 0);
    const totalOverdue = overdue.reduce((sum, i) => sum + safeNum(i.amount, 0), 0);
    const collectionRate =
      totalPaid + totalPending > 0 ? Math.round((totalPaid / (totalPaid + totalPending)) * 100) : 0;
    return {
      totalPaid,
      pendingCount: pending.length,
      overdueCount: overdue.length,
      collectionRate,
    };
  }, [list]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse" role="status" aria-label="Loading">
        <div className="h-8 bg-stone-200 rounded w-1/3"></div>
        <div className="h-32 bg-stone-100 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-lg text-rose-700" role="alert">
        <p className="font-semibold">Error loading invoices</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <BackButton />

      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Payments & Finance</h1>
        <p className="text-slate-500 text-sm mt-1">
          Invoices, billing status, and revenue (live data from omk_saas.invoices)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Paid</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatMoney(stats.totalPaid)}</h3>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs font-medium text-slate-400 mt-4">all time</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Pending</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.pendingCount}</h3>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs font-medium text-slate-400 mt-4">invoices awaiting payment</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Overdue</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.overdueCount}</h3>
            </div>
            <div className="p-2.5 rounded-lg bg-red-50 text-red-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs font-medium text-slate-400 mt-4">invoices past due date</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Collection Rate</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.collectionRate}%</h3>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs font-medium text-slate-400 mt-4">paid / (paid + pending)</p>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b border-stone-200 flex justify-between items-center">
          <h3 className="font-semibold text-slate-900">Recent Transactions</h3>
          <span className="text-xs text-slate-500 font-mono">{list.length} invoices</span>
        </div>

        {list.length === 0 ? (
          <EmptyState
            title="No invoices yet"
            description="Invoices will appear here once they are created for a client."
          />
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-xs font-semibold text-slate-500 uppercase">
                <th className="p-4">Invoice</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Currency</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {list.map((inv) => (
                <tr key={inv.id} className="hover:bg-stone-50 transition-colors">
                  <td className="p-4 font-mono text-xs text-slate-500">{inv.id.slice(0, 8)}…</td>
                  <td className="p-4 font-medium text-slate-900 text-sm">
                    {formatMoney(inv.amount, inv.currency)}
                  </td>
                  <td className="p-4 text-sm text-slate-500">{inv.currency}</td>
                  <td className="p-4">
                    <Badge variant={VARIANT_BY_STATUS[inv.status]}>
                      {INVOICE_STATUS_LABEL[inv.status]}
                    </Badge>
                  </td>
                  <td className="p-4 text-right text-sm text-slate-500 font-mono">
                    {formatDate(inv.dueAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};

export default FinanceView;