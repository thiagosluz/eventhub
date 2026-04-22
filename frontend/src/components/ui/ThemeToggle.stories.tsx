import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ThemeToggle } from "./ThemeToggle";
import { ThemeModeProvider } from "../providers/ThemeModeProvider";

const meta: Meta<typeof ThemeToggle> = {
  title: "UI/ThemeToggle",
  component: ThemeToggle,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <ThemeModeProvider>
        <Story />
      </ThemeModeProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof ThemeToggle>;

export const Default: Story = {};

export const InHeader: Story = {
  render: () => (
    <div className="flex items-center justify-between w-[520px] h-14 px-6 rounded-2xl border border-border bg-card">
      <span className="text-sm font-black uppercase tracking-widest text-muted-foreground">
        EventHub HQ <span className="text-border mx-2">/</span>{" "}
        <span className="text-foreground">Visão Geral</span>
      </span>
      <ThemeModeProvider>
        <ThemeToggle />
      </ThemeModeProvider>
    </div>
  ),
};
