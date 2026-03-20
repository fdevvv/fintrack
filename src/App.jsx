import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthPage } from '@/components/auth/AuthPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { TransactionsPage } from '@/pages/TransactionsPage';
import { BudgetsPage } from '@/pages/BudgetsPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { PricesPage } from '@/pages/PricesPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { Spinner } from '@/components/ui/Misc';
import { authService } from '@/services/auth';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

export default function App() {
  const { user, loading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = authService.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          useAuthStore.setState({ user: null, profile: null });
        } else if (event === 'SIGNED_IN' && session?.user) {
          initialize();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '12px',
            fontSize: '14px',
          },
        }}
      />
      <Routes>
        <Route
          path="/auth"
          element={user ? <Navigate to="/" replace /> : <AuthPage />}
        />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/budgets" element={<BudgetsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/prices" element={<PricesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
