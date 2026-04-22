import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const pushMock = vi.fn();
const changePasswordForcedMock = vi.fn().mockResolvedValue(undefined);
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/services/auth.service", () => ({
  authService: {
    changePasswordForced: (...args: unknown[]) =>
      changePasswordForcedMock(...args),
  },
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

import ForcePasswordChangePage from "../page";

describe("ForcePasswordChangePage", () => {
  beforeEach(() => {
    pushMock.mockReset();
    changePasswordForcedMock.mockReset().mockResolvedValue(undefined);
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
    Object.defineProperty(window, "location", {
      writable: true,
      value: { ...window.location, reload: vi.fn() },
    });
  });

  it("shows validation error when password is too short", async () => {
    const user = userEvent.setup();
    render(<ForcePasswordChangePage />);

    await user.type(screen.getByLabelText(/^Nova Senha/), "abc");
    await user.type(
      screen.getByLabelText(/Confirmar Nova Senha/),
      "abc",
    );
    await user.click(
      screen.getByRole("button", { name: /Atualizar e Acessar/i }),
    );

    expect(
      await screen.findByText(/pelo menos 8 caracteres/i),
    ).toBeInTheDocument();
    expect(changePasswordForcedMock).not.toHaveBeenCalled();
  });

  it("shows validation error when passwords do not match", async () => {
    const user = userEvent.setup();
    render(<ForcePasswordChangePage />);

    await user.type(
      screen.getByLabelText(/^Nova Senha/),
      "strongpassword1",
    );
    await user.type(
      screen.getByLabelText(/Confirmar Nova Senha/),
      "strongpassword2",
    );
    await user.click(
      screen.getByRole("button", { name: /Atualizar e Acessar/i }),
    );

    expect(
      await screen.findByText(/senhas não coincidem/i),
    ).toBeInTheDocument();
    expect(changePasswordForcedMock).not.toHaveBeenCalled();
  });

  it("submits valid data to the service", async () => {
    const user = userEvent.setup();
    render(<ForcePasswordChangePage />);

    await user.type(
      screen.getByLabelText(/^Nova Senha/),
      "strongpassword1",
    );
    await user.type(
      screen.getByLabelText(/Confirmar Nova Senha/),
      "strongpassword1",
    );
    await user.click(
      screen.getByRole("button", { name: /Atualizar e Acessar/i }),
    );

    await waitFor(() => {
      expect(changePasswordForcedMock).toHaveBeenCalledWith("strongpassword1");
    });
    expect(toastSuccessMock).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/dashboard");
  });
});
