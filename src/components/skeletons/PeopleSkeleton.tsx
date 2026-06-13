import React from 'react';

const SkeletonBar = ({ className }: { className: string }) => (
  <div className={`bg-stone-200 animate-pulse rounded ${className}`} />
);

export default function PeopleSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <SkeletonBar className="h-7 w-48" />
          <SkeletonBar className="h-4 w-72" />
        </div>
        <SkeletonBar className="h-8 w-40 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white border border-stone-200 p-5 rounded-xl space-y-4">
            <div className="flex items-center gap-3">
              <SkeletonBar className="h-12 w-12 rounded-xl" />
              <div className="space-y-2 flex-1">
                <SkeletonBar className="h-4 w-3/4" />
                <SkeletonBar className="h-3 w-1/2" />
              </div>
            </div>
            <SkeletonBar className="h-2 w-full" />
          </div>
        ))}
      </div>
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 border-b border-stone-100 last:border-b-0">
            <SkeletonBar className="h-4 w-32" />
            <SkeletonBar className="h-8 w-40 rounded-full" />
            <SkeletonBar className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
