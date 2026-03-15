'use client';

import { useState, useEffect } from 'react';
import { tenantsService, UpdateTenantDto } from '@/services/tenants.service';
import { toast } from 'react-hot-toast';

export default function BrandingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenant, setTenant] = useState<any>(null);
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
      toast.success('Branding atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar branding.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Carregando...</div>;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Branding da Organização</h1>
        <p className="text-gray-600 mt-2">Personalize a identidade visual do seu portal de eventos.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700">Nome da Organização</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Minha Empresa"
            />
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700">Cor Primária</label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                className="w-16 h-12 p-1 rounded-lg border border-gray-200 cursor-pointer"
                value={formData.themeConfig?.primaryColor}
                onChange={(e) => setFormData({
                  ...formData,
                  themeConfig: { ...formData.themeConfig, primaryColor: e.target.value }
                })}
              />
              <input
                type="text"
                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm font-mono"
                value={formData.themeConfig?.primaryColor}
                onChange={(e) => setFormData({
                  ...formData,
                  themeConfig: { ...formData.themeConfig, primaryColor: e.target.value }
                })}
              />
            </div>
            <p className="text-xs text-gray-500">Esta cor será usada em botões, links e destaques.</p>
          </div>

          <div className="space-y-4 md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700">Logo URL</label>
            <input
              type="url"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              value={formData.logoUrl}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
              placeholder="https://exemplo.com/logo.png"
            />
            {formData.logoUrl && (
              <div className="mt-4 p-4 border border-dashed border-gray-200 rounded-xl bg-gray-50 flex justify-center">
                <img src={formData.logoUrl} alt="Logo Preview" className="h-16 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>

      <div className="mt-12 p-8 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-4">
        <div className="p-3 bg-white rounded-xl shadow-sm">
          <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-emerald-900">Dica de Design</h3>
          <p className="text-emerald-800/80 text-sm mt-1">
            Escolha uma cor primária que tenha bom contraste com branco para garantir que os botões sejam legíveis.
            Cores muito claras podem dificultar a leitura.
          </p>
        </div>
      </div>
    </div>
  );
}
