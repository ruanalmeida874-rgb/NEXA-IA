import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  UserX, 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertTriangle, 
  Bot, 
  Database, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  Loader2,
  Calendar
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardService } from '@/services/dashboardService';
import { demoService } from '@/services/demoService';
import { DashboardMetrics } from '@/types';
import { formatCurrency } from '@/utils/formatters';

export const DashboardPage: React.FC = () => {
  const { company } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDemo, setLoadingDemo] = useState(false);

  const fetchMetrics = async () => {
    if (!company?.id) return;
    try {
      setLoading(true);
      const data = await dashboardService.getMetrics(company.id);
      setMetrics(data);
    } catch (e) {
      console.error('Failed to load metrics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [company?.id]);

  const handleLoadDemo = async () => {
    if (!company?.id) return;
    setLoadingDemo(true);
    try {
      await demoService.loadDemoData(company.id);
      await fetchMetrics();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDemo(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin mb-3" />
        <p className="text-sm text-slate-500">Compilando indicadores da sua empresa...</p>
      </div>
    );
  }

  const isCompletelyEmpty = metrics && metrics.salesCount === 0 && metrics.activeCustomers === 0 && metrics.totalExpenses === 0;

  return (
    <div className="space-y-6">
      {/* Top Banner Greeting */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-brand-600/10 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold mb-3 border border-brand-500/30">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            Assistente Corporativo em Tempo Real
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Painel Executivo — {company?.name}
          </h2>
          <p className="mt-1.5 text-sm text-slate-300 leading-relaxed">
            Olá, sou o <strong className="text-white">{company?.ai_employee_name || 'NEXA'}</strong>. Estou monitorando seus indicadores de vendas, estoques e obrigações financeiras.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/ia')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md shadow-brand-500/30 transition-all active:scale-95"
            >
              <Bot className="w-4 h-4" />
              <span>Conversar com o {company?.ai_employee_name || 'NEXA'}</span>
            </button>

            {isCompletelyEmpty && (
              <button
                onClick={handleLoadDemo}
                disabled={loadingDemo}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-all active:scale-95 disabled:opacity-50"
              >
                {loadingDemo ? <Loader2 className="w-4 h-4 animate-spin text-brand-400" /> : <Database className="w-4 h-4 text-brand-400" />}
                <span>Carregar Dados de Demonstração</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Elegant Empty State when no data has been created yet */}
      {isCompletelyEmpty ? (
        <div className="bg-white rounded-2xl p-8 sm:p-12 border border-slate-200 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-brand-600 mx-auto mb-4">
            <TrendingUp className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Sua empresa ainda não possui registros</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
            Seu ambiente começa 100% limpo. Cadastre seus clientes, produtos e vendas para ver os gráficos e métricas ganharem vida, ou experimente o modo demonstração.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate('/clientes')}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 shadow-sm"
            >
              Cadastrar Primeiro Cliente
            </button>
            <button
              onClick={() => navigate('/produtos')}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
            >
              Cadastrar Produto no Estoque
            </button>
            <button
              onClick={handleLoadDemo}
              disabled={loadingDemo}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 flex items-center gap-2"
            >
              {loadingDemo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
              Carregar Dados de Demonstração
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* 1. Faturamento do Mês */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Faturamento do Mês</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-900">
                {formatCurrency(metrics?.monthRevenue || 0)}
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Total de vendas registradas</span>
              </div>
            </div>

            {/* 2. Vendas Realizadas */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Vendas no Mês</span>
                <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-900">
                {metrics?.salesCount || 0}
              </p>
              <div className="mt-2 text-xs text-slate-500 font-medium">
                Transações concluídas
              </div>
            </div>

            {/* 3. Clientes Ativos vs Inativos */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Base de Clientes</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-extrabold text-slate-900">{metrics?.activeCustomers || 0}</p>
                <span className="text-xs text-emerald-600 font-bold">ativos</span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs text-amber-600 font-medium">
                <UserX className="w-3.5 h-3.5 text-amber-500" />
                <span>{metrics?.inactiveCustomers || 0} inativos (&gt;60 dias)</span>
              </div>
            </div>

            {/* 4. Contas a Receber vs Pagar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Contas a Receber</span>
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-sky-700">
                {formatCurrency(metrics?.totalReceivables || 0)}
              </p>
              <div className="mt-2 flex items-center gap-1 text-xs text-rose-600 font-medium">
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>A pagar: {formatCurrency(metrics?.totalPayables || 0)}</span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Vendas por Período */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base">Evolução de Vendas</h3>
                  <p className="text-xs text-slate-500">Receita diária dos últimos 14 dias</p>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  14 dias
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics?.salesByPeriod || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4875f5" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#4875f5" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      formatter={(val: any) => [formatCurrency(Number(val)), 'Vendas']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#2c53ea" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. Receita x Despesas */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base">Receita x Despesas</h3>
                  <p className="text-xs text-slate-500">Comparativo financeiro mensal</p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics?.revenueVsExpense || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      formatter={(val: any) => [formatCurrency(Number(val))]}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="receita" name="Receita" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="despesa" name="Despesa" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Atividades Importantes & Alertas do NEXA */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista: Atividades Importantes */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Atividades e Alertas Importantes
                  </h3>
                  <p className="text-xs text-slate-500">Situações prioritárias detectadas pelo sistema</p>
                </div>
              </div>

              {metrics?.importantAlerts && metrics.importantAlerts.length > 0 ? (
                <div className="space-y-3">
                  {metrics.importantAlerts.map((alert) => (
                    <div 
                      key={alert.id}
                      onClick={() => alert.link && navigate(alert.link)}
                      className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 cursor-pointer transition-colors ${
                        alert.type === 'alerta'
                          ? 'bg-rose-50/50 border-rose-200 hover:bg-rose-50'
                          : 'bg-amber-50/50 border-amber-200 hover:bg-amber-50'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-800">{alert.title}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{alert.description}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
                  Nenhum alerta crítico ativo. Sua empresa está operando regularmente!
                </div>
              )}
            </div>

            {/* Quick AI Assistant Card */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-2xl text-white shadow-xs border border-indigo-950 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-300 flex items-center justify-center mb-3 border border-brand-500/30">
                  <Bot className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base text-white">Precisa de um relatório rápido?</h4>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Pergunte ao {company?.ai_employee_name || 'NEXA'} para comparar faturamento com o mês anterior, saber quais produtos mais saíram ou solicitar o cadastro de um novo cliente.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800">
                <button
                  onClick={() => navigate('/ia')}
                  className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-brand-600/30"
                >
                  <span>Abrir Assistente NEXA</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
