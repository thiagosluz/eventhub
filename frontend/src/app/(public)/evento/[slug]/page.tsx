import type { Metadata } from "next";

type Event = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  location?: string | null;
  startDate: string;
  endDate: string;
  bannerUrl?: string | null;
  logoUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  activities: {
    id: string;
    title: string;
    description?: string | null;
    location?: string | null;
    startAt: string;
    endAt: string;
  }[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

async function fetchEvent(slug: string): Promise<Event> {
  const res = await fetch(`${API_URL}/public/events/${slug}`, {
    // SSR, mas não revalida agressivamente no MVP
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Evento não encontrado");
  }

  return res.json();
}

type PageParams = { params: { slug: string } };

export async function generateMetadata(
  { params }: PageParams,
): Promise<Metadata> {
  try {
    const event = await fetchEvent(params.slug);
    return {
      title: event.seoTitle ?? event.name,
      description: event.seoDescription ?? event.description ?? undefined,
      openGraph: {
        title: event.seoTitle ?? event.name,
        description: event.seoDescription ?? event.description ?? undefined,
        images: event.bannerUrl ? [event.bannerUrl] : undefined,
      },
    };
  } catch {
    return {
      title: "Evento não encontrado — EventHub",
    };
  }
}

export default async function EventPage({ params }: PageParams) {
  const event = await fetchEvent(params.slug);

  return (
    <div className="min-h-screen bg-background">
      <section aria-labelledby="evento-header">
        {event.bannerUrl ? (
          <div
            className="h-60 w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${event.bannerUrl})` }}
          >
            <div className="h-full w-full bg-gradient-to-t from-background/80 to-background/30 flex items-end">
              <div className="container mx-auto px-4 py-6">
                <h1
                  id="evento-header"
                  className="text-3xl font-bold text-foreground"
                >
                  {event.name}
                </h1>
                {event.location && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {event.location}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="border-b border-border bg-card">
            <div className="container mx-auto px-4 py-8">
              <h1
                id="evento-header"
                className="text-3xl font-bold text-foreground"
              >
                {event.name}
              </h1>
              {event.location && (
                <p className="text-sm text-muted-foreground mt-1">
                  {event.location}
                </p>
              )}
            </div>
          </div>
        )}
      </section>

      <main
        id="main"
        className="container mx-auto px-4 py-10 grid gap-10 md:grid-cols-[2fr,1.2fr]"
      >
        <section aria-labelledby="sobre-evento">
          <h2
            id="sobre-evento"
            className="text-xl font-semibold mb-3 text-foreground"
          >
            Sobre o evento
          </h2>
          <p className="text-muted-foreground whitespace-pre-line">
            {event.description ?? "Descrição em breve."}
          </p>
        </section>

        <aside aria-labelledby="inscricao-evento" className="space-y-4">
          <h2
            id="inscricao-evento"
            className="text-lg font-semibold text-foreground"
          >
            Inscrição
          </h2>
          <p className="text-sm text-muted-foreground">
            Inscrição gratuita. Você será redirecionado para o checkout.
          </p>
          <form
            action="/checkout"
            method="GET"
            className="space-y-3"
            aria-label="Formulário de inscrição"
          >
            <input type="hidden" name="eventId" value={event.id} />
            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Inscrever-se gratuitamente
            </button>
            <p className="text-xs text-muted-foreground text-center">
              Total: R$ 0,00
            </p>
          </form>
        </aside>

        <section
          aria-labelledby="grade-programacao"
          className="md:col-span-2 mt-4"
        >
          <h2
            id="grade-programacao"
            className="text-xl font-semibold mb-3 text-foreground"
          >
            Grade de programação
          </h2>
          {event.activities.length === 0 ? (
            <p className="text-muted-foreground">
              A programação será divulgada em breve.
            </p>
          ) : (
            <ul className="space-y-3">
              {event.activities.map((activity) => (
                <li
                  key={activity.id}
                  className="rounded-lg border border-border bg-card px-4 py-3"
                >
                  <h3 className="font-medium text-foreground">
                    {activity.title}
                  </h3>
                  {activity.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {activity.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(activity.startAt).toLocaleString("pt-BR")} —{" "}
                    {new Date(activity.endAt).toLocaleTimeString("pt-BR")}
                    {activity.location ? ` · ${activity.location}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

