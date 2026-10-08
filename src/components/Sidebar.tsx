import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Bot, 
  Users, 
  Kanban, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  CheckSquare, 
  BarChart3, 
  Sparkles, 
  Bell, 
  Settings, 
  HelpCircle, 
  LogOut,
  X,
  Building2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  unreadNotificationsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen, unreadNotificationsCount = 0 }) => {
  const { signOut, company, profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Funcionário IA', path: '/ia', icon: Bot, badge: 'NEXA', highlight: true },
    { name: 'Clientes', path: '/clientes', icon: Users },
    { name: 'CRM', path: '/crm', icon: Kanban },
    { name: 'Produtos', path: '/produtos', icon: Package },
    { name: 'Vendas', path: '/vendas', icon: ShoppingCart },
    { name: 'Financeiro', path: '/financeiro', icon: DollarSign },
    { name: 'Tarefas', path: '/tarefas', icon: CheckSquare },
    { name: 'Relatórios', path: '/relatorios', icon: BarChart3 },
    { name: 'Insights', path: '/insights', icon: Sparkles },
    { name: 'Notificações', path: '/notificacoes', icon: Bell, count: unreadNotificationsCount },
  ];

  const secondaryItems = [
    { name: 'Configurações', path: '/configuracoes', icon: Settings },
    { name: 'Ajuda & Guia', path: '/ajuda', icon: HelpCircle },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo and Brand */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950/40">
          <NavLink to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
                NEXA
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  IA
                </span>
              </span>
              <p className="text-[11px] text-slate-400 font-medium">Funcionário Virtual</p>
            </div>
          </NavLink>

          <button 
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Company Quick Badge */}
        {company && (
          <div className="mx-4 mt-3 p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-slate-700 flex items-center justify-center text-slate-300">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-200 truncate">{company.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{company.segment || 'Pequena Empresa'}</p>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Menu Principal
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30 font-semibold'
                      : item.highlight
                      ? 'text-brand-300 hover:bg-slate-800/80 hover:text-white'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-400/20 text-brand-300 border border-brand-400/30">
                    {item.badge}
                  </span>
                )}
                {item.count !== undefined && item.count > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500 text-white">
                    {item.count}
                  </span>
                )}
              </NavLink>
            );
          })}

          <div className="pt-4 mt-4 border-t border-slate-800/80">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Suporte & Ajustes
            </p>
            {secondaryItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-800 text-white font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Footer / User Profile & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs ring-1 ring-slate-600">
                {(profile?.full_name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {profile?.full_name || 'Gestor'}
                </p>
                <p className="text-[11px] text-slate-400 capitalize">{profile?.role || 'Proprietário'}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sair do sistema"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
