import { levelProgress } from "@/lib/gamification/level";

interface LevelProgressBarProps {
  xp: number;
  className?: string;
}

/**
 * Barra de progresso para o nível atual do usuário, fiel à fórmula
 * oficial definida em `frontend/src/lib/gamification/level.ts` e
 * `backend/src/gamification/gamification.service.ts`.
 *
 * Não mude o cálculo aqui. Se o progresso visual ficar "desalinhado"
 * com o level up real, é sinal de que a fórmula (ou algum consumidor)
 * precisa ser ajustado no util compartilhado, não aqui.
 */
export function LevelProgressBar({ xp, className }: LevelProgressBarProps) {
  const progress = levelProgress(xp);
  const nextLevel = progress.level + 1;

  return (
    <div
      className={`flex items-center gap-4 ${className ?? ""}`}
      title={`Nível ${progress.level} · ${progress.xpToNext} XP para o nível ${nextLevel}`}
    >
      <div
        className="flex-1 h-2 bg-slate-800 rounded-full max-w-[200px] overflow-hidden border border-white/5"
        role="progressbar"
        aria-valuenow={Math.round(progress.progressPercent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progresso do nível ${progress.level}`}
      >
        <div
          data-testid="level-progress-fill"
          className="h-full bg-gradient-to-r from-primary to-blue-400 transition-all duration-1000"
          style={{ width: `${progress.progressPercent}%` }}
        />
      </div>
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
        {xp} XP · {progress.xpToNext} p/ nv {nextLevel}
      </span>
    </div>
  );
}
