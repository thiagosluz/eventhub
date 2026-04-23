'use client';

import React, { useEffect, useState } from 'react';
import { HealthStatusCard } from '@/components/admin/HealthStatusCard';
import { api } from '@/lib/api';
import {
  BoltIcon,
  ClockIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface HealthData {
  status: string;
  info: Record<string, { status: string; [key: string]: any }>;
  error: Record<string, any>;
}

export default function AdminHealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [latency, setLatency] = useState<number | null>(null);

  const fetchHealth = async () => {
    const start = Date.now();
    try {
      // Usamos api.get que já lida com auth
      const result = await api.get<HealthData>('/admin/health');
      setLatency(Date.now() - start);
      setData(result);
    } catch (err: any) {
      setLatency(Date.now() - start);
      if (err.response?.data) {
        setData(err.response.data);
      }
    } finally {
      setLoading(false);
      setLastUpdate(new Date());
    }
  };

  useEffect(() => {
    fetchHealth();
    // Poll a cada 60 segundos conforme solicitado
    const interval = setInterval(fetchHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-500 mb-2">
            <ShieldCheckIcon className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">System Integrity</span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Saúde da Infraestrutura</h1>
          <p className="text-gray-400 mt-2">Monitoramento global de serviços críticos e performance.</p>
        </div>
        
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-900 border border-gray-800 text-gray-400">
            <ClockIcon className="w-3.5 h-3.5" />
            Última atualização: {lastUpdate.toLocaleTimeString()}
          </div>
          <button 
            onClick={() => { setLoading(true); fetchHealth(); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors"
          >
            <ArrowPathIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar Agora
          </button>
        </div>
      </div>

      {/* Latency Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div className="flex items-center gap-3 text-gray-400 mb-4">
            <BoltIcon className="w-5 h-5 text-blue-500" />
            <span className="font-medium text-sm">Latência da API</span>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-white">{latency ?? '--'}</span>
              <span className="text-gray-500 font-medium">ms</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Tempo total de ida e volta (RTT)</p>
          </div>
        </div>

        <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          <HealthStatusCard 
            title="Banco de Dados"
            status={loading ? 'loading' : data?.info?.database?.status === 'up' ? 'ok' : 'error'}
            message={data?.info?.database?.status === 'up' ? 'Conectado via Prisma' : 'Falha na conexão'}
            details={data?.error?.database}
          />
          <HealthStatusCard 
            title="Serviço de E-mail"
            status={loading ? 'loading' : data?.info?.email?.status === 'up' ? 'ok' : 'error'}
            message={data?.info?.email?.status === 'up' ? 'SMTP Autenticado' : 'Erro no transporte'}
            details={data?.error?.email}
          />
          <HealthStatusCard 
            title="Armazenamento"
            status={loading ? 'loading' : data?.info?.storage?.status === 'up' ? 'ok' : 'error'}
            message={data?.info?.storage?.status === 'up' ? 'MinIO Online' : 'Bucket inacessível'}
            details={data?.error?.storage}
          />
        </div>
      </div>

      {/* System JSON Raw (Optional/Debug) */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Status Detalhado (JSON)</h3>
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
            Cluster Health: {data?.status?.toUpperCase() || '--'}
          </span>
        </div>
        <pre className="text-xs font-mono text-gray-500 bg-black/30 p-4 rounded-xl overflow-auto max-h-[300px] border border-white/5 scrollbar-thin scrollbar-thumb-gray-800">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}
