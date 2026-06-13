import React from 'react';
import { Users } from 'lucide-react';

export default function EmptyPeople() {
  return (
    <div className="flex flex-col items-center justify-center h-96 text-slate-400">
      <div className="p-4 bg-stone-50 rounded-full mb-4">
        <Users className="w-10 h-10 text-slate-300" />
      </div>
      <p className="text-lg font-medium text-slate-600">No team members</p>
      <p className="text-sm mt-2">Build your crew. Add humans and AI agents to your roster.</p>
    </div>
  );
}
