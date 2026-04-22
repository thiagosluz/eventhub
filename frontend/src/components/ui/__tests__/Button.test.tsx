import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "../Button";

describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Salvar</Button>);
    expect(screen.getByRole("button", { name: /Salvar/i })).toBeInTheDocument();
  });

  it("defaults to type=button to avoid accidental submits", () => {
    render(<Button>Ação</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("handles loading state and disables interactions", () => {
    const onClick = vi.fn();
    render(
      <Button isLoading onClick={onClick}>
        Aguarde
      </Button>,
    );
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("aria-busy", "true");
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("applies variant classes", () => {
    render(<Button variant="destructive">Remover</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-red-600");
  });
});
