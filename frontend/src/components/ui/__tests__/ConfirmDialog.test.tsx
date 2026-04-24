import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "../ConfirmDialog";

describe("ConfirmDialog", () => {
  it("renderiza título, descrição e botões padrão no tom danger", () => {
    render(
      <ConfirmDialog
        open
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Excluir evento?"
        description="Ação irreversível"
      />,
    );
    expect(
      screen.getByRole("heading", { name: /excluir evento\?/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/ação irreversível/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancelar/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /confirmar exclusão/i }),
    ).toBeInTheDocument();
  });

  it("chama onConfirm quando o botão é clicado", async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        onClose={vi.fn()}
        onConfirm={onConfirm}
        title="Confirma?"
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /confirmar/i }));
    expect(onConfirm).toHaveBeenCalledWith(undefined);
  });

  it("com safetyWord, bloqueia confirm até o usuário digitar a palavra", async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        onClose={vi.fn()}
        onConfirm={onConfirm}
        title="Excluir definitivamente?"
        safetyWord="DELETAR"
        confirmText="Excluir"
      />,
    );

    const confirmBtn = screen.getByRole("button", { name: "Excluir" });
    expect(confirmBtn).toBeDisabled();

    const input = screen.getByPlaceholderText("DELETAR");
    await userEvent.type(input, "deletar");
    expect(confirmBtn).not.toBeDisabled();

    await userEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledWith("deletar");
  });

  it("esconde botão cancelar quando hideCancel=true (sucesso)", () => {
    render(
      <ConfirmDialog
        open
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Tudo certo!"
        tone="success"
        hideCancel
      />,
    );
    expect(screen.queryByRole("button", { name: /cancelar/i })).toBeNull();
    expect(screen.getByRole("button", { name: /entendido/i })).toBeInTheDocument();
  });

  it("estado isLoading desabilita confirm e cancel", () => {
    render(
      <ConfirmDialog
        open
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Processando…"
        isLoading
      />,
    );
    expect(screen.getByRole("button", { name: /cancelar/i })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /confirmar exclusão/i }),
    ).toBeDisabled();
  });
});
