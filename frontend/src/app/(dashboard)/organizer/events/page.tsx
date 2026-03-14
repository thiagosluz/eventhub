'use client';

import Link from 'next/link';
import { useTenantEvents } from '@/hooks/use-events';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CalendarDays, Plus, Loader2 } from 'lucide-react';

export default function OrganizerEventsPage() {
  const { data: events, isLoading } = useTenantEvents();

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Eventos</h1>
          <p className="text-muted-foreground">
            Gerencie todos os eventos da sua organização.
          </p>
        </div>
        <Link href="/organizer/events/new" className={buttonVariants()}>
          <Plus className="mr-2 h-4 w-4" /> Novo Evento
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !events || events.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <CardContent className="flex flex-col items-center gap-4 text-center">
            <CalendarDays className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">Nenhum evento ainda</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Crie o seu primeiro evento para começar a vender ingressos.
              </p>
            </div>
            <Link href="/organizer/events/new" className={buttonVariants()}>
              <Plus className="mr-2 h-4 w-4" /> Criar Primeiro Evento
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden">
              {event.bannerUrl && (
                <div className="aspect-video w-full overflow-hidden bg-muted">
                  <img
                    src={event.bannerUrl}
                    alt={event.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="line-clamp-1">{event.name}</CardTitle>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      event.status === 'PUBLISHED'
                        ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-500'
                        : event.status === 'ARCHIVED'
                        ? 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-500'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-500'
                    }`}
                  >
                    {event.status === 'PUBLISHED'
                      ? 'Publicado'
                      : event.status === 'ARCHIVED'
                      ? 'Arquivado'
                      : 'Rascunho'}
                  </span>
                </div>
                <CardDescription className="line-clamp-2">
                  {event.description || 'Sem descrição'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <CalendarDays className="h-4 w-4" />
                  {new Date(event.startDate).toLocaleDateString('pt-BR')} —{' '}
                  {new Date(event.endDate).toLocaleDateString('pt-BR')}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/organizer/events/${event.id}`}
                    className={buttonVariants({ variant: 'outline', size: 'sm' })}
                  >
                    Editar
                  </Link>
                  <Link
                    href={`/organizer/events/${event.id}/attendees`}
                    className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                  >
                    Participantes
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
