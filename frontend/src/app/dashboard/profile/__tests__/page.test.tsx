import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const updateUserMock = vi.fn();
const getMeMock = vi.fn();
const updateProfileMock = vi.fn();
const updatePasswordMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();
const toastLoadingMock = vi.fn();

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: {
      name: "João",
      email: "joao@example.com",
      role: "ORGANIZER",
      tenantId: "tenant-1",
      avatarUrl: undefined,
    },
    updateUser: updateUserMock,
  }),
}));

vi.mock("@/services/users.service", () => ({
  usersService: {
    getMe: (...a: unknown[]) => getMeMock(...a),
    updateProfile: (...a: unknown[]) => updateProfileMock(...a),
    updatePassword: (...a: unknown[]) => updatePasswordMock(...a),
    uploadAvatar: vi.fn(),
  },
}));

vi.mock("react-hot-toast", () => ({
  toast: {
    success: (...a: unknown[]) => toastSuccessMock(...a),
    error: (...a: unknown[]) => toastErrorMock(...a),
    loading: (...a: unknown[]) => toastLoadingMock(...a),
  },
}));

import ProfilePage from "../page";

describe("ProfilePage", () => {
  beforeEach(() => {
    updateUserMock.mockReset();
    getMeMock.mockReset().mockResolvedValue({
      id: "u1",
      name: "João Silva",
      email: "joao@example.com",
      bio: "Bio existente",
      publicProfile: true,
      role: "ORGANIZER",
      tenantId: "tenant-1",
    });
    updateProfileMock.mockReset().mockResolvedValue({
      id: "u1",
      name: "João Silva",
      email: "joao@example.com",
      bio: "Bio existente",
      publicProfile: true,
      role: "ORGANIZER",
      tenantId: "tenant-1",
    });
    updatePasswordMock.mockReset().mockResolvedValue({ message: "ok" });
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
  });

  it("populates the profile form with fetched data", async () => {
    render(<ProfilePage />);
    expect(await screen.findByDisplayValue("João Silva")).toBeInTheDocument();
    expect(screen.getByDisplayValue("joao@example.com")).toBeInTheDocument();
  });

  it("submits profile updates", async () => {
    const user = userEvent.setup();
    render(<ProfilePage />);

    const nameField = await screen.findByLabelText(/Nome Completo/);
    await user.clear(nameField);
    await user.type(nameField, "João da Silva");

    await user.click(screen.getByRole("button", { name: /Salvar Alterações/i }));

    await waitFor(() => {
      expect(updateProfileMock).toHaveBeenCalled();
    });
    const payload = updateProfileMock.mock.calls[0][0];
    expect(payload.name).toBe("João da Silva");
    expect(toastSuccessMock).toHaveBeenCalled();
  });

  it("blocks password submission when confirmation does not match", async () => {
    const user = userEvent.setup();
    render(<ProfilePage />);

    await screen.findByLabelText(/Nome Completo/);

    await user.type(
      screen.getByLabelText(/Senha Atual/),
      "oldpassword",
    );
    await user.type(
      screen.getByLabelText(/^Nova Senha/),
      "newpassword1",
    );
    await user.type(
      screen.getByLabelText(/Confirmar Nova Senha/),
      "different2",
    );

    await user.click(
      screen.getByRole("button", { name: /Atualizar Senha/i }),
    );

    expect(
      await screen.findByText(/senhas não coincidem/i),
    ).toBeInTheDocument();
    expect(updatePasswordMock).not.toHaveBeenCalled();
  });
});
