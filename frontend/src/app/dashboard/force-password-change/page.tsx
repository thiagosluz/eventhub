"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import {
  LockClosedIcon,
  KeyIcon,
  CheckBadgeIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

import { authService } from "@/services/auth.service";
import { Button, Input } from "@/components/ui";
import {
  forcePasswordChangeSchema,
  type ForcePasswordChangeInput,
} from "@/lib/validation/user";

export default function ForcePasswordChangePage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForcePasswordChangeInput>({
    resolver: zodResolver(forcePasswordChangeSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: ForcePasswordChangeInput) => {
    try {
      await authService.changePasswordForced(values.password);
      toast.success("Senha atualizada com sucesso!");
      router.push("/dashboard");
      window.location.reload();
    } catch {
      toast.error("Erro ao atualizar senha.");
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
              Esta é sua primeira vez acessando. <br />
              <span className="text-amber-500 font-black uppercase tracking-widest">
                Altere sua senha temporária
              </span>{" "}
              Para continuar.
            </p>
          </div>
        </div>

        <div className="premium-card p-8 bg-card border-border shadow-2xl relative overflow-hidden">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6 relative z-10"
            noValidate
          >
            <Input
              id="password"
              type="password"
              label="Nova Senha"
              placeholder="******"
              required
              autoComplete="new-password"
              leftAddon={<KeyIcon className="w-4 h-4" />}
              error={errors.password?.message}
              {...register("password")}
            />

            <Input
              id="confirm-password"
              type="password"
              label="Confirmar Nova Senha"
              placeholder="******"
              required
              autoComplete="new-password"
              leftAddon={<LockClosedIcon className="w-4 h-4" />}
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isSubmitting}
              leftIcon={<CheckBadgeIcon className="w-5 h-5" />}
            >
              Atualizar e Acessar
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
