'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useTenantEvent, useUpdateEvent } from '@/hooks/use-events';

const editEventSchema = z.object({
  name: z.string().min(3, { message: 'Nome deve ter no mínimo 3 caracteres' }),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hifens'),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().min(1, { message: 'Data de início é obrigatória' }),
  endDate: z.string().min(1, { message: 'Data de fim é obrigatória' }),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

type EditEventValues = z.infer<typeof editEventSchema>;

function toDatetimeLocal(dateStr: string) {
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const { data: event, isLoading } = useTenantEvent(eventId);
  const { mutateAsync: updateEvent, isPending } = useUpdateEvent();
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const form = useForm<EditEventValues>({
    resolver: zodResolver(editEventSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      location: '',
      startDate: '',
      endDate: '',
      status: 'DRAFT',
      seoTitle: '',
      seoDescription: '',
    },
  });

  useEffect(() => {
    if (event) {
      form.reset({
        name: event.name,
        slug: event.slug,
        description: event.description || '',
        location: event.location || '',
        startDate: toDatetimeLocal(event.startDate),
        endDate: toDatetimeLocal(event.endDate),
        status: event.status,
        seoTitle: event.seoTitle || '',
        seoDescription: event.seoDescription || '',
      });
    }
  }, [event, form]);

  async function onSubmit(values: EditEventValues) {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await updateEvent({ id: eventId, data: values });
      setSuccessMsg('Evento atualizado com sucesso!');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setErrorMsg(err.response?.data?.message || 'Erro ao atualizar evento');
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold">Evento não encontrado</h2>
        <Link href="/organizer/events" className={buttonVariants({ variant: 'outline', className: 'mt-4' })}>
          Voltar
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-4 mb-2">
        <Link href="/organizer/events" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Link>
      </div>

      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Editar Evento</CardTitle>
          <CardDescription>Atualize as informações do seu evento.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Evento</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="slug" render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug (URL)</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <textarea
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem>
                  <FormLabel>Local</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="startDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Início</FormLabel>
                    <FormControl><Input type="datetime-local" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="endDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Fim</FormLabel>
                    <FormControl><Input type="datetime-local" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      {...field}
                    >
                      <option value="DRAFT">Rascunho</option>
                      <option value="PUBLISHED">Publicado</option>
                      <option value="ARCHIVED">Arquivado</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {errorMsg && (
                <div className="text-sm font-medium text-destructive text-center">{errorMsg}</div>
              )}
              {successMsg && (
                <div className="text-sm font-medium text-green-600 dark:text-green-400 text-center">{successMsg}</div>
              )}

              <div className="flex justify-end gap-4">
                <Link href="/organizer/events" className={buttonVariants({ variant: 'outline' })}>Cancelar</Link>
                <Button disabled={isPending} type="submit">
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
