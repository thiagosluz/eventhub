import { render, screen, waitFor } from "@/test-utils";
import SpeakerDashboard from "../page";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { speakersService } from "@/services/speakers.service";
import { useAuth } from "@/context/AuthContext";

// Mock do AuthContext
vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

// Mock do @heroicons/react
vi.mock("@heroicons/react/24/outline", () => ({
  CalendarIcon: (props: any) => <div {...props} data-testid="CalendarIcon" />,
  UserGroupIcon: (props: any) => <div {...props} data-testid="UserGroupIcon" />,
  StarIcon: (props: any) => <div {...props} data-testid="StarIcon" />,
  ArrowRightIcon: (props: any) => <div {...props} data-testid="ArrowRightIcon" />,
  MicrophoneIcon: (props: any) => <div {...props} data-testid="MicrophoneIcon" />,
  MapPinIcon: (props: any) => <div {...props} data-testid="MapPinIcon" />,
  CloudArrowUpIcon: (props: any) => <div {...props} data-testid="CloudArrowUpIcon" />,
  DocumentIcon: (props: any) => <div {...props} data-testid="DocumentIcon" />,
  CheckBadgeIcon: (props: any) => <div {...props} data-testid="CheckBadgeIcon" />,
  GlobeAltIcon: (props: any) => <div {...props} data-testid="GlobeAltIcon" />,
  UserIcon: (props: any) => <div {...props} data-testid="UserIcon" />,
  CheckIcon: (props: any) => <div {...props} data-testid="CheckIcon" />,
  CameraIcon: (props: any) => <div {...props} data-testid="CameraIcon" />,
}));

vi.mock("@heroicons/react/24/solid", () => ({
  StarIcon: (props: any) => <div {...props} data-testid="StarIconSolid" />,
}));

// Mock do speakersService
vi.mock("@/services/speakers.service", () => ({
  speakersService: {
    getMe: vi.fn(),
    getMyActivities: vi.fn(),
    getMyFeedbacks: vi.fn(),
  },
}));

describe("SpeakerDashboard Component", () => {
  const mockUser = { id: "u-1", name: "Jane" };
  const mockProfile = { id: "s-1", name: "Jane", bio: "Tech Speaker" };
  const mockActivities = [
    {
      activityId: "act-1",
      roleId: "r-1",
      activity: {
        id: "act-1",
        title: "Keynote: Future of AI",
        description: "A deep dive into AI.",
        startAt: "2024-10-10T10:00:00Z",
        _count: { enrollments: 150 },
        type: { name: "Palestra" }
      }
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: mockUser });
    (speakersService.getMe as any).mockResolvedValue(mockProfile);
    (speakersService.getMyActivities as any).mockResolvedValue(mockActivities);
    (speakersService.getMyFeedbacks as any).mockResolvedValue([]);
  });

  it("deve carregar e exibir dados do palestrante corretamente", async () => {
    render(<SpeakerDashboard />);

    // Usar findByText que já tem o waitFor embutido e é mais resiliente
    const welcomeMsg = await screen.findByText(/Olá,/i);
    expect(welcomeMsg).toBeInTheDocument();
    
    // Verifica se os componentes do dashboard aparecem
    expect(screen.getByText(/Total de Atividades/i)).toBeInTheDocument();
  });

  it("deve exibir a próxima apresentação com detalhes", async () => {
    render(<SpeakerDashboard />);
    expect(await screen.findByText("Keynote: Future of AI")).toBeInTheDocument();
  });

  it("deve exibir estado vazio quando não há atividades", async () => {
    (speakersService.getMyActivities as any).mockResolvedValue([]);
    render(<SpeakerDashboard />);
    expect(await screen.findByText(/Nenhuma atividade agendada/i)).toBeInTheDocument();
  });

  it("deve conter link para o perfil do palestrante", async () => {
    render(<SpeakerDashboard />);
    const profileLink = await screen.findByRole("link", { name: /Editar Perfil Público/i });
    expect(profileLink).toHaveAttribute("href", "/speaker/profile");
  });
});
