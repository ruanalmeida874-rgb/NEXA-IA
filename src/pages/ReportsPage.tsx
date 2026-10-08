import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  Loader2 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/services/storage';
import { Sale, Expense } from '@/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/utils/formatters';

export const ReportsPage: React.FC = () => {
  const { company } = useAuth();
  const [period, setPeriod] = useState<'hoje' | '7dias' | '30dias' | '90dias' | 'ano'>('30dias');
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      if (!company?.id) return;
      try {
        setLoading(true);
        const [s, e] = await Promise.all([
          storage.getSales(company.id),
          storage.getExpenses(company.id),
        ]);
        setSales(s);
        setExpenses(e);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [company?.id]);

  // Filter sales & expenses by chosen period
  const filterByDate = (dateStr: string) => {
    const itemDate = new Date(dateStr).getTime();
    const now = new Date().getTime();
    const diffDays = (now - itemDate) / (1000 * 60 * 60 * 24);

    if (period === 'hoje') return diffDays <= 1;
    if (period === '7dias') return diffDays <= 7;
    if (period === '30dias') return diffDays <= 30;
    if (period === '90dias') return diffDays <= 90;
    if (period === 'ano') return diffDays <= 365;
    return true;
  };

  const filteredSales = sales.filter((s) => filterByDate(s.sale_date));
  const filteredExpenses = expenses.filter((e) => filterByDate(e.date));

  const totalSalesAmount = filteredSales.reduce((acc, s) => acc + Number(s.total || 0), 0);
  const totalExpensesAmount = filteredExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const lucroLiquido = totalSalesAmount - totalExpensesAmount;

  // Breakdown by payment method
  const paymentBreakdownMap = new Map<string, number>();
  filteredSales.forEach((s) => {
    const cur = paymentBreakdownMap.get(s.payment_method) || 0;
    paymentBreakdownMap.set(s.payment_method, cur + Number(s.total || 0));
  });

  const paymentBreakdownData = Array.from(paymentBreakdownMap.entries()).map(([name, value]) => ({
    name: name.toUpperCase().replace('_', ' '),
    value: Math.round(value),
  }));

  const COLORS = ['#2c53ea', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  // Top Products by Revenue
  const productSalesMap = new Map<string, number>();
  filteredSales.forEach((s) => {
    s.items?.forEach((item) => {
      const cur = productSalesMap.get(item.product_name) || 0;
      productSalesMap.set(item.product_name, cur + Number(item.total || 0));
    });
  });

  const topProductsData = Array.from(productSalesMap.entries())
    .map(([name, total]) => ({ name, total: Math.round(total) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brand-600" />
            Relatórios & Desempenho
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Análises gerenciais consolidadas diretamente a partir do banco de dados da empresa.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-2xs overflow-x-auto">
          <button
            onClick={() => setPeriod('hoje')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              period === 'hoje' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Hoje
          </button>
          <button
            onClick={() => setPeriod('7dias')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              period === '7dias' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            7 dias
          </button>
          <button
            onClick={() => setPeriod('30dias')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              period === '30dias' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            30 dias
          </button>
          <button
            onClick={() => setPeriod('90dias')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              period === '90dias' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            90 dias
          </button>
          <button
            onClick={() => setPeriod('ano')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              period === 'ano' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Este ano
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Compilando relatórios e cálculos do período...</p>
        </div>
      ) : filteredSales.length === 0 && filteredExpenses.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Sem movimentações registradas neste período"
          description="Alterne o filtro de período ou realize vendas e despesas para gerar relatórios detalhados."
        />
      ) : (
        <>
          {/* Key Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold uppercase text-slate-400">Total Faturado no Período</span>
              <p className="text-2xl font-extrabold text-brand-600 mt-1">{formatCurrency(totalSalesAmount)}</p>
              <p className="text-xs text-slate-500 mt-1">{filteredSales.length} pedido(s) atendido(s)</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold uppercase text-slate-400">Despesas no Período</span>
              <p className="text-2xl font-extrabold text-rose-600 mt-1">{formatCurrency(totalExpensesAmount)}</p>
              <p className="text-xs text-slate-500 mt-1">{filteredExpenses.length} desembolso(s)</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold uppercase text-slate-400">Margem Líquida Operacional</span>
              <p className={`text-2xl font-extrabold mt-1 ${lucroLiquido >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(lucroLiquido)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Receita menos despesas</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products Bar Chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base mb-1">
                Top 5 Produtos em Faturamento
              </h3>
              <p className="text-xs text-slate-500 mb-4">Itens que mais geraram receita no período selecionado</p>

              <div className="h-64 w-full">
                {topProductsData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    Nenhum produto vendido no período
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProductsData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10, fill: '#475569' }} />
                      <Tooltip formatter={(val: any) => [formatCurrency(Number(val)), 'Receita']} />
                      <Bar dataKey="total" fill="#2c53ea" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Payment Methods Pie Chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base mb-1">
                Vendas por Forma de Pagamento
              </h3>
              <p className="text-xs text-slate-500 mb-4">Distribuição percentual da receita</p>

              <div className="h-64 w-full">
                {paymentBreakdownData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    Nenhuma venda com forma de pagamento registrada
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentBreakdownData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {paymentBreakdownData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => [formatCurrency(Number(val)), 'Total']} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
