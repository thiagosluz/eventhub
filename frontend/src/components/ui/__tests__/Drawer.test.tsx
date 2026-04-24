import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Drawer } from "../Drawer";

function TestDrawer({
  open = true,
  onClose = vi.fn(),
  side = "right" as const,
}: {
  open?: boolean;
  onClose?: () => void;
  side?: "right" | "left";
}) {
  return (
    <Drawer open={open} onClose={onClose} side={side}>
      <Drawer.Header subtitle="Informações detalhadas">
        Detalhes do participante
      </Drawer.Header>
      <Drawer.Body>Conteúdo com dados privados.</Drawer.Body>
      <Drawer.Footer>
        <button type="button" onClick={onClose}>
          Fechar
        </button>
      </Drawer.Footer>
    </Drawer>
  );
}

describe("Drawer", () => {
  it("não renderiza quando open=false", () => {
    render(<TestDrawer open={false} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renderiza com aria-modal e labelledBy/describedBy", () => {
    render(<TestDrawer />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(
      document.getElementById(dialog.getAttribute("aria-labelledby")!),
    ).toHaveTextContent("Detalhes do participante");
    expect(
      document.getElementById(dialog.getAttribute("aria-describedby")!),
    ).toHaveTextContent("Conteúdo com dados privados.");
  });

  it("fecha com ESC e com clique no overlay", async () => {
    const onClose = vi.fn();
    render(<TestDrawer onClose={onClose} />);

    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId("drawer-overlay"));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("botão X do header fecha", async () => {
    const onClose = vi.fn();
    render(<TestDrawer onClose={onClose} />);
    const buttons = screen.getAllByRole("button", { name: /fechar/i });
    const headerCloseBtn = buttons.find((b) => b.getAttribute("aria-label") === "Fechar");
    expect(headerCloseBtn).toBeDefined();
    await userEvent.click(headerCloseBtn!);
    expect(onClose).toHaveBeenCalled();
  });

  it("renderiza variante 'left' também sem quebrar", () => {
    render(<TestDrawer side="left" />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
