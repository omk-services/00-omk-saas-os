import React from 'react';
import { Check } from 'lucide-react';

export default function EmptyTasks() {
  return (
    <div className="flex flex-col items-center justify-center h-96 text-slate-400">
      <div className="p-4 bg-stone-50 rounded-full mb-4">
        <Check className="w-10 h-10 text-emerald-300" />
      </div>
      <p className="text-lg font-medium text-slate-600">Inbox zero</p>
      <p className="text-sm mt-2">No tasks pending. Add one to start your day.</p>
    </div>
  );
}
