'use client';

import { useState, useEffect } from 'react';
import { tenantsService, UpdateTenantDto } from '@/services/tenants.service';
import { Tenant } from '@/types/event';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

export default function BrandingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState<UpdateTenantDto>({
    name: '',
    logoUrl: '',
    themeConfig: {
      primaryColor: '#10b981',
    },
  });

  useEffect(() => {
    loadTenant();
  }, []);

  const loadTenant = async () => {
    try {
      const data = await tenantsService.getMe();
      setTenant(data);
      setFormData({
        name: data.name,
        logoUrl: data.logoUrl || '',
        themeConfig: data.themeConfig || { primaryColor: '#10b981' },
      });
    } catch (error) {
      toast.error('Erro ao carregar configurações.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await tenantsService.updateMe(formData);
      window.dispatchEvent(new CustomEvent('tenant-updated'));
      toast.success('Branding atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar branding.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-bold animate-pulse">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-foreground">Branding da Organização</h1>
        <p className="text-muted-foreground font-medium mt-1">Personalize a identidade visual do seu portal de eventos.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 premium-card p-8 bg-card border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-foreground">Nome da Organização</label>
            <input
              type="text"
              className="premium-input w-full"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Minha Empresa"
            />
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-semibold text-foreground">Cor Primária</label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                className="w-16 h-12 p-1 rounded-lg border border-border bg-card cursor-pointer"
                value={formData.themeConfig?.primaryColor}
                onChange={(e) => setFormData({
                  ...formData,
                  themeConfig: { ...formData.themeConfig, primaryColor: e.target.value }
                })}
              />
              <input
                type="text"
                className="premium-input flex-1 font-mono"
                value={formData.themeConfig?.primaryColor}
                onChange={(e) => setFormData({
                  ...formData,
                  themeConfig: { ...formData.themeConfig, primaryColor: e.target.value }
                })}
              />
            </div>
            <p className="text-xs text-muted-foreground font-medium">Esta cor será usada em botões, links e destaques.</p>
          </div>

          <div className="space-y-4 md:col-span-2">
            <label className="block text-sm font-semibold text-foreground">Logo URL</label>
            <input
              type="url"
              className="premium-input w-full"
              value={formData.logoUrl}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
              placeholder="https://exemplo.com/logo.png"
            />
            {formData.logoUrl && (
              <div className="mt-4 p-4 border border-dashed border-border rounded-xl bg-muted/50 flex justify-center relative min-h-[64px]">
                <Image 
                  src={formData.logoUrl} 
                  alt="Logo Preview" 
                  width={128}
                  height={64}
                  className="h-16 w-auto object-contain" 
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-border mt-8">
          <button
            type="submit"
            disabled={saving}
            className="premium-button"
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>

      <div className="mt-12 p-8 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-4">
        <div className="p-3 bg-card border border-border rounded-xl shadow-sm">
          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-foreground">Dica de Design</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Escolha uma cor primária que tenha bom contraste com branco para garantir que os botões sejam legíveis.
            Cores muito claras podem dificultar a leitura.
          </p>
        </div>
      </div>
    </div>
  );
}
