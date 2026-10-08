import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  Check, 
  AlertTriangle, 
  AlertOctagon, 
  Info, 
  CheckCircle2, 
  Loader2, 
  ExternalLink 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/services/storage';
import { Notification } from '@/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDateTime } from '@/utils/formatters';
import { useNavigate } from 'react-router-dom';

export const NotificationsPage: React.FC = () => {
  const { company } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    if (!company?.id) return;
    try {
      setLoading(true);
      const data = await storage.getNotifications(company.id);
      setNotifications(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [company?.id]);

  const handleMarkAsRead = async (id: string) => {
    if (!company?.id) return;
    await storage.markNotificationRead(company.id, id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAllRead = async () => {
    if (!company?.id) return;
    for (const n of notifications) {
      if (!n.read) await storage.markNotificationRead(company.id, n.id);
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-brand-600" />
            Central de Notificações
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Alertas automáticos de contas, estoque crítico, tarefas e atividades corporativas.
          </p>
        </div>

        {notifications.some(n => !n.read) && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors border border-slate-200"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Marcar todas como lidas</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Buscando notificações do sistema...</p>
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Nenhuma notificação no momento"
          description="Quando houver contas vencendo, estoques baixos ou clientes necessitando de contato, você será avisado aqui."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const isAlert = n.type === 'alerta';
            const isWarning = n.type === 'aviso';
            const isSuccess = n.type === 'sucesso';

            return (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 shadow-xs ${
                  n.read
                    ? 'bg-white border-slate-200/60 opacity-80'
                    : 'bg-white border-brand-200 ring-1 ring-brand-100 shadow-2xs'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center mt-0.5 ${
                      isAlert
                        ? 'bg-rose-50 text-rose-600'
                        : isWarning
                        ? 'bg-amber-50 text-amber-600'
                        : isSuccess
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-indigo-50 text-indigo-600'
                    }`}
                  >
                    {isAlert ? (
                      <AlertOctagon className="w-5 h-5" />
                    ) : isWarning ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : isSuccess ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Info className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">{n.title}</h4>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-brand-600" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                    <p className="text-[11px] text-slate-400 mt-2">{formatDateTime(n.created_at)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {n.link && (
                    <button
                      onClick={() => {
                        handleMarkAsRead(n.id);
                        navigate(n.link!);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50"
                      title="Abrir página vinculada"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                  {!n.read && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                      title="Marcar como lida"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
