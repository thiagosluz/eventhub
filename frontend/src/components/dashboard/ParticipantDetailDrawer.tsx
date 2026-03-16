"use client";

import { 
  XMarkIcon, 
  CalendarIcon, 
  AcademicCapIcon, 
  ClipboardDocumentCheckIcon,
  UserCircleIcon,
  TicketIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import { ParticipantDetail } from "@/services/participants.service";

interface ParticipantDetailDrawerProps {
  participant: ParticipantDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ParticipantDetailDrawer({ participant, isOpen, onClose }: ParticipantDetailDrawerProps) {
  if (!isOpen || !participant) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-2xl transform transition-all duration-500 ease-in-out">
          <div className="flex flex-col h-full bg-background shadow-2xl border-l border-border animate-in slide-in-from-right duration-500">
            {/* Header */}
            <div className="p-8 border-b border-border bg-muted/20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black uppercase tracking-tight">Detalhes do Participante</h2>
                <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-all">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-black uppercase">
                  {participant.user.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-foreground">{participant.user.name}</h3>
                  <p className="font-bold text-muted-foreground">{participant.user.email}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
              
              {/* Evento Atual */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <TicketIcon className="w-5 h-5" />
                  <h4 className="text-xs font-black uppercase tracking-widest">Inscrição Atual</h4>
                </div>
                <div className="premium-card p-6 bg-card border-border space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold">{participant.event.name}</p>
                      <p className="text-xs text-muted-foreground italic">Inscrito em {new Date(participant.createdAt).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <span className="px-3 py-1 text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20">
                      {participant.tickets[0]?.type || "GRATUITO"}
                    </span>
                  </div>
                </div>
              </section>

              {/* Respostas do Formulário */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-500">
                  <ClipboardDocumentCheckIcon className="w-5 h-5" />
                  <h4 className="text-xs font-black uppercase tracking-widest">Respostas do Formulário</h4>
                </div>
                <div className="space-y-3">
                  {participant.formResponses.length > 0 ? (
                    participant.formResponses.map((response: any) => (
                      <div key={response.id} className="space-y-4">
                        <p className="text-[10px] font-black uppercase text-muted-foreground px-1">{response.form.name}</p>
                        <div className="grid grid-cols-1 gap-4">
                          {response.answers.map((answer: any) => (
                            <div key={answer.id} className="p-4 rounded-xl bg-muted/30 border border-border">
                              <label className="text-[10px] font-black uppercase text-muted-foreground block mb-1">{answer.field.label}</label>
                              <p className="text-sm font-bold text-foreground">{answer.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic px-1">Nenhuma resposta adicional disponível.</p>
                  )}
                </div>
              </section>

              {/* Atividades */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-amber-500">
                  <ClockIcon className="w-5 h-5" />
                  <h4 className="text-xs font-black uppercase tracking-widest">Atividades (Grade)</h4>
                </div>
                <div className="space-y-3">
                  {participant.enrollments.length > 0 ? (
                    participant.enrollments.map((enroll: any) => (
                      <div key={enroll.id} className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold">{enroll.activity.title}</p>
                          <p className="text-[10px] font-black uppercase text-amber-600/60">{enroll.activity.type.name}</p>
                        </div>
                        <CalendarIcon className="w-5 h-5 text-amber-500/50" />
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic px-1">Não inscrito em atividades específicas.</p>
                  )}
                </div>
              </section>

              {/* Certificados */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-blue-500">
                  <AcademicCapIcon className="w-5 h-5" />
                  <h4 className="text-xs font-black uppercase tracking-widest">Certificados Emitidos</h4>
                </div>
                <div className="space-y-3">
                  {participant.certificates.length > 0 ? (
                    participant.certificates.map((cert: any) => (
                      <div key={cert.id} className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold">{cert.template.name}</p>
                          <p className="text-[10px] text-muted-foreground italic">Emitido em {new Date(cert.issuedAt).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <AcademicCapIcon className="w-5 h-5 text-blue-500/50" />
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic px-1">Nenhum certificado emitido para esta inscrição.</p>
                  )}
                </div>
              </section>

              {/* Histórico no Tenant */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-purple-500">
                  <UserCircleIcon className="w-5 h-5" />
                  <h4 className="text-xs font-black uppercase tracking-widest">Histórico na Organização</h4>
                </div>
                <div className="space-y-3 pb-8">
                  {participant.history.length > 0 ? (
                    participant.history.map((hist: any) => (
                      <div key={hist.id} className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-sm font-bold">{hist.event.name}</p>
                          <span className="text-[10px] font-black uppercase text-purple-600/60">
                            {new Date(hist.event.startDate).getFullYear()}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-bold text-muted-foreground">
                            Ticket: {hist.tickets[0]?.type || "GRATUITO"}
                          </span>
                          {hist.certificates.length > 0 && (
                            <span className="flex items-center gap-1 text-[10px] font-black text-emerald-500">
                              <AcademicCapIcon className="w-3 h-3" /> CERTIFICADO EMITIDO
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic px-1">Primeira participação nesta organização.</p>
                  )}
                </div>
              </section>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
