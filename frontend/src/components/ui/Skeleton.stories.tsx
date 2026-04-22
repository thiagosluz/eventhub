import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Skeleton, SkeletonCard, SkeletonList } from "./Skeleton";

const meta: Meta<typeof Skeleton> = {
  title: "UI/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
  render: () => <Skeleton className="h-6 w-[260px]" />,
};

export const Stack: Story = {
  render: () => (
    <div className="w-[320px] space-y-3">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  ),
};

export const AsCard: Story = {
  render: () => (
    <div className="w-[360px]">
      <SkeletonCard />
    </div>
  ),
};

export const AsList: Story = {
  render: () => (
    <div className="w-[420px]">
      <SkeletonList count={3} />
    </div>
  ),
};
