"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/auth.service";
import { Button, Input, ConfirmDialog } from "@/components/ui";
import { toast } from "react-hot-toast";
import { 
  AlertCircle, 
  CheckCircle2, 
  Shield, 
  ShieldAlert, 
  KeyRound, 
  Lock,
  RefreshCw,
  Download,
  Copy,
  AlertTriangle,
  ChevronRight
} from "lucide-react";

export default function AdminProfilePage() {
  const { user, updateUser, logout } = useAuth();
  
  // States for 2FA
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [is2faSubmitting, setIs2faSubmitting] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);
  const [twoFactorSuccess, setTwoFactorSuccess] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
  const [isConfirmRegenerateOpen, setIsConfirmRegenerateOpen] = useState(false);

  // States for Password Change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const is2faEnabled = user?.isTwoFactorEnabled;

  const handleGenerateQr = async () => {
    setIsGenerating(true);
    setTwoFactorError(null);
    setTwoFactorSuccess(null);
    try {
      const response = await authService.generate2fa();
      setQrCode(response.qrCode);
    } catch (err: unknown) {
      setTwoFactorError(err instanceof Error ? err.message : "Erro ao gerar QR Code");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTurnOn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (twoFactorCode.length !== 6) return;
    
    setIs2faSubmitting(true);
    setTwoFactorError(null);
    try {
      const response = await authService.turnOn2fa(twoFactorCode);
      setTwoFactorSuccess("Autenticação em duas etapas habilitada com sucesso!");
      updateUser({ isTwoFactorEnabled: true });
      setQrCode(null);
      setTwoFactorCode("");
      if (response.recoveryCodes) {
        setRecoveryCodes(response.recoveryCodes);
        setShowRecoveryCodes(true);
      }
    } catch (err: unknown) {
      setTwoFactorError(err instanceof Error ? err.message : "Código inválido");
    } finally {
      setIs2faSubmitting(false);
    }
  };

  const handleTurnOff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (twoFactorCode.length !== 6) return;
    
    setIs2faSubmitting(true);
    setTwoFactorError(null);
    try {
      await authService.turnOff2fa(twoFactorCode);
      setTwoFactorSuccess("Autenticação em duas etapas desabilitada.");
      updateUser({ isTwoFactorEnabled: false });
      setTwoFactorCode("");
      setRecoveryCodes([]);
      setShowRecoveryCodes(false);
    } catch (err: unknown) {
      setTwoFactorError(err instanceof Error ? err.message : "Código inválido");
    } finally {
      setIs2faSubmitting(false);
    }
  };

  const handleRegenerateCodes = async () => {
    setIs2faSubmitting(true);
    try {
      const response = await authService.regenerateRecoveryCodes();
      setRecoveryCodes(response.recoveryCodes);
      setShowRecoveryCodes(true);
      setTwoFactorSuccess("Novos códigos de recuperação gerados!");
      setIsConfirmRegenerateOpen(false);
    } catch (err: unknown) {
      setTwoFactorError(err instanceof Error ? err.message : "Erro ao gerar códigos");
    } finally {
      setIs2faSubmitting(false);
    }
  };

  const downloadRecoveryCodes = () => {
    const content = `CÓDIGOS DE RECUPERAÇÃO EVENTHUB\n\nGuarde estes códigos em um local seguro. Cada código só pode ser usado uma vez.\n\n${recoveryCodes.join('\n')}\n\nGerado em: ${new Date().toLocaleString()}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recovery-codes-${user?.email}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    toast.success("Códigos copiados!");
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas não coincidem.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }

    setIsPasswordSubmitting(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setPasswordSuccess("Senha alterada com sucesso! Você será desconectado em instantes...");
      
      // Auto logout after 3 seconds to force re-login
      setTimeout(() => {
        logout();
      }, 3000);
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : "Erro ao alterar senha. Verifique sua senha atual.");
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-2">
          Meu Perfil
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie as configurações de segurança da sua conta de Super Admin.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Card 2FA */}
        <div className="bg-white dark:bg-gray-900 shadow-sm rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden h-full flex flex-col">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 flex items-center gap-3">
            <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Autenticação de Dois Fatores (2FA)
            </h2>
          </div>
          
          <div className="p-6 space-y-6 flex-1">
            {twoFactorError && (
              <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg flex items-start gap-3 text-red-700 dark:text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{twoFactorError}</p>
              </div>
            )}
            
            {twoFactorSuccess && !showRecoveryCodes && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg flex items-start gap-3 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{twoFactorSuccess}</p>
              </div>
            )}

            {showRecoveryCodes ? (
              <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
                <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg flex items-start gap-3 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold">Guarde seus códigos de recuperação!</p>
                    <p className="text-xs mt-1">Eles são a única forma de acessar sua conta caso você perca seu dispositivo.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 font-mono text-sm">
                  {recoveryCodes.map((code, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-gray-400 dark:text-gray-500 w-4">{index + 1}.</span>
                      <span className="text-gray-900 dark:text-gray-100 font-bold tracking-wider">{code}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button onClick={copyToClipboard} variant="outline" className="flex-1 gap-2">
                    <Copy className="w-4 h-4" /> Copiar
                  </Button>
                  <Button onClick={downloadRecoveryCodes} variant="outline" className="flex-1 gap-2">
                    <Download className="w-4 h-4" /> Baixar .txt
                  </Button>
                </div>

                <Button 
                  onClick={() => setShowRecoveryCodes(false)} 
                  fullWidth
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Entendi, códigos salvos
                </Button>
              </div>
            ) : is2faEnabled ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 rounded-xl">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-full flex items-center justify-center">
                    <ShieldCheckIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                      O 2FA está Ativo
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Sua conta está protegida por uma camada extra de segurança.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
                  <button 
                    onClick={() => setIsConfirmRegenerateOpen(true)}
                    className="flex items-center justify-between w-full p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <RefreshCw className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                      <div className="text-left">
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Códigos de Backup</p>
                        <p className="text-xs text-gray-500">Gerar novos códigos de recuperação</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </button>
                </div>

                <form onSubmit={handleTurnOff} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Confirme seu código para desativar:
                    </label>
                    <Input
                      type="text"
                      placeholder="123456"
                      maxLength={6}
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                      className="tracking-[0.5em] text-xl font-bold text-center h-12"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    variant="outline" 
                    fullWidth
                    className="text-red-500 hover:text-red-600 dark:hover:bg-red-500/10"
                    disabled={twoFactorCode.length !== 6 || is2faSubmitting}
                    isLoading={is2faSubmitting}
                  >
                    Desabilitar 2FA
                  </Button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-xl">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-700">
                    <KeyRound className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                      2FA Desativado
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Contas de Super Admin devem usar 2FA para proteção máxima.
                    </p>
                  </div>
                </div>

                {!qrCode ? (
                  <Button 
                    onClick={handleGenerateQr} 
                    isLoading={isGenerating}
                    fullWidth
                    size="lg"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Ativar Autenticação em Duas Etapas
                  </Button>
                ) : (
                  <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="p-6 border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/30 dark:bg-indigo-500/5 rounded-xl flex flex-col items-center text-center gap-6">
                      <div className="bg-white p-3 rounded-2xl shadow-lg border-4 border-indigo-500/20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-bold text-gray-900 dark:text-gray-100">
                          Configure seu App
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed max-w-xs">
                          Escaneie o QR Code com o Google Authenticator ou Authy e insira o código abaixo.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleTurnOn} className="space-y-4">
                      <Input
                        type="text"
                        placeholder="000000"
                        maxLength={6}
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                        className="tracking-[0.5em] text-xl font-bold text-center h-12"
                      />
                      <Button 
                        type="submit" 
                        fullWidth
                        size="lg"
                        className="bg-indigo-600 hover:bg-indigo-700"
                        disabled={twoFactorCode.length !== 6 || is2faSubmitting}
                        isLoading={is2faSubmitting}
                      >
                        Confirmar e Ativar
                      </Button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Card Alterar Senha */}
        <div className="bg-white dark:bg-gray-900 shadow-sm rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden h-full flex flex-col">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 flex items-center gap-3">
            <Lock className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Alterar Senha
            </h2>
          </div>

          <form onSubmit={handlePasswordChange} className="p-6 space-y-6 flex-1 flex flex-col">
            {passwordError && (
              <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg flex items-start gap-3 text-red-700 dark:text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{passwordError}</p>
              </div>
            )}
            
            {passwordSuccess && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg flex items-start gap-3 text-emerald-700 dark:text-emerald-400">
                <RefreshCw className="w-5 h-5 flex-shrink-0 animate-spin-slow" />
                <p className="text-sm font-medium">{passwordSuccess}</p>
              </div>
            )}

            <div className="space-y-4 flex-1">
              <Input
                label="Senha Atual"
                type="password"
                placeholder="••••••••"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />

              <div className="pt-2 border-t border-gray-100 dark:border-gray-800" />

              <Input
                label="Nova Senha"
                type="password"
                placeholder="••••••••"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <Input
                label="Confirmar Nova Senha"
                type="password"
                placeholder="••••••••"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <div className="pt-6">
              <Button
                type="submit"
                fullWidth
                size="lg"
                variant="primary"
                disabled={isPasswordSubmitting || !currentPassword || !newPassword || !confirmPassword}
                isLoading={isPasswordSubmitting}
              >
                Atualizar Senha
              </Button>
              <p className="text-center text-[11px] text-gray-500 mt-4">
                Por segurança, ao alterar sua senha você será desconectado de todos os dispositivos.
              </p>
            </div>
          </form>
        </div>
      </div>
      <ConfirmDialog
        open={isConfirmRegenerateOpen}
        onClose={() => setIsConfirmRegenerateOpen(false)}
        onConfirm={handleRegenerateCodes}
        title="Gerar novos códigos?"
        description="Ao gerar novos códigos, os 10 códigos anteriores serão invalidados imediatamente. Você precisará salvar os novos códigos."
        confirmText="Gerar novos códigos"
        tone="warning"
        isLoading={is2faSubmitting}
      />
    </div>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
