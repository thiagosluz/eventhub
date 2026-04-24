import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ConfirmDialog } from "./ConfirmDialog";
import { Button } from "./Button";

const meta: Meta<typeof ConfirmDialog> = {
  title: "UI/ConfirmDialog",
  component: ConfirmDialog,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Diálogo de confirmação de alto nível sobre o primitivo Modal. Suporta tons (danger/warning/primary/success/info), palavra de segurança e estado de loading.",
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof ConfirmDialog>;

function Harness(props: Omit<React.ComponentProps<typeof ConfirmDialog>, "open" | "onClose" | "onConfirm">) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-[400px] flex items-center justify-center p-12">
      <Button onClick={() => setOpen(true)}>Abrir diálogo</Button>
      <ConfirmDialog
        {...props}
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
      />
    </div>
  );
}

export const Danger: Story = {
  render: () => (
    <Harness
      title="Excluir evento?"
      description="Esta ação é irreversível e removerá todas as inscrições e atividades associadas."
      tone="danger"
    />
  ),
};

export const Warning: Story = {
  render: () => (
    <Harness
      title="Publicar com alterações pendentes?"
      description="Há 3 atividades sem palestrante definido. Tem certeza que quer publicar agora?"
      tone="warning"
      confirmText="Publicar mesmo assim"
    />
  ),
};

export const Primary: Story = {
  render: () => (
    <Harness
      title="Deseja reabrir inscrições?"
      description="Os participantes poderão se inscrever novamente até o próximo fechamento."
      tone="primary"
      confirmText="Reabrir"
    />
  ),
};

export const Success: Story = {
  render: () => (
    <Harness
      title="Tudo certo!"
      description="Seu evento foi publicado e já está visível publicamente."
      tone="success"
      hideCancel
    />
  ),
};

export const WithSafetyWord: Story = {
  render: () => (
    <Harness
      title="Exclusão definitiva"
      description="Digite a palavra de segurança para confirmar. Essa ação não pode ser desfeita."
      tone="danger"
      safetyWord="DELETAR"
      confirmText="Excluir definitivamente"
    />
  ),
};
