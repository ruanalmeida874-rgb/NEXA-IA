import React, { useEffect, useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Calendar, 
  User, 
  Check, 
  Trash2, 
  Loader2 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/services/storage';
import { Task, TaskPriority, TaskStatus } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/utils/formatters';

export const TasksPage: React.FC = () => {
  const { company } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignee: '',
    priority: 'media' as TaskPriority,
    due_date: new Date().toISOString().split('T')[0],
    status: 'pendente' as TaskStatus,
  });

  const loadTasks = async () => {
    if (!company?.id) return;
    try {
      setLoading(true);
      const data = await storage.getTasks(company.id);
      setTasks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [company?.id]);

  const handleOpenCreate = () => {
    setFormData({
      title: '',
      description: '',
      assignee: '',
      priority: 'media',
      due_date: new Date().toISOString().split('T')[0],
      status: 'pendente',
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (task: Task) => {
    if (!company?.id) return;
    const nextStatus: TaskStatus = task.status === 'concluida' ? 'pendente' : 'concluida';
    try {
      await storage.saveTask(company.id, {
        id: task.id,
        status: nextStatus,
      });
      await loadTasks();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateTaskStatus = async (task: Task, newStatus: TaskStatus) => {
    if (!company?.id) return;
    try {
      await storage.saveTask(company.id, {
        id: task.id,
        status: newStatus,
      });
      await loadTasks();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!company?.id) return;
    if (!window.confirm('Deseja excluir esta tarefa?')) return;
    try {
      await storage.deleteTask(company.id, id);
      await loadTasks();
    } catch (e) {
      console.error(e);
      alert('Não foi possível excluir a tarefa.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company?.id) return;
    if (!formData.title.trim()) {
      setErrorMsg('O título da tarefa é obrigatório.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      await storage.saveTask(company.id, {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        assignee: formData.assignee.trim() || null,
        priority: formData.priority,
        due_date: formData.due_date || null,
        status: formData.status,
      });

      setIsModalOpen(false);
      await loadTasks();
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Erro ao salvar tarefa.');
    } finally {
      setSaving(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = 
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.assignee && t.assignee.toLowerCase().includes(search.toLowerCase())) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-brand-600" />
            Tarefas & Compromissos
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Organize afazeres da equipe, prazos e lembretes criados manualmente ou pelo NEXA.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-brand-500/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Tarefa</span>
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, responsável..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas ({tasks.length})
          </button>
          <button
            onClick={() => setStatusFilter('pendente')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'pendente'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Pendentes ({tasks.filter(t => t.status === 'pendente').length})
          </button>
          <button
            onClick={() => setStatusFilter('em_andamento')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'em_andamento'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            Em Andamento ({tasks.filter(t => t.status === 'em_andamento').length})
          </button>
          <button
            onClick={() => setStatusFilter('concluida')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'concluida'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Concluídas ({tasks.filter(t => t.status === 'concluida').length})
          </button>
        </div>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Carregando lista de tarefas...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title={search ? 'Nenhuma tarefa encontrada' : 'Nenhuma tarefa cadastrada'}
          description={
            search 
              ? 'Tente pesquisar com outros termos.' 
              : 'Mantenha os compromissos da empresa organizados criando sua primeira tarefa.'
          }
          actionText={search ? undefined : 'Criar Primeira Tarefa'}
          onAction={search ? undefined : handleOpenCreate}
        />
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((t) => {
            const isCompleted = t.status === 'concluida';
            return (
              <div
                key={t.id}
                className={`bg-white p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 shadow-xs ${
                  isCompleted ? 'border-slate-200/60 opacity-70 bg-slate-50/50' : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <button
                    onClick={() => handleToggleStatus(t)}
                    className={`mt-1 w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                      isCompleted
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 hover:border-brand-500 bg-white'
                    }`}
                  >
                    {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <div>
                    <h4 className={`text-sm font-bold ${isCompleted ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {t.title}
                    </h4>
                    {t.description && (
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {t.due_date && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {formatDate(t.due_date)}
                        </span>
                      )}

                      {t.assignee && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          <User className="w-3 h-3 text-slate-400" />
                          {t.assignee}
                        </span>
                      )}

                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          t.priority === 'alta'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : t.priority === 'media'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        Prioridade {t.priority}
                      </span>

                      <select
                        value={t.status}
                        onChange={(e) => handleUpdateTaskStatus(t, e.target.value as TaskStatus)}
                        className={`text-[10px] font-bold uppercase tracking-wider rounded-md px-2 py-0.5 border cursor-pointer focus:outline-hidden ${
                          t.status === 'concluida'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : t.status === 'em_andamento'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <option value="pendente">Pendente</option>
                        <option value="em_andamento">Em Andamento</option>
                        <option value="concluida">Concluída</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(t.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Criar Nova Tarefa"
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
              Título da Tarefa *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Ligar para fornecedor de notebooks"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Descrição / Detalhes
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Instruções e dados necessários para a execução..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Responsável
              </label>
              <input
                type="text"
                value={formData.assignee}
                onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                placeholder="Ex: Carlos, Ana..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Prazo / Data
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Prioridade
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Status Inicial
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
              >
                <option value="pendente">Pendente</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="concluida">Concluída</option>
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
              <span>Criar Tarefa</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
