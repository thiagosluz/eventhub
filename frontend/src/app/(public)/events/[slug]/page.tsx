'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { usePublicEvent } from '@/hooks/use-events';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  CalendarDays,
  MapPin,
  ArrowLeft,
  Clock,
  Loader2,
} from 'lucide-react';

export default function PublicEventDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: event, isLoading, isError } = usePublicEvent(slug);

  if (isLoading) {
    return (
      <div className="container flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="container py-24 text-center">
        <h1 className="text-3xl font-bold mb-4">Evento não encontrado</h1>
        <p className="text-muted-foreground mb-6">
          O evento que você procura não existe ou não está publicado.
        </p>
        <Link href="/events" className={buttonVariants()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Eventos
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Back link */}
      <Link
        href="/events"
        className={buttonVariants({ variant: 'ghost', size: 'sm' })}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Eventos
      </Link>

      {/* Banner */}
      <div className="mt-6 aspect-[3/1] w-full overflow-hidden rounded-xl bg-muted">
        {event.bannerUrl ? (
          <img
            src={event.bannerUrl}
            alt={event.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <CalendarDays className="h-16 w-16 text-primary/30" />
          </div>
        )}
      </div>

      {/* Content Grid */}
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              {event.name}
            </h1>
            {event.description && (
              <p className="mt-4 text-muted-foreground text-lg leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            )}
          </div>

          {/* Activities */}
          {event.activities && event.activities.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Programação</h2>
              <div className="space-y-3">
                {event.activities.map((activity: Record<string, unknown>) => (
                  <Card key={String(activity.id)}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{String(activity.title)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(String(activity.startAt)).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        {Boolean(activity.location) && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {String(activity.location)}
                          </div>
                        )}
                      </div>
                      {Boolean(activity.description) && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {String(activity.description)}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <CalendarDays className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Data</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(event.startDate).toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}{' '}
                    até{' '}
                    {new Date(event.endDate).toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              {event.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Local</p>
                    <p className="text-sm text-muted-foreground">
                      {event.location}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Link
            href={`/events/${slug}/register`}
            className={buttonVariants({ className: 'w-full', size: 'lg' })}
          >
            Inscrever-se
          </Link>
        </div>
      </div>
    </div>
  );
}
