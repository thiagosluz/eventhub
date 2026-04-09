"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { 
  XMarkIcon,
  UserIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  HomeModernIcon,
  KeyIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: any;
}

export function EditUserModal({ isOpen, onClose, onSuccess, user }: EditUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        role: user.role || "USER",
      });
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await api.patch(`/admin/users/${user.id}`, formData);
      setSuccessMsg("Usuário atualizado com sucesso!");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar usuário.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!confirm("Tem certeza que deseja redefinir a senha deste usuário para o padrão?")) return;
    
    setResetLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res: any = await api.post(`/admin/users/${user.id}/reset-password`);
      setSuccessMsg(res.message);
    } catch (err: any) {
      setError(err.message || "Erro ao redefinir senha.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 space-y-8 shadow-2xl animate-in zoom-in-95 duration-300">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
            <UserIcon className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Editar Usuário</h2>
            <p className="text-slate-400 font-medium text-sm">Gestão de identidade e segurança.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-destructive/20 border border-destructive/20 text-white text-sm font-bold animate-in slide-in-from-top-2">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-sm font-bold animate-in slide-in-from-top-2 flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5" />
              {successMsg}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Nome Completo</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-bold text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">E-mail</label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-bold text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Papel / Nível de Acesso</label>
              <div className="relative">
                <ShieldCheckIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select 
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-white/10 bg-black/20 text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-bold text-sm appearance-none"
                >
                  <option value="USER">Usuário (Participante)</option>
                  <option value="MONITOR">Monitor</option>
                  <option value="SPEAKER">Palestrante</option>
                  <option value="ORGANIZER">Organizador</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <button 
              disabled={loading}
              type="submit"
              className="w-full h-14 rounded-2xl bg-indigo-500 text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-indigo-500/20"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Salvar Alterações"
              )}
            </button>

            <button 
              type="button"
              disabled={resetLoading}
              onClick={handleResetPassword}
              className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 text-slate-300 font-bold text-xs flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
            >
              {resetLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <KeyIcon className="w-4 h-4" />
                  Resetar Senha para Padrão
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
