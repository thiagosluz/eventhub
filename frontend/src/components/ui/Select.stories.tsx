import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Select } from "./Select";

const meta: Meta<typeof Select> = {
  title: "UI/Select",
  component: Select,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    label: "Tipo de evento",
    placeholder: "Selecione uma opção",
    options: [
      { value: "conference", label: "Conferência" },
      { value: "workshop", label: "Workshop" },
      { value: "meetup", label: "Meetup" },
      { value: "webinar", label: "Webinar", disabled: true },
    ],
  },
};
export default meta;

type Story = StoryObj<typeof Select>;

export const Default: Story = {};

export const Required: Story = {
  args: { required: true },
};

export const WithHelperText: Story = {
  args: {
    helperText: "Essa classificação afeta os filtros de busca pública.",
  },
};

export const WithError: Story = {
  args: {
    error: "Selecione um tipo válido.",
  },
};

export const Prefilled: Story = {
  args: { defaultValue: "workshop" },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "conference" },
};

export const WithChildren: Story = {
  args: {
    options: undefined,
    children: (
      <>
        <option value="">— selecione —</option>
        <optgroup label="Presenciais">
          <option value="conf">Conferência</option>
          <option value="ws">Workshop</option>
        </optgroup>
        <optgroup label="Online">
          <option value="web">Webinar</option>
        </optgroup>
      </>
    ),
  },
};
