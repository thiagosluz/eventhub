import { SkeletonList } from "@/components/ui";

export default function PublicLoading() {
  return (
    <div className="min-h-screen bg-background px-6 pt-28 pb-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="space-y-3">
          <div className="h-10 w-2/3 rounded-xl bg-muted/70 animate-pulse" />
          <div className="h-4 w-1/2 rounded-md bg-muted/70 animate-pulse" />
        </div>
        <SkeletonList count={4} />
      </div>
    </div>
  );
}
