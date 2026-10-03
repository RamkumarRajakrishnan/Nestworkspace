import React, { useState } from 'react';
import { useOperations } from '../../context/OperationsContext';
import { KpiCard } from '../../components/common/KpiCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { mockHourlyDemand, mockMarketCapacityChart } from '../../data/mock/mockReports';
import { 
  ShoppingBag, 
  AlertCircle, 
  Users, 
  Briefcase, 
  CheckCircle, 
  Flame, 
  Clock, 
  MapPin, 
  Radio, 
  ChevronRight,
  TrendingUp,
  Activity,
  ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { AssignWorkerModal } from '../../components/operations/AssignWorkerModal';
import { Booking } from '../../types';

export const DashboardPage: React.FC = () => {
  const { workers, bookings, markets, runScenario1CapacityCrunch } = useOperations();
  const navigate = useNavigate();
  const [assignBooking, setAssignBooking] = useState<Booking | null>(null);

  // Compute live KPI metrics from reactive state
  const activeOrdersCount = bookings.filter((b) => b.status === 'In Progress' || b.status === 'En Route').length;
  const unassignedOrdersCount = bookings.filter((b) => b.status === 'Searching' || b.status === 'New').length;
  const workersOnlineCount = workers.filter((w) => w.status !== 'Offline').length;
  const workersBusyCount = workers.filter((w) => w.status === 'Busy' || w.status === 'Assigned' || w.status === 'Traveling').length;
  const workersAvailableCount = workers.filter((w) => w.status === 'Available').length;
  const jobsInProgressCount = bookings.filter((b) => b.status === 'In Progress').length;
  const slaRiskCount = bookings.filter((b) => b.status === 'SLA Risk').length;
  const avgAssignmentTime = '21 sec';

  // Live exceptions data
  const liveExceptions = [
    {
      id: 'exc-1',
      severity: 'critical' as const,
      title: 'SLA Risk: Booking #BK-1005 (VIP)',
      description: 'Order unassigned for 3 minutes. Less than 95 seconds SLA remaining.',
      time: 'Just now',
      actionLabel: 'Assign Expert',
      onAction: () => {
        const b = bookings.find((item) => item.id === 'BK-1005');
        if (b) setAssignBooking(b);
      },
    },
    {
      id: 'exc-2',
      severity: 'high' as const,
      title: 'Capacity Crunch in KOR-03',
      description: '100% capacity reached. 0 local experts available for incoming orders.',
      time: '4m ago',
      actionLabel: 'Open Crunch Console',
      onAction: () => navigate('/area/KOR-03'),
    },
    {
      id: 'exc-3',
      severity: 'medium' as const,
      title: 'GPS Stale: Ganesh Shinde (WRK-1009)',
      description: 'No GPS telemetry transmitted for 18 minutes. Potential dead zone.',
      time: '18m ago',
      actionLabel: 'Inspect Expert',
      onAction: () => navigate('/experts/WRK-1009'),
    },
    {
      id: 'exc-4',
      severity: 'medium' as const,
      title: 'Expiring Insurance: Rajesh Goud',
      description: 'ICICI Lombard policy expires in 7 days (Sep 30, 2026).',
      time: '1h ago',
      actionLabel: 'Review Document',
      onAction: () => navigate('/compliance'),
    },
  ];

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#1F1F1F] flex items-center gap-2">
            Operations Control Center
            <span className="flex h-2.5 w-2.5 rounded-full bg-[#10B981] animate-pulse" />
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Real-time expert availability, nano-market capacity telemetry, and dispatch routing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            onClick={() => {
              runScenario1CapacityCrunch();
              navigate('/area/KOR-03');
            }}
            className="flex items-center gap-2 rounded-xl border border-[#FECDCA] bg-[#FEF2F2] px-3.5 py-2 text-xs font-bold text-[#B42318] hover:bg-[#FEE2E2] transition-all shadow-soft-sm active:scale-95"
          >
            <Flame className="h-4 w-4 text-[#B42318] animate-pulse" />
            <span>Scenario 1: KOR-03 Crunch</span>
          </button>

          <button
            onClick={() => navigate('/live-operations')}
            className="flex items-center gap-2 rounded-xl bg-[#5B21B6] px-4 py-2 text-xs font-bold text-white shadow-soft-sm hover:bg-[#4C1D95] transition-all active:scale-95"
          >
            <MapPin className="h-4 w-4" />
            <span>Open Tactical Map</span>
          </button>
        </div>
      </div>

      {/* Special Purple Highlight Card (Section 8: Inspired by the worker app's hero earnings card) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#5B21B6] via-[#6D28D9] to-[#7C3AED] p-5 sm:p-6 text-white shadow-soft-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/20 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-purple-100">
                Live Operations Overview
              </span>
              <span className="flex items-center gap-1.5 text-xs text-purple-200">
                <span className="h-2 w-2 rounded-full bg-[#10B981]" /> Operations Running Stable
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {activeOrdersCount} Active Bookings • {workersAvailableCount} Experts Available
            </h2>
            <p className="text-xs text-purple-200 max-w-xl">
              Cluster load is balanced across 6 Bangalore nano-markets. Koramangala (KOR-03) requires capacity expansion buffer.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
            <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 px-3.5 sm:px-4 py-2.5 sm:py-3 text-center">
              <span className="text-[10px] uppercase font-mono text-purple-200">Dispatch Speed</span>
              <div className="text-lg sm:text-xl font-bold font-mono text-white mt-0.5">21 sec</div>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 px-3.5 sm:px-4 py-2.5 sm:py-3 text-center">
              <span className="text-[10px] uppercase font-mono text-purple-200">Fulfillment</span>
              <div className="text-lg sm:text-xl font-bold font-mono text-white mt-0.5">97.8%</div>
            </div>
          </div>
        </div>
      </div>

      {/* 8 Top Operational KPI Cards (Section 7: White rounded-2xl cards with circular purple icon containers) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-8 gap-3 sm:gap-3.5">
        <KpiCard
          title="Active Orders"
          value={activeOrdersCount}
          subtext="In execution"
          icon={ShoppingBag}
          trend={{ value: '+14%', isPositive: true }}
          onClick={() => navigate('/bookings')}
        />
        <KpiCard
          title="Unassigned"
          value={unassignedOrdersCount}
          subtext="Searching supply"
          icon={AlertCircle}
          variant={unassignedOrdersCount > 0 ? 'warning' : 'default'}
          onClick={() => navigate('/bookings')}
        />
        <KpiCard
          title="Experts Online"
          value={workersOnlineCount}
          subtext="Logged in"
          icon={Users}
          onClick={() => navigate('/experts')}
        />
        <KpiCard
          title="Experts Busy"
          value={workersBusyCount}
          subtext="Committed"
          icon={Briefcase}
          onClick={() => navigate('/experts')}
        />
        <KpiCard
          title="Available Experts"
          value={workersAvailableCount}
          subtext="Ready to dispatch"
          icon={CheckCircle}
          variant="success"
          onClick={() => navigate('/experts')}
        />
        <KpiCard
          title="In Progress"
          value={jobsInProgressCount}
          subtext="On-site active"
          icon={Clock}
          onClick={() => navigate('/bookings')}
        />
        <KpiCard
          title="SLA Risk"
          value={slaRiskCount}
          subtext="Critical urgency"
          icon={Flame}
          variant={slaRiskCount > 0 ? 'critical' : 'default'}
          onClick={() => navigate('/bookings')}
        />
        <KpiCard
          title="Avg Dispatch"
          value={avgAssignmentTime}
          subtext="Target < 30s"
          icon={TrendingUp}
          trend={{ value: 'Target met', isPositive: true }}
        />
      </div>

      {/* Main Grid: Demand vs Supply Table & Live Exceptions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Demand vs Supply Market Matrix (2 Cols) */}
        <div className="lg:col-span-2 rounded-3xl border border-[#EEEEF2] bg-white p-4 sm:p-6 shadow-soft-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EEEEF2] pb-3 sm:pb-4">
            <div>
              <h2 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider">
                Demand vs Supply by Nano-Market
              </h2>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                Dynamic capacity threshold monitoring across Bengaluru clusters
              </p>
            </div>
            <button
              onClick={() => navigate('/area')}
              className="text-xs text-[#5B21B6] hover:text-[#4C1D95] font-bold flex items-center gap-1 shrink-0"
            >
              All Markets <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1F1F1F]">
              <thead className="border-b border-[#EEEEF2] bg-[#FAF9FC] text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B]">
                <tr>
                  <th className="py-3 px-3.5 whitespace-nowrap">Market</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Active Orders</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Available Supply</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Busy Supply</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Capacity %</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F2F7] font-sans">
                {markets.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => navigate(`/area/${m.id}`)}
                    className="hover:bg-[#F9F8FD] cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-3.5">
                      <div className="font-bold text-[#1F1F1F]">{m.name}</div>
                      <div className="text-[11px] text-[#6B6B6B] font-mono">{m.id} • {m.area}</div>
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-[#1F1F1F]">
                      {m.activeOrders}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-[#027A48]">
                      {m.availableWorkers}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-[#6B6B6B]">
                      {m.busyWorkers}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-20 h-2 rounded-full bg-[#EEEEF2] overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              m.capacity >= 90
                                ? 'bg-[#E11D48]'
                                : m.capacity >= 70
                                ? 'bg-[#F59E0B]'
                                : 'bg-[#5B21B6]'
                            }`}
                            style={{ width: `${Math.min(100, m.capacity)}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs font-bold text-[#1F1F1F]">{m.capacity}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <StatusBadge status={m.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Operational Exceptions (1 Col) */}
        <div className="rounded-3xl border border-[#EEEEF2] bg-white p-6 shadow-soft-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#EEEEF2] pb-4">
            <div>
              <h2 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider flex items-center gap-2">
                <Radio className="h-4 w-4 text-[#B42318] animate-pulse" />
                Live Exceptions
              </h2>
              <p className="text-xs text-[#6B6B6B] mt-0.5">SLA risks & critical operational events</p>
            </div>
            <span className="rounded-full bg-[#FEF2F2] border border-[#FECDCA] text-[#B42318] px-2.5 py-0.5 text-[10px] font-bold">
              {liveExceptions.length} ALERTS
            </span>
          </div>

          <div className="space-y-3">
            {liveExceptions.map((exc) => (
              <div
                key={exc.id}
                className="rounded-2xl border border-[#EEEEF2] bg-[#FAF9FC] p-4 space-y-2 hover:border-[#DDD6FE] transition-all shadow-soft-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-[#1F1F1F]">{exc.title}</h4>
                  <span className="text-[10px] font-mono text-[#6B6B6B] shrink-0">{exc.time}</span>
                </div>
                <p className="text-xs text-[#6B6B6B] leading-relaxed">{exc.description}</p>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={exc.onAction}
                    className="rounded-xl bg-[#EDE9FE] hover:bg-[#DDD6FE] text-[#5B21B6] px-3 py-1.5 text-[11px] font-bold transition-colors flex items-center gap-1"
                  >
                    {exc.actionLabel} →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analytics Charts: Hourly Demand Curve & Market Capacity Bars (Purple Palette) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Orders vs Available Workers */}
        <div className="rounded-3xl border border-[#EEEEF2] bg-white p-6 shadow-soft-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#EEEEF2] pb-4">
            <div>
              <h3 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider">
                Demand vs Available Supply Curve
              </h3>
              <p className="text-xs text-[#6B6B6B] mt-0.5">Hourly orders vs online available experts</p>
            </div>
            <span className="text-xs text-[#6B6B6B] font-mono">Today (IST)</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockHourlyDemand} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5B21B6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#5B21B6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="workerGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F2F7" vertical={false} />
                <XAxis dataKey="hour" stroke="#9CA3AF" fontSize={11} />
                <YAxis stroke="#9CA3AF" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#EEEEF2', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 16px rgba(91, 33, 182, 0.08)' }}
                />
                <Area type="monotone" dataKey="orders" name="Orders Demand" stroke="#5B21B6" fillOpacity={1} fill="url(#orderGrad)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="availableWorkers" name="Available Experts" stroke="#10B981" fillOpacity={1} fill="url(#workerGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Market Capacity Utilization */}
        <div className="rounded-3xl border border-[#EEEEF2] bg-white p-6 shadow-soft-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#EEEEF2] pb-4">
            <div>
              <h3 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider">
                Capacity Saturation by Market
              </h3>
              <p className="text-xs text-[#6B6B6B] mt-0.5">Utilization index highlighting critical bottlenecks</p>
            </div>
            <span className="text-xs font-mono text-[#5B21B6] font-bold">Target &lt; 80%</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockMarketCapacityChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F2F7" vertical={false} />
                <XAxis dataKey="market" stroke="#9CA3AF" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#9CA3AF" fontSize={11} unit="%" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#EEEEF2', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 16px rgba(91, 33, 182, 0.08)' }}
                />
                <Bar dataKey="capacity" name="Capacity Saturation %" radius={[8, 8, 0, 0]}>
                  {mockMarketCapacityChart.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.capacity >= 90 ? '#E11D48' : entry.capacity >= 70 ? '#F59E0B' : '#5B21B6'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Upcoming Jobs Schedule Table */}
      <div className="rounded-3xl border border-[#EEEEF2] bg-white p-6 shadow-soft-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#EEEEF2] pb-4">
          <div>
            <h3 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider">
              Upcoming Scheduled Deployments
            </h3>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              Next scheduled booking slots and expert fulfillment completeness
            </p>
          </div>
          <button
            onClick={() => navigate('/bookings')}
            className="text-xs text-[#5B21B6] hover:text-[#4C1D95] font-bold flex items-center gap-1"
          >
            View All Bookings <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1F1F1F]">
            <thead className="border-b border-[#EEEEF2] bg-[#FAF9FC] text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B]">
              <tr>
                <th className="py-3 px-3.5">Job ID</th>
                <th className="py-3 px-3.5">Customer</th>
                <th className="py-3 px-3.5">Service</th>
                <th className="py-3 px-3.5">Zone</th>
                <th className="py-3 px-3.5">Start Time</th>
                <th className="py-3 px-3.5 text-center">Fulfillment</th>
                <th className="py-3 px-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F2F7] font-sans">
              {bookings.slice(0, 6).map((b) => (
                <tr
                  key={b.id}
                  onClick={() => navigate(`/bookings/${b.id}`)}
                  className="hover:bg-[#F9F8FD] cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-3.5 font-mono font-bold text-[#5B21B6]">#{b.id}</td>
                  <td className="py-3.5 px-3.5">
                    <div className="font-bold text-[#1F1F1F]">{b.customer.name}</div>
                    <div className="text-[10px] text-[#6B6B6B] font-mono">{b.customer.phone}</div>
                  </td>
                  <td className="py-3.5 px-3.5 text-[#1F1F1F] font-medium">{b.service}</td>
                  <td className="py-3.5 px-3.5 font-mono text-[#5B21B6] font-semibold">{b.areaId}</td>
                  <td className="py-3.5 px-3.5 font-mono text-[#1F1F1F]">{b.startTime}</td>
                  <td className="py-3.5 px-3.5 text-center font-mono font-bold">
                    <span className={b.assignedWorkerIds.length >= b.requiredWorkers ? 'text-[#027A48]' : 'text-[#B42318]'}>
                      {b.assignedWorkerIds.length} / {b.requiredWorkers} Experts Assigned
                    </span>
                  </td>
                  <td className="py-3.5 px-3.5 text-right">
                    <StatusBadge status={b.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Modal if clicked from Live Exceptions */}
      {assignBooking && (
        <AssignWorkerModal
          booking={assignBooking}
          isOpen={true}
          onClose={() => setAssignBooking(null)}
        />
      )}
    </div>
  );
};
