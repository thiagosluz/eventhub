import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "EventHub | Premium Event Management",
  description: "A plataforma definitiva para gerenciar e descobrir eventos incríveis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${jakarta.variable} font-sans antialiased selection:bg-primary/30 selection:text-primary`}>
        <Providers>
          <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md shadow-lg">
            Pular para o conteúdo
          </a>
          <div className="relative flex min-h-screen flex-col bg-background text-foreground">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
