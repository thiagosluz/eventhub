export default function ParticipantDashboard() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Painel do Participante</h1>
        <p className="text-muted-foreground text-sm mt-1">Bem-vindo de volta! Aqui estão seus próximos eventos.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Placeholder para os cards de eventos */}
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 space-x-2 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Eventos Inscritos</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Nenhuma inscrição recente</p>
          </div>
        </div>
      </div>
    </div>
  );
}
