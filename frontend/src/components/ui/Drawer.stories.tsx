import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Drawer } from "./Drawer";
import { Button } from "./Button";

const meta: Meta<typeof Drawer> = {
  title: "UI/Drawer",
  component: Drawer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Sheet lateral com focus trap, ESC e scroll lock. Compartilha o `useDialogBehavior` com o Modal. Use para detalhes ricos (ex: detalhes de participante).",
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof Drawer>;

function DrawerHarness({
  side = "right" as const,
  label = "Abrir drawer",
}: {
  side?: "right" | "left";
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-[400px] flex items-center justify-center p-12">
      <Button onClick={() => setOpen(true)}>{label}</Button>
      <Drawer open={open} onClose={() => setOpen(false)} side={side}>
        <Drawer.Header subtitle="Informações detalhadas do registro selecionado">
          Detalhes do participante
        </Drawer.Header>
        <Drawer.Body>
          <div className="space-y-6">
            <section>
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">
                Inscrição atual
              </h3>
              <p className="text-sm text-foreground">
                Congresso Nacional de Tecnologia — Ingresso Profissional.
              </p>
            </section>
            <section>
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">
                Respostas do formulário
              </h3>
              <ul className="space-y-2 text-sm text-foreground">
                <li>
                  <span className="text-muted-foreground">Empresa:</span> Acme
                </li>
                <li>
                  <span className="text-muted-foreground">Cargo:</span> Engineer
                </li>
              </ul>
            </section>
          </div>
        </Drawer.Body>
        <Drawer.Footer>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Fechar
          </Button>
          <Button variant="primary" onClick={() => setOpen(false)}>
            Enviar mensagem
          </Button>
        </Drawer.Footer>
      </Drawer>
    </div>
  );
}

export const Right: Story = {
  render: () => <DrawerHarness side="right" label="Abrir drawer (direita)" />,
};

export const Left: Story = {
  render: () => <DrawerHarness side="left" label="Abrir drawer (esquerda)" />,
};
