import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { Checkbox } from "../Checkbox";

describe("Checkbox", () => {
  it("renders label associated with the input", () => {
    render(<Checkbox id="terms" label="Aceito os termos" />);
    const input = screen.getByLabelText("Aceito os termos");
    expect(input).toHaveAttribute("type", "checkbox");
    expect(input).toHaveAttribute("id", "terms");
  });

  it("shows error and sets aria-invalid", () => {
    render(<Checkbox label="Aceito" error="É obrigatório" />);
    const input = screen.getByLabelText(/Aceito/);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("É obrigatório");
  });

  it("shows description when no error", () => {
    render(<Checkbox label="Ok" description="Pode desmarcar depois" />);
    expect(screen.getByText("Pode desmarcar depois")).toBeInTheDocument();
  });

  it("toggles when clicked", async () => {
    const Wrapper = () => {
      const [checked, setChecked] = useState(false);
      return (
        <Checkbox
          label="Aceito"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
      );
    };
    const user = userEvent.setup();
    render(<Wrapper />);
    const input = screen.getByLabelText("Aceito") as HTMLInputElement;
    expect(input.checked).toBe(false);
    await user.click(input);
    expect(input.checked).toBe(true);
  });
});
