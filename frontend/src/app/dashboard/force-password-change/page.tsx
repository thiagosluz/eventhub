"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import toast from "react-hot-toast";
import { 
  LockClosedIcon, 
  KeyIcon, 
  CheckBadgeIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";

export default function ForcePasswordChangePage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      await authService.changePasswordForced(password);
      toast.success("Senha atualizada com sucesso!");
      // We should probably redirect to dashboard or something
      // But we need to refresh the session token to clear the mustChangePassword flag
      // For now, let's just go to dashboard and assume the token will be handled or user will re-login
      router.push("/dashboard");
      window.location.reload(); // Force refresh to update session
    } catch {
      toast.error("Erro ao atualizar senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        <div className="text-center mb-10 space-y-4">
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto ring-8 ring-amber-500/5">
            <ShieldCheckIcon className="w-10 h-10 text-amber-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase italic">
              Segurança Necessária
            </h1>
            <p className="text-muted-foreground font-bold text-sm tracking-tight opacity-80 mt-2">
              Esta é sua primeira vez acessando. <br/>
              <span className="text-amber-500 font-black uppercase tracking-widest">
                Altere sua senha temporária
              </span> Para continuar.
            </p>
          </div>
        </div>

        <div className="premium-card p-8 bg-card border-border shadow-2xl relative overflow-hidden">
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-foreground px-1 flex items-center gap-2">
                  <KeyIcon className="w-3.5 h-3.5" /> Nova Senha
                </label>
                <input 
                  required
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="******"
                  className="w-full h-12 px-4 rounded-xl border border-border bg-muted/20 focus:border-amber-500 outline-none font-bold text-sm transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-foreground px-1 flex items-center gap-2">
                  <LockClosedIcon className="w-3.5 h-3.5" /> Confirmar Nova Senha
                </label>
                <input 
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="******"
                  className="w-full h-12 px-4 rounded-xl border border-border bg-muted/20 focus:border-amber-500 outline-none font-bold text-sm transition-all"
                />
              </div>
            </div>

            <button 
              disabled={loading}
              type="submit"
              className="w-full h-14 bg-amber-500 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? "Atualizando..." : (
                <>
                  <CheckBadgeIcon className="w-5 h-5" /> Atualizar e Acessar
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
