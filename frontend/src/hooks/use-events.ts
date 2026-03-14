'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EventsService } from '@/services/events.service';

export function useTenantEvents() {
  return useQuery({
    queryKey: ['events', 'tenant'],
    queryFn: () => EventsService.getTenantEvents(),
  });
}

export function useTenantEvent(id: string) {
  return useQuery({
    queryKey: ['events', id],
    queryFn: () => EventsService.getEventById(id),
    enabled: !!id,
  });
}

export function usePublicEvents() {
  return useQuery({
    queryKey: ['events', 'public'],
    queryFn: () => EventsService.getPublicEvents(),
  });
}

export function usePublicEvent(slug: string) {
  return useQuery({
    queryKey: ['events', 'public', slug],
    queryFn: () => EventsService.getPublicEventBySlug(slug),
    enabled: !!slug,
  });
}

export function useMyTickets() {
  return useQuery({
    queryKey: ['tickets', 'mine'],
    queryFn: () => EventsService.getMyTickets(),
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: EventsService.createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', 'tenant'] });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<import('@/services/events.service').EventModel> }) => EventsService.updateEvent(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events', 'tenant'] });
      queryClient.invalidateQueries({ queryKey: ['events', variables.id] });
    },
  });
}
