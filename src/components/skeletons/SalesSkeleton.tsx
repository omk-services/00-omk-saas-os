import React from 'react';

const SkeletonBar = ({ className }: { className: string }) => (
  <div className={`bg-stone-200 animate-pulse rounded ${className}`} />
);

export default function SalesSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <SkeletonBar className="h-8 w-56" />
          <SkeletonBar className="h-4 w-72" />
        </div>
        <SkeletonBar className="h-10 w-48 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-stone-200 p-6 rounded-2xl space-y-3">
            <SkeletonBar className="h-3 w-24" />
            <SkeletonBar className="h-7 w-32" />
            <SkeletonBar className="h-1.5 w-full" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-stone-200 p-4 rounded-xl flex items-center space-x-3">
            <SkeletonBar className="h-9 w-9 rounded-lg" />
            <div className="flex-1 space-y-2">
              <SkeletonBar className="h-3 w-3/4" />
              <SkeletonBar className="h-2 w-1/2" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-stone-200 p-4 rounded-xl space-y-3">
            <SkeletonBar className="h-3 w-20" />
            {Array.from({ length: 2 }).map((__, j) => (
              <div key={j} className="space-y-2 p-3 border border-stone-200 rounded-lg">
                <SkeletonBar className="h-3 w-3/4" />
                <SkeletonBar className="h-2 w-1/2" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
