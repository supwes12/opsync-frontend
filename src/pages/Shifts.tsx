import { useEffect, useState } from 'react'
import { shifts as shiftsApi } from '../api/endpoints'
import ErrorState from '../components/ErrorState'
import type { Shift, ShiftSummary } from '../types'

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

export default function Shifts() {
  const [shiftList, setShiftList] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)
  const [summary, setSummary] = useState<ShiftSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  const fetchShifts = () => {
    setLoading(true)
    setError(null)
    const params = filter === 'all' ? {} : { status: filter }
    shiftsApi.list(params)
      .then((res) => setShiftList(res.data.shifts))
      .catch(() => setError('Failed to load shifts.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchShifts()
  }, [filter])

  const handleShiftClick = (shift: Shift) => {
    if (shift.status !== 'completed') return
    setSelectedShift(shift)
    setSummary(null)
    setSummaryError(null)
    setSummaryLoading(true)
    shiftsApi.summary(shift.shift_id)
      .then((res) => setSummary(res.data))
      .catch(() => setSummaryError('Unable to load shift summary.'))
      .finally(() => setSummaryLoading(false))
  }

  const closeSummary = () => {
    setSelectedShift(null)
    setSummary(null)
    setSummaryError(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchShifts} />
  }

  const activeCount = shiftList.filter(s => s.status === 'active').length
  const scheduledCount = shiftList.filter(s => s.status === 'scheduled').length
  const completedCount = shiftList.filter(s => s.status === 'completed').length

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Shifts</h1>
          <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
            {shiftList.length}
          </span>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Summary bar */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-xl text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-soft" />
          {activeCount} Active
        </div>
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-xl text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          {scheduledCount} Scheduled
        </div>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-gray-400" />
          {completedCount} Completed
        </div>
      </div>

      {shiftList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium">No shifts found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left text-gray-500">
                  <th className="px-6 py-3.5 font-medium">Type</th>
                  <th className="px-6 py-3.5 font-medium">Start</th>
                  <th className="px-6 py-3.5 font-medium">End</th>
                  <th className="px-6 py-3.5 font-medium">Staff</th>
                  <th className="px-6 py-3.5 font-medium">Status</th>
                  <th className="px-6 py-3.5 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {shiftList.map((shift, idx) => (
                  <tr
                    key={shift.shift_id}
                    className={`border-b border-gray-100 transition-colors ${
                      shift.status === 'completed'
                        ? 'hover:bg-blue-50/50 cursor-pointer'
                        : 'hover:bg-gray-50/50'
                    } ${idx % 2 === 1 ? 'bg-gray-50/30' : ''}`}
                    onClick={() => handleShiftClick(shift)}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 capitalize">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {shift.shift_type}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{formatDateTime(shift.start_time)}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {shift.end_time ? formatDateTime(shift.end_time) : <span className="text-gray-400">--</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                        {shift.staff_count}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={shift.status} />
                    </td>
                    <td className="px-6 py-4">
                      {shift.status === 'completed' && (
                        <span className="text-xs text-blue-500 font-medium hover:text-blue-700 transition-colors">
                          View Summary
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Shift Summary Modal */}
      {selectedShift && (
        <ShiftSummaryModal
          shift={selectedShift}
          summary={summary}
          loading={summaryLoading}
          error={summaryError}
          onClose={closeSummary}
        />
      )}
    </div>
  )
}

function ShiftSummaryModal({
  shift,
  summary,
  loading,
  error,
  onClose,
}: {
  shift: Shift
  summary: ShiftSummary | null
  loading: boolean
  error: string | null
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold capitalize">{shift.shift_type} Shift Summary</h2>
              <p className="text-blue-100 text-sm mt-1">
                {formatDateTime(shift.start_time)}
                {shift.end_time ? ` - ${formatDateTime(shift.end_time)}` : ''}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
          )}

          {summary && !loading && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Key Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <SummaryMetric
                    label="Total Orders"
                    value={String(summary.total_orders)}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    }
                    color="blue"
                  />
                  <SummaryMetric
                    label="Avg Ticket Time"
                    value={`${Math.round(summary.avg_ticket_time)}s`}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                    color="amber"
                  />
                  <SummaryMetric
                    label="Peak Orders"
                    value={String(summary.peak_orders)}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    }
                    color="red"
                  />
                  <SummaryMetric
                    label="Staff Utilization"
                    value={`${Math.round(summary.staff_utilization_avg * 100)}%`}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    }
                    color="green"
                  />
                </div>
              </div>

              {/* Recommendations Stats */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Recommendations</h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatItem label="Generated" value={summary.recommendations_generated} color="text-blue-600" />
                    <StatItem label="Accepted" value={summary.recommendations_accepted} color="text-green-600" />
                    <StatItem label="Deferred" value={summary.recommendations_deferred} color="text-amber-600" />
                    <StatItem label="Rejected" value={summary.recommendations_rejected} color="text-red-600" />
                  </div>
                  {summary.recommendations_generated > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
                            style={{ width: `${(summary.recommendations_accepted / summary.recommendations_generated) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-500">
                          {Math.round((summary.recommendations_accepted / summary.recommendations_generated) * 100)}% accepted
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Alert Stats */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Alerts</h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <StatItem label="Triggered" value={summary.alerts_triggered} color="text-red-600" />
                    <StatItem label="Acknowledged" value={summary.alerts_acknowledged} color="text-green-600" />
                  </div>
                  {summary.alerts_triggered > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
                            style={{ width: `${(summary.alerts_acknowledged / summary.alerts_triggered) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-500">
                          {Math.round((summary.alerts_acknowledged / summary.alerts_triggered) * 100)}% acknowledged
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SummaryMetric({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: string
  icon: React.ReactNode
  color: 'blue' | 'amber' | 'red' | 'green'
}) {
  const colorMap = {
    blue: { bg: 'bg-blue-50 border-blue-100', icon: 'bg-blue-100 text-blue-600', text: 'text-blue-700' },
    amber: { bg: 'bg-amber-50 border-amber-100', icon: 'bg-amber-100 text-amber-600', text: 'text-amber-700' },
    red: { bg: 'bg-red-50 border-red-100', icon: 'bg-red-100 text-red-600', text: 'text-red-700' },
    green: { bg: 'bg-green-50 border-green-100', icon: 'bg-green-100 text-green-600', text: 'text-green-700' },
  }
  const c = colorMap[color]
  return (
    <div className={`${c.bg} border rounded-xl p-3`}>
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${c.icon}`}>
          {icon}
        </div>
      </div>
      <p className={`text-xl font-bold ${c.text}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

function StatItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { classes: string; dot: string }> = {
    active: { classes: 'bg-green-100 text-green-700 border border-green-200', dot: 'bg-green-500 animate-pulse-soft' },
    scheduled: { classes: 'bg-blue-100 text-blue-700 border border-blue-200', dot: 'bg-blue-500' },
    completed: { classes: 'bg-gray-100 text-gray-600 border border-gray-200', dot: 'bg-gray-400' },
  }
  const style = styles[status] ?? { classes: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${style.classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  )
}
