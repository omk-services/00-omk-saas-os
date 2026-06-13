import React from 'react';

const SkeletonBar = ({ className }: { className: string }) => (
  <div className={`bg-stone-200 animate-pulse rounded ${className}`} />
);

export default function TasksSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <SkeletonBar className="h-7 w-32" />
          <SkeletonBar className="h-4 w-56" />
        </div>
        <SkeletonBar className="h-10 w-24 rounded-lg" />
      </div>
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-stone-200 bg-stone-50">
          <SkeletonBar className="h-3 w-8 col-span-1" />
          <SkeletonBar className="h-3 w-20 col-span-5" />
          <SkeletonBar className="h-3 w-16 col-span-3" />
          <SkeletonBar className="h-3 w-16 col-span-3" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="grid grid-cols-12 gap-4 p-4 items-center border-b border-stone-100 last:border-b-0">
            <SkeletonBar className="h-6 w-6 rounded-lg col-span-1" />
            <div className="col-span-5 space-y-2">
              <SkeletonBar className="h-4 w-3/4" />
              <SkeletonBar className="h-3 w-1/2" />
            </div>
            <SkeletonBar className="h-6 w-20 rounded-lg col-span-3" />
            <SkeletonBar className="h-6 w-16 rounded-lg col-span-3" />
          </div>
        ))}
      </div>
    </div>
  );
}
