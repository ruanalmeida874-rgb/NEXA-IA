import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppLayout } from '@/layouts/AppLayout';

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { OnboardingPage } from '@/pages/auth/OnboardingPage';

// Main Pages
import { DashboardPage } from '@/pages/DashboardPage';
import { AIAssistantPage } from '@/pages/AIAssistantPage';
import { CustomersPage } from '@/pages/CustomersPage';
import { ProductsPage } from '@/pages/ProductsPage';
import { SalesPage } from '@/pages/SalesPage';
import { FinancePage } from '@/pages/FinancePage';
import { TasksPage } from '@/pages/TasksPage';
import { CRMPage } from '@/pages/CRMPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { InsightsPage } from '@/pages/InsightsPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { HelpPage } from '@/pages/HelpPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<RegisterPage />} />
          <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* Protected Application Routes */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/ia" element={<AIAssistantPage />} />
            <Route path="/clientes" element={<CustomersPage />} />
            <Route path="/crm" element={<CRMPage />} />
            <Route path="/produtos" element={<ProductsPage />} />
            <Route path="/vendas" element={<SalesPage />} />
            <Route path="/financeiro" element={<FinancePage />} />
            <Route path="/tarefas" element={<TasksPage />} />
            <Route path="/relatorios" element={<ReportsPage />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/notificacoes" element={<NotificationsPage />} />
            <Route path="/configuracoes" element={<SettingsPage />} />
            <Route path="/ajuda" element={<HelpPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
