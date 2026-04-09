"use client";

export default function AdminDashboardPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-100 mb-2">Painel de Controle Mestre</h1>
        <p className="text-gray-400">Visão global de todos os inquilinos e componentes do sistema.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-sm">
          <h2 className="text-gray-400 font-medium text-sm">Total de Inquilinos</h2>
          <p className="text-4xl font-bold text-gray-100 mt-2">--</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-sm">
          <h2 className="text-gray-400 font-medium text-sm">Planos Ativos</h2>
          <p className="text-4xl font-bold text-gray-100 mt-2">--</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-sm">
          <h2 className="text-gray-400 font-medium text-sm">Receita Mensal</h2>
          <p className="text-4xl font-bold text-emerald-500 mt-2">--</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 min-h-[400px]">
        <h3 className="text-lg font-semibold text-gray-100 mb-6">Integrações de API em Breve</h3>
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <p>Os gráficos e métricas serão conectados à API em breve.</p>
        </div>
      </div>
    </div>
  );
}
