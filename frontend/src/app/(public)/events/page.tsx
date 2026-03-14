'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePublicEvents } from '@/hooks/use-events';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CalendarDays, MapPin, Search, Loader2 } from 'lucide-react';

export default function PublicEventsPage() {
  const { data: events, isLoading } = usePublicEvents();
  const [search, setSearch] = useState('');

  const filtered = events?.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.description?.toLowerCase().includes(search.toLowerCase()) ||
      e.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container py-10">
      <div className="flex flex-col gap-6">
        {/* Hero */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Explorar <span className="text-primary">Eventos</span>
          </h1>
          <p className="mx-auto max-w-[600px] text-muted-foreground text-lg">
            Descubra conferências, workshops e meetups incríveis acontecendo agora.
          </p>
        </div>

        {/* Search */}
        <div className="mx-auto w-full max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, descrição ou local..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !filtered || filtered.length === 0 ? (
          <div className="text-center py-16">
            <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Nenhum evento encontrado</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {search
                ? 'Tente buscar com outros termos.'
                : 'Ainda não há eventos publicados.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((event) => (
              <Link key={event.id} href={`/events/${event.slug}`} className="group">
                <Card className="overflow-hidden transition-shadow hover:shadow-lg h-full flex flex-col">
                  <div className="aspect-video w-full overflow-hidden bg-muted">
                    {event.bannerUrl ? (
                      <img
                        src={event.bannerUrl}
                        alt={event.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                        <CalendarDays className="h-12 w-12 text-primary/30" />
                      </div>
                    )}
                  </div>
                  <CardHeader className="flex-1">
                    <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                      {event.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {event.description || 'Sem descrição'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 shrink-0" />
                        {new Date(event.startDate).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}{' '}
                        —{' '}
                        {new Date(event.endDate).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 shrink-0" />
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
