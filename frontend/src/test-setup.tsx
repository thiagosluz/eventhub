import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Mock do next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard'),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Mock do next/link
vi.mock('next/link', () => ({
  default: ({ children, href, className, onClick }: any) => (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  ),
}));

// Mock do next/image
vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}));

// Mock do framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock manual dos ícones do Heroicons usados com frequência
const MockIcon = (name: string) => {
  return (props: any) => <span data-testid={`icon-${name}`} {...props} />;
};

vi.mock('@heroicons/react/24/outline', () => ({
  HomeIcon: MockIcon('HomeIcon'),
  CalendarIcon: MockIcon('CalendarIcon'),
  UsersIcon: MockIcon('UsersIcon'),
  CreditCardIcon: MockIcon('CreditCardIcon'),
  Cog6ToothIcon: MockIcon('Cog6ToothIcon'),
  AcademicCapIcon: MockIcon('AcademicCapIcon'),
  PlusIcon: MockIcon('PlusIcon'),
  UserIcon: MockIcon('UserIcon'),
  ChartBarIcon: MockIcon('ChartBarIcon'),
  XMarkIcon: MockIcon('XMarkIcon'),
  CheckCircleIcon: MockIcon('CheckCircleIcon'),
  ExclamationTriangleIcon: MockIcon('ExclamationTriangleIcon'),
  TrashIcon: MockIcon('TrashIcon'),
  ShieldCheckIcon: MockIcon('ShieldCheckIcon'),
  ShieldExclamationIcon: MockIcon('ShieldExclamationIcon'),
  EnvelopeIcon: MockIcon('EnvelopeIcon'),
  EyeIcon: MockIcon('EyeIcon'),
  ClockIcon: MockIcon('ClockIcon'),
  TicketIcon: MockIcon('TicketIcon'),
  MagnifyingGlassIcon: MockIcon('MagnifyingGlassIcon'),
  ArrowDownTrayIcon: MockIcon('ArrowDownTrayIcon'),
  ClipboardDocumentCheckIcon: MockIcon('ClipboardDocumentCheckIcon'),
  UserCircleIcon: MockIcon('UserCircleIcon'),
  MapPinIcon: MockIcon('MapPinIcon'),
  PhotoIcon: MockIcon('PhotoIcon'),
  QrCodeIcon: MockIcon('QrCodeIcon'),
  ChevronLeftIcon: MockIcon('ChevronLeftIcon'),
  XCircleIcon: MockIcon('XCircleIcon'),
  CameraIcon: MockIcon('CameraIcon'),
  InformationCircleIcon: MockIcon('InformationCircleIcon'),
  ArrowPathIcon: MockIcon('ArrowPathIcon'),
  IdentificationIcon: MockIcon('IdentificationIcon')
}));

vi.mock('@heroicons/react/24/solid', () => ({
  CheckIcon: MockIcon('CheckIcon'),
}));

// Mock da AuthContext
vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: 'clv_user_thiago',
      name: 'Thiago Organizador',
      email: 'organizador@eventhub.com.br',
      role: 'ORGANIZER',
      tenantId: 'clv_tenant_hq'
    },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
  })),
  AuthProvider: ({ children }: any) => <>{children}</>,
}));
