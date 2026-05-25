import { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import type { PieLabelRenderProps } from 'recharts'
import { dashboard, shifts as shiftsApi } from '../api/endpoints'
import ErrorState from '../components/ErrorState'
import type { TrendsData, Shift } from '../types'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const HEATMAP_COLORS = [
  '#1e3a5f', '#1e4d7a', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd',
  '#f59e0b', '#f97316', '#ef4444',
]

function getHeatmapColor(utilization: number): string {
  const idx = Math.min(Math.floor(utilization * (HEATMAP_COLORS.length - 1)), HEATMAP_COLORS.length - 1)
  return HEATMAP_COLORS[Math.max(0, idx)]
}

function formatShiftLabel(shift: Shift): string {
  const type = shift.shift_type.charAt(0).toUpperCase() + shift.shift_type.slice(1)
  try {
    const d = new Date(shift.start_time)
    const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' })
    return `${type} - ${dateStr}`
  } catch {
    return type
  }
}

export default function Trends() {
  const [data, setData] = useState<TrendsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(7)
  const [shiftId, setShiftId] = useState<string>('')
  const [availableShifts, setAvailableShifts] = useState<Shift[]>([])

  // Fetch available shifts for the dropdown
  useEffect(() => {
    shiftsApi.list()
      .then((res) => setAvailableShifts(res.data.shifts))
      .catch(() => { /* silent - dropdown just won't populate */ })
  }, [])

  const fetchData = () => {
    setLoading(true)
    setError(null)
    const params: { days?: number; shift_id?: string } = { days }
    if (shiftId) params.shift_id = shiftId
    dashboard.trends(params)
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load trends data.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, [days, shiftId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />
  }

  // Build heatmap grid data
  const heatmapDays = [...new Set((data?.staff_utilization_heatmap ?? []).map(d => d.day))]
  const heatmapHours = [...new Set((data?.staff_utilization_heatmap ?? []).map(d => d.hour))].sort((a, b) => a - b)
  const heatmapMap = new Map<string, number>()
  ;(data?.staff_utilization_heatmap ?? []).forEach(d => {
    heatmapMap.set(`${d.day}-${d.hour}`, d.utilization)
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trends & Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Historical performance insights across key operational metrics</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Shift selector dropdown */}
          <select
            value={shiftId}
            onChange={(e) => setShiftId(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm min-w-[160px]"
          >
            <option value="">All Shifts</option>
            {availableShifts.map((s) => (
              <option key={s.shift_id} value={s.shift_id}>
                {formatShiftLabel(s)}
              </option>
            ))}
          </select>
          {/* Date range buttons */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            {[7, 14, 30].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  days === d
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Volume Over Time */}
        <ChartCard title="Order Volume Over Time" subtitle={`Daily orders, last ${days} days`}>
          {data?.order_volume_by_day?.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.order_volume_by_day} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="trendsOrderGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={(v: string) => {
                    try {
                      return new Date(v).toLocaleDateString([], { month: 'short', day: 'numeric' })
                    } catch { return v }
                  }}
                />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} label={{ value: 'Orders', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#9ca3af' } }} />
                <Tooltip
                  labelFormatter={(label) => {
                    try { return new Date(String(label)).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) }
                    catch { return String(label) }
                  }}
                  formatter={(value) => [String(value ?? ''), 'Orders']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2.5} fill="url(#trendsOrderGradient)" dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        {/* Ticket Time Distribution */}
        <ChartCard title="Ticket Time Distribution" subtitle="Orders grouped by ticket completion time">
          {data?.ticket_time_distribution?.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.ticket_time_distribution} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="ticketDistGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="bucket" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#9ca3af' } }} />
                <Tooltip
                  formatter={(value) => [String(value ?? ''), 'Orders']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="count" fill="url(#ticketDistGradient)" radius={[6, 6, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        {/* Staff Utilization Heatmap */}
        <ChartCard title="Staff Utilization Heatmap" subtitle="Utilization by hour and day of week">
          {heatmapDays.length > 0 && heatmapHours.length > 0 ? (
            <div className="px-2 py-4 overflow-x-auto">
              <div className="min-w-[400px]">
                {/* Hour labels */}
                <div className="flex items-center mb-1">
                  <div className="w-16 shrink-0" />
                  {heatmapHours.map(h => (
                    <div key={h} className="flex-1 text-center text-[10px] text-gray-400 font-medium">
                      {h}:00
                    </div>
                  ))}
                </div>
                {/* Rows */}
                {heatmapDays.map(day => (
                  <div key={day} className="flex items-center mb-1">
                    <div className="w-16 shrink-0 text-xs text-gray-500 font-medium pr-2 text-right">{day}</div>
                    {heatmapHours.map(hour => {
                      const util = heatmapMap.get(`${day}-${hour}`) ?? 0
                      return (
                        <div
                          key={hour}
                          className="flex-1 aspect-square mx-0.5 rounded-sm cursor-default transition-transform hover:scale-110"
                          style={{ backgroundColor: getHeatmapColor(util), minHeight: '24px' }}
                          title={`${day} ${hour}:00 -- ${(util * 100).toFixed(0)}%`}
                        />
                      )
                    })}
                  </div>
                ))}
                {/* Legend */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  <span className="text-[10px] text-gray-400">Low</span>
                  <div className="flex gap-0.5">
                    {HEATMAP_COLORS.map((c, i) => (
                      <div key={i} className="w-5 h-3 rounded-sm" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <span className="text-[10px] text-gray-400">High</span>
                </div>
              </div>
            </div>
          ) : <EmptyChart />}
        </ChartCard>

        {/* Recommendation Acceptance Rate */}
        <ChartCard title="Recommendation Acceptance Rate" subtitle="Breakdown of recommendation responses">
          {data?.recommendation_acceptance_rate?.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.recommendation_acceptance_rate}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="45%"
                  outerRadius={95}
                  innerRadius={50}
                  paddingAngle={3}
                  label={(props: PieLabelRenderProps) => {
                    const entry = props as PieLabelRenderProps & { status?: string }
                    return `${String(entry.status ?? entry.name ?? '')} ${((Number(props.percent) || 0) * 100).toFixed(0)}%`
                  }}
                  labelLine={{ strokeWidth: 1, stroke: '#9ca3af' }}
                >
                  {data.recommendation_acceptance_rate.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [String(value ?? ''), 'Count']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>
      </div>

      {/* Alert Frequency -- full width */}
      <ChartCard title="Alert Frequency by Type" subtitle={`Distribution of alerts over the last ${days} days`}>
        {data?.alert_frequency?.length ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.alert_frequency} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} layout="vertical">
              <defs>
                <linearGradient id="alertFreqGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} />
              <YAxis type="category" dataKey="type" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} width={140} />
              <Tooltip
                formatter={(value) => [String(value ?? ''), 'Alerts']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="count" fill="url(#alertFreqGradient)" radius={[0, 6, 6, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        ) : <EmptyChart />}
      </ChartCard>
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

function EmptyChart() {
  return (
    <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
      <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-3">
        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-500">No trend data available yet</p>
      <p className="text-xs text-gray-400 mt-1">Data will appear here once operations begin</p>
    </div>
  )
}
