import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Sparkles, ArrowRight, Loader2, Target, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const OnboardingPage: React.FC = () => {
  const { updateCompany, profile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [companyName, setCompanyName] = useState('');
  const [segment, setSegment] = useState('Comércio / Varejo');
  const [ownerName, setOwnerName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [employeeCount, setEmployeeCount] = useState('1 a 5');
  const [mainGoal, setMainGoal] = useState('Aumentar vendas');
  const [aiName, setAiName] = useState('NEXA');

  const goals = [
    { id: 'Aumentar vendas', label: 'Aumentar vendas', desc: 'Foco em conversão e recuperação de clientes' },
    { id: 'Organizar empresa', label: 'Organizar empresa', desc: 'Centralizar tarefas, processos e clientes' },
    { id: 'Controlar financeiro', label: 'Controlar financeiro', desc: 'Fluxo de caixa, despesas e recebíveis' },
    { id: 'Melhorar atendimento', label: 'Melhorar atendimento', desc: 'Agilidade no contato e relacionamento' },
    { id: 'Controlar clientes', label: 'Controlar clientes', desc: 'Evitar perda de clientes inativos' },
  ];

  const segments = [
    'Comércio / Varejo',
    'Prestação de Serviços',
    'Consultoria / Escritório',
    'Indústria / Manufatura',
    'Tecnologia / SaaS',
    'Saúde / Clínica',
    'Alimentação / Restaurante',
    'Outro',
  ];

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      alert('Por favor, informe o nome da sua empresa.');
      return;
    }

    setLoading(true);
    try {
      await updateCompany({
        name: companyName.trim(),
        segment,
        owner_name: ownerName.trim() || 'Gestor',
        phone: phone.trim(),
        email: email.trim(),
        city: city.trim(),
        employee_count: employeeCount,
        main_goal: mainGoal,
        ai_employee_name: aiName.trim() || 'NEXA',
      });

      navigate('/dashboard');
    } catch (e: any) {
      console.error('Erro ao salvar empresa no onboarding:', e);
      const detail = e?.message || '';
      if (detail.includes('JWT') || detail.includes('Sessão') || detail.includes('auth')) {
        alert('Sessão expirada ou não autenticada. Por favor, faça login para continuar.');
        navigate('/login');
      } else {
        alert(detail || 'Não foi possível salvar as informações da empresa. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl relative z-10 text-center mb-8">
        <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Configuração do seu ambiente corporativo
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Vamos preparar o seu NEXA
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Personalize seu funcionário de IA e a estrutura da sua empresa em poucos segundos.
        </p>

        {/* Progress pills */}
        <div className="flex justify-center gap-2 mt-6">
          <div className={`h-1.5 rounded-full transition-all ${step === 1 ? 'w-12 bg-brand-500' : 'w-6 bg-slate-800'}`} />
          <div className={`h-1.5 rounded-full transition-all ${step === 2 ? 'w-12 bg-brand-500' : 'w-6 bg-slate-800'}`} />
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-800">
          <form onSubmit={handleFinish}>
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Building2 className="w-5 h-5 text-brand-400" />
                  Dados da Empresa
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Nome da Empresa *
                    </label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Ex: Alfa Soluções Comerciais"
                      className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Segmento de Atuação
                    </label>
                    <select
                      value={segment}
                      onChange={(e) => setSegment(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                    >
                      {segments.map((s) => (
                        <option key={s} value={s} className="bg-slate-900 text-white">
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Nome do Responsável
                    </label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="Seu nome"
                      className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Telefone / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      E-mail Corporativo
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contato@suaempresa.com.br"
                      className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Cidade e Estado
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="São Paulo - SP"
                      className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Quantidade aproximada de funcionários
                    </label>
                    <select
                      value={employeeCount}
                      onChange={(e) => setEmployeeCount(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="Apenas eu (1)">Apenas eu (1)</option>
                      <option value="2 a 5 funcionários">2 a 5 funcionários</option>
                      <option value="6 a 15 funcionários">6 a 15 funcionários</option>
                      <option value="16 a 50 funcionários">16 a 50 funcionários</option>
                      <option value="Mais de 50 funcionários">Mais de 50 funcionários</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Nome do seu Funcionário de IA
                    </label>
                    <input
                      type="text"
                      value={aiName}
                      onChange={(e) => setAiName(e.target.value)}
                      placeholder="NEXA, LIA, ANA, MAX..."
                      className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (!companyName.trim()) {
                        alert('Informe o nome da sua empresa para avançar.');
                        return;
                      }
                      setStep(2);
                    }}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-all"
                  >
                    <span>Avançar para Objetivos</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in fade-in">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Target className="w-5 h-5 text-brand-400" />
                  Qual o Principal Objetivo da Sua Empresa Hoje?
                </h3>
                <p className="text-xs text-slate-400">
                  O {aiName || 'NEXA'} priorizará alertas e orientações alinhados à sua meta primária.
                </p>

                <div className="space-y-2.5 pt-2">
                  {goals.map((g) => {
                    const isSelected = mainGoal === g.id;
                    return (
                      <div
                        key={g.id}
                        onClick={() => setMainGoal(g.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-brand-600/15 border-brand-500 text-white ring-1 ring-brand-500'
                            : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-bold">{g.label}</p>
                          <p className="text-xs text-slate-400">{g.desc}</p>
                        </div>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-brand-400" />}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-6 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Voltar
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-600/30 transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span>Criar Ambiente da Empresa</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
