import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CalendarDaysIcon, InboxIcon } from "@heroicons/react/24/outline";
import { EmptyState } from "./EmptyState";
import { Button } from "./Button";

const meta: Meta<typeof EmptyState> = {
  title: "UI/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    title: "Nenhum evento por aqui",
    description:
      "Crie seu primeiro evento para começar a receber inscrições e submissões.",
    icon: <CalendarDaysIcon className="h-7 w-7" />,
    action: <Button>Criar evento</Button>,
  },
};

export const Minimal: Story = {
  args: {
    title: "Sem notificações",
    description: "Você está em dia.",
    icon: <InboxIcon className="h-7 w-7" />,
  },
};
