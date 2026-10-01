import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OperationsProvider } from './context/OperationsContext';
import { MainLayout } from './components/layout/MainLayout';

// Existing Page components
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
import { NestPassPage } from './pages/NestPassPage';
import { ModulePlaceholderPage } from './pages/ModulePlaceholderPage';

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

              {/* 1. Dashboard */}
              <Route path="dashboard" element={<DashboardPage />} />

              {/* 2. Operations */}
              {/* Bookings (Existing Orders Page) */}
              <Route path="bookings" element={<OrdersPage />} />
              <Route path="bookings/:id" element={<OrderDetailPage />} />
              {/* Existing Orders alias */}
              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/:id" element={<OrderDetailPage />} />

              {/* Live Operations (Existing Live Dispatch) */}
              <Route path="live-operations" element={<LiveDispatchPage />} />
              <Route path="dispatch" element={<LiveDispatchPage />} />

              {/* 3. Workforce */}
              {/* Experts (Existing Workers / Manage Experts Page) */}
              <Route path="experts" element={<WorkersPage />} />
              <Route path="experts/:id" element={<WorkerDetailPage />} />
              <Route path="workers" element={<WorkersPage />} />
              <Route path="workers/:id" element={<WorkerDetailPage />} />

              {/* Attendance (Existing Schedule Page) */}
              <Route path="attendance" element={<SchedulePage />} />
              <Route path="workforce/attendance" element={<SchedulePage />} />
              <Route path="schedule" element={<SchedulePage />} />

              {/* Leave */}
              <Route
                path="workforce/leave"
                element={
                  <ModulePlaceholderPage
                    title="Leave Management"
                    subtitle="Manage expert time-off requests, leave approvals, and shift coverages"
                    category="Workforce"
                  />
                }
              />

              {/* 4. Market */}
              {/* Area (Existing Markets Page) */}
              <Route path="area" element={<MarketsPage />} />
              <Route path="area/:id" element={<MarketDetailPage />} />
              <Route path="market/area" element={<MarketsPage />} />
              <Route path="market/area/:id" element={<MarketDetailPage />} />
              <Route path="markets" element={<MarketsPage />} />
              <Route path="markets/:id" element={<MarketDetailPage />} />

              {/* Durations & Pricing */}
              <Route
                path="market/durations-pricing"
                element={
                  <ModulePlaceholderPage
                    title="Durations & Pricing"
                    subtitle="Configure service booking duration presets, customer rate tiers, and surge pricing rules"
                    category="Market"
                  />
                }
              />

              {/* 5. Services (Direct item) */}
              <Route
                path="services"
                element={
                  <ModulePlaceholderPage
                    title="Services Catalog"
                    subtitle="Configure platform service offerings, service checklists, and operational categories"
                    category="Services"
                  />
                }
              />

              {/* 6. Pass Management */}
              {/* All Passes (Existing Nest Pass Page) */}
              <Route path="all-passes" element={<NestPassPage />} />
              <Route path="pass-management/all-passes" element={<NestPassPage />} />
              <Route path="nest-pass" element={<NestPassPage />} />

              {/* Usage History */}
              <Route
                path="pass-management/usage-history"
                element={
                  <ModulePlaceholderPage
                    title="Pass Usage History"
                    subtitle="Audit customer pass redemptions, active package balances, and session consumption"
                    category="Pass Management"
                  />
                }
              />

              {/* 7. Customers */}
              <Route
                path="customers"
                element={
                  <ModulePlaceholderPage
                    title="Customers"
                    subtitle="Customer account profiles, order histories, satisfaction scores, and support interactions"
                    category="Customers"
                  />
                }
              />

              {/* 8. Finance */}
              <Route
                path="finance/revenue"
                element={
                  <ModulePlaceholderPage
                    title="Revenue"
                    subtitle="Gross merchandise value (GMV), platform margin tracking, and financial growth metrics"
                    category="Finance"
                  />
                }
              />
              <Route
                path="finance/payments"
                element={
                  <ModulePlaceholderPage
                    title="Payments"
                    subtitle="Gateway transactions, payment settlement reconciliations, and collection logs"
                    category="Finance"
                  />
                }
              />
              <Route
                path="finance/refunds"
                element={
                  <ModulePlaceholderPage
                    title="Refunds"
                    subtitle="Customer refund claims, cancellation penalties, and financial reversal records"
                    category="Finance"
                  />
                }
              />
              <Route
                path="finance/wallet"
                element={
                  <ModulePlaceholderPage
                    title="Wallet"
                    subtitle="User promotional credits, partner escrow deposits, and platform balance ledgers"
                    category="Finance"
                  />
                }
              />
              {/* Payroll (Existing Payouts Page) */}
              <Route path="payroll" element={<PayoutsPage />} />
              <Route path="finance/payroll" element={<PayoutsPage />} />
              <Route path="payouts" element={<PayoutsPage />} />

              {/* 9. Marketing */}
              <Route
                path="marketing/offers"
                element={
                  <ModulePlaceholderPage
                    title="Offers"
                    subtitle="Manage localized promotional banners, seasonal demand boosters, and consumer offers"
                    category="Marketing"
                  />
                }
              />
              <Route
                path="marketing/coupons"
                element={
                  <ModulePlaceholderPage
                    title="Coupons"
                    subtitle="Create promo codes, referral discounts, usage limits, and redemption criteria"
                    category="Marketing"
                  />
                }
              />
              <Route
                path="marketing/campaigns"
                element={
                  <ModulePlaceholderPage
                    title="Campaigns"
                    subtitle="Acquisition campaigns, cross-market activations, and conversion performance"
                    category="Marketing"
                  />
                }
              />
              <Route
                path="marketing/notifications"
                element={
                  <ModulePlaceholderPage
                    title="Notifications"
                    subtitle="Broadcast push messages, operational SMS alerts, and marketing announcements"
                    category="Marketing"
                  />
                }
              />

              {/* 10. Quality */}
              <Route
                path="quality/reviews"
                element={
                  <ModulePlaceholderPage
                    title="Reviews & Ratings"
                    subtitle="Customer post-service feedback, expert rating breakdown, and sentiment telemetry"
                    category="Quality"
                  />
                }
              />
              <Route
                path="quality/complaints"
                element={
                  <ModulePlaceholderPage
                    title="Complaints"
                    subtitle="Customer incident reports, dispute tickets, and corrective resolution queues"
                    category="Quality"
                  />
                }
              />
              <Route
                path="quality/reports"
                element={
                  <ModulePlaceholderPage
                    title="Quality Reports"
                    subtitle="Defect ratios, expert re-training triggers, and service consistency audit logs"
                    category="Quality"
                  />
                }
              />

              {/* 11. Reports */}
              <Route
                path="reports/operations"
                element={
                  <ModulePlaceholderPage
                    title="Operations Reports"
                    subtitle="Detailed dispatch velocity, assignment latency, and fulfillment completion logs"
                    category="Reports"
                  />
                }
              />
              <Route
                path="reports/workforce"
                element={
                  <ModulePlaceholderPage
                    title="Workforce Reports"
                    subtitle="Expert active hours, on-duty attendance, and utilization efficiency summaries"
                    category="Reports"
                  />
                }
              />
              <Route
                path="reports/market"
                element={
                  <ModulePlaceholderPage
                    title="Market Reports"
                    subtitle="Nano-market density, capacity saturation levels, and cross-market demand heatmaps"
                    category="Reports"
                  />
                }
              />
              <Route
                path="reports/finance"
                element={
                  <ModulePlaceholderPage
                    title="Finance Reports"
                    subtitle="Consolidated earnings ledgers, payout disbursements, and financial audit files"
                    category="Reports"
                  />
                }
              />
              <Route
                path="reports/customers"
                element={
                  <ModulePlaceholderPage
                    title="Customer Reports"
                    subtitle="Cohort retention analytics, user frequency, and market booking distributions"
                    category="Reports"
                  />
                }
              />
              {/* Analytics (Existing Reports Page) */}
              <Route path="analytics" element={<ReportsPage />} />
              <Route path="reports/analytics" element={<ReportsPage />} />
              <Route path="reports" element={<ReportsPage />} />

              {/* 12. Masters */}
              <Route
                path="masters/services"
                element={
                  <ModulePlaceholderPage
                    title="Master Services"
                    subtitle="Master service type registry, skill tags, and service requirement definitions"
                    category="Masters"
                  />
                }
              />
              <Route
                path="masters/areas"
                element={
                  <ModulePlaceholderPage
                    title="Master Areas"
                    subtitle="Master geographical polygons, city boundaries, and operational zone master data"
                    category="Masters"
                  />
                }
              />
              <Route
                path="masters/durations"
                element={
                  <ModulePlaceholderPage
                    title="Master Durations"
                    subtitle="Global standard service duration options and minimum booking windows"
                    category="Masters"
                  />
                }
              />
              <Route
                path="masters/pricing"
                element={
                  <ModulePlaceholderPage
                    title="Master Pricing"
                    subtitle="Base tariff matrices, dynamic multiplier rules, and fee structure guidelines"
                    category="Masters"
                  />
                }
              />
              <Route
                path="masters/shifts"
                element={
                  <ModulePlaceholderPage
                    title="Master Shifts"
                    subtitle="Operational shift hour definitions, break schedules, and overtime rules"
                    category="Masters"
                  />
                }
              />

              {/* 13. Administration */}
              {/* Users (Existing Employees Page) */}
              <Route path="users" element={<EmployeesPage />} />
              <Route path="administration/users" element={<EmployeesPage />} />
              <Route path="employees" element={<EmployeesPage />} />

              <Route
                path="administration/roles"
                element={
                  <ModulePlaceholderPage
                    title="Roles"
                    subtitle="Portal administrative roles, team assignments, and operational permissions"
                    category="Administration"
                  />
                }
              />
              <Route
                path="administration/permissions"
                element={
                  <ModulePlaceholderPage
                    title="Permissions"
                    subtitle="Granular resource permissions, read/write authorizations, and audit compliance"
                    category="Administration"
                  />
                }
              />
              {/* System Settings (Existing Settings Page) */}
              <Route path="settings" element={<SettingsPage />} />
              <Route path="administration/settings" element={<SettingsPage />} />

              {/* Other Existing Pages */}
              <Route path="assignments" element={<AssignmentsPage />} />
              <Route path="compliance" element={<CompliancePage />} />

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
