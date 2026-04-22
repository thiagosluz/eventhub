import { SkeletonCard } from "@/components/ui";

export default function SpeakerLoading() {
  return (
    <div className="p-8 space-y-6">
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
