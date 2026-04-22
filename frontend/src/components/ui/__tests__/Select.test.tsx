import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Select } from "../Select";

describe("Select", () => {
  it("associates label and select via htmlFor/id", () => {
    render(
      <Select
        label="Modalidade"
        id="modality"
        options={[
          { value: "a", label: "A" },
          { value: "b", label: "B" },
        ]}
      />,
    );
    const select = screen.getByLabelText("Modalidade");
    expect(select).toHaveAttribute("id", "modality");
    expect(select.tagName).toBe("SELECT");
  });

  it("renders options via options prop", () => {
    render(
      <Select
        label="Modalidade"
        options={[
          { value: "poster", label: "Pôster" },
          { value: "oral", label: "Apresentação Oral" },
        ]}
      />,
    );
    expect(screen.getByText("Pôster")).toBeInTheDocument();
    expect(screen.getByText("Apresentação Oral")).toBeInTheDocument();
  });

  it("renders placeholder as disabled option", () => {
    render(
      <Select label="Escolha" placeholder="Selecione">
        <option value="x">X</option>
      </Select>,
    );
    const placeholder = screen.getByRole("option", { name: "Selecione" });
    expect(placeholder).toBeDisabled();
  });

  it("shows error and sets aria-invalid", () => {
    render(<Select label="Área" error="Campo obrigatório" />);
    const select = screen.getByLabelText(/Área/);
    expect(select).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Campo obrigatório");
  });
});
