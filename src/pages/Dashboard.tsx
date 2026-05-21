import { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { dashboard } from '../api/endpoints'
import type { DashboardState, DashboardMetrics } from '../types'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']

export default function Dashboard() {
  const [state, setState] = useState<DashboardState | null>(null)
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      dashboard.current().catch(() => null),
      dashboard.metrics().catch(() => null),
    ]).then(([stateRes, metricsRes]) => {
      if (stateRes) setState(stateRes.data)
      if (metricsRes) setMetrics(metricsRes.data)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  const snapshot = state?.latest_snapshot

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Current Orders" value={snapshot?.current_orders ?? '-'} />
        <KpiCard label="Avg Ticket Time" value={snapshot ? `${Math.round(snapshot.avg_ticket_time_seconds)}s` : '-'} />
        <KpiCard label="Queue Depth" value={snapshot?.queue_depth ?? '-'} />
        <KpiCard label="Staff on Duty" value={snapshot?.staff_on_duty ?? '-'} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders over time */}
        <ChartCard title="Orders Over Time">
          {metrics?.orders_over_time?.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={metrics.orders_over_time}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#3b82f680" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        {/* Channel breakdown */}
        <ChartCard title="Order Channels">
          {metrics?.channel_breakdown?.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={metrics.channel_breakdown}
                  dataKey="count"
                  nameKey="channel"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {metrics.channel_breakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        {/* Ticket time trend */}
        <ChartCard title="Avg Ticket Time Trend">
          {metrics?.avg_ticket_time_trend?.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={metrics.avg_ticket_time_trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="seconds" stroke="#f59e0b" fill="#f59e0b80" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        {/* Staff utilization */}
        <ChartCard title="Staff Utilization">
          {metrics?.staff_utilization?.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={metrics.staff_utilization}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="ratio" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>
      </div>

      {/* Active alerts & recent recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Active Alerts</h3>
          {state?.active_alerts?.length ? (
            <div className="space-y-3">
              {state.active_alerts.slice(0, 5).map((alert) => (
                <div key={alert.alert_id} className="flex items-start gap-3">
                  <SeverityBadge severity={alert.severity} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                    <p className="text-xs text-gray-500">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No active alerts</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Recommendations</h3>
          {state?.recent_recommendations?.length ? (
            <div className="space-y-3">
              {state.recent_recommendations.slice(0, 5).map((rec) => (
                <div key={rec.recommendation_id} className="flex items-start gap-3">
                  <SeverityBadge severity={rec.priority} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{rec.title}</p>
                    <p className="text-xs text-gray-500">{rec.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No recent recommendations</p>
          )}
        </div>
      </div>
    </div>
  )
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-blue-100 text-blue-700',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[severity] ?? 'bg-gray-100 text-gray-700'}`}>
      {severity}
    </span>
  )
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-[250px] text-sm text-gray-400">
      No data available
    </div>
  )
}
