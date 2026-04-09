'use client';

import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface HealthStatusCardProps {
  title: string;
  status: 'ok' | 'error' | 'loading';
  message?: string;
  details?: any;
}

export const HealthStatusCard: React.FC<HealthStatusCardProps> = ({
  title,
  status,
  message,
  details,
}) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'ok':
        return 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500';
      case 'error':
        return 'border-rose-500/20 bg-rose-500/5 text-rose-500';
      default:
        return 'border-gray-800 bg-gray-900/50 text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <XCircle className="w-5 h-5" />;
      case 'loading':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  return (
    <div className={`p-6 rounded-2xl border ${getStatusStyles()} transition-all duration-300 hover:scale-[1.02] shadow-xl backdrop-blur-sm`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-lg text-gray-100">{title}</h3>
        <div className="p-2 rounded-lg bg-black/20">
            {getStatusIcon()}
        </div>
      </div>
      
      <div className="space-y-1">
        <p className="text-2xl font-bold tracking-tight text-white capitalize">
          {status === 'loading' ? 'Checking...' : status === 'ok' ? 'Online' : 'Offline'}
        </p>
        <p className={`text-sm ${status === 'error' ? 'text-rose-400' : 'text-gray-400'}`}>
          {message || (status === 'ok' ? 'System operating normally' : 'Connecting...')}
        </p>
      </div>

      {details && status === 'error' && (
        <div className="mt-4 p-3 rounded-lg bg-black/40 border border-white/5 font-mono text-[10px] text-rose-300/80 overflow-auto max-h-24">
          {JSON.stringify(details, null, 2)}
        </div>
      )}
    </div>
  );
};
