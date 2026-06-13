import React from 'react';
import { Server } from 'lucide-react';

export default function EmptyItData() {
  return (
    <div className="flex flex-col items-center justify-center h-96 text-slate-400">
      <div className="p-4 bg-stone-50 rounded-full mb-4">
        <Server className="w-10 h-10 text-slate-300" />
      </div>
      <p className="text-lg font-medium text-slate-600">No connections configured</p>
      <p className="text-sm mt-2">Connect your first service to monitor health and uptime.</p>
    </div>
  );
}
