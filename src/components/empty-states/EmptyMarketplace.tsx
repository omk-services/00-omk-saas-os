import React from 'react';
import { Package } from 'lucide-react';

export default function EmptyMarketplace() {
  return (
    <div className="flex flex-col items-center justify-center h-96 text-slate-400">
      <div className="p-4 bg-stone-50 rounded-full mb-4">
        <Package className="w-10 h-10 text-slate-300" />
      </div>
      <p className="text-lg font-medium text-slate-600">Marketplace is empty</p>
      <p className="text-sm mt-2">No modules available. Check back later for new sprouts.</p>
    </div>
  );
}
