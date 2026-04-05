import { render, screen, fireEvent } from "@testing-library/react";
import { ScheduleGrid } from "../ScheduleGrid";
import { Activity } from "@/types/event";
import { vi, describe, it, expect } from "vitest";

// Mock do Framer Motion para evitar problemas de animação nos testes
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock dos ícones do Heroicons
vi.mock("@heroicons/react/24/outline", () => ({
  ClockIcon: (props: any) => <div {...props} data-testid="icon-ClockIcon" />,
  MapPinIcon: (props: any) => <div {...props} data-testid="icon-MapPinIcon" />,
  UserGroupIcon: (props: any) => <div {...props} data-testid="icon-UserGroupIcon" />,
  TagIcon: (props: any) => <div {...props} data-testid="icon-TagIcon" />,
  XMarkIcon: (props: any) => <div {...props} data-testid="icon-XMarkIcon" />,
  InformationCircleIcon: (props: any) => <div {...props} data-testid="icon-InformationCircleIcon" />,
  ChevronLeftIcon: (props: any) => <div {...props} data-testid="icon-ChevronLeftIcon" />,
  QrCodeIcon: (props: any) => <div {...props} data-testid="icon-QrCodeIcon" />,
  CheckCircleIcon: (props: any) => <div {...props} data-testid="icon-CheckCircleIcon" />,
  XCircleIcon: (props: any) => <div {...props} data-testid="icon-XCircleIcon" />,
  ExclamationTriangleIcon: (props: any) => <div {...props} data-testid="icon-ExclamationTriangleIcon" />,
  CameraIcon: (props: any) => <div {...props} data-testid="icon-CameraIcon" />,
  ArrowPathIcon: (props: any) => <div {...props} data-testid="icon-ArrowPathIcon" />,
  MagnifyingGlassIcon: (props: any) => <div {...props} data-testid="icon-MagnifyingGlassIcon" />,
  UserIcon: (props: any) => <div {...props} data-testid="icon-UserIcon" />,
  IdentificationIcon: (props: any) => <div {...props} data-testid="icon-IdentificationIcon" />,
  PhotoIcon: (props: any) => <div {...props} data-testid="icon-PhotoIcon" />,
}));

// Mock do Next/Image
vi.mock("next/image", () => ({
  default: ({ src, alt }: any) => <img src={src} alt={alt} />,
}));

const mockActivities: Activity[] = [
  {
    id: "act-1",
    title: "Abertura do Evento",
    startAt: "2024-10-10T09:00:00Z",
    endAt: "2024-10-10T10:00:00Z",
    status: "SCHEDULED",
    requiresEnrollment: false,
    requiresConfirmation: false,
    location: "Auditório Principal",
    type: { id: "t-1", name: "Palestra" },
    speakers: [
      {
        speakerId: "s-1",
        speaker: { id: "s-1", name: "Thiago Silva", avatarUrl: "/avatar.png", createdAt: "", updatedAt: "" }
      }
    ]
  },
  {
    id: "act-2",
    title: "Workshop de React",
    startAt: "2024-10-11T14:00:00Z",
    endAt: "2024-10-11T17:00:00Z",
    status: "SCHEDULED",
    requiresEnrollment: true,
    requiresConfirmation: true,
    location: "Lab 1",
    type: { id: "t-2", name: "Workshop" }
  }
];

describe("ScheduleGrid", () => {
  it("deve renderizar mensagem de estado vazio quando não há atividades", () => {
    render(<ScheduleGrid activities={[]} />);
    expect(screen.getByText(/Nenhuma atividade programada/i)).toBeInTheDocument();
  });

  it("deve agrupar atividades por data e renderizar as abas corretamente", () => {
    render(<ScheduleGrid activities={mockActivities} />);
    
    // Verifica se as datas formatadas aparecem nas abas
    expect(screen.getByText(/quinta-feira/i)).toBeInTheDocument();
    expect(screen.getByText(/sexta-feira/i)).toBeInTheDocument();
  });

  it("deve alternar entre atividades ao clicar nas abas", () => {
    render(<ScheduleGrid activities={mockActivities} />);
    
    // Inicialmente mostra a primeira atividade
    expect(screen.getByText("Abertura do Evento")).toBeInTheDocument();
    expect(screen.queryByText("Workshop de React")).not.toBeInTheDocument();
    
    // Clica na segunda aba
    const secondTab = screen.getByText(/sexta-feira/i);
    fireEvent.click(secondTab);
    
    // Agora deve mostrar a segunda atividade
    expect(screen.getByText("Workshop de React")).toBeInTheDocument();
    expect(screen.queryByText("Abertura do Evento")).not.toBeInTheDocument();
  });

  it("deve abrir o modal de detalhes ao clicar em uma atividade", () => {
    render(<ScheduleGrid activities={mockActivities} />);
    
    const activityCard = screen.getByText("Abertura do Evento");
    fireEvent.click(activityCard);
    
    // Verifica se os detalhes aparecem no modal
    expect(screen.getByRole("heading", { name: "Abertura do Evento", level: 2 })).toBeInTheDocument();
    expect(screen.getAllByText("Auditório Principal")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Thiago Silva")[0]).toBeInTheDocument();
  });

  it("deve fechar o modal ao clicar no botão de fechar", () => {
    render(<ScheduleGrid activities={mockActivities} />);
    
    fireEvent.click(screen.getByText("Abertura do Evento"));
    const closeButton = screen.getByRole("button", { name: /Fechar Detalhes/i });
    fireEvent.click(closeButton);
    
    // Modal não deve estar mais visível
    expect(screen.queryByText("Fechar Detalhes")).not.toBeInTheDocument();
  });
});
