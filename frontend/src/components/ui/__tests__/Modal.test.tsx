import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "../Modal";

function TestModal({
  open = true,
  onClose = vi.fn(),
  closeOnEscape,
  closeOnOverlayClick,
}: {
  open?: boolean;
  onClose?: () => void;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      closeOnEscape={closeOnEscape}
      closeOnOverlayClick={closeOnOverlayClick}
    >
      <Modal.Header>Publicar evento?</Modal.Header>
      <Modal.Body>
        <p>Descrição do modal para publicar.</p>
        <button type="button">Primeiro</button>
        <button type="button">Segundo</button>
      </Modal.Body>
      <Modal.Footer>
        <button type="button" onClick={onClose}>
          Cancelar
        </button>
        <button type="button">Publicar</button>
      </Modal.Footer>
    </Modal>
  );
}

describe("Modal", () => {
  it("não renderiza quando open=false", () => {
    render(<TestModal open={false} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renderiza com role, aria-modal e labelledBy/describedBy conectados", () => {
    render(<TestModal />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");

    const labelledBy = dialog.getAttribute("aria-labelledby");
    const describedBy = dialog.getAttribute("aria-describedby");
    expect(labelledBy).toBeTruthy();
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(labelledBy!)).toHaveTextContent(
      "Publicar evento?",
    );
    expect(document.getElementById(describedBy!)).toHaveTextContent(
      "Descrição do modal para publicar.",
    );
  });

  it("chama onClose quando usuário pressiona ESC", async () => {
    const onClose = vi.fn();
    render(<TestModal onClose={onClose} />);
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("não fecha no ESC se closeOnEscape=false", async () => {
    const onClose = vi.fn();
    render(<TestModal onClose={onClose} closeOnEscape={false} />);
    await userEvent.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("chama onClose ao clicar no overlay", () => {
    const onClose = vi.fn();
    render(<TestModal onClose={onClose} />);
    fireEvent.click(screen.getByTestId("modal-overlay"));
    expect(onClose).toHaveBeenCalled();
  });

  it("não fecha no overlay se closeOnOverlayClick=false", () => {
    const onClose = vi.fn();
    render(<TestModal onClose={onClose} closeOnOverlayClick={false} />);
    fireEvent.click(screen.getByTestId("modal-overlay"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("chama onClose ao clicar no botão X do header", async () => {
    const onClose = vi.fn();
    render(<TestModal onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: /fechar/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("trava o scroll do body enquanto aberto e restaura ao fechar", () => {
    const { rerender } = render(<TestModal open={false} />);
    expect(document.body.style.overflow).not.toBe("hidden");

    rerender(<TestModal open={true} />);
    expect(document.body.style.overflow).toBe("hidden");

    rerender(<TestModal open={false} />);
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("aplica focus trap: Tab no último volta para o primeiro e Shift+Tab no primeiro vai para o último", () => {
    render(<TestModal />);
    const dialog = screen.getByRole("dialog");
    const closeBtn = screen.getByRole("button", { name: /fechar/i });
    const publicar = screen.getByRole("button", { name: "Publicar" });

    publicar.focus();
    expect(document.activeElement).toBe(publicar);
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(closeBtn);

    closeBtn.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(publicar);

    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });
});
