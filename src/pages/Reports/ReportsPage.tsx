import React, { useState } from 'react';
import { useOperations } from '../../context/OperationsContext';
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
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { mockHourlyDemand, mockMarketCapacityChart, mockDailyMetrics } from '../../data/mock/mockReports';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  DollarSign, 
  Calendar,
  Filter
} from 'lucide-react';
import { KpiCard } from '../../components/common/KpiCard';

export const ReportsPage: React.FC = () => {
  const { markets } = useOperations();
  const [selectedMarket, setSelectedMarket] = useState('ALL');

  const cancellationReasonsData = [
    { name: 'No local partner found', value: 42, color: '#5B21B6' },
    { name: 'Customer rescheduled', value: 28, color: '#7C3AED' },
    { name: 'Traffic / ETA delay', value: 18, color: '#A855F7' },
    { name: 'Incorrect address', value: 12, color: '#C084FC' },
  ];

  const avgEtaTrends = [
    { time: '08:00', eta: 6.2, target: 8.0 },
    { time: '10:00', eta: 7.8, target: 8.0 },
    { time: '12:00', eta: 9.4, target: 8.0 },
    { time: '14:00', eta: 7.1, target: 8.0 },
    { time: '16:00', eta: 8.6, target: 8.0 },
    { time: '18:00', eta: 9.8, target: 8.0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#1F1F1F] flex items-center gap-2">
            Operations Analytics & SLA Intelligence
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Cross-market dispatch velocity, fulfillment efficiency, expert utilization, and earnings health.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedMarket}
            onChange={(e) => setSelectedMarket(e.target.value)}
            aria-label="Filter Analytics by Nano Market"
            className="rounded-xl border border-[#EEEEF2] bg-white px-3 py-1.5 text-xs text-[#1F1F1F] focus:outline-none focus:border-[#5B21B6] focus:ring-1 focus:ring-[#5B21B6]/20 font-medium shadow-soft-sm cursor-pointer"
          >
            <option value="ALL">All Nano-Markets (Bengaluru)</option>
            {markets.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id} — {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Top Benchmark KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard
          title="Completion Rate"
          value={`${mockDailyMetrics.completionRate}%`}
          subtext="Benchmark: 95%"
          icon={CheckCircle2}
          variant="success"
          trend={{ value: '+1.2%', isPositive: true }}
        />
        <KpiCard
          title="Cancellation Rate"
          value={`${mockDailyMetrics.cancellationRate}%`}
          subtext="Benchmark < 2.5%"
          icon={XCircle}
          trend={{ value: '-0.4%', isPositive: true }}
        />
        <KpiCard
          title="Average ETA"
          value={`${mockDailyMetrics.avgEtaMinutes} min`}
          subtext="From dispatch acceptance"
          icon={Clock}
        />
        <KpiCard
          title="Gross GMV Today"
          value={`₹${(mockDailyMetrics.grossGMVToday / 1000).toFixed(1)}k`}
          subtext="486 completed bookings"
          icon={DollarSign}
          variant="info"
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Orders vs Online Workers */}
        <div className="rounded-2xl border border-[#EEEEF2] bg-white p-5 shadow-soft-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#EEEEF2] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider">
                Orders Volume vs Expert Utilization
              </h3>
              <p className="text-xs text-[#6B6B6B] mt-0.5">Hourly load dynamics across service categories</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockHourlyDemand}>
                <defs>
                  <linearGradient id="orderFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5B21B6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#5B21B6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEEEF2" vertical={false} />
                <XAxis dataKey="hour" stroke="#6B6B6B" fontSize={11} />
                <YAxis stroke="#6B6B6B" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#EEEEF2', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', fontSize: '12px', color: '#1F1F1F' }} />
                <Area type="monotone" dataKey="orders" stroke="#5B21B6" fill="url(#orderFill)" strokeWidth={2.5} name="Order Volume" />
                <Area type="monotone" dataKey="busyWorkers" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.1} strokeWidth={2} name="Busy Supply" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ETA Trends vs SLA Target */}
        <div className="rounded-2xl border border-[#EEEEF2] bg-white p-5 shadow-soft-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#EEEEF2] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider">
                Average Travel Time / ETA (Minutes)
              </h3>
              <p className="text-xs text-[#6B6B6B] mt-0.5">Expert travel arrival time vs 8-min target line</p>
            </div>
            <span className="text-xs font-mono font-semibold text-[#5B21B6] bg-[#EDE9FE] px-2.5 py-0.5 rounded-full">Target: 8.0 min</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={avgEtaTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEEEF2" vertical={false} />
                <XAxis dataKey="time" stroke="#6B6B6B" fontSize={11} />
                <YAxis domain={[4, 12]} stroke="#6B6B6B" fontSize={11} unit="m" />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#EEEEF2', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', fontSize: '12px', color: '#1F1F1F' }} />
                <Line type="monotone" dataKey="eta" stroke="#5B21B6" strokeWidth={2.5} dot={{ r: 4, fill: '#5B21B6' }} name="Actual ETA" />
                <Line type="monotone" dataKey="target" stroke="#B42318" strokeDasharray="4 4" strokeWidth={2} name="SLA Target" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cancellation Distribution */}
        <div className="rounded-2xl border border-[#EEEEF2] bg-white p-5 shadow-soft-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#EEEEF2] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider">
                Drop-off & Cancellation Root Causes
              </h3>
              <p className="text-xs text-[#6B6B6B] mt-0.5">Operational bottlenecks leading to booking drop</p>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cancellationReasonsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {cancellationReasonsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#EEEEF2', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', fontSize: '12px', color: '#1F1F1F' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            {cancellationReasonsData.map((c) => (
              <div key={c.name} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="text-[#1F1F1F] font-medium">{c.name} ({c.value}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Capacity Saturation Breakdown */}
        <div className="rounded-2xl border border-[#EEEEF2] bg-white p-5 shadow-soft-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#EEEEF2] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider">
                Nano-Market Capacity Indices
              </h3>
              <p className="text-xs text-[#6B6B6B] mt-0.5">Peak utilization levels across all managed clusters</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockMarketCapacityChart} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEEEF2" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="#6B6B6B" fontSize={11} unit="%" />
                <YAxis dataKey="market" type="category" stroke="#6B6B6B" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#EEEEF2', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', fontSize: '12px', color: '#1F1F1F' }} />
                <Bar dataKey="capacity" radius={[0, 6, 6, 0]}>
                  {mockMarketCapacityChart.map((entry, index) => (
                    <Cell 
                      key={`bar-${index}`} 
                      fill={entry.capacity >= 90 ? '#B42318' : entry.capacity >= 70 ? '#C2410C' : '#5B21B6'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
