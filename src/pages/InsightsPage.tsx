import React, { useEffect, useState } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  Loader2, 
  ArrowRight,
  Bot
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/services/storage';
import { formatCurrency, getDaysInactive } from '@/utils/formatters';
import { useNavigate } from 'react-router-dom';

interface InsightItem {
  id: string;
  type: 'oportunidade' | 'alerta' | 'recomendacao';
  title: string;
  description: string;
  actionText?: string;
  actionLink?: string;
}

export const InsightsPage: React.FC = () => {
  const { company } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<InsightItem[]>([]);

  const generateInsights = async () => {
    if (!company?.id) return;
    try {
      setLoading(true);
      const [customers, products, sales, , receivables, payables] = await Promise.all([
        storage.getCustomers(company.id),
        storage.getProducts(company.id),
        storage.getSales(company.id),
        storage.getExpenses(company.id),
        storage.getReceivables(company.id),
        storage.getPayables(company.id),
      ]);

      const items: InsightItem[] = [];

      // 1. Clientes inativos (>60 dias)
      const inactives = customers.filter(c => {
        const days = getDaysInactive(c.last_purchase_at);
        return days !== null && days >= 60;
      });
      if (inactives.length > 0) {
        items.push({
          id: 'inactive-opp',
          type: 'oportunidade',
          title: `Recuperação: ${inactives.length} cliente(s) sem compras há mais de 60 dias`,
          description: `Identificamos clientes como "${inactives[0].name}" que costumavam comprar e podem estar esquecidos. Uma mensagem no WhatsApp com frete grátis ou desconto de retorno pode gerar receita imediata.`,
          actionText: 'Ver Clientes Inativos',
          actionLink: '/clientes',
        });
      }

      // 2. Produto Campeão de Vendas
      if (sales.length > 0) {
        const prodSalesMap = new Map<string, { count: number; total: number }>();
        sales.forEach(s => {
          s.items?.forEach(i => {
            const cur = prodSalesMap.get(i.product_name) || { count: 0, total: 0 };
            prodSalesMap.set(i.product_name, {
              count: cur.count + i.quantity,
              total: cur.total + Number(i.total || 0),
            });
          });
        });

        const sortedProds = Array.from(prodSalesMap.entries()).sort((a, b) => b[1].total - a[1].total);
        if (sortedProds.length > 0) {
          const totalRevenue = sales.reduce((acc, s) => acc + Number(s.total || 0), 0);
          const topProd = sortedProds[0];
          const pct = totalRevenue > 0 ? Math.round((topProd[1].total / totalRevenue) * 100) : 0;

          if (pct >= 15) {
            items.push({
              id: 'top-product',
              type: 'oportunidade',
              title: `Seu produto "${topProd[0]}" representa ${pct}% do faturamento`,
              description: `Este produto é a sua principal âncora de vendas (${formatCurrency(topProd[1].total)}). Considere criar kits combinados com produtos de menor saída para aumentar o ticket médio.`,
              actionText: 'Ver Produtos',
              actionLink: '/produtos',
            });
          }
        }
      }

      // 3. Estoque Crítico
      const lowStock = products.filter(p => p.stock <= p.min_stock && p.status === 'ativo');
      if (lowStock.length > 0) {
        items.push({
          id: 'low-stock-alert',
          type: 'alerta',
          title: `${lowStock.length} produto(s) abaixo do estoque mínimo de segurança`,
          description: `Itens essenciais como "${lowStock[0].name}" correm risco iminente de ruptura. Isso pode provocar perda de vendas caso os pedidos aumentem nos próximos dias.`,
          actionText: 'Repor Estoque',
          actionLink: '/produtos',
        });
      }

      // 4. Contas a Receber Pendentes
      const pendingRec = receivables.filter(r => r.status === 'pendente' || r.status === 'vencido');
      const totalRec = pendingRec.reduce((acc, r) => acc + Number(r.amount || 0), 0);
      if (totalRec > 0) {
        items.push({
          id: 'receivables-insight',
          type: 'recomendacao',
          title: `Você possui ${formatCurrency(totalRec)} a receber em títulos em aberto`,
          description: `Garantir a cobrança pontual desses ${pendingRec.length} recebíveis evitará necessidade de capital de giro externo para cobrir as contas da empresa.`,
          actionText: 'Acessar Recebíveis',
          actionLink: '/financeiro',
        });
      }

      // 5. Contas a Pagar
      const pendingPay = payables.filter(p => p.status === 'pendente' || p.status === 'vencido');
      const totalPay = pendingPay.reduce((acc, p) => acc + Number(p.amount || 0), 0);
      if (totalPay > 0) {
        items.push({
          id: 'payables-alert',
          type: 'alerta',
          title: `Compromissos a pagar totalizam ${formatCurrency(totalPay)}`,
          description: `Fique atento às datas de liquidação dos fornecedores e concessionárias para evitar encargos por atraso de pagamento.`,
          actionText: 'Ver Contas a Pagar',
          actionLink: '/financeiro',
        });
      }

      // 6. Base Vazia / Primeiros Passos
      if (items.length === 0) {
        items.push({
          id: 'onboarding-insight',
          type: 'recomendacao',
          title: 'Alimente o sistema para gerar insights preditivos',
          description: `O ${company.ai_employee_name || 'NEXA'} gera análises com base em dados reais de clientes, vendas e despesas. Comece cadastrando os primeiros registros ou use o modo demonstração no topo da tela.`,
          actionText: 'Explorar Dashboard',
          actionLink: '/dashboard',
        });
      }

      setInsights(items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateInsights();
  }, [company?.id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-brand-600" />
            Insights do {company?.ai_employee_name || 'NEXA'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Diagnóstico contínuo e recomendações baseadas no cruzamento de dados reais da empresa.
          </p>
        </div>

        <button
          onClick={() => navigate('/ia')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-brand-500/20 active:scale-95"
        >
          <Bot className="w-4 h-4" />
          <span>Pedir Diagnóstico no Chat</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">O {company?.ai_employee_name || 'NEXA'} está analisando os dados da empresa...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((item) => {
            const isOportunidade = item.type === 'oportunidade';
            const isAlerta = item.type === 'alerta';

            return (
              <div
                key={item.id}
                className={`bg-white p-6 rounded-2xl border transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5 ${
                  isOportunidade
                    ? 'border-emerald-200/80 hover:border-emerald-300'
                    : isAlerta
                    ? 'border-rose-200/80 hover:border-rose-300'
                    : 'border-indigo-200/80 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center ${
                      isOportunidade
                        ? 'bg-emerald-50 text-emerald-600'
                        : isAlerta
                        ? 'bg-rose-50 text-rose-600'
                        : 'bg-indigo-50 text-indigo-600'
                    }`}
                  >
                    {isOportunidade ? (
                      <TrendingUp className="w-6 h-6" />
                    ) : isAlerta ? (
                      <AlertTriangle className="w-6 h-6" />
                    ) : (
                      <Lightbulb className="w-6 h-6" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isOportunidade
                            ? 'bg-emerald-100 text-emerald-800'
                            : isAlerta
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {item.type}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm sm:text-base mt-1.5">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {item.actionText && item.actionLink && (
                  <button
                    onClick={() => navigate(item.actionLink!)}
                    className="self-start sm:self-center shrink-0 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <span>{item.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
