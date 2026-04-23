import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Textarea } from "./Textarea";

const meta: Meta<typeof Textarea> = {
  title: "UI/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    label: "Descrição",
    placeholder: "Fale um pouco sobre o evento…",
  },
};
export default meta;

type Story = StoryObj<typeof Textarea>;

export const Default: Story = {};

export const Required: Story = {
  args: { required: true },
};

export const WithHelperText: Story = {
  args: {
    helperText: "Aparece na página pública do evento.",
  },
};

export const WithError: Story = {
  args: {
    error: "A descrição deve ter pelo menos 20 caracteres.",
    defaultValue: "curta",
  },
};

export const Large: Story = {
  args: {
    rows: 8,
    defaultValue:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero.",
  },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "Somente leitura." },
};
