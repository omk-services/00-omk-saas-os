import React, { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { invoicesRepo } from '@/data/invoices.repo';
import { Invoice } from '@/lib/types';
import { BarChart3, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

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

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-stone-200 rounded w-1/3"></div>
        <div className="h-32 bg-stone-100 rounded"></div>
      </div>
    );
  }
  if (error) {
    return <div className="p-6 bg-rose-50 border border-rose-200 rounded-lg text-rose-700">Error: {error}</div>;
  }

  return (
  <div className="space-y-6 animate-in fade-in duration-300">
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Payments & Finance</h1>
      <p className="text-slate-500 text-sm mt-1">Automated billing with Stripe/PayPal integration</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[
        { label: 'Total Revenue', value: '$4,350', status: 'mtd', icon: BarChart3, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Pending', value: '$850', status: '3 invoices', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Overdue', value: '$350', status: '1 invoice', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
        { label: 'Collection Rate', value: '95%', status: 'Top tier', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      ].map((stat, i) => (
        <Card key={i} className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
            </div>
            <div className={`p-2.5 rounded-lg ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs font-medium text-slate-400 mt-4">{stat.status}</p>
        </Card>
      ))}
    </div>

    <Card>
      <div className="p-4 border-b border-stone-200 flex justify-between items-center">
        <h3 className="font-semibold text-slate-900">Recent Transactions</h3>
        <button className="text-sm bg-stone-100 hover:bg-stone-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors">
          Create Invoice
        </button>
      </div>
      <table className="w-full text-left">
        <thead>
          <tr className="bg-stone-50 border-b border-stone-200 text-xs font-semibold text-slate-500 uppercase">
            <th className="p-4">Invoice</th>
            <th className="p-4">Client</th>
            <th className="p-4">Service</th>
            <th className="p-4">Amount</th>
            <th className="p-4">Status</th>
            <th className="p-4 text-right">Due Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {invoices.map(inv => (
            <tr key={inv.id} className="hover:bg-stone-50 transition-colors">
              <td className="p-4 font-medium text-slate-900 text-sm">{inv.id}</td>
              <td className="p-4 text-sm text-slate-700">{inv.client}</td>
              <td className="p-4 text-sm text-slate-500">{inv.service}</td>
              <td className="p-4 font-medium text-slate-900 text-sm">${inv.amount}</td>
              <td className="p-4">
                <Badge variant={inv.status === 'Paid' ? 'success' : inv.status === 'Pending' ? 'warning' : 'danger'}>{inv.status}</Badge>
              </td>
              <td className="p-4 text-right text-sm text-slate-500 font-mono">{inv.due}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  </div>
  );
};
