import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Textarea } from "../Textarea";

describe("Textarea", () => {
  it("associates label and textarea via htmlFor/id", () => {
    render(<Textarea label="Bio" id="bio" />);
    const textarea = screen.getByLabelText("Bio");
    expect(textarea).toHaveAttribute("id", "bio");
    expect(textarea.tagName).toBe("TEXTAREA");
  });

  it("generates an id when none is provided", () => {
    render(<Textarea label="Resumo" />);
    const textarea = screen.getByLabelText("Resumo");
    expect(textarea.id).toBeTruthy();
  });

  it("shows error and sets aria-invalid", () => {
    render(<Textarea label="Resumo" error="Campo obrigatório" />);
    const textarea = screen.getByLabelText(/Resumo/);
    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Campo obrigatório");
  });

  it("renders helper text when no error", () => {
    render(<Textarea label="Bio" helperText="Até 500 caracteres" />);
    expect(screen.getByText("Até 500 caracteres")).toBeInTheDocument();
  });
});
