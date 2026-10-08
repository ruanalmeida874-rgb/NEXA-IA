import React, { useEffect, useState } from 'react';
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Clock, 
  Trash2, 
  Loader2 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/services/storage';
import { Expense, Receivable, Payable, FinancialStatus } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, formatDate } from '@/utils/formatters';

export const FinancePage: React.FC = () => {
  const { company } = useAuth();
  const [activeTab, setActiveTab] = useState<'despesas' | 'receber' | 'pagar'>('despesas');

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [payables, setPayables] = useState<Payable[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    description: '',
    category: 'Operacional',
    amount: 0,
    due_date: new Date().toISOString().split('T')[0],
    supplier: '',
    status: 'pendente' as FinancialStatus,
    notes: '',
  });

  const loadData = async () => {
    if (!company?.id) return;
    try {
      setLoading(true);
      const [exp, rec, pay] = await Promise.all([
        storage.getExpenses(company.id),
        storage.getReceivables(company.id),
        storage.getPayables(company.id),
      ]);
      setExpenses(exp);
      setReceivables(rec);
      setPayables(pay);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [company?.id]);

  // Financial Summaries
  const totalDespesas = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalReceivables = receivables.filter(r => r.status === 'pendente' || r.status === 'vencido').reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const totalPayables = payables.filter(p => p.status === 'pendente' || p.status === 'vencido').reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const saldoProjetado = totalReceivables - totalPayables;

  const handleOpenCreate = () => {
    setFormData({
      description: '',
      category: activeTab === 'despesas' ? 'Operacional' : activeTab === 'pagar' ? 'Fornecedores' : 'Vendas',
      amount: 0,
      due_date: new Date().toISOString().split('T')[0],
      supplier: '',
      status: activeTab === 'despesas' ? 'pago' : 'pendente',
      notes: '',
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company?.id) return;
    if (!formData.description.trim()) {
      setErrorMsg('A descrição é obrigatória.');
      return;
    }
    if (formData.amount <= 0) {
      setErrorMsg('O valor deve ser maior que zero.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      if (activeTab === 'despesas') {
        await storage.saveExpense(company.id, {
          description: formData.description.trim(),
          category: formData.category,
          amount: Number(formData.amount),
          date: formData.due_date,
          due_date: formData.due_date,
          status: formData.status,
          notes: formData.notes.trim() || null,
        });
      } else if (activeTab === 'receber') {
        await storage.saveReceivable(company.id, {
          description: formData.description.trim(),
          amount: Number(formData.amount),
          due_date: formData.due_date,
          status: formData.status,
          notes: formData.notes.trim() || null,
        });
      } else if (activeTab === 'pagar') {
        await storage.savePayable(company.id, {
          description: formData.description.trim(),
          category: formData.category,
          supplier: formData.supplier.trim() || null,
          amount: Number(formData.amount),
          due_date: formData.due_date,
          status: formData.status,
          notes: formData.notes.trim() || null,
        });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Erro ao registrar lançamento.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!company?.id) return;
    if (!window.confirm('Deseja excluir este lançamento financeiro?')) return;
    try {
      if (activeTab === 'despesas') await storage.deleteExpense(company.id, id);
      if (activeTab === 'receber') await storage.deleteReceivable(company.id, id);
      if (activeTab === 'pagar') await storage.deletePayable(company.id, id);
      await loadData();
    } catch (e) {
      console.error(e);
      alert('Não foi possível excluir o item.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-brand-600" />
            Controle Financeiro
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gestão de despesas, contas a pagar, recebíveis e conciliação de fluxo de caixa.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-brand-500/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>
            {activeTab === 'despesas' ? 'Nova Despesa' : activeTab === 'receber' ? 'Novo Recebível' : 'Nova Conta a Pagar'}
          </span>
        </button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Despesas Totais */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Despesas Registradas</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-slate-900">{formatCurrency(totalDespesas)}</p>
          <p className="text-[11px] text-slate-400 mt-1">{expenses.length} lançamentos efetuados</p>
        </div>

        {/* Contas a Receber */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Contas a Receber</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-sky-700">{formatCurrency(totalReceivables)}</p>
          <p className="text-[11px] text-slate-400 mt-1">{receivables.filter(r => r.status === 'pendente').length} pendente(s)</p>
        </div>

        {/* Contas a Pagar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Contas a Pagar</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-amber-700">{formatCurrency(totalPayables)}</p>
          <p className="text-[11px] text-slate-400 mt-1">{payables.filter(p => p.status === 'pendente').length} pendente(s)</p>
        </div>

        {/* Saldo Projetado */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Saldo Projetado</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${saldoProjetado >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-xl font-extrabold ${saldoProjetado >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatCurrency(saldoProjetado)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Receber menos Pagar</p>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('despesas')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'despesas'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Despesas ({expenses.length})
        </button>
        <button
          onClick={() => setActiveTab('receber')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'receber'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Contas a Receber ({receivables.length})
        </button>
        <button
          onClick={() => setActiveTab('pagar')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'pagar'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Contas a Pagar ({payables.length})
        </button>
      </div>

      {/* Tables Content */}
      {loading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Carregando movimentações...</p>
        </div>
      ) : activeTab === 'despesas' && expenses.length === 0 ? (
        <EmptyState
          icon={ArrowDownRight}
          title="Nenhuma despesa lançada"
          description="Registre os custos fixos e variáveis da sua empresa para acompanhar as saídas financeiras."
          actionText="Nova Despesa"
          onAction={handleOpenCreate}
        />
      ) : activeTab === 'receber' && receivables.length === 0 ? (
        <EmptyState
          icon={ArrowUpRight}
          title="Nenhuma conta a receber pendente"
          description="Vendas a prazo ou boletos geram recebíveis automaticamente aqui."
          actionText="Novo Recebível"
          onAction={handleOpenCreate}
        />
      ) : activeTab === 'pagar' && payables.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="Nenhuma conta a pagar cadastrada"
          description="Cadastre boletos de fornecedores, impostos e aluguel para não perder prazos."
          actionText="Nova Conta a Pagar"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4 sm:px-6">Descrição</th>
                  <th className="py-3.5 px-4">Categoria / Detalhe</th>
                  <th className="py-3.5 px-4">Vencimento</th>
                  <th className="py-3.5 px-4">Valor</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {activeTab === 'despesas' && expenses.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-4 px-4 sm:px-6 font-bold text-slate-900">{item.description}</td>
                    <td className="py-4 px-4 text-slate-600">{item.category}</td>
                    <td className="py-4 px-4 text-slate-600">{formatDate(item.due_date)}</td>
                    <td className="py-4 px-4 font-bold text-rose-600">-{formatCurrency(item.amount)}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${item.status === 'pago' ? 'bg-emerald-50 text-emerald-700' : item.status === 'vencido' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button onClick={() => handleDelete(item.id)} className="p-1 text-slate-400 hover:text-rose-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}

                {activeTab === 'receber' && receivables.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-4 px-4 sm:px-6">
                      <p className="font-bold text-slate-900">{item.description}</p>
                      {item.customer && <p className="text-xs text-slate-400">Cliente: {item.customer.name}</p>}
                    </td>
                    <td className="py-4 px-4 text-slate-600">{item.notes || 'Venda a Prazo'}</td>
                    <td className="py-4 px-4 text-slate-600">{formatDate(item.due_date)}</td>
                    <td className="py-4 px-4 font-bold text-emerald-600">+{formatCurrency(item.amount)}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${item.status === 'pago' ? 'bg-emerald-50 text-emerald-700' : item.status === 'vencido' ? 'bg-rose-50 text-rose-700' : 'bg-sky-50 text-sky-700'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button onClick={() => handleDelete(item.id)} className="p-1 text-slate-400 hover:text-rose-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}

                {activeTab === 'pagar' && payables.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-4 px-4 sm:px-6">
                      <p className="font-bold text-slate-900">{item.description}</p>
                      {item.supplier && <p className="text-xs text-slate-400">Favorecido: {item.supplier}</p>}
                    </td>
                    <td className="py-4 px-4 text-slate-600">{item.category}</td>
                    <td className="py-4 px-4 text-slate-600">{formatDate(item.due_date)}</td>
                    <td className="py-4 px-4 font-bold text-amber-700">-{formatCurrency(item.amount)}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${item.status === 'pago' ? 'bg-emerald-50 text-emerald-700' : item.status === 'vencido' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button onClick={() => handleDelete(item.id)} className="p-1 text-slate-400 hover:text-rose-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={activeTab === 'despesas' ? 'Nova Despesa' : activeTab === 'receber' ? 'Novo Recebível' : 'Nova Conta a Pagar'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveItem} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Descrição *
            </label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Aluguel, Fornecedor X, Taxa de software..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Valor (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Data de Vencimento *
              </label>
              <input
                type="date"
                required
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
              />
            </div>

            {activeTab !== 'receber' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Categoria
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Operacional, Marketing, Impostos..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as FinancialStatus })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
              >
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="vencido">Vencido</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Salvar Lançamento</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
