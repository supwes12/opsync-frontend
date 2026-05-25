import { useEffect, useState, useCallback } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import type { PieLabelRenderProps } from 'recharts'
import { dashboard } from '../api/endpoints'
import { useAutoRefresh } from '../hooks/useAutoRefresh'
import ErrorState from '../components/ErrorState'
import type { DashboardState, DashboardMetrics, ForecastData } from '../types'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

/** HH:MM strings pass through; ISO strings get formatted; everything else stringified. */
function formatTime(timestamp: unknown): string {
  if (typeof timestamp !== 'string') return String(timestamp ?? '')
  // Already an HH:MM formatted string — return as-is
  if (/^\d{1,2}:\d{2}$/.test(timestamp)) return timestamp
  try {
    const d = new Date(timestamp)
    if (isNaN(d.getTime())) return timestamp
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return timestamp
  }
}

export default function Dashboard() {
  const [state, setState] = useState<DashboardState | null>(null)
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [forecast, setForecast] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [evaluating, setEvaluating] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [stateRes, metricsRes] = await Promise.all([
        dashboard.current().catch(() => null),
        dashboard.metrics().catch(() => null),
      ])
      if (stateRes) {
        setState(stateRes.data)
        // Extract forecast from response if present
        const raw = stateRes.data as DashboardState & { forecast?: ForecastData }
        if (raw.forecast) setForecast(raw.forecast)
      }
      if (metricsRes) setMetrics(metricsRes.data)
      if (!stateRes && !metricsRes) {
        setError('Unable to load dashboard data. The server may be unavailable.')
      } else {
        setError(null)
        setLastUpdated(new Date())
      }
    } catch {
      setError('Unable to load dashboard data. The server may be unavailable.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useAutoRefresh(fetchData, { intervalSeconds: 30 })

  const handleRefresh = () => {
    setLoading(true)
    fetchData()
  }

  const handleEvaluate = async () => {
    setEvaluating(true)
    try {
      await dashboard.evaluate()
      await fetchData()
    } catch {
      // evaluation may fail if no active shift, that's okay
    } finally {
      setEvaluating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error && !state && !metrics) {
    return <ErrorState message={error} onRetry={handleRefresh} />
  }

  const snapshot = state?.latest_snapshot
  const restaurant = state?.restaurant
  const activeShift = state?.active_shift

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Area */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">{restaurant?.name ?? 'Dashboard'}</h1>
            <div className="flex items-center gap-4 mt-1 text-blue-100 text-sm">
              {activeShift && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {activeShift.shift_type.charAt(0).toUpperCase() + activeShift.shift_type.slice(1)} Shift
                  {activeShift.staff_count > 0 && ` • ${activeShift.staff_count} staff`}
                </span>
              )}
              {!activeShift && <span>No active shift</span>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-blue-200 bg-white/10 px-2.5 py-1 rounded-lg">
                Last updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
            <button
              onClick={handleRefresh}
              className="px-3.5 py-2 text-sm bg-white/15 backdrop-blur-sm text-white rounded-lg hover:bg-white/25 transition-all border border-white/20"
            >
              <svg className="w-4 h-4 inline-block mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              onClick={handleEvaluate}
              disabled={evaluating}
              className="px-3.5 py-2 text-sm bg-white text-blue-700 font-medium rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-all shadow-sm"
            >
              {evaluating ? (
                <>
                  <svg className="w-4 h-4 inline-block mr-1 -mt-0.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Evaluating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 inline-block mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Evaluate
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          label="Current Orders"
          value={snapshot?.current_orders ?? '-'}
          color={getOrdersColor(snapshot?.current_orders)}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          trend={snapshot?.current_orders !== undefined ? (snapshot.current_orders >= 15 ? 'up' : 'stable') : undefined}
        />
        <KpiCard
          label="Avg Ticket Time"
          value={snapshot ? `${Math.round(snapshot.avg_ticket_time_seconds)}s` : '-'}
          color={getTicketTimeColor(snapshot?.avg_ticket_time_seconds)}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          trend={snapshot?.avg_ticket_time_seconds !== undefined ? (snapshot.avg_ticket_time_seconds >= 240 ? 'up' : 'down') : undefined}
        />
        <KpiCard
          label="Queue Depth"
          value={snapshot?.queue_depth ?? '-'}
          color={getQueueColor(snapshot?.queue_depth)}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          trend={snapshot?.queue_depth !== undefined ? (snapshot.queue_depth >= 10 ? 'up' : 'stable') : undefined}
        />
        <KpiCard
          label="Staff on Duty"
          value={snapshot?.staff_on_duty ?? '-'}
          color="default"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          }
        />
        {/* Demand Forecast Card */}
        <ForecastCard forecast={forecast} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders over time */}
        <ChartCard title="Orders Over Time" subtitle="Order volume by time interval">
          {metrics?.orders_over_time?.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={metrics.orders_over_time} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="timestamp" tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={formatTime} axisLine={{ stroke: '#e5e7eb' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} label={{ value: 'Orders', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#9ca3af' } }} />
                <Tooltip
                  labelFormatter={(label) => `Time: ${formatTime(label)}`}
                  formatter={(value) => [String(value ?? ''), 'Orders']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2.5} fill="url(#ordersGradient)" dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        {/* Channel breakdown */}
        <ChartCard title="Order Channels" subtitle="Distribution by order source">
          {metrics?.channel_breakdown?.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={metrics.channel_breakdown}
                  dataKey="count"
                  nameKey="channel"
                  cx="50%"
                  cy="45%"
                  outerRadius={90}
                  innerRadius={45}
                  paddingAngle={3}
                  label={(props: PieLabelRenderProps) => `${String((props as PieLabelRenderProps & { channel?: string }).channel ?? props.name ?? '')} ${((Number(props.percent) || 0) * 100).toFixed(0)}%`}
                  labelLine={{ strokeWidth: 1, stroke: '#9ca3af' }}
                >
                  {metrics.channel_breakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [String(value ?? ''), 'Orders']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        {/* Ticket time trend */}
        <ChartCard title="Avg Ticket Time Trend" subtitle="Average seconds per order">
          {metrics?.avg_ticket_time_trend?.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={metrics.avg_ticket_time_trend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="ticketGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="timestamp" tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={formatTime} axisLine={{ stroke: '#e5e7eb' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} label={{ value: 'Seconds', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#9ca3af' } }} />
                <Tooltip
                  labelFormatter={(label) => `Time: ${formatTime(label)}`}
                  formatter={(value) => [`${value ?? 0}s`, 'Avg Ticket Time']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="seconds" stroke="#f59e0b" strokeWidth={2.5} fill="url(#ticketGradient)" dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        {/* Staff utilization */}
        <ChartCard title="Staff Utilization" subtitle="Staff efficiency ratio over time">
          {metrics?.staff_utilization?.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={metrics.staff_utilization} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="utilizationGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="timestamp" tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={formatTime} axisLine={{ stroke: '#e5e7eb' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} domain={[0, 1]} tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`} label={{ value: 'Utilization', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#9ca3af' } }} />
                <Tooltip
                  labelFormatter={(label) => `Time: ${formatTime(label)}`}
                  formatter={(value) => [`${(Number(value ?? 0) * 100).toFixed(1)}%`, 'Utilization']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="ratio" fill="url(#utilizationGradient)" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>
      </div>

      {/* Active alerts & recent recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-red-50 to-orange-50">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <h3 className="font-semibold text-gray-900">Active Alerts</h3>
              {state?.active_alerts?.length ? (
                <span className="text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full ml-auto">
                  {state.active_alerts.length}
                </span>
              ) : null}
            </div>
          </div>
          <div className="p-6">
            {state?.active_alerts?.length ? (
              <div className="space-y-3">
                {state.active_alerts.slice(0, 5).map((alert) => (
                  <div key={alert.alert_id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <SeverityBadge severity={alert.severity} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{alert.message}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                      {alert.created_at ? formatTime(alert.created_at) : ''}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <svg className="w-8 h-8 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">No active alerts</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h3 className="font-semibold text-gray-900">Recent Recommendations</h3>
              {state?.recent_recommendations?.length ? (
                <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-auto">
                  {state.recent_recommendations.length}
                </span>
              ) : null}
            </div>
          </div>
          <div className="p-6">
            {state?.recent_recommendations?.length ? (
              <div className="space-y-3">
                {state.recent_recommendations.slice(0, 5).map((rec) => (
                  <div key={rec.recommendation_id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <SeverityBadge severity={rec.priority} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{rec.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{rec.description}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                      {rec.created_at ? formatTime(rec.created_at) : ''}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <svg className="w-8 h-8 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">No recent recommendations</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function getOrdersColor(orders?: number): string {
  if (orders === undefined) return 'default'
  if (orders >= 20) return 'red'
  if (orders >= 10) return 'yellow'
  return 'green'
}

function getTicketTimeColor(seconds?: number): string {
  if (seconds === undefined) return 'default'
  if (seconds >= 300) return 'red'
  if (seconds >= 180) return 'yellow'
  return 'green'
}

function getQueueColor(depth?: number): string {
  if (depth === undefined) return 'default'
  if (depth >= 15) return 'red'
  if (depth >= 8) return 'yellow'
  return 'green'
}

function KpiCard({
  label,
  value,
  color = 'default',
  icon,
  trend,
}: {
  label: string
  value: string | number
  color?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'stable'
}) {
  const bgColors: Record<string, string> = {
    green: 'from-green-50 to-white border-green-200',
    yellow: 'from-yellow-50 to-white border-yellow-200',
    red: 'from-red-50 to-white border-red-200',
    default: 'from-blue-50 to-white border-gray-200',
  }
  const iconBgColors: Record<string, string> = {
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    default: 'bg-blue-100 text-blue-600',
  }
  const textColors: Record<string, string> = {
    green: 'text-green-700',
    yellow: 'text-yellow-700',
    red: 'text-red-700',
    default: 'text-gray-900',
  }
  const trendColors: Record<string, string> = {
    up: 'text-red-500',
    down: 'text-green-500',
    stable: 'text-gray-400',
  }
  return (
    <div className={`bg-gradient-to-br ${bgColors[color] ?? bgColors.default} rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all duration-200 min-h-[120px]`}>
      <div className="flex items-start justify-between h-full">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className={`text-3xl font-bold mt-1.5 ${textColors[color] ?? textColors.default}`}>{value}</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBgColors[color] ?? iconBgColors.default}`}>
            {icon}
          </div>
          {trend && (
            <span className={`${trendColors[trend]}`}>
              {trend === 'up' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                </svg>
              )}
              {trend === 'down' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              )}
              {trend === 'stable' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14" />
                </svg>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="px-6 pt-5 pb-2">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="px-4 pb-4">
        {children}
      </div>
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
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${colors[severity] ?? 'bg-gray-100 text-gray-700'}`}>
      {severity}
    </span>
  )
}

function EmptyChart() {
  return (
    <div className="flex flex-col items-center justify-center h-[280px] text-gray-400">
      <svg className="w-10 h-10 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <p className="text-sm">No data available</p>
    </div>
  )
}

function ForecastCard({ forecast }: { forecast: ForecastData | null }) {
  if (!forecast) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 min-h-[120px]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Demand Forecast</p>
            <p className="text-lg text-gray-400 mt-1.5">No forecast available</p>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-100 text-indigo-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>
      </div>
    )
  }

  const confidenceColor = forecast.confidence >= 0.8 ? 'text-green-600' : forecast.confidence >= 0.6 ? 'text-yellow-600' : 'text-red-600'
  const confidenceBg = forecast.confidence >= 0.8 ? 'bg-green-100' : forecast.confidence >= 0.6 ? 'bg-yellow-100' : 'bg-red-100'

  return (
    <div className="relative bg-gradient-to-br from-indigo-50 to-white border border-indigo-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 min-h-[120px] overflow-hidden">
      {/* Subtle animated glow indicator */}
      <div className="absolute top-0 right-0 w-3 h-3 m-3">
        <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-50 animate-ping" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500" />
      </div>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">Demand Forecast</p>
          <div className="flex items-baseline gap-3 mt-1.5">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
              </svg>
              <span className="text-2xl font-bold text-indigo-700">{forecast.predicted_orders_30min}</span>
              <span className="text-xs text-gray-400">30m</span>
            </div>
            <div className="text-gray-300">|</div>
            <div className="flex items-center gap-1">
              <span className="text-xl font-bold text-indigo-500">{forecast.predicted_orders_60min}</span>
              <span className="text-xs text-gray-400">60m</span>
            </div>
          </div>
          <div className={`inline-flex items-center gap-1 mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${confidenceBg} ${confidenceColor}`}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
            </svg>
            {(forecast.confidence * 100).toFixed(0)}% confidence
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-100 text-indigo-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
      </div>
    </div>
  )
}
