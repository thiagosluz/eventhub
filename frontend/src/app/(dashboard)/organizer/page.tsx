'use client';

import { useTenantEvents } from '@/hooks/use-events';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { CalendarDays, DollarSign, Plus, Users } from 'lucide-react';
import Link from 'next/link';

export default function OrganizerDashboardPage() {
  const { data: events, isLoading } = useTenantEvents();

  const totalEvents = events?.length || 0;
  // TODO: Fetch real stats from backend
  const activeEvents = events?.filter((e) => e.status === 'PUBLISHED').length || 0;

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Link href="/organizer/events/new" className={buttonVariants()}>
            <Plus className="mr-2 h-4 w-4" /> Novo Evento
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Criados</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '-' : totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              {activeEvents} eventos publicados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inscrições (Total)</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2350</div>
            <p className="text-xs text-muted-foreground">
              +180 no último mês
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 45.231,89</div>
            <p className="text-xs text-muted-foreground">
              +19% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Meus Eventos Recentes</CardTitle>
              <CardDescription>
                Lista dos últimos eventos criados ou editados no seu tenant.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Carregando eventos...</div>
            ) : totalEvents === 0 ? (
              <div className="text-sm text-muted-foreground">Nenhum evento criado ainda. Clique em &quot;Novo Evento&quot; para começar.</div>
            ) : (
              <div className="space-y-4">
                {events?.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <h4 className="font-semibold">{event.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.startDate).toLocaleDateString('pt-BR')} a {new Date(event.endDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        event.status === 'PUBLISHED' ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-500' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-500'
                      }`}>
                        {event.status === 'PUBLISHED' ? 'Publicado' : 'Rascunho'}
                      </span>
                      <Link href={`/organizer/events/${event.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                        Editar
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Placeholder for Quick Actions or Announcements */}
      </div>
    </>
  );
}
