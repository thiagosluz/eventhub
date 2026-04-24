import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Input } from "./Input";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

const meta: Meta<typeof Modal> = {
  title: "UI/Modal",
  component: Modal,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Primitivo de diálogo modal com role=dialog, aria-modal, focus trap, ESC e scroll lock. Use `Modal.Header`, `Modal.Body` e `Modal.Footer` para manter layout consistente.",
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof Modal>;

function ModalHarness({
  label = "Abrir modal",
  children,
}: {
  label?: string;
  children: (ctx: { open: boolean; close: () => void }) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-[400px] flex items-center justify-center p-12">
      <Button onClick={() => setOpen(true)}>{label}</Button>
      {children({ open, close: () => setOpen(false) })}
    </div>
  );
}

export const Basic: Story = {
  render: () => (
    <ModalHarness>
      {({ open, close }) => (
        <Modal open={open} onClose={close}>
          <Modal.Header
            icon={<InformationCircleIcon className="w-6 h-6" />}
            iconTone="info"
          >
            Publicar evento?
          </Modal.Header>
          <Modal.Body>
            Ao publicar, o evento se torna visível publicamente na landing e em
            URLs por slug. Você ainda poderá editá-lo depois.
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" onClick={close}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={close}>
              Publicar
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </ModalHarness>
  ),
};

export const WithForm: Story = {
  render: () => (
    <ModalHarness label="Criar categoria">
      {({ open, close }) => (
        <Modal open={open} onClose={close} size="lg">
          <Modal.Header>Nova categoria</Modal.Header>
          <Modal.Body>
            <form className="space-y-4 text-foreground">
              <Input label="Nome" placeholder="Ex: Workshop" data-autofocus="true" />
              <Input label="Descrição (opcional)" placeholder="Resumo curto" />
            </form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" onClick={close}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={close}>
              Criar
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </ModalHarness>
  ),
};

function SizesDemo() {
  const sizes: Array<"sm" | "md" | "lg" | "xl" | "2xl"> = [
    "sm",
    "md",
    "lg",
    "xl",
    "2xl",
  ];
  const [openSize, setOpenSize] = useState<string | null>(null);
  return (
    <div className="min-h-[400px] flex flex-wrap gap-2 items-center justify-center p-12">
      {sizes.map((s) => (
        <Button key={s} onClick={() => setOpenSize(s)}>
          Abrir {s}
        </Button>
      ))}
      {sizes.map((s) => (
        <Modal
          key={s}
          open={openSize === s}
          onClose={() => setOpenSize(null)}
          size={s}
        >
          <Modal.Header>Tamanho: {s}</Modal.Header>
          <Modal.Body>
            Cada tamanho controla o `max-width` do painel.
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={() => setOpenSize(null)}>Fechar</Button>
          </Modal.Footer>
        </Modal>
      ))}
    </div>
  );
}

export const Sizes: Story = {
  render: () => <SizesDemo />,
};

export const NotDismissibleOnOverlay: Story = {
  name: "Não fecha no overlay",
  render: () => (
    <ModalHarness label="Abrir modal persistente">
      {({ open, close }) => (
        <Modal open={open} onClose={close} closeOnOverlayClick={false}>
          <Modal.Header>Ação necessária</Modal.Header>
          <Modal.Body>
            Esse modal só pode ser fechado pelo botão ou pela tecla ESC.
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={close}>
              Ok, entendi
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </ModalHarness>
  ),
};
