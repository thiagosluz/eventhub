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
  useParams: vi.fn(() => ({ id: 'ev-123' })),
}));

// Mock do next/link
vi.mock('next/link', () => ({
  default: ({ children, href, className, onClick }: { children: React.ReactNode, href: string, className?: string, onClick?: () => void }) => (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  ),
}));

// Mock do next/image
vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt="" {...props} />;
  },
}));

// Mock do framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => <p {...props}>{children}</p>,
    section: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <section {...props}>{children}</section>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock manual dos ícones do Heroicons usados com frequência
const MockIcon = (name: string) => {
  const Icon = (props: React.SVGProps<SVGSVGElement>) => <span data-testid={`icon-${name}`} {...(props as any)} />;
  Icon.displayName = name;
  return Icon;
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
  QueueListIcon: MockIcon('QueueListIcon'),
  ArrowTopRightOnSquareIcon: MockIcon('ArrowTopRightOnSquareIcon'),
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
  IdentificationIcon: MockIcon('IdentificationIcon'),
  SparklesIcon: MockIcon('SparklesIcon'),
  EyeSlashIcon: MockIcon('EyeSlashIcon'),
  TrophyIcon: MockIcon('TrophyIcon'),
  PencilIcon: MockIcon('PencilIcon'),
  CheckIcon: MockIcon('CheckIcon'),
  ViewColumnsIcon: MockIcon('ViewColumnsIcon'),
  Bars3Icon: MockIcon('Bars3Icon'),
  CalendarDaysIcon: MockIcon('CalendarDaysIcon'),
  AdjustmentsHorizontalIcon: MockIcon('AdjustmentsHorizontalIcon'),
  Squares2X2Icon: MockIcon('Squares2X2Icon'),
  EllipsisHorizontalIcon: MockIcon('EllipsisHorizontalIcon'),
  FlagIcon: MockIcon('FlagIcon'),
  UserPlusIcon: MockIcon('UserPlusIcon'),
  ChatBubbleBottomCenterTextIcon: MockIcon('ChatBubbleBottomCenterTextIcon'),
  PaperAirplaneIcon: MockIcon('PaperAirplaneIcon'),
  KeyIcon: MockIcon('KeyIcon'),
  LockClosedIcon: MockIcon('LockClosedIcon'),
  CheckBadgeIcon: MockIcon('CheckBadgeIcon'),
  ArrowUpTrayIcon: MockIcon('ArrowUpTrayIcon'),
  CloudArrowUpIcon: MockIcon('CloudArrowUpIcon'),
  DocumentTextIcon: MockIcon('DocumentTextIcon'),
  ArrowLeftIcon: MockIcon('ArrowLeftIcon'),
  ChevronRightIcon: MockIcon('ChevronRightIcon'),
  BellIcon: MockIcon('BellIcon'),
  ArrowRightOnRectangleIcon: MockIcon('ArrowRightOnRectangleIcon'),
  BuildingOffice2Icon: MockIcon('BuildingOffice2Icon'),
  BoltIcon: MockIcon('BoltIcon'),
  NoSymbolIcon: MockIcon('NoSymbolIcon'),
  FunnelIcon: MockIcon('FunnelIcon'),
  MoonIcon: MockIcon('MoonIcon'),
  SunIcon: MockIcon('SunIcon'),
  ComputerDesktopIcon: MockIcon('ComputerDesktopIcon'),
  GlobeAltIcon: MockIcon('GlobeAltIcon'),
  BriefcaseIcon: MockIcon('BriefcaseIcon'),
  HashtagIcon: MockIcon('HashtagIcon'),
  HomeModernIcon: MockIcon('HomeModernIcon'),
  LinkIcon: MockIcon('LinkIcon'),
  RocketLaunchIcon: MockIcon('RocketLaunchIcon'),
  UserGroupIcon: MockIcon('UserGroupIcon'),
  DocumentIcon: MockIcon('DocumentIcon'),
  ClipboardDocumentListIcon: MockIcon('ClipboardDocumentListIcon'),
}));

vi.mock('@heroicons/react/24/solid', () => ({
  CheckIcon: MockIcon('CheckIcon'),
  TrophyIcon: MockIcon('TrophyIcon'),
  SparklesIcon: MockIcon('SparklesIcon'),
  StarIcon: MockIcon('StarIcon'),
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
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
// Mock do hook use (Next.js 15 / React 19)
if (!(React as any).use) {
  (React as any).use = <T,>(promise: Promise<T> & { _value?: T }) => {
    if (promise && promise._value !== undefined) {
      return promise._value;
    }
    return promise;
  };
}

vi.mock('react', async (importActual) => {
  const actual: any = await importActual();
  return {
    ...actual,
    use: (promise: any) => promise?._value !== undefined ? promise._value : actual.use?.(promise),
  };
});
