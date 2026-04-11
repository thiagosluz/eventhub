"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usersService, UserProfile } from "@/services/users.service";
import { 
  UserCircleIcon, 
  KeyIcon, 
  PhotoIcon, 
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowUpTrayIcon
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Forms State
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    bio: "",
    publicProfile: false
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await usersService.getMe();
        setProfileData({
          name: data.name,
          email: data.email,
          bio: data.bio || "",
          publicProfile: data.publicProfile || false
        });
      } catch (err) {
        toast.error("Erro ao carregar dados do perfil.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await usersService.updateProfile(profileData);
      updateUser(updated);
      toast.success("Perfil atualizado com sucesso!");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao atualizar perfil.";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setIsSaving(true);
    try {
      await usersService.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success("Senha alterada com sucesso!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao alterar senha.";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const loadingToast = toast.loading("Enviando foto...");
    try {
      const { avatarUrl } = await usersService.uploadAvatar(file);
      updateUser({ avatarUrl });
      toast.success("Foto de perfil atualizada!", { id: loadingToast });
    } catch (err) {
      toast.error("Erro ao enviar foto.", { id: loadingToast });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-bold animate-pulse">Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">Meu Perfil</h1>
        <p className="text-muted-foreground font-medium">Gerencie suas informações pessoais e configurações de segurança.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Basic Info */}
        <div className="lg:col-span-2 space-y-8">
          <div className="premium-card p-8 bg-card border-border">
            <div className="flex items-center gap-2 mb-8 border-b border-border pb-4">
              <UserCircleIcon className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold uppercase tracking-tight">Informações Pessoais</h2>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="full-name" className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Nome Completo</label>
                  <input 
                    id="full-name"
                    value={profileData.name} 
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    type="text" 
                    className="w-full h-12 px-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm" 
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Endereço de E-mail</label>
                  <input 
                    id="email"
                    value={profileData.email} 
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    type="email" 
                    className="w-full h-12 px-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="bio" className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Bio (Opcional)</label>
                <textarea 
                  id="bio"
                  value={profileData.bio} 
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  rows={4} 
                  className="w-full p-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm" 
                  placeholder="Conte um pouco sobre você..."
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <div className="space-y-0.5">
                  <span className="text-xs font-black uppercase tracking-widest text-primary block">Visibilidade Pública</span>
                  <span className="text-[10px] text-muted-foreground font-medium">Permitir que meu perfil seja listado na página pública da organização.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setProfileData({ ...profileData, publicProfile: !profileData.publicProfile })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${profileData.publicProfile ? 'bg-primary' : 'bg-muted'}`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${profileData.publicProfile ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex justify-end">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="premium-button !px-12"
                >
                  {isSaving ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>

          {/* Password Change Section */}
          <div className="premium-card p-8 bg-card border-border">
            <div className="flex items-center gap-2 mb-8 border-b border-border pb-4">
              <KeyIcon className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold uppercase tracking-tight">Segurança</h2>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="current-password" dir="ltr" className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Senha Atual</label>
                  <input 
                    id="current-password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    type="password" 
                    className="w-full h-12 px-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm" 
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="new-password" object-type="field-label" className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Nova Senha</label>
                    <input 
                      id="new-password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      type="password" 
                      className="w-full h-12 px-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="confirm-password" object-type="field-label" className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Confirmar Nova Senha</label>
                    <input 
                      id="confirm-password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      type="password" 
                      className="w-full h-12 px-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm" 
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="px-8 py-3 rounded-xl bg-foreground text-background font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {isSaving ? "Processando..." : "Atualizar Senha"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Avatar Upload */}
        <div className="space-y-8">
          <div className="premium-card p-8 bg-card border-border flex flex-col items-center text-center">
            <div className="flex items-center gap-2 mb-8 border-b border-border pb-4 w-full">
              <PhotoIcon className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold uppercase tracking-tight">Foto de Perfil</h2>
            </div>

            <div className="relative group">
              <div className="w-40 h-40 rounded-3xl bg-muted overflow-hidden border-4 border-white shadow-xl">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user?.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <UserCircleIcon className="w-20 h-20 opacity-20" />
                  </div>
                )}
              </div>
              <label className="absolute inset-0 cursor-pointer rounded-3xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white space-y-2 z-10">
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                <ArrowUpTrayIcon className="w-8 h-8" />
                <span className="text-[10px] font-black uppercase tracking-widest">Alterar Foto</span>
              </label>
            </div>
            
            <p className="mt-6 text-xs text-muted-foreground font-medium max-w-[200px]">
              Use uma foto quadrada de alta resolução (JPG ou PNG) para melhores resultados.
            </p>
          </div>

          {/* Quick Info */}
          <div className="premium-card p-6 bg-primary/5 border-primary/10 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-primary">Informações da Conta</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] font-bold tracking-widest uppercase">
                <span className="text-muted-foreground">Role</span>
                <span className="px-2 py-0.5 rounded bg-primary text-white">{user?.role}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold tracking-widest uppercase">
                <span className="text-muted-foreground">ID do Tenant</span>
                <span className="text-foreground truncate max-w-[120px]">{user?.tenantId}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
