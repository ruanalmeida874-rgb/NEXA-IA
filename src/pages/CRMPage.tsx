import React, { useEffect, useState } from 'react';
import { 
  Kanban, 
  Plus, 
  ArrowRight, 
  ArrowLeft, 
  Trash2, 
  Loader2, 
  Building,
  UserCheck
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/services/storage';
import { Lead, LeadStage } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/utils/formatters';

export const CRMPage: React.FC = () => {
  const { company } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    stage: 'novo' as LeadStage,
    estimated_value: 0,
    source: '',
    notes: '',
  });

  const stages: { id: LeadStage; label: string; color: string }[] = [
    { id: 'novo', label: 'Novo Lead', color: 'border-blue-400 bg-blue-50/50' },
    { id: 'contato', label: 'Contato Realizado', color: 'border-indigo-400 bg-indigo-50/50' },
    { id: 'interessado', label: 'Interessado', color: 'border-violet-400 bg-violet-50/50' },
    { id: 'proposta', label: 'Proposta Enviada', color: 'border-amber-400 bg-amber-50/50' },
    { id: 'negociacao', label: 'Negociação', color: 'border-orange-400 bg-orange-50/50' },
    { id: 'cliente', label: 'Fechado / Ganho', color: 'border-emerald-400 bg-emerald-50/50' },
  ];

  const loadLeads = async () => {
    if (!company?.id) return;
    try {
      setLoading(true);
      const data = await storage.getLeads(company.id);
      setLeads(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [company?.id]);

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      company_name: '',
      contact_name: '',
      email: '',
      phone: '',
      stage: 'novo',
      estimated_value: 0,
      source: '',
      notes: '',
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleMoveStage = async (lead: Lead, direction: 'forward' | 'backward') => {
    if (!company?.id) return;
    const stageOrder: LeadStage[] = ['novo', 'contato', 'interessado', 'proposta', 'negociacao', 'cliente'];
    const currentIndex = stageOrder.indexOf(lead.stage);
    if (currentIndex === -1) return;

    const newIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex < 0 || newIndex >= stageOrder.length) return;

    const nextStage = stageOrder[newIndex];
    try {
      await storage.saveLead(company.id, {
        id: lead.id,
        stage: nextStage,
      });

      // If converted to 'cliente', prompt or optionally register as customer
      if (nextStage === 'cliente') {
        await storage.saveCustomer(company.id, {
          name: lead.name,
          company_name: lead.company_name,
          phone: lead.phone,
          email: lead.email,
          status: 'ativo',
        });
      }

      await loadLeads();
    } catch (e) {
      console.error(e);
    }
  };

  const handleConvertToCustomer = async (lead: Lead) => {
    if (!company?.id) return;
    try {
      await storage.saveCustomer(company.id, {
        name: lead.name,
        company_name: lead.company_name,
        phone: lead.phone,
        email: lead.email,
        status: 'ativo',
      });
      await storage.saveLead(company.id, {
        id: lead.id,
        stage: 'cliente',
      });
      alert(`Lead "${lead.name}" convertido em Cliente com sucesso!`);
      await loadLeads();
    } catch (e: any) {
      alert(e.message || 'Erro ao converter lead.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!company?.id) return;
    if (!window.confirm('Deseja excluir esta oportunidade do CRM?')) return;
    try {
      await storage.deleteLead(company.id, id);
      await loadLeads();
    } catch (e) {
      console.error(e);
      alert('Não foi possível excluir o lead.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company?.id) return;
    if (!formData.name.trim()) {
      setErrorMsg('O nome do lead ou empresa é obrigatório.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      await storage.saveLead(company.id, {
        name: formData.name.trim(),
        company_name: formData.company_name.trim() || null,
        contact_name: formData.contact_name.trim() || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        stage: formData.stage,
        estimated_value: Number(formData.estimated_value) || 0,
        source: formData.source.trim() || null,
        notes: formData.notes.trim() || null,
      });

      setIsModalOpen(false);
      await loadLeads();
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Erro ao cadastrar oportunidade.');
    } finally {
      setSaving(false);
    }
  };

  const totalPipeline = leads.filter(l => l.stage !== 'perdido').reduce((acc, l) => acc + Number(l.estimated_value || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Kanban className="w-6 h-6 text-brand-600" />
            Funil Comercial (CRM)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pipeline de vendas integrado: acompanhe leads desde o primeiro contato até o fechamento.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-[11px] text-slate-400 font-semibold uppercase">Pipeline Estimado</p>
            <p className="text-base font-extrabold text-brand-600">{formatCurrency(totalPipeline)}</p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-brand-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Lead</span>
          </button>
        </div>
      </div>

      {/* Kanban Board Container */}
      {loading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Carregando funil de vendas...</p>
        </div>
      ) : leads.length === 0 ? (
        <EmptyState
          icon={Kanban}
          title="Funil comercial sem oportunidades"
          description="Cadastre oportunidades e leads no seu funil para gerenciar negociações e acompanhar o fluxo de vendas."
          actionText="Cadastrar Primeiro Lead"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar">
          {stages.map((stage, stageIdx) => {
            const stageLeads = leads.filter(l => l.stage === stage.id);
            const stageTotal = stageLeads.reduce((acc, l) => acc + Number(l.estimated_value || 0), 0);

            return (
              <div
                key={stage.id}
                className="w-72 shrink-0 bg-slate-100/70 rounded-2xl p-3 border border-slate-200/80 flex flex-col max-h-[calc(100vh-14rem)]"
              >
                {/* Column Header */}
                <div className="p-2 mb-2 flex items-center justify-between border-b border-slate-200/80">
                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                      {stage.label}
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                      {formatCurrency(stageTotal)}
                    </p>
                  </div>
                  <span className="w-5 h-5 rounded-full bg-white text-slate-700 text-xs font-bold flex items-center justify-center shadow-2xs border border-slate-200">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
                  {stageLeads.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                      Nenhum card
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-xs text-slate-900 leading-snug">{lead.name}</h4>
                            {lead.company_name && (
                              <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <Building className="w-3 h-3 text-slate-400" />
                                {lead.company_name}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDelete(lead.id)}
                            className="text-slate-300 hover:text-rose-500 p-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {lead.estimated_value > 0 && (
                          <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                            {formatCurrency(lead.estimated_value)}
                          </div>
                        )}

                        <div className="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-100">
                          {lead.contact_name && <p>👤 {lead.contact_name}</p>}
                          {lead.phone && <p>📞 {lead.phone}</p>}
                          {lead.source && <p>📍 {lead.source}</p>}
                        </div>

                        {/* Stage Controls */}
                        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                          <button
                            onClick={() => handleMoveStage(lead, 'backward')}
                            disabled={stageIdx === 0}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20"
                            title="Voltar etapa"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>

                          <span className="text-[10px] text-slate-400 font-medium">Mover</span>

                          <button
                            onClick={() => handleMoveStage(lead, 'forward')}
                            disabled={stageIdx === stages.length - 1}
                            className="p-1 rounded text-slate-400 hover:text-brand-600 disabled:opacity-20"
                            title="Avançar etapa"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {lead.stage !== 'cliente' && (
                          <button
                            onClick={() => handleConvertToCustomer(lead)}
                            className="w-full mt-1.5 py-1 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200 transition-colors flex items-center justify-center gap-1"
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>Converter em Cliente</span>
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Lead */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Novo Lead / Oportunidade"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Nome do Lead / Projeto *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Aquisição de Lote Corporativo"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nome da Empresa
              </label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Ex: Construtora Horizonte"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Contato Responsável
              </label>
              <input
                type="text"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                placeholder="Ex: Dr. Marcelo"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Telefone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                E-mail
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contato@empresa.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Valor Estimado (R$)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.estimated_value}
                onChange={(e) => setFormData({ ...formData, estimated_value: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Etapa Inicial
              </label>
              <select
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value as LeadStage })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
              >
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Origem do Lead
            </label>
            <input
              type="text"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              placeholder="Indicação, Google Ads, Feira, Instagram..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
            />
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
              <span>Adicionar ao Funil</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
