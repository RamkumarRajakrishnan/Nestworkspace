import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OperationsProvider } from './context/OperationsContext';
import { MainLayout } from './components/layout/MainLayout';

// Existing Page components
import { LoginPage } from './pages/Auth/LoginPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { LiveDispatchPage } from './pages/Operations/LiveOperations/LiveDispatchPage';
import { OrdersPage } from './pages/Operations/Bookings/OrdersPage';
import { OrderDetailPage } from './pages/Operations/Bookings/OrderDetailPage';
import { WorkersPage } from './pages/Workforce/Experts/WorkersPage';
import { WorkerDetailPage } from './pages/Workforce/Experts/WorkerDetailPage';
import { EmployeesPage } from './pages/Administration/Employees/EmployeesPage';
import { AssignmentsPage } from './pages/Operations/Assignments/AssignmentsPage';
import { SchedulePage } from './pages/Workforce/Attendance/SchedulePage';
import { MarketsPage } from './pages/Market/Area/MarketsPage';
import { MarketDetailPage } from './pages/Market/Area/MarketDetailPage';
import { CompliancePage } from './pages/Workforce/Compliance/CompliancePage';
import { PayoutsPage } from './pages/Finance/PayoutsPage';
import { ReportsPage } from './pages/Reports/ReportsPage';
import { SettingsPage } from './pages/Administration/Settings/SettingsPage';
import { NestPassPage } from './pages/PassManagement/NestPassPage';
import { ModulePlaceholderPage } from './pages/ModulePlaceholderPage';

interface AuthorizedRouteProps {
  menuTitle: string;
  moduleName?: string;
  children: React.ReactElement;
}

