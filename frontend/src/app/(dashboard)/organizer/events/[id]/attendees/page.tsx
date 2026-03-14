'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowLeft, Users } from 'lucide-react';

export default function EventAttendeesPage() {
  const params = useParams();
  const eventId = params.id as string;

  return (
    <>
      <div className="flex items-center gap-4 mb-2">
        <Link href={`/organizer/events/${eventId}`} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Evento
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Participantes</h1>
      </div>

      <Card className="flex flex-col items-center justify-center py-16">
        <CardContent className="flex flex-col items-center gap-4 text-center">
          <Users className="h-12 w-12 text-muted-foreground" />
          <div>
            <CardHeader className="pb-2">
              <CardTitle>Em breve</CardTitle>
            </CardHeader>
            <p className="text-sm text-muted-foreground">
              A gestão de participantes será implementada em breve.
              Você poderá visualizar inscrições, exportar listas e gerenciar check-ins.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
