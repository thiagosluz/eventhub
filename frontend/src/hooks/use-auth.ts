'use client';

import { useQuery } from '@tanstack/react-query';
import { jwtDecode } from 'jwt-decode';
import { getToken } from '@/actions/auth.actions';

export interface UserSession {
  sub: string;
  email: string;
  tenantId: string;
  role: 'ORGANIZER' | 'PARTICIPANT' | 'REVIEWER';
  exp: number;
}

export function useAuth() {
  const { data: session, isLoading } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) return null;
      try {
        const decoded = jwtDecode<UserSession>(token);
        // Expiration check (Date.now is in ms, exp is in seconds)
        if (decoded.exp * 1000 < Date.now()) {
          return null; // expired
        }
        return decoded;
      } catch {
        return null; // invalid token
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache for session
  });

  return {
    user: session,
    isAuthenticated: !!session,
    isLoading,
    isOrganizer: session?.role === 'ORGANIZER',
    isParticipant: session?.role === 'PARTICIPANT',
    isReviewer: session?.role === 'REVIEWER',
  };
}
