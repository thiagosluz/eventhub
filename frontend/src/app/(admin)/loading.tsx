import { SkeletonList } from "@/components/ui";

export default function AdminLoading() {
  return (
    <div className="p-8 space-y-6">
      <SkeletonList count={4} />
    </div>
  );
}