const AuthorizedRoute: React.FC<AuthorizedRouteProps> = ({ menuTitle, moduleName, children }) => {
  const { isAuthorized } = useAuth();
  if (!isAuthorized(menuTitle, moduleName)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

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

              {/* 1. Dashboard (Always accessible for authenticated users) */}
              <Route path="dashboard" element={<DashboardPage />} />

              {/* 2. Operations */}
              {/* Bookings (Existing Orders Page) */}
              <Route
                path="bookings"
                element={
                  <AuthorizedRoute menuTitle="Operations" moduleName="Bookings">
                    <OrdersPage />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="bookings/:id"
                element={
                  <AuthorizedRoute menuTitle="Operations" moduleName="Bookings">
                    <OrderDetailPage />
                  </AuthorizedRoute>
                }
              />
              {/* Existing Orders alias */}
              <Route
                path="orders"
                element={
                  <AuthorizedRoute menuTitle="Operations" moduleName="Bookings">
                    <OrdersPage />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="orders/:id"
                element={
                  <AuthorizedRoute menuTitle="Operations" moduleName="Bookings">
                    <OrderDetailPage />
                  </AuthorizedRoute>
                }
              />

              {/* Live Operations (Existing Live Dispatch) */}
              <Route
                path="live-operations"
                element={
                  <AuthorizedRoute menuTitle="Operations" moduleName="Live Operations">
                    <LiveDispatchPage />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="dispatch"
                element={
                  <AuthorizedRoute menuTitle="Operations" moduleName="Live Operations">
                    <LiveDispatchPage />
                  </AuthorizedRoute>
                }
              />

              {/* 3. Workforce */}
              {/* Experts (Existing Workers / Manage Experts Page) */}
              <Route
                path="experts"
                element={
                  <AuthorizedRoute menuTitle="Workforce" moduleName="Experts">
                    <WorkersPage />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="experts/:id"
                element={
                  <AuthorizedRoute menuTitle="Workforce" moduleName="Experts">
                    <WorkerDetailPage />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="workers"
                element={
                  <AuthorizedRoute menuTitle="Workforce" moduleName="Experts">
                    <WorkersPage />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="workers/:id"
                element={
                  <AuthorizedRoute menuTitle="Workforce" moduleName="Experts">
                    <WorkerDetailPage />
                  </AuthorizedRoute>
                }
              />

              {/* Attendance (Existing Schedule Page) */}
              <Route
                path="attendance"
                element={
                  <AuthorizedRoute menuTitle="Workforce" moduleName="Attendance">
                    <SchedulePage />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="workforce/attendance"
                element={
                  <AuthorizedRoute menuTitle="Workforce" moduleName="Attendance">
                    <SchedulePage />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="schedule"
                element={
                  <AuthorizedRoute menuTitle="Workforce" moduleName="Attendance">
                    <SchedulePage />
                  </AuthorizedRoute>
                }
              />

              {/* Leave */}
              <Route
                path="workforce/leave"
                element={
                  <AuthorizedRoute menuTitle="Workforce" moduleName="Leave">
                    <ModulePlaceholderPage
                      title="Leave Management"
                      subtitle="Manage expert time-off requests, leave approvals, and shift coverages"
                      category="Workforce"
                    />
                  </AuthorizedRoute>
                }
              />

              {/* 4. Market */}
              {/* Area (Existing Markets Page) */}
              <Route
                path="area"
                element={
                  <AuthorizedRoute menuTitle="Market" moduleName="Area">
                    <MarketsPage />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="area/:id"
                element={
                  <AuthorizedRoute menuTitle="Market" moduleName="Area">
                    <MarketDetailPage />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="market/area"
                element={
                  <AuthorizedRoute menuTitle="Market" moduleName="Area">
                    <MarketsPage />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="market/area/:id"
                element={
                  <AuthorizedRoute menuTitle="Market" moduleName="Area">
                    <MarketDetailPage />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="markets"
                element={
                  <AuthorizedRoute menuTitle="Market" moduleName="Area">
                    <MarketsPage />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="markets/:id"
                element={
                  <AuthorizedRoute menuTitle="Market" moduleName="Area">
                    <MarketDetailPage />
                  </AuthorizedRoute>
                }
              />

              {/* Durations & Pricing */}
              <Route
                path="market/durations-pricing"
                element={
                  <AuthorizedRoute menuTitle="Market" moduleName="Durations & Pricing">
                    <ModulePlaceholderPage
                      title="Durations & Pricing"
                      subtitle="Configure service booking duration presets, customer rate tiers, and surge pricing rules"
                      category="Market"
                    />
                  </AuthorizedRoute>
                }
              />

              {/* 5. Services (Direct item) */}
              <Route
                path="services"
                element={
                  <AuthorizedRoute menuTitle="Services" moduleName="Services">
                    <ModulePlaceholderPage
                      title="Services Catalog"
                      subtitle="Configure platform service offerings, service checklists, and operational categories"
                      category="Services"
                    />
                  </AuthorizedRoute>
                }
              />

              {/* 6. Pass Management */}
              {/* All Passes (Existing Nest Pass Page) */}
              <Route
                path="all-passes"
                element={
                  <AuthorizedRoute menuTitle="Pass Management" moduleName="All Passes">
                    <NestPassPage />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="pass-management/all-passes"
                element={
                  <AuthorizedRoute menuTitle="Pass Management" moduleName="All Passes">
                    <NestPassPage />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="nest-pass"
                element={
                  <AuthorizedRoute menuTitle="Pass Management" moduleName="All Passes">
                    <NestPassPage />
                  </AuthorizedRoute>
                }
              />

              {/* Usage History */}
              <Route
                path="pass-management/usage-history"
                element={
                  <AuthorizedRoute menuTitle="Pass Management" moduleName="Usage History">
                    <ModulePlaceholderPage
                      title="Pass Usage History"
                      subtitle="Audit customer pass redemptions, active package balances, and session consumption"
                      category="Pass Management"
                    />
                  </AuthorizedRoute>
                }
              />

              {/* 7. Customers */}
              <Route
                path="customers"
                element={
                  <AuthorizedRoute menuTitle="Customers" moduleName="Customers">
                    <ModulePlaceholderPage
                      title="Customers"
                      subtitle="Customer account profiles, order histories, satisfaction scores, and support interactions"
                      category="Customers"
                    />
                  </AuthorizedRoute>
                }
              />

              {/* 8. Finance */}
              <Route
                path="finance/revenue"
                element={
                  <AuthorizedRoute menuTitle="Finance" moduleName="Revenue">
                    <ModulePlaceholderPage
                      title="Revenue"
                      subtitle="Gross merchandise value (GMV), platform margin tracking, and financial growth metrics"
                      category="Finance"
                    />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="finance/payments"
                element={
                  <AuthorizedRoute menuTitle="Finance" moduleName="Payments">
                    <ModulePlaceholderPage
                      title="Payments"
                      subtitle="Gateway transactions, payment settlement reconciliations, and collection logs"
                      category="Finance"
                    />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="finance/refunds"
                element={
                  <AuthorizedRoute menuTitle="Finance" moduleName="Refunds">
                    <ModulePlaceholderPage
                      title="Refunds"
                      subtitle="Customer refund claims, cancellation penalties, and financial reversal records"
                      category="Finance"
                    />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="finance/wallet"
                element={
                  <AuthorizedRoute menuTitle="Finance" moduleName="Wallet">
                    <ModulePlaceholderPage
                      title="Wallet"
                      subtitle="User promotional credits, partner escrow deposits, and platform balance ledgers"
                      category="Finance"
                    />
                  </AuthorizedRoute>
                }
              />
              {/* Payroll (Existing Payouts Page) */}
              <Route
                path="payroll"
                element={
                  <AuthorizedRoute menuTitle="Finance" moduleName="Payroll">
                    <PayoutsPage />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="finance/payroll"
                element={
                  <AuthorizedRoute menuTitle="Finance" moduleName="Payroll">
                    <PayoutsPage />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="payouts"
                element={
                  <AuthorizedRoute menuTitle="Finance" moduleName="Payroll">
                    <PayoutsPage />
                  </AuthorizedRoute>
                }
              />

              {/* 9. Marketing */}
              <Route
                path="marketing/offers"
                element={
                  <AuthorizedRoute menuTitle="Marketing" moduleName="Offers">
                    <ModulePlaceholderPage
                      title="Offers"
                      subtitle="Manage localized promotional banners, seasonal demand boosters, and consumer offers"
                      category="Marketing"
                    />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="marketing/coupons"
                element={
                  <AuthorizedRoute menuTitle="Marketing" moduleName="Coupons">
                    <ModulePlaceholderPage
                      title="Coupons"
                      subtitle="Create promo codes, referral discounts, usage limits, and redemption criteria"
                      category="Marketing"
                    />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="marketing/campaigns"
                element={
                  <AuthorizedRoute menuTitle="Marketing" moduleName="Campaigns">
                    <ModulePlaceholderPage
                      title="Campaigns"
                      subtitle="Acquisition campaigns, cross-market activations, and conversion performance"
                      category="Marketing"
                    />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="marketing/notifications"
                element={
                  <AuthorizedRoute menuTitle="Marketing" moduleName="Notifications">
                    <ModulePlaceholderPage
                      title="Notifications"
                      subtitle="Broadcast push messages, operational SMS alerts, and marketing announcements"
                      category="Marketing"
                    />
                  </AuthorizedRoute>
                }
              />

              {/* 10. Quality */}
              <Route
                path="quality/reviews"
                element={
                  <AuthorizedRoute menuTitle="Quality" moduleName="Reviews & Ratings">
                    <ModulePlaceholderPage
                      title="Reviews & Ratings"
                      subtitle="Customer post-service feedback, expert rating breakdown, and sentiment telemetry"
                      category="Quality"
                    />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="quality/complaints"
                element={
                  <AuthorizedRoute menuTitle="Quality" moduleName="Complaints">
                    <ModulePlaceholderPage
                      title="Complaints"
                      subtitle="Customer incident reports, dispute tickets, and corrective resolution queues"
                      category="Quality"
                    />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="quality/reports"
                element={
                  <AuthorizedRoute menuTitle="Quality" moduleName="Quality Reports">
                    <ModulePlaceholderPage
                      title="Quality Reports"
                      subtitle="Defect ratios, expert re-training triggers, and service consistency audit logs"
                      category="Quality"
                    />
                  </AuthorizedRoute>
                }
              />

              {/* 11. Reports */}
              <Route
                path="reports/operations"
                element={
                  <AuthorizedRoute menuTitle="Reports" moduleName="Operations">
                    <ModulePlaceholderPage
                      title="Operations Reports"
                      subtitle="Detailed dispatch velocity, assignment latency, and fulfillment completion logs"
                      category="Reports"
                    />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="reports/workforce"
                element={
                  <AuthorizedRoute menuTitle="Reports" moduleName="Workforce">
                    <ModulePlaceholderPage
                      title="Workforce Reports"
                      subtitle="Expert active hours, on-duty attendance, and utilization efficiency summaries"
                      category="Reports"
                    />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="reports/market"
                element={
                  <AuthorizedRoute menuTitle="Reports" moduleName="Market">
                    <ModulePlaceholderPage
                      title="Market Reports"
                      subtitle="Nano-market density, capacity saturation levels, and cross-market demand heatmaps"
                      category="Reports"
                    />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="reports/finance"
                element={
                  <AuthorizedRoute menuTitle="Reports" moduleName="Finance">
                    <ModulePlaceholderPage
                      title="Finance Reports"
                      subtitle="Consolidated earnings ledgers, payout disbursements, and financial audit files"
                      category="Reports"
                    />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="reports/customers"
                element={
                  <AuthorizedRoute menuTitle="Reports" moduleName="Customers">
                    <ModulePlaceholderPage
                      title="Customer Reports"
                      subtitle="Cohort retention analytics, user frequency, and market booking distributions"
                      category="Reports"
                    />
                  </AuthorizedRoute>
                }
              />
              {/* Analytics (Existing Reports Page) */}
              <Route
                path="analytics"
                element={
                  <AuthorizedRoute menuTitle="Reports" moduleName="Analytics">
                    <ReportsPage />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="reports/analytics"
                element={
                  <AuthorizedRoute menuTitle="Reports" moduleName="Analytics">
                    <ReportsPage />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="reports"
                element={
                  <AuthorizedRoute menuTitle="Reports" moduleName="Analytics">
                    <ReportsPage />
                  </AuthorizedRoute>
                }
              />

              {/* 12. Masters */}
              <Route
                path="masters/services"
                element={
                  <AuthorizedRoute menuTitle="Masters" moduleName="Services">
                    <ModulePlaceholderPage
                      title="Master Services"
                      subtitle="Master service type registry, skill tags, and service requirement definitions"
                      category="Masters"
                    />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="masters/areas"
                element={
                  <AuthorizedRoute menuTitle="Masters" moduleName="Areas">
                    <ModulePlaceholderPage
                      title="Master Areas"
                      subtitle="Master geographical polygons, city boundaries, and operational zone master data"
                      category="Masters"
                    />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="masters/durations"
                element={
                  <AuthorizedRoute menuTitle="Masters" moduleName="Durations">
                    <ModulePlaceholderPage
                      title="Master Durations"
                      subtitle="Global standard service duration options and minimum booking windows"
                      category="Masters"
                    />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="masters/pricing"
                element={
                  <AuthorizedRoute menuTitle="Masters" moduleName="Pricing">
                    <ModulePlaceholderPage
                      title="Master Pricing"
                      subtitle="Base tariff matrices, dynamic multiplier rules, and fee structure guidelines"
                      category="Masters"
                    />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="masters/shifts"
                element={
                  <AuthorizedRoute menuTitle="Masters" moduleName="Shifts">
                    <ModulePlaceholderPage
                      title="Master Shifts"
                      subtitle="Operational shift hour definitions, break schedules, and overtime rules"
                      category="Masters"
                    />
                  </AuthorizedRoute>
                }
              />

              {/* 13. Administration */}
              {/* Users (Existing Employees Page) */}
              <Route
                path="users"
                element={
                  <AuthorizedRoute menuTitle="Administration" moduleName="Users">
                    <EmployeesPage />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="administration/users"
                element={
                  <AuthorizedRoute menuTitle="Administration" moduleName="Users">
                    <EmployeesPage />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="employees"
                element={
                  <AuthorizedRoute menuTitle="Administration" moduleName="Users">
                    <EmployeesPage />
                  </AuthorizedRoute>
                }
              />

              <Route
                path="administration/roles"
                element={
                  <AuthorizedRoute menuTitle="Administration" moduleName="Roles">
                    <ModulePlaceholderPage
                      title="Roles"
                      subtitle="Portal administrative roles, team assignments, and operational permissions"
                      category="Administration"
                    />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="administration/permissions"
                element={
                  <AuthorizedRoute menuTitle="Administration" moduleName="Permissions">
                    <ModulePlaceholderPage
                      title="Permissions"
                      subtitle="Granular resource permissions, read/write authorizations, and audit compliance"
                      category="Administration"
                    />
                  </AuthorizedRoute>
                }
              />

              {/* System Settings (Existing Settings Page) */}
              <Route
                path="settings"
                element={
                  <AuthorizedRoute menuTitle="Administration" moduleName="Settings">
                    <SettingsPage />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="administration/settings"
                element={
                  <AuthorizedRoute menuTitle="Administration" moduleName="Settings">
                    <SettingsPage />
                  </AuthorizedRoute>
                }
              />

              {/* Other Existing Pages */}
              <Route
                path="assignments"
                element={
                  <AuthorizedRoute menuTitle="Operations">
                    <AssignmentsPage />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="compliance"
                element={
                  <AuthorizedRoute menuTitle="Workforce">
                    <CompliancePage />
                  </AuthorizedRoute>
                }
              />

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
