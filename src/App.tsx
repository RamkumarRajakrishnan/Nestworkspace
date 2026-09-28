import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OperationsProvider } from './context/OperationsContext';
import { MainLayout } from './components/layout/MainLayout';

// Page components
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { LiveDispatchPage } from './pages/LiveDispatchPage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { WorkersPage } from './pages/WorkersPage';
import { WorkerDetailPage } from './pages/WorkerDetailPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { AssignmentsPage } from './pages/AssignmentsPage';
import { SchedulePage } from './pages/SchedulePage';
import { MarketsPage } from './pages/MarketsPage';
import { MarketDetailPage } from './pages/MarketDetailPage';
import { CompliancePage } from './pages/CompliancePage';
import { PayoutsPage } from './pages/PayoutsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

const ProtectedLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <MainLayout />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <OperationsProvider>
        <BrowserRouter>
          <Routes>
            {/* Dedicated Login Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Routes */}
            <Route path="/" element={<ProtectedLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="dispatch" element={<LiveDispatchPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/:id" element={<OrderDetailPage />} />
              <Route path="workers" element={<WorkersPage />} />
              <Route path="workers/:id" element={<WorkerDetailPage />} />
              {/* Alias routes for /experts */}
              <Route path="experts" element={<WorkersPage />} />
              <Route path="experts/:id" element={<WorkerDetailPage />} />
              {/* Employees Route */}
              <Route path="employees" element={<EmployeesPage />} />
              <Route path="assignments" element={<AssignmentsPage />} />
              <Route path="schedule" element={<SchedulePage />} />
              <Route path="markets" element={<MarketsPage />} />
              <Route path="markets/:id" element={<MarketDetailPage />} />
              <Route path="compliance" element={<CompliancePage />} />
              <Route path="payouts" element={<PayoutsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </OperationsProvider>
    </AuthProvider>
  );
};

export default App;
