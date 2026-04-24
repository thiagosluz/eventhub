import Link from "next/link";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { Navbar } from "@/components/common/Navbar";
import { Footer } from "@/components/common/Footer";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

async function getValidateData(hash: string) {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const res = await fetch(`${backendUrl}/certificates/validate/${hash}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    return null;
  }
  return res.json();
}

export default async function ValidateCertificatePage({
  params,
}: {
  params: Promise<{ hash: string }>;
}) {
  const { hash } = await params;
  const data = await getValidateData(hash);

  if (!data) {
    return (
      <ThemeProvider>
        <Navbar />
        <main className="min-h-[calc(100vh-80px)] pt-20 bg-background px-4">
          <div className="max-w-3xl mx-auto py-16 md:py-24">
            <div className="premium-card p-8 md:p-10 text-center space-y-5">
              <XCircleIcon className="w-16 h-16 text-destructive mx-auto" />
              <h1 className="text-2xl md:text-3xl font-black text-foreground">
                Certificado não encontrado
              </h1>
              <p className="text-muted-foreground font-medium">
                Este certificado não existe ou o código de validação é inválido.
              </p>
              <Link href="/" className="premium-button inline-flex !py-3 !px-6">
                Voltar para o início
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <Navbar />
      <main className="min-h-[calc(100vh-80px)] pt-20 bg-background px-4">
        <div className="max-w-3xl mx-auto py-16 md:py-24">
          <div className="premium-card p-8 md:p-10 text-center space-y-8">
            <div className="space-y-4">
              <CheckCircleIcon className="w-16 h-16 text-primary mx-auto" />
              <h1 className="text-2xl md:text-3xl font-black text-foreground">
                Certificado válido
              </h1>
              <p className="text-muted-foreground font-medium">
                Este certificado foi autenticado com sucesso em nossa base de dados.
              </p>
            </div>

            <div className="rounded-2xl bg-muted/40 border border-border p-5 text-left space-y-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Participante
                </p>
                <p className="font-semibold text-foreground">{data.participantName}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Evento
                </p>
                <p className="font-semibold text-foreground">{data.eventName}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Data de emissão
                </p>
                <p className="font-semibold text-foreground">
                  {new Date(data.issuedAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Código hash
                </p>
                <p className="font-mono text-xs text-foreground break-all">{data.hash}</p>
              </div>
            </div>

            <a
              href={data.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="premium-button inline-flex !py-3 !px-6"
            >
              Visualizar certificado original
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </ThemeProvider>
  );
}
