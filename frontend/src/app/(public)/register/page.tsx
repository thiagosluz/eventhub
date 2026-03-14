'use client';

import { useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { useForm as useHookForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import {
  registerParticipantAction,
  registerOrganizerAction,
} from '@/actions/auth.actions';

const participantSchema = z.object({
  name: z.string().min(2, { message: 'Nome é obrigatório' }),
  email: z.string().email({ message: 'E-mail inválido' }),
  password: z.string().min(6, { message: 'Senha deve ter no mínimo 6 caracteres' }),
});

const organizerSchema = z.object({
  tenantName: z.string().min(2, { message: 'Nome da organização é obrigatório' }),
  tenantSlug: z
    .string()
    .min(2, { message: 'Slug é obrigatório' })
    .regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e traços'),
  name: z.string().min(2, { message: 'Seu nome é obrigatório' }),
  email: z.string().email({ message: 'E-mail inválido' }),
  password: z.string().min(6, { message: 'Senha deve ter no mínimo 6 caracteres' }),
});

export default function RegisterPage() {
  const [activeTab, setActiveTab] = useState('participant');
  const [errorMsg, setErrorMsg] = useState('');
  const [isPending, setIsPending] = useState(false);

  const participantForm = useHookForm<z.infer<typeof participantSchema>>({
    resolver: zodResolver(participantSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const organizerForm = useHookForm<z.infer<typeof organizerSchema>>({
    resolver: zodResolver(organizerSchema),
    defaultValues: { tenantName: '', tenantSlug: '', name: '', email: '', password: '' },
  });

  async function onParticipantSubmit(values: z.infer<typeof participantSchema>) {
    setIsPending(true);
    setErrorMsg('');
    const res = await registerParticipantAction(values);
    if (res?.success) {
      window.location.assign('/participant');
    } else {
      setErrorMsg(res?.error || 'Falha ao cadastrar');
      setIsPending(false);
    }
  }

  async function onOrganizerSubmit(values: z.infer<typeof organizerSchema>) {
    setIsPending(true);
    setErrorMsg('');
    const res = await registerOrganizerAction(values);
    if (res?.success) {
      window.location.assign('/organizer');
    } else {
      setErrorMsg(res?.error || 'Falha ao cadastrar organizador');
      setIsPending(false);
    }
  }

  return (
    <div className="container flex h-full min-h-[calc(100vh-8rem)] w-full flex-col items-center justify-center py-10">
      <Card className="mx-auto w-full max-w-[500px]">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Criar Conta</CardTitle>
          <CardDescription>Escolha o seu perfil para se cadastrar</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue="participant"
            value={activeTab}
            onValueChange={(val) => {
              setActiveTab(val);
              setErrorMsg('');
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="participant">Participante</TabsTrigger>
              <TabsTrigger value="organizer">Organizador</TabsTrigger>
            </TabsList>

            {/* Participante Form */}
            <TabsContent value="participant">
              <Form {...participantForm}>
                <form
                  onSubmit={participantForm.handleSubmit(onParticipantSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={participantForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="João da Silva" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={participantForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input placeholder="joao@exemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={participantForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {errorMsg && activeTab === 'participant' && (
                    <div className="text-sm font-medium text-destructive mt-2 text-center">
                      {errorMsg}
                    </div>
                  )}
                  <Button disabled={isPending} type="submit" className="w-full">
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Cadastrar
                  </Button>
                </form>
              </Form>
            </TabsContent>

            {/* Organizador Form */}
            <TabsContent value="organizer">
              <Form {...organizerForm}>
                <form
                  onSubmit={organizerForm.handleSubmit(onOrganizerSubmit)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={organizerForm.control}
                      name="tenantName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Organização</FormLabel>
                          <FormControl>
                            <Input placeholder="Minha Empresa" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={organizerForm.control}
                      name="tenantSlug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slug (URL única)</FormLabel>
                          <FormControl>
                            <Input placeholder="minha-empresa" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={organizerForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seu Nome (Admin)</FormLabel>
                        <FormControl>
                          <Input placeholder="Maria Souza" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={organizerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail Corporativo</FormLabel>
                        <FormControl>
                          <Input placeholder="maria@empresa.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={organizerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {errorMsg && activeTab === 'organizer' && (
                    <div className="text-sm font-medium text-destructive mt-2 text-center">
                      {errorMsg}
                    </div>
                  )}
                  <Button disabled={isPending} type="submit" className="w-full">
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Cadastrar Organização
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm">
            Já possui uma conta?{' '}
            <Link href="/login" className="underline hover:text-primary">
              Entre aqui
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
