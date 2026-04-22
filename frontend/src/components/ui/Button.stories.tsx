import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArrowRightIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  args: {
    children: "Continuar",
    variant: "primary",
    size: "md",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "outline", "ghost", "destructive"],
    },
    size: { control: "select", options: ["sm", "md", "lg"] },
    isLoading: { control: "boolean" },
    fullWidth: { control: "boolean" },
    disabled: { control: "boolean" },
  },
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: { variant: "secondary" },
};

export const Outline: Story = {
  args: { variant: "outline" },
};

export const Ghost: Story = {
  args: { variant: "ghost" },
};

export const Destructive: Story = {
  args: { variant: "destructive", children: "Excluir" },
};

export const Loading: Story = {
  args: { isLoading: true, children: "Processando…" },
};

export const WithLeftIcon: Story = {
  args: {
    children: "Remover",
    variant: "destructive",
    leftIcon: <TrashIcon className="h-4 w-4" />,
  },
};

export const WithRightIcon: Story = {
  args: {
    children: "Avançar",
    rightIcon: <ArrowRightIcon className="h-4 w-4" />,
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <Button {...args} size="sm">
        Pequeno
      </Button>
      <Button {...args} size="md">
        Médio
      </Button>
      <Button {...args} size="lg">
        Grande
      </Button>
    </div>
  ),
};

export const AllVariants: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  ),
};
