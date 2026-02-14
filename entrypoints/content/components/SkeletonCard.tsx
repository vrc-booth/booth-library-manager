interface SkeletonCardProps {
  count?: number;
}

function SingleSkeleton() {
  return (
    <div className="rounded-lg overflow-hidden border border-gray-100">
      <div className="aspect-square bg-gray-200 animate-pulse" />
      <div className="p-2 space-y-2">
        <div className="h-3 bg-gray-200 rounded animate-pulse w-full" />
        <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
        <div className="h-2 bg-gray-200 rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
}

export default function SkeletonCard({ count = 6 }: SkeletonCardProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }, (_, i) => (
        <SingleSkeleton key={i} />
      ))}
    </div>
  );
}
