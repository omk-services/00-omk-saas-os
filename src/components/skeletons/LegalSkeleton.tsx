import React from 'react';

const SkeletonBar = ({ className }: { className: string }) => (
  <div className={`bg-stone-200 animate-pulse rounded ${className}`} />
);

export default function LegalSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <SkeletonBar className="h-7 w-44" />
          <SkeletonBar className="h-4 w-72" />
        </div>
        <SkeletonBar className="h-8 w-40 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-xl p-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <SkeletonBar className="h-10 w-10 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <SkeletonBar className="h-4 w-3/4" />
                  <SkeletonBar className="h-3 w-1/2" />
                </div>
              </div>
              <SkeletonBar className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
          <SkeletonBar className="h-32 w-32 rounded-full mx-auto" />
          <SkeletonBar className="h-4 w-3/4 mx-auto" />
          <SkeletonBar className="h-10 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
