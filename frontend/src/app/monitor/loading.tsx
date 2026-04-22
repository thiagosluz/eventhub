import { SkeletonList } from "@/components/ui";

export default function MonitorLoading() {
  return (
    <div className="p-8 space-y-6">
      <SkeletonList count={3} />
    </div>
  );
}
