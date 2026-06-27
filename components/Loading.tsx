"use client";

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-10 w-10" };
  return (
    <div
      className={`${sizes[size]} animate-spin rounded-full border-2 border-orange-500/30 border-t-orange-500`}
      role="status"
      aria-label="Loading"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden bg-zinc-800/60 border border-zinc-700/50 animate-pulse">
      <div className="aspect-square bg-zinc-700/60" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-zinc-700/60 rounded-full w-3/4" />
        <div className="h-3 bg-zinc-700/60 rounded-full w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonGallery() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="rounded-2xl bg-zinc-800/60 border border-zinc-700/50 p-6 animate-pulse">
        <div className="h-6 bg-zinc-700/60 rounded-full w-2/3 mb-3" />
        <div className="h-4 bg-zinc-700/60 rounded-full w-1/3 mb-2" />
        <div className="h-4 bg-zinc-700/60 rounded-full w-1/4" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
