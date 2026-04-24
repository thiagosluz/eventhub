"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { operationsService } from "@/services/operations.service";
import confetti from "canvas-confetti";
import { TrophyIcon, SparklesIcon } from "@heroicons/react/24/solid";

export default function RaffleDisplayPage() {
  const params = useParams();
  const id = params.id as string;
  const [latestRaffleId, setLatestRaffleId] = useState<string | null>(null);
  const [displayWinner, setDisplayWinner] = useState<{ name: string, prize: string | null } | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [dummyName, setDummyName] = useState("");

  const DUMMY_NAMES = [
    "Paula Ribeiro", "Bruno Carvalho", "Larissa Teixeira", "Felipe Barbosa", "Renata Freitas",
    "Eduardo Nogueira", "Patrícia Monteiro", "Vinícius Cardoso", "Camila Pires", "Thiago Duarte",
    "Aline Correia", "Rodrigo Batista", "Natália Farias", "André Moreira", "Bianca Martins",
    "Leonardo Rezende", "Vanessa Azevedo", "Gustavo Peixoto", "Isabela Tavares", "Marcelo Cunha",
    "Daniela Matos", "Hugo Coelho", "Tatiane Borges", "Fábio Macedo", "Cristiane Neves",
    "Sérgio Guimarães", "Priscila Antunes", "Alexandre Portela", "Débora Viana", "Caio Fonseca",
    "Elaine Diniz", "Igor Salgado", "Simone Lacerda", "Renan Brito", "Flávia Queiroz",
    "Otávio Amaral", "Karla Menezes", "Jorge Santana", "Michele Paiva", "Ricardo Leite",
    "Daniele Xavier", "César Pontes", "Roberta Andrade", "Leandro Figueiredo", "Sabrina Melo",
    "Cláudio Ventura", "Lorena Gusmão", "Vitor Sarmento", "Evelyn Barreto", "Murilo Goulart"
  ];

  useEffect(() => {

    const checkLatest = async () => {
      try {
        const latest = await operationsService.getLatestRaffle(id);
        if (latest) {
          if (latest.isHiddenOnDisplay) {
            setDisplayWinner(null);
            setLatestRaffleId(latest.id); // manter a ref do ultimo
          } else if (latestRaffleId === null) {
            // Primeiro carregamento - salvar referência mas não animar
            setLatestRaffleId(latest.id);
            setDisplayWinner({
              name: latest.registration?.user?.name || "Ganhador Anônimo",
              prize: latest.prizeName
            });
          } else if (latest.id !== latestRaffleId) {
            // Novo sorteio disparado pelo organizador! Suspense neles!
            setLatestRaffleId(latest.id);
            triggerAnimation({
              name: latest.registration?.user?.name || "Ganhador Anônimo",
              prize: latest.prizeName
            });
          } else if (!displayWinner && !isSpinning) {
            // Se reexibiu manualmente (unhide), mostra instantaneamente
            setDisplayWinner({
              name: latest.registration?.user?.name || "Ganhador Anônimo",
              prize: latest.prizeName
            });
          }
        } else {
          setDisplayWinner(null);
        }
      } catch (err) {
        console.error("Erro ao verificar sorteio", err);
      }
    };

    const pollInterval = process.env.NODE_ENV === 'test' ? 100 : 3000;
    const intervalId = setInterval(checkLatest, pollInterval);
    checkLatest(); // check instantâneo ao montar

    return () => clearInterval(intervalId);
  }, [id, latestRaffleId]);

  useEffect(() => {
    let spinInterval: NodeJS.Timeout;
    if (isSpinning) {
      spinInterval = setInterval(() => {
        setDummyName(DUMMY_NAMES[Math.floor(Math.random() * DUMMY_NAMES.length)]);
      }, 100);
    }
    return () => clearInterval(spinInterval);
  }, [isSpinning]);

  const triggerAnimation = (winner: { name: string, prize: string | null }) => {
    setIsSpinning(true);
    setDisplayWinner(null);

    // Efeito de rolagem dramático (Slot Machine falso)
    const delay = process.env.NODE_ENV === 'test' ? 10 : 4500;
    setTimeout(() => {
      setIsSpinning(false);
      setDisplayWinner(winner);
      fireConfetti();
    }, delay); // 4.5 segundos de suspense puro (10ms em testes)
  };

  const fireConfetti = () => {
    const duration = 5000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 8,
        angle: 60,
        spread: 70,
        origin: { x: 0, y: 0.8 },
        colors: ['#10b981', '#fbbf24', '#f43f5e']
      });
      confetti({
        particleCount: 8,
        angle: 120,
        spread: 70,
        origin: { x: 1, y: 0.8 },
        colors: ['#10b981', '#fbbf24', '#f43f5e']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 overflow-hidden relative selection:bg-primary/30">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div
          className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full animate-pulse"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--color-accent) 70%, transparent) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full animate-pulse"
          style={{
            animationDelay: "1s",
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--color-primary) 70%, transparent) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="z-10 text-center w-full max-w-5xl">
        <div className="mb-12 flex justify-center">
          <div className="w-24 h-24 bg-card/80 rounded-3xl flex items-center justify-center border border-border backdrop-blur-md shadow-[var(--shadow-premium)]">
            <TrophyIcon className="w-12 h-12 text-primary" />
          </div>
        </div>

        <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight mb-12">
          SORTEIO OFICIAL
        </h1>

        <div className="min-h-[350px] flex items-center justify-center w-full">
          {isSpinning ? (
            <div className="text-6xl md:text-8xl w-full px-4 overflow-hidden whitespace-nowrap text-ellipsis font-black text-muted-foreground/70 animate-pulse tracking-tighter transition-all">
              {dummyName}
            </div>
          ) : displayWinner ? (
            <div className="flex flex-col items-center animate-in zoom-in slide-in-from-bottom-5 duration-700">
              <SparklesIcon className="w-12 h-12 text-primary mb-6 animate-bounce" />
              <div className="text-6xl md:text-[8rem] w-full px-4 overflow-hidden whitespace-nowrap text-ellipsis font-black text-foreground tracking-tighter drop-shadow-[0_0_35px_rgba(0,0,0,0.25)] leading-tight">
                {displayWinner.name.split(' ')[0]} {/* Destaca primeiro nome grandioso */}
                <span className="block text-4xl md:text-6xl opacity-80 mt-2 tracking-tight text-muted-foreground">{displayWinner.name.split(' ').slice(1).join(' ')}</span>
              </div>

              {displayWinner.prize && (
                <div className="mt-12 px-10 py-5 bg-card/80 border border-border rounded-[2rem] backdrop-blur-lg animate-in fade-in slide-in-from-bottom-10 delay-300 duration-700">
                  <p className="text-2xl md:text-4xl font-bold text-primary uppercase tracking-widest">
                    Prêmio: <span className="text-foreground ml-2">{displayWinner.prize}</span>
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-2xl md:text-4xl font-bold text-muted-foreground/40 tracking-[0.3em] uppercase animate-pulse">
              Aguardando sorteio...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
