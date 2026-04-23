"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowTopRightOnSquareIcon,
  QueueListIcon,
  ShieldExclamationIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/context/AuthContext";

const BULL_BOARD_PATH = "/admin/queues";

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
}

export default function AdminQueuesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    if (!isLoading && user && user.role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem("eventhub_token")
        : null;
    setToken(stored);
  }, []);

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user.role !== "SUPER_ADMIN") {
    return (
      <div className="m-8 rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center">
        <ShieldExclamationIcon className="w-12 h-12 mx-auto text-rose-500 mb-4" />
        <h2 className="text-lg font-black uppercase tracking-wider text-gray-100">
          Acesso restrito
        </h2>
        <p className="text-sm text-gray-400 mt-2">
          Apenas usuários <strong>Super Admin</strong> podem acessar o Bull
          Board.
        </p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="m-8 rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center">
        <p className="text-sm text-gray-400">Carregando credenciais...</p>
      </div>
    );
  }

  const apiBase = getApiBaseUrl();
  const bullBoardUrl = `${apiBase}${BULL_BOARD_PATH}?token=${encodeURIComponent(
    token,
  )}`;

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center">
            <QueueListIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-100">
              Filas (Bull Board)
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Monitoramento das filas BullMQ: jobs ativos, aguardando,
              concluídos, falhas e retries.
            </p>
          </div>
        </div>

        <a
          href={bullBoardUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 shrink-0 px-5 py-3 rounded-xl bg-yellow-500 text-gray-950 text-xs font-black uppercase tracking-wider hover:bg-yellow-400 transition-colors"
        >
          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
          Abrir em nova aba
        </a>
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
        {iframeError ? (
          <div className="p-10 text-center space-y-3">
            <ShieldExclamationIcon className="w-10 h-10 mx-auto text-gray-500" />
            <p className="text-sm font-bold text-gray-200">
              Não foi possível carregar o painel neste iframe.
            </p>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Isso geralmente acontece quando o backend bloqueia embed por CSP.
              Use o botão acima para abrir o Bull Board em uma nova aba com o
              token injetado.
            </p>
          </div>
        ) : (
          <iframe
            title="Bull Board dashboard"
            src={bullBoardUrl}
            className="w-full h-[calc(100vh-240px)] min-h-[560px] bg-white"
            onError={() => setIframeError(true)}
          />
        )}
      </div>

      <p className="text-[11px] text-gray-500">
        O token de acesso é anexado à URL apenas em tempo de renderização e
        nunca gravado no servidor. Ele herda o mesmo tempo de expiração do seu
        JWT de login.
      </p>
    </div>
  );
}
