import React from 'react';

const SkeletonBar = ({ className }: { className: string }) => (
  <div className={`bg-stone-200 animate-pulse rounded ${className}`} />
);

export default function MarketplaceSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="text-center max-w-2xl mx-auto pt-2 space-y-3">
        <SkeletonBar className="h-9 w-72 mx-auto" />
        <SkeletonBar className="h-4 w-96 mx-auto" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-stone-200 rounded-2xl p-8 space-y-4">
            <div className="flex justify-between">
              <SkeletonBar className="h-12 w-12 rounded-2xl" />
              <SkeletonBar className="h-6 w-16 rounded-full" />
            </div>
            <SkeletonBar className="h-5 w-3/4" />
            <SkeletonBar className="h-4 w-full" />
            <SkeletonBar className="h-4 w-5/6" />
            <div className="flex justify-between pt-4 border-t border-stone-100">
              <SkeletonBar className="h-7 w-16" />
              <SkeletonBar className="h-10 w-28 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
