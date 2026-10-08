import React, { useState } from 'react';
import { Menu, Sparkles, Database, Trash2, Bell, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { demoService } from '@/services/demoService';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  setMobileOpen: (open: boolean) => void;
  onRefreshData?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ setMobileOpen, onRefreshData }) => {
  const { profile, company } = useAuth();
  const navigate = useNavigate();
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const handleLoadDemo = async () => {
    if (!company?.id) return;
    setLoadingDemo(true);
    setShowDemoMenu(false);
    try {
      await demoService.loadDemoData(company.id);
      setFeedback('Dados de demonstração carregados!');
      setTimeout(() => setFeedback(null), 4000);
      if (onRefreshData) onRefreshData();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDemo(false);
    }
  };

  const handleClearDemo = async () => {
    if (!company?.id) return;
    if (!window.confirm('Tem certeza de que deseja limpar todos os dados e retornar ao estado vazio?')) return;
    setLoadingDemo(true);
    setShowDemoMenu(false);
    try {
      await demoService.clearDemoData(company.id);
      setFeedback('Todos os dados foram limpos com sucesso.');
      setTimeout(() => setFeedback(null), 4000);
      if (onRefreshData) onRefreshData();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Greeting */}
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">
            {getGreeting()}, <span className="text-brand-600">{profile?.full_name || 'Empresário'}</span>
          </h1>
          <p className="text-xs text-slate-500 hidden sm:block">
            Sou o <strong className="text-slate-700">{company?.ai_employee_name || 'NEXA'}</strong>, seu funcionário de IA.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Feedback alert pill */}
        {feedback && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold animate-fade-in">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            {feedback}
          </div>
        )}

        {/* AI Agent Status Badge */}
        <div 
          onClick={() => navigate('/ia')}
          className="cursor-pointer hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 hover:bg-indigo-100/70 transition-colors"
          title="Abrir chat do funcionário IA"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-indigo-900 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-600" />
            {company?.ai_employee_name || 'NEXA'} Online
          </span>
        </div>

        {/* Demo Mode Button / Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDemoMenu(!showDemoMenu)}
            disabled={loadingDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200/80 transition-colors border border-slate-200 shadow-2xs disabled:opacity-50"
          >
            {loadingDemo ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600" />
            ) : (
              <Database className="w-3.5 h-3.5 text-slate-600" />
            )}
            <span className="hidden sm:inline">Modo Demonstração</span>
            <span className="sm:hidden">Demo</span>
          </button>

          {showDemoMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-1">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="font-semibold text-slate-800">Apresentação & Testes</p>
                <p className="text-[11px] text-slate-500">Alterne entre dados de teste e estado vazio.</p>
              </div>

              <button
                onClick={handleLoadDemo}
                className="w-full text-left px-3 py-2 text-slate-700 hover:bg-brand-50 hover:text-brand-700 flex items-center gap-2"
              >
                <Database className="w-3.5 h-3.5 text-brand-600" />
                Carregar dados de demonstração
              </button>

              <button
                onClick={handleClearDemo}
                className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                Limpar dados (Voltar a vazio)
              </button>
            </div>
          )}
        </div>

        {/* Notifications Icon Button */}
        <button
          onClick={() => navigate('/notificacoes')}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors relative"
          title="Notificações"
        >
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
