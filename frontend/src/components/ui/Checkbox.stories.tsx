import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Checkbox } from "./Checkbox";

const meta: Meta<typeof Checkbox> = {
  title: "UI/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    label: "Aceito os termos e a política de privacidade",
  },
};
export default meta;

type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {};

export const Required: Story = {
  args: { required: true },
};

export const Checked: Story = {
  args: { defaultChecked: true },
};

export const WithDescription: Story = {
  args: {
    label: "Notificações por e-mail",
    description:
      "Você receberá atualizações sobre inscrições, ingressos e submissões.",
    defaultChecked: true,
  },
};

export const WithError: Story = {
  args: {
    label: "Li e concordo com os termos de uso",
    error: "É obrigatório aceitar os termos para continuar.",
    required: true,
  },
};

export const Disabled: Story = {
  args: { disabled: true, defaultChecked: true, label: "Opção travada" },
};
