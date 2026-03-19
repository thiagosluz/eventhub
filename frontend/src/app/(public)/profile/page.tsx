"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usersService, UserProfile } from "@/services/users.service";
import { eventsService } from "@/services/events.service";
import { certificatesService } from "@/services/certificates.service";
import { Ticket } from "@/types/event";
import { IssuedCertificate } from "@/types/certificate";
import Image from "next/image";
import Link from "next/link";
import {
  UserIcon,
  TicketIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  CheckBadgeIcon,
  ClockIcon,
  CameraIcon,
  CalendarIcon,
  MapPinIcon,
  QrCodeIcon,
  ChevronRightIcon,
  TrophyIcon
} from "@heroicons/react/24/outline";

// Components for tabs
import { CertificatesList } from "@/components/certificates/CertificatesList";
import { SubmissionsList } from "@/components/submissions/SubmissionsList";
import { ActivityEnrollmentList } from "@/components/activities/ActivityEnrollmentList";
import { BadgesShowcase } from "@/components/profile/BadgesShowcase";
import { ShareIcon, IdentificationIcon } from "@heroicons/react/24/solid";

function QRCodeImage({ ticketId }: { ticketId: string }) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQR = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/tickets/${ticketId}/qrcode`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('eventhub_token')}` }
        });
        const blob = await response.blob();
        setQrUrl(URL.createObjectURL(blob));
      } catch (error) {
        console.error("Failed to fetch QR Code", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQR();
  }, [ticketId]);

  if (loading) return <div className="w-48 h-48 bg-muted animate-pulse rounded-xl" />;
  if (!qrUrl) return <div className="w-48 h-48 bg-destructive/10 flex items-center justify-center text-destructive rounded-xl text-[10px] font-bold">Erro ao carregar QR</div>;

  return (
    <div className="relative w-48 h-48 rounded-xl shadow-inner bg-white p-2">
      <Image src={qrUrl} alt="Ticket QR Code" fill className="object-contain p-2" />
    </div>
  );
}

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: authUser, logout } = useAuth();
  
  const defaultTab = (searchParams.get("tab") as any) || "profile";
  const [activeTab, setActiveTab] = useState<'profile' | 'tickets' | 'certificates' | 'submissions' | 'badges'>(defaultTab);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [certificates, setCertificates] = useState<IssuedCertificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tickets specific state
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [viewingActivitiesEvent, setViewingActivitiesEvent] = useState<{ id: string, name: string } | null>(null);

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", bio: "" });
  const [passForm, setPassForm] = useState({ currentPassword: "", newPassword: "" });
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [uProfile, uTickets, uCerts] = await Promise.all([
        usersService.getMe(),
        eventsService.getMyTickets(),
        certificatesService.listMyCertificates()
      ]);
      setProfile(uProfile);
      setEditForm({ name: uProfile.name || "", email: uProfile.email || "", bio: uProfile.bio || "" });
      setTickets(uTickets);
      setCertificates(uCerts);
    } catch (err: any) {
      if (err?.status === 401 || err?.response?.status === 401) {
        router.push("/auth/login?redirect=/profile");
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateHours = () => {
    // Estimativa simples: 4 horas por certificado, apenas para gamificação visual.
    return certificates.length * 4;
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await usersService.uploadAvatar(file);
      setProfile(prev => prev ? { ...prev, avatarUrl: res.avatarUrl } : null);
    } catch (error) {
      console.error("Erro ao subir avatar", error);
    }
  };

  const handleSaveProfile = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const updated = await usersService.updateProfile(editForm);
      setProfile(updated);
      setIsEditing(false);
      setSuccessMsg("Perfil atualizado com sucesso!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Erro ao salvar perfil");
    }
  };

  const handleSavePassword = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await usersService.updatePassword(passForm);
      setPassForm({ currentPassword: "", newPassword: "" });
      setSuccessMsg("Senha atualizada com segurança!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Erro ao atualizar senha");
    }
  };

  const handleShareBadge = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Minha Credencial - EventHubHQ',
        text: 'Vou participar deste evento incrível! Garanta seu ingresso também.',
        url: window.location.origin
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/events`);
      setSuccessMsg("Link copiado para a área de transferência!");
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 pt-24 pb-12 md:pt-32 space-y-8">
        <div className="h-64 rounded-3xl bg-muted animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1 h-96 rounded-3xl bg-muted animate-pulse" />
          <div className="md:col-span-3 h-96 rounded-3xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pt-24 pb-12 md:pt-32 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Gamified Top Banner */}
      <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-8 md:p-12 shadow-2xl flex flex-col md:flex-row items-center gap-8 justify-between border border-border/10">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[150%] bg-primary/20 blur-[100px] pointer-events-none rounded-full" />
        
        <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
          <div className="relative group">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-slate-800 bg-slate-900 overflow-hidden relative shadow-2xl flex items-center justify-center flex-shrink-0">
              {profile?.avatarUrl ? (
                <Image src={profile.avatarUrl} alt="Avatar" fill className="object-cover" />
              ) : (
                <span className="text-3xl font-black text-white/20 uppercase">{profile?.name.substring(0,2)}</span>
              )}
              <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <CameraIcon className="w-8 h-8 text-white" />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
              </label>
            </div>
            {profile?.role === 'ORGANIZER' && (
              <div className="absolute -bottom-2 -right-2 bg-primary text-white text-[10px] font-black uppercase px-3 py-1 rounded-full border-2 border-slate-950 shadow-lg">
                Organizador
              </div>
            )}
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">{profile?.name}</h1>
            <p className="text-slate-400 font-medium">{profile?.email}</p>
            {profile?.bio && <p className="text-sm text-slate-500 mt-2 max-w-md line-clamp-2 md:line-clamp-none">{profile.bio}</p>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 md:gap-8 w-full md:w-auto relative z-10">
           <div className="text-center bg-white/5 rounded-2xl p-4 backdrop-blur-md border border-white/10">
             <div className="text-3xl font-black text-primary mb-1">{tickets.length}</div>
             <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold flex items-center justify-center gap-1"><TicketIcon className="w-3 h-3"/> Eventos</div>
           </div>
           <div className="text-center bg-white/5 rounded-2xl p-4 backdrop-blur-md border border-white/10">
             <div className="text-3xl font-black text-emerald-400 mb-1">{certificates.length}</div>
             <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold flex items-center justify-center gap-1"><CheckBadgeIcon className="w-3 h-3"/> Certificados</div>
           </div>
           <div className="text-center bg-white/5 rounded-2xl p-4 backdrop-blur-md border border-white/10">
             <div className="text-3xl font-black text-amber-400 mb-1">{calculateHours()}h</div>
             <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold flex items-center justify-center gap-1"><ClockIcon className="w-3 h-3"/> Horas</div>
           </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-2">
           <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'profile' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-card text-muted-foreground hover:bg-muted border border-border'}`}>
             <UserIcon className="w-5 h-5" /> Meu Perfil
           </button>
           <button onClick={() => { setActiveTab('tickets'); setViewingActivitiesEvent(null); }} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'tickets' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-card text-muted-foreground hover:bg-muted border border-border'}`}>
             <TicketIcon className="w-5 h-5" /> Meus Ingressos
           </button>
           <button onClick={() => setActiveTab('certificates')} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'certificates' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-card text-muted-foreground hover:bg-muted border border-border'}`}>
             <AcademicCapIcon className="w-5 h-5" /> Certificados
           </button>
           <button onClick={() => setActiveTab('submissions')} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'submissions' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-card text-muted-foreground hover:bg-muted border border-border'}`}>
             <ClipboardDocumentListIcon className="w-5 h-5" /> Submissões
           </button>
           <button onClick={() => setActiveTab('badges')} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-black transition-all ${activeTab === 'badges' ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-lg shadow-purple-500/30' : 'bg-card text-fuchsia-600 hover:bg-muted border border-fuchsia-500/20'}`}>
             <TrophyIcon className="w-5 h-5" /> Conquistas
           </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          {errorMsg && <div className="p-4 bg-red-500/10 text-red-600 rounded-xl mb-6 text-sm font-bold animate-in fade-in">{errorMsg}</div>}
          {successMsg && <div className="p-4 bg-emerald-500/10 text-emerald-600 rounded-xl mb-6 text-sm font-bold animate-in fade-in">{successMsg}</div>}

          {activeTab === 'profile' && (
            <div className="space-y-8 animate-in fade-in duration-500">
               
               {/* Credencial Digital (Badge) */}
               {tickets.length > 0 && (
                 <div className="premium-card p-1 md:p-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 border-none relative overflow-hidden group">
                    <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    
                    <div className="relative z-10 p-6 md:p-0 flex flex-col md:flex-row items-center gap-8">
                       <div className="w-32 h-48 bg-white/10 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl flex flex-col items-center justify-between p-4 transform group-hover:rotate-y-12 group-hover:rotate-x-12 transition-transform duration-500 perspective-1000">
                          <div className="w-12 h-12 rounded-full border-2 border-white/50 overflow-hidden relative">
                             {profile?.avatarUrl ? <Image src={profile.avatarUrl} alt="Avatar" fill className="object-cover" /> : <div className="w-full h-full bg-primary flex items-center justify-center text-white font-black">{profile?.name.substring(0,2)}</div>}
                          </div>
                          <div className="text-center w-full">
                            <h4 className="text-white text-xs font-black uppercase tracking-tight line-clamp-1">{profile?.name}</h4>
                            <p className="text-white/60 text-[8px] uppercase tracking-widest">{profile?.role === 'ORGANIZER' ? 'Staff' : 'Participante'}</p>
                          </div>
                          <div className="w-full text-center border-t border-white/20 pt-2">
                             <div className="text-[10px] font-black text-white line-clamp-2">{tickets[0]?.event?.name || 'Evento EventHub'}</div>
                          </div>
                       </div>
                       
                       <div className="flex-1 text-center md:text-left space-y-4">
                          <div>
                            <h3 className="text-2xl md:text-3xl font-black text-white drop-shadow-md">Sua Credencial Digital</h3>
                            <p className="text-white/80 font-medium">Compartilhe com sua rede que você estará presente no evento <strong className="text-white">{tickets[0]?.event?.name}</strong>!</p>
                          </div>
                          <button onClick={handleShareBadge} className="inline-flex items-center gap-2 bg-white text-purple-600 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-white/90 transition-colors shadow-xl">
                            <ShareIcon className="w-4 h-4" /> Compartilhar Presença
                          </button>
                       </div>
                    </div>
                 </div>
               )}

               <div className="premium-card p-8 bg-card border-border">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black flex items-center gap-2"><IdentificationIcon className="w-6 h-6 text-primary"/> Informações Pessoais</h2>
                    {!isEditing && <button onClick={() => setIsEditing(true)} className="text-sm font-bold text-primary hover:underline">Editar</button>}
                  </div>
                  <div className="space-y-4">
                     <div>
                       <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Nome Completo</label>
                       {isEditing ? (
                          <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-slate-50 border border-border rounded-xl px-4 py-3 text-sm font-medium" />
                       ) : (
                          <p className="font-medium text-foreground">{profile?.name}</p>
                       )}
                     </div>
                     <div>
                       <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">E-mail</label>
                       {isEditing ? (
                          <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full bg-slate-50 border border-border rounded-xl px-4 py-3 text-sm font-medium" />
                       ) : (
                          <p className="font-medium text-foreground">{profile?.email}</p>
                       )}
                     </div>
                     <div>
                       <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Biografia Curta</label>
                       {isEditing ? (
                          <textarea rows={3} value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} className="w-full bg-slate-50 border border-border rounded-xl px-4 py-3 text-sm font-medium" placeholder="Conte um pouco sobre você..."></textarea>
                       ) : (
                          <p className="font-medium text-foreground">{profile?.bio || <span className="text-muted-foreground/50 italic">Sem biografia</span>}</p>
                       )}
                     </div>
                     {isEditing && (
                        <div className="pt-4 flex justify-end gap-3">
                           <button onClick={() => setIsEditing(false)} className="px-6 py-2 rounded-xl border border-border font-bold text-sm text-muted-foreground hover:bg-muted">Cancelar</button>
                           <button onClick={handleSaveProfile} className="premium-button !py-2 !text-sm">Salvar Alterações</button>
                        </div>
                     )}
                  </div>
               </div>

               <div className="premium-card p-8 bg-card border-border">
                  <h2 className="text-xl font-black mb-6 text-foreground">Segurança</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Senha Atual</label>
                       <input type="password" placeholder="••••••••" value={passForm.currentPassword} onChange={e => setPassForm({...passForm, currentPassword: e.target.value})} className="w-full bg-slate-50 border border-border rounded-xl px-4 py-3 text-sm font-medium" />
                     </div>
                     <div>
                       <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Nova Senha</label>
                       <input type="password" placeholder="••••••••" value={passForm.newPassword} onChange={e => setPassForm({...passForm, newPassword: e.target.value})} className="w-full bg-slate-50 border border-border rounded-xl px-4 py-3 text-sm font-medium" />
                     </div>
                  </div>
                  <div className="pt-6 flex justify-end">
                     <button onClick={handleSavePassword} disabled={!passForm.currentPassword || !passForm.newPassword} className="premium-button !py-2 !text-sm disabled:opacity-50">Atualizar Senha</button>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className="animate-in fade-in duration-500">
               {viewingActivitiesEvent ? (
                 <div>
                    <button onClick={() => setViewingActivitiesEvent(null)} className="mb-6 flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground">
                       ← Voltar aos ingressos
                    </button>
                    <ActivityEnrollmentList eventId={viewingActivitiesEvent.id} />
                 </div>
               ) : tickets.length > 0 ? (
                 <div className="space-y-12">
                   {/* Ingressos Ativos / Próximos */}
                   <div>
                     <h3 className="text-xl font-black mb-6 text-foreground flex items-center gap-2">🎫 Próximos Eventos</h3>
                     <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-8">
                       {tickets.filter(t => !t.event?.endDate || new Date(t.event.endDate) >= new Date()).map((ticket) => (
                         <div key={ticket.id} className="premium-card overflow-hidden bg-card border-border flex flex-col md:flex-row group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
                           <div className="w-full md:w-32 aspect-video md:aspect-auto relative overflow-hidden bg-muted flex-shrink-0">
                             {ticket.event?.bannerUrl ? (
                               <Image src={ticket.event.bannerUrl} alt={ticket.event.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                             ) : (
                               <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary"><TicketIcon className="w-8 h-8 opacity-20" /></div>
                             )}
                           </div>

                           <div className="p-5 flex-1 flex flex-col justify-between">
                             <div>
                               <div className="flex justify-between items-start mb-1">
                                 <h3 className="text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-1">{ticket.event?.name}</h3>
                               </div>
                               <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-lg uppercase tracking-widest inline-block mb-3">{ticket.type}</span>
                               
                               <div className="space-y-1 mb-4">
                                 <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                   <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                                   {ticket.event?.startDate ? new Date(ticket.event.startDate).toLocaleDateString() : 'TBD'}
                                 </div>
                               </div>
                             </div>

                             <div className="flex flex-wrap items-center gap-2">
                               <button onClick={() => setSelectedTicket(ticket)} className="flex-1 premium-button !py-2 !text-xs !font-black flex items-center justify-center gap-1">
                                 <QrCodeIcon className="w-4 h-4" /> QR
                               </button>
                               <button onClick={() => setViewingActivitiesEvent({ id: ticket.eventId, name: ticket.event?.name || "" })} className="flex-1 px-4 py-2 rounded-xl border-2 border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 transition-all flex items-center justify-center gap-1">
                                 <CalendarIcon className="w-4 h-4" /> Grade
                               </button>
                               <Link href={`/events/${ticket.event?.slug}`} className="p-2 rounded-xl border border-border hover:bg-muted transition-colors text-muted-foreground"><ChevronRightIcon className="w-4 h-4" /></Link>
                             </div>
                           </div>
                         </div>
                       ))}
                       {tickets.filter(t => !t.event?.endDate || new Date(t.event.endDate) >= new Date()).length === 0 && (
                         <div className="col-span-full p-8 text-center bg-muted/30 rounded-3xl border border-dashed border-border text-muted-foreground font-medium text-sm">Nenhum evento futuro agendado.</div>
                       )}
                     </div>
                   </div>

                   {/* Linha do Tempo (Timelime Journey) */}
                   <div className="pt-8 border-t border-border">
                      <h3 className="text-xl font-black mb-8 text-foreground flex items-center gap-2">⏳ Sua Jornada (Histórico)</h3>
                      <div className="relative border-l-2 border-primary/20 ml-4 space-y-8">
                         {tickets.filter(t => t.event?.endDate && new Date(t.event.endDate) < new Date())
                             .sort((a,b) => new Date(b.event!.endDate).getTime() - new Date(a.event!.endDate).getTime())
                             .map(ticket => (
                           <div key={`history-${ticket.id}`} className="relative pl-8">
                              <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-background border-4 border-primary flex items-center justify-center">
                                 <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></div>
                              </div>
                              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group">
                                 <div className="flex items-center gap-4 mb-2">
                                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                      <CalendarIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                       <h4 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">{ticket.event?.name}</h4>
                                       <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                                         {new Date(ticket.event!.startDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                                       </span>
                                    </div>
                                 </div>
                                 <div className="mt-4 flex items-center gap-3">
                                   <span className="px-3 py-1 bg-muted rounded-lg text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status: Concluído</span>
                                   <Link href={`/events/${ticket.event?.slug}`} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Ver Evento</Link>
                                 </div>
                              </div>
                           </div>
                         ))}
                         {tickets.filter(t => t.event?.endDate && new Date(t.event.endDate) < new Date()).length === 0 && (
                            <div className="pl-8 text-sm text-muted-foreground font-medium">Seu histórico de eventos passados aparecerá aqui.</div>
                         )}
                      </div>
                   </div>

                 </div>
               ) : (
                 <div className="premium-card p-16 text-center space-y-6">
                    <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mx-auto"><TicketIcon className="w-10 h-10 text-muted-foreground" /></div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-black text-foreground">Nenhum ingresso encontrado</h2>
                      <p className="text-muted-foreground font-medium text-sm">Inscreva-se em eventos para eles aparecerem aqui.</p>
                    </div>
                 </div>
               )}
            </div>
          )}

          {activeTab === 'certificates' && <div className="animate-in fade-in duration-500"><CertificatesList /></div>}
          {activeTab === 'submissions' && <div className="animate-in fade-in duration-500"><SubmissionsList /></div>}
          {activeTab === 'badges' && <div className="animate-in fade-in duration-500"><BadgesShowcase /></div>}

        </div>
      </div>

       {/* QR Code Modal for Tickets */}
       {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedTicket(null)} />
          <div className="premium-card bg-card border-border w-full max-w-sm p-8 space-y-8 relative z-10 animate-in zoom-in-95 duration-300">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-foreground">{selectedTicket.event?.name}</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">Apresente no check-in</p>
            </div>
            <div className="flex justify-center"><QRCodeImage ticketId={selectedTicket.id} /></div>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-muted/50 space-y-1 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">ID do Ingresso</p>
                <p className="text-xs font-mono font-bold break-all">{selectedTicket.id}</p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="w-full py-4 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground">Fechar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"/></div>}>
      <ProfileContent />
    </Suspense>
  );
}
