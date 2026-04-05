import { render, screen, fireEvent, waitFor } from "@/test-utils";
import SpeakerProfilePage from "../page";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { speakersService } from "@/services/speakers.service";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";

// Mock do @heroicons/react
vi.mock("@heroicons/react/24/outline", () => ({
  GlobeAltIcon: (props: any) => <div {...props} />,
  UserIcon: (props: any) => <div {...props} />,
  CheckIcon: (props: any) => <div {...props} />,
  CameraIcon: (props: any) => <div {...props} />,
}));

// Mocks
vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/services/speakers.service", () => ({
  speakersService: {
    getMe: vi.fn(),
    uploadAvatar: vi.fn(),
    updateSpeaker: vi.fn(),
  },
}));

vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("SpeakerProfilePage Component", () => {
  const mockUser = { id: "u-1", name: "Jane Speaker", role: "SPEAKER" };
  const mockUpdateUser = vi.fn();
  const mockProfile = {
    id: "s-1",
    name: "Jane Speaker",
    email: "jane@speaker.com",
    bio: "Expert Speaker",
    linkedinUrl: "https://linkedin.com/jane",
    websiteUrl: "https://jane.me",
    avatarUrl: "/old-avatar.png"
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: mockUser, updateUser: mockUpdateUser });
    (speakersService.getMe as any).mockResolvedValue(mockProfile);
  });

  it("deve carregar e preencher o formulário com dados do perfil", async () => {
    render(<SpeakerProfilePage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Jane Speaker")).toBeInTheDocument();
      expect(screen.getByDisplayValue("jane@speaker.com")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Expert Speaker")).toBeInTheDocument();
      expect(screen.getByDisplayValue("https://linkedin.com/jane")).toBeInTheDocument();
      expect(screen.getByDisplayValue("https://jane.me")).toBeInTheDocument();
    });
  });

  it("deve simular o upload de avatar", async () => {
    (speakersService.uploadAvatar as any).mockResolvedValue({ url: "/new-avatar.png" });
    
    render(<SpeakerProfilePage />);
    await waitFor(() => screen.getByDisplayValue("Jane Speaker"));

    const file = new File(["dummy content"], "avatar.png", { type: "image/png" });
    const input = screen.getByLabelText("", { selector: 'input[type="file"]' });
    
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(speakersService.uploadAvatar).toHaveBeenCalledWith(file);
      expect(toast.success).toHaveBeenCalledWith("Foto carregada com sucesso!");
    });
  });

  it("deve salvar alterações no perfil e sincronizar com AuthContext", async () => {
    (speakersService.updateSpeaker as any).mockResolvedValue({
      ...mockProfile,
      name: "Jane New Name",
      avatarUrl: "/new-avatar.png"
    });

    render(<SpeakerProfilePage />);
    await waitFor(() => screen.getByDisplayValue("Jane Speaker"));

    fireEvent.change(screen.getByPlaceholderText(/Ex: Dr. Jane Doe/i), { target: { value: "Jane New Name" } });
    
    fireEvent.click(screen.getByRole("button", { name: /Salvar Alterações/i }));

    await waitFor(() => {
      expect(speakersService.updateSpeaker).toHaveBeenCalledWith("s-1", expect.objectContaining({
        name: "Jane New Name"
      }));
      expect(mockUpdateUser).toHaveBeenCalledWith({ avatarUrl: "/new-avatar.png" });
      expect(toast.success).toHaveBeenCalledWith("Perfil atualizado com sucesso!");
    });
  });

  it("deve tratar erro ao salvar perfil", async () => {
    (speakersService.updateSpeaker as any).mockRejectedValue(new Error("Update failed"));
    
    render(<SpeakerProfilePage />);
    await waitFor(() => screen.getByDisplayValue("Jane Speaker"));

    fireEvent.click(screen.getByRole("button", { name: /Salvar Alterações/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Erro ao salvar alterações.");
    });
  });
});
