import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EnvelopeIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { Input } from "./Input";

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    label: "E-mail",
    placeholder: "seu@email.com",
  },
};
export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {};

export const Required: Story = {
  args: { required: true },
};

export const WithHelperText: Story = {
  args: {
    label: "Slug",
    placeholder: "meu-evento-2026",
    helperText: "Apenas letras minúsculas, números e hífens.",
  },
};

export const WithError: Story = {
  args: {
    label: "Senha",
    type: "password",
    placeholder: "••••••••",
    error: "A senha deve ter pelo menos 8 caracteres.",
  },
};

export const WithLeftAddon: Story = {
  args: {
    leftAddon: <EnvelopeIcon className="h-4 w-4" />,
  },
};

export const Password: Story = {
  args: {
    label: "Senha",
    type: "password",
    placeholder: "••••••••",
    leftAddon: <LockClosedIcon className="h-4 w-4" />,
  },
};

export const Disabled: Story = {
  args: { disabled: true, value: "disabled@example.com" },
};
