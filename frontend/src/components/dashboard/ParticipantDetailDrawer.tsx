"use client";

import {
  CalendarIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  UserCircleIcon,
  TicketIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { ParticipantDetail } from "@/services/participants.service";
import { Drawer } from "@/components/ui";

interface ParticipantDetailDrawerProps {
  participant: ParticipantDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ParticipantDetailDrawer({
  participant,
  isOpen,
  onClose,
}: ParticipantDetailDrawerProps) {
  if (!participant) return null;

  return (
    <Drawer open={isOpen} onClose={onClose} side="right" size="2xl">
      <Drawer.Header
        subtitle={participant.user.email}
      >
        Detalhes do Participante
      </Drawer.Header>

      <Drawer.Body>
        <div className="flex items-center gap-5 pb-6 mb-2 border-b border-border">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-black uppercase">
            {participant.user.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h3 className="text-2xl font-black text-foreground truncate">
              {participant.user.name}
            </h3>
            <p className="font-bold text-muted-foreground text-sm truncate">
              {participant.user.email}
            </p>
          </div>
        </div>

        <div className="space-y-12">
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <TicketIcon className="w-5 h-5" />
              <h4 className="text-xs font-black uppercase tracking-widest">
                Inscrição Atual
              </h4>
            </div>
            <div className="premium-card p-6 bg-card border-border space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold">{participant.event.name}</p>
                  <p className="text-xs text-muted-foreground italic">
                    Inscrito em{" "}
                    {new Date(participant.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <span className="px-3 py-1 text-[10px] font-black uppercase bg-[color:var(--color-success)]/10 text-[color:var(--color-success)] rounded-lg border border-[color:var(--color-success)]/20">
                  {participant.tickets[0]?.type || "GRATUITO"}
                </span>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-500">
              <ClipboardDocumentCheckIcon className="w-5 h-5" />
              <h4 className="text-xs font-black uppercase tracking-widest">
                Respostas do Formulário
              </h4>
            </div>
            <div className="space-y-3">
              {participant.formResponses.length > 0 ? (
                participant.formResponses.map((response: any) => (
                  <div key={response.id} className="space-y-4">
                    <p className="text-[10px] font-black uppercase text-muted-foreground px-1">
                      {response.form.name}
                    </p>
                    <div className="grid grid-cols-1 gap-4">
                      {response.answers.map((answer: any) => (
                        <div
                          key={answer.id}
                          className="p-4 rounded-xl bg-muted/30 border border-border"
                        >
                          <label className="text-[10px] font-black uppercase text-muted-foreground block mb-1">
                            {answer.field.label}
                          </label>
                          <p className="text-sm font-bold text-foreground">
                            {answer.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic px-1">
                  Nenhuma resposta adicional disponível.
                </p>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-amber-500">
              <ClockIcon className="w-5 h-5" />
              <h4 className="text-xs font-black uppercase tracking-widest">
                Atividades (Grade)
              </h4>
            </div>
            <div className="space-y-3">
              {participant.enrollments.length > 0 ? (
                participant.enrollments.map((enroll: any) => (
                  <div
                    key={enroll.id}
                    className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-bold">{enroll.activity.title}</p>
                      <p className="text-[10px] font-black uppercase text-amber-600/60">
                        {enroll.activity.type.name}
                      </p>
                    </div>
                    <CalendarIcon className="w-5 h-5 text-amber-500/50" />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic px-1">
                  Não inscrito em atividades específicas.
                </p>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-blue-500">
              <AcademicCapIcon className="w-5 h-5" />
              <h4 className="text-xs font-black uppercase tracking-widest">
                Certificados Emitidos
              </h4>
            </div>
            <div className="space-y-3">
              {participant.certificates.length > 0 ? (
                participant.certificates.map((cert: any) => (
                  <div
                    key={cert.id}
                    className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-bold">{cert.template.name}</p>
                      <p className="text-[10px] text-muted-foreground italic">
                        Emitido em{" "}
                        {new Date(cert.issuedAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <AcademicCapIcon className="w-5 h-5 text-blue-500/50" />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic px-1">
                  Nenhum certificado emitido para esta inscrição.
                </p>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-purple-500">
              <UserCircleIcon className="w-5 h-5" />
              <h4 className="text-xs font-black uppercase tracking-widest">
                Histórico na Organização
              </h4>
            </div>
            <div className="space-y-3 pb-8">
              {participant.history.length > 0 ? (
                participant.history.map((hist: any) => (
                  <div
                    key={hist.id}
                    className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10"
                  >
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
                        <span className="flex items-center gap-1 text-[10px] font-black text-[color:var(--color-success)]">
                          <AcademicCapIcon className="w-3 h-3" /> CERTIFICADO EMITIDO
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic px-1">
                  Primeira participação nesta organização.
                </p>
              )}
            </div>
          </section>
        </div>
      </Drawer.Body>
    </Drawer>
  );
}
