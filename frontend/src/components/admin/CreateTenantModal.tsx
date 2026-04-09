"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { 
  XMarkIcon,
  HomeModernIcon,
  UserIcon,
  KeyIcon,
  EnvelopeIcon,
  LinkIcon,
  RocketLaunchIcon
} from "@heroicons/react/24/outline";

interface CreateTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateTenantModal({ isOpen, onClose, onSuccess }: CreateTenantModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    adminName: "",
    adminEmail: "",
    adminPassword: ""
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post("/admin/tenants", formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao criar inquilino.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 space-y-8 shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
            <HomeModernIcon className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Novo Inquilino</h2>
            <p className="text-slate-400 font-medium text-sm">Cadastre uma nova organização na plataforma.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="p-4 rounded-2xl bg-destructive/20 border border-destructive/20 text-white text-sm font-bold animate-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Seção Organização */}
            <div className="space-y-6 md:col-span-2">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-400 border-b border-white/5 pb-2">
                <HomeModernIcon className="w-4 h-4" />
                Dados da Organização
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Nome Fantasia</label>
                  <div className="relative">
                    <HomeModernIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      required
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Ex: Eventos Pro"
                      className="w-full h-12 pl-12 pr-4 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-slate-600 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-bold text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Slug da URL</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      required
                      name="slug"
                      value={formData.slug}
                      onChange={handleChange}
                      placeholder="ex-eventos-pro"
                      className="w-full h-12 pl-12 pr-4 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-slate-600 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-bold text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Seção Administrador */}
            <div className="space-y-6 md:col-span-2">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-400 border-b border-white/5 pb-2">
                <UserIcon className="w-4 h-4" />
                Administrador Mestre
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Nome Completo</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      required
                      name="adminName"
                      value={formData.adminName}
                      onChange={handleChange}
                      placeholder="Nome do responsável"
                      className="w-full h-12 pl-12 pr-4 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-slate-600 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/10 transition-all outline-none font-bold text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">E-mail Principal</label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      required
                      type="email"
                      name="adminEmail"
                      value={formData.adminEmail}
                      onChange={handleChange}
                      placeholder="email@exemplo.com"
                      className="w-full h-12 pl-12 pr-4 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-slate-600 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/10 transition-all outline-none font-bold text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Senha de Acesso</label>
                  <div className="relative">
                    <KeyIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      required
                      type="password"
                      name="adminPassword"
                      value={formData.adminPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full h-12 pl-12 pr-4 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-slate-600 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/10 transition-all outline-none font-bold text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <button 
              disabled={loading}
              type="submit"
              className="w-full h-14 rounded-2xl bg-emerald-500 text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <RocketLaunchIcon className="w-5 h-5" />
                  Finalizar Provisionamento
                </>
              )}
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-500 hover:text-white transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
