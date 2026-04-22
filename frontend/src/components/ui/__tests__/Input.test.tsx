import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Input } from "../Input";

describe("Input", () => {
  it("associates label and input via htmlFor/id", () => {
    render(<Input label="E-mail" id="email" />);
    const input = screen.getByLabelText("E-mail");
    expect(input).toHaveAttribute("id", "email");
  });

  it("generates an id when none is provided", () => {
    render(<Input label="Nome" />);
    const input = screen.getByLabelText("Nome");
    expect(input.id).toBeTruthy();
  });

  it("shows error and sets aria-invalid", () => {
    render(<Input label="Senha" error="Muito curta" />);
    const input = screen.getByLabelText(/Senha/);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Muito curta");
  });

  it("shows helper text when no error", () => {
    render(<Input label="Slug" helperText="Apenas letras" />);
    expect(screen.getByText("Apenas letras")).toBeInTheDocument();
  });
});
