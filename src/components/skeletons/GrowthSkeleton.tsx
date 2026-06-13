import React from 'react';

const SkeletonBar = ({ className }: { className: string }) => (
  <div className={`bg-stone-200 animate-pulse rounded ${className}`} />
);

export default function GrowthSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <SkeletonBar className="h-7 w-44" />
          <SkeletonBar className="h-4 w-56" />
        </div>
        <div className="flex gap-3">
          <SkeletonBar className="h-10 w-32 rounded-lg" />
          <SkeletonBar className="h-10 w-28 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3">
            <SkeletonBar className="h-5 w-32" />
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((__, j) => (
                <div key={j} className="bg-stone-200 animate-pulse rounded-xl h-16 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
