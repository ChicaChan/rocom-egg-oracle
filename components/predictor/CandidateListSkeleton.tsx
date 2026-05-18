"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function CandidateListSkeleton() {
  return (
    <ol className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <li className="md:col-span-2">
        <div className="rounded-xl border p-5 flex gap-4">
          <Skeleton className="size-24 rounded-lg" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-2 w-full" />
          </div>
        </div>
      </li>
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i}>
          <div className="rounded-xl border p-4 flex gap-3">
            <Skeleton className="size-14 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-2 w-full" />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
