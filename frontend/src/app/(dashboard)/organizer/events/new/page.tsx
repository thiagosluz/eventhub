'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { Loader2, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useCreateEvent } from '@/hooks/use-events';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

const createEventSchema = z.object({
  name: z.string().min(3, { message: 'Nome deve ter no mínimo 3 caracteres' }),
  slug: z
    .string()
    .min(3, { message: 'Slug deve ter no mínimo 3 caracteres' })
    .regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hifens'),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().min(1, { message: 'Data de início é obrigatória' }),
  endDate: z.string().min(1, { message: 'Data de fim é obrigatória' }),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

type CreateEventValues = z.infer<typeof createEventSchema>;

export default function NewEventPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState('');
  const { mutateAsync: createEvent, isPending } = useCreateEvent();

  const form = useForm<CreateEventValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      location: '',
      startDate: '',
      endDate: '',
      seoTitle: '',
      seoDescription: '',
    },
  });

  // Auto-generate slug from name
  function handleNameChange(value: string) {
    form.setValue('name', value);
    const slug = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    form.setValue('slug', slug);
  }

  async function onSubmit(values: CreateEventValues) {
    setErrorMsg('');
    try {
      await createEvent(values);
      router.push('/organizer/events');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setErrorMsg(err.response?.data?.message || 'Erro ao criar evento');
    }
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
          <CardTitle className="text-2xl">Criar Novo Evento</CardTitle>
          <CardDescription>
            Preencha as informações básicas do seu evento. Você poderá editá-lo depois.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Evento</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Conferência de Tecnologia 2026"
                        {...field}
                        onChange={(e) => handleNameChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug (URL única)</FormLabel>
                    <FormControl>
                      <Input placeholder="conferencia-tech-2026" {...field} />
                    </FormControl>
                    <FormDescription>
                      Será usado na URL pública: /events/seu-slug
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <textarea
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Descreva o seu evento..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local</FormLabel>
                    <FormControl>
                      <Input placeholder="Centro de Convenções, São Paulo - SP" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Início</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Fim</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 border-t pt-6">
                <h3 className="text-sm font-medium text-muted-foreground">SEO (Opcional)</h3>
                <FormField
                  control={form.control}
                  name="seoTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título SEO</FormLabel>
                      <FormControl>
                        <Input placeholder="Título para mecanismos de busca" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="seoDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição SEO</FormLabel>
                      <FormControl>
                        <Input placeholder="Descrição para mecanismos de busca" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {errorMsg && (
                <div className="text-sm font-medium text-destructive text-center">
                  {errorMsg}
                </div>
              )}

              <div className="flex justify-end gap-4">
                <Link href="/organizer/events" className={buttonVariants({ variant: 'outline' })}>
                  Cancelar
                </Link>
                <Button disabled={isPending} type="submit">
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Evento
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
