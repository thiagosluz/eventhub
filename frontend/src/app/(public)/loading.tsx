import { Skeleton, SkeletonList } from "@/components/ui";

export default function PublicLoading() {
  return (
    <div className="min-h-screen bg-background px-6 pt-28 pb-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <SkeletonList count={4} />
      </div>
    </div>
  );
}
