import React, { useState } from 'react';
import { 
  Settings, 
  Building2, 
  Bot, 
  Shield, 
  User, 
  Save, 
  Loader2, 
  CheckCircle2, 
  Info
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isSupabaseConfigured, testSupabaseConnection, ConnectionStatus } from '@/lib/supabase';

export const SettingsPage: React.FC = () => {
  const { company, profile, updateCompany } = useAuth();

  const [activeTab, setActiveTab] = useState<'empresa' | 'ia' | 'conta' | 'seguranca'>('empresa');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Connection Test State
  const [connStatus, setConnStatus] = useState<ConnectionStatus>(isSupabaseConfigured ? 'connected' : 'local');
  const [connMessage, setConnMessage] = useState<string>('');
  const [testingConn, setTestingConn] = useState(false);

  const runConnectionCheck = async () => {
    setTestingConn(true);
    const result = await testSupabaseConnection();
    setConnStatus(result.status);
    setConnMessage(result.message);
    setTestingConn(false);
  };

  React.useEffect(() => {
    if (activeTab === 'seguranca') {
      runConnectionCheck();
    }
  }, [activeTab]);

  // Form States
  const [companyName, setCompanyName] = useState(company?.name || '');
  const [segment, setSegment] = useState(company?.segment || 'Comércio / Varejo');
  const [phone, setPhone] = useState(company?.phone || '');
  const [email, setEmail] = useState(company?.email || '');
  const [city, setCity] = useState(company?.city || '');
  const [aiName, setAiName] = useState(company?.ai_employee_name || 'NEXA');

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;
    setSaving(true);
    setSuccessMsg(null);

    try {
      await updateCompany({
        name: companyName.trim(),
        segment,
        phone: phone.trim(),
        email: email.trim(),
        city: city.trim(),
        ai_employee_name: aiName.trim() || 'NEXA',
      });
      setSuccessMsg('Configurações atualizadas com sucesso!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e) {
      console.error(e);
      alert('Não foi possível salvar as configurações.');
    } finally {
      setSaving(false);
    }
  };

  const aiNamePresets = ['NEXA', 'LIA', 'ANA', 'MAX', 'ATLAS', 'ORION'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-brand-600" />
          Configurações do Sistema
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Gerencie dados da empresa, parametrização do assistente de IA e preferências de conta.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs Layout */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Navigation */}
        <div className="w-full md:w-56 shrink-0 space-y-1">
          <button
            onClick={() => setActiveTab('empresa')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors ${
              activeTab === 'empresa'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Dados da Empresa</span>
          </button>

          <button
            onClick={() => setActiveTab('ia')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors ${
              activeTab === 'ia'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Funcionário de IA</span>
          </button>

          <button
            onClick={() => setActiveTab('conta')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors ${
              activeTab === 'conta'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Minha Conta</span>
          </button>

          <button
            onClick={() => setActiveTab('seguranca')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors ${
              activeTab === 'seguranca'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Segurança & Supabase</span>
          </button>
        </div>

        {/* Settings Form Panel */}
        <div className="flex-1 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs">
          {activeTab === 'empresa' && (
            <form onSubmit={handleSaveCompany} className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Informações da Empresa
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Nome da Empresa *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Segmento
                  </label>
                  <input
                    type="text"
                    value={segment}
                    onChange={(e) => setSegment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Telefone de Contato
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    E-mail Corporativo
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-brand-500/20 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Salvar Dados</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'ia' && (
            <form onSubmit={handleSaveCompany} className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Identidade do Funcionário de IA
              </h3>
              <p className="text-xs text-slate-500">
                Personalize o nome com o qual seu funcionário de IA se apresentará no painel e nas conversas.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nome do Agente
                </label>
                <input
                  type="text"
                  required
                  value={aiName}
                  onChange={(e) => setAiName(e.target.value)}
                  placeholder="NEXA"
                  className="w-full max-w-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">
                  Sugestões populares:
                </label>
                <div className="flex flex-wrap gap-2">
                  {aiNamePresets.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setAiName(name)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                        aiName === name
                          ? 'bg-brand-600 text-white border-brand-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5 mt-4">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Info className="w-4 h-4 text-brand-600" />
                  <span>Diretrizes de Segurança do Agente</span>
                </div>
                <p>• O agente responde estritamente com base nos dados reais salvos no seu sistema.</p>
                <p>• Ações destrutivas ou de cadastro sempre exigirão confirmação por botão na tela de chat.</p>
                <p>• Credenciais e chaves secretas são mantidas estritamente no ambiente do servidor.</p>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-brand-500/20 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Salvar Nome do Agente</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'conta' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Minha Conta de Usuário
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Nome Completo
                  </label>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{profile?.full_name || 'Gestor'}</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Perfil de Acesso
                  </label>
                  <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-md bg-brand-50 text-brand-700 text-xs font-bold border border-brand-200 uppercase">
                    {profile?.role || 'Proprietário'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Identificador da Empresa (Tenant ID)
                  </label>
                  <p className="text-xs font-mono text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 mt-1 select-all">
                    {company?.id}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'seguranca' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                Segurança & Isolamento de Dados (RLS)
              </h3>

              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 space-y-1.5">
                <p className="font-bold">✓ Isolamento por Tenant Ativo</p>
                <p>
                  Todas as tabelas de clientes, produtos, vendas, despesas e conversas utilizam o identificador da empresa (company_id) com Row Level Security (RLS) no PostgreSQL do Supabase.
                </p>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <p className="font-bold text-slate-800">Status da Conexão com Banco de Dados:</p>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Conexão Atual:</span>
                    <span className={`inline-flex items-center gap-1.5 font-bold px-3 py-1 rounded-full text-xs ${
                      connStatus === 'connected'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : connStatus === 'local'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      <span>
                        {connStatus === 'connected' ? '🟢' : connStatus === 'local' ? '🟡' : '🔴'}
                      </span>
                      {connStatus === 'connected' ? 'Banco conectado' : connStatus === 'local' ? 'Modo local' : 'Erro de conexão'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">{connMessage}</p>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={runConnectionCheck}
                      disabled={testingConn}
                      className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {testingConn && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Testar Conexão Novamente</span>
                    </button>

                    <span className="text-[11px] text-slate-400">
                      Provedor: {isSupabaseConfigured ? 'Supabase PostgreSQL' : 'Armazenamento Local'}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  Para conectar à sua nuvem de produção, preencha as chaves <code className="text-slate-700 font-semibold">VITE_SUPABASE_URL</code> e <code className="text-slate-700 font-semibold">VITE_SUPABASE_ANON_KEY</code> no arquivo <code className="text-slate-700 font-semibold">.env</code>.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
