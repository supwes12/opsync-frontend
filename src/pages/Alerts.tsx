import { useEffect, useState } from 'react'
import { alerts as alertsApi } from '../api/endpoints'
import { useAuth } from '../contexts/AuthContext'
import ErrorState from '../components/ErrorState'
import type { Alert } from '../types'

export default function Alerts() {
  const { user } = useAuth()
  const [alertList, setAlertList] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('unacknowledged')

  const fetchAlerts = () => {
    setLoading(true)
    setError(null)
    const params = filter === 'all' ? {} : { acknowledged: filter === 'acknowledged' }
    alertsApi.list(params)
      .then((res) => setAlertList(res.data.alerts))
      .catch(() => setError('Failed to load alerts.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchAlerts()
  }, [filter])

  const handleAcknowledge = async (id: string) => {
    try {
      await alertsApi.acknowledge(id)
      setAlertList((prev) =>
        prev.map((a) =>
          a.alert_id === id ? { ...a, acknowledged: true } : a,
        ),
      )
    } catch { /* handled by interceptor */ }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchAlerts} />
  }

  const severityCounts = alertList.reduce<Record<string, number>>((acc, a) => {
    acc[a.severity] = (acc[a.severity] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
          <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
            {alertList.length}
          </span>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        >
          <option value="unacknowledged">Unacknowledged</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="all">All</option>
        </select>
      </div>

      {/* Severity summary */}
      {alertList.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {severityCounts.critical !== undefined && severityCounts.critical > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-sm font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {severityCounts.critical} Critical
            </div>
          )}
          {severityCounts.high !== undefined && severityCounts.high > 0 && (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 px-4 py-2 rounded-xl text-sm font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {severityCounts.high} High
            </div>
          )}
          {severityCounts.medium !== undefined && severityCounts.medium > 0 && (
            <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2 rounded-xl text-sm font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {severityCounts.medium} Medium
            </div>
          )}
          {severityCounts.low !== undefined && severityCounts.low > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-xl text-sm font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {severityCounts.low} Low
            </div>
          )}
        </div>
      )}

      {alertList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-base font-semibold text-gray-600">All clear -- no active alerts</p>
          <p className="text-sm text-gray-400 mt-1.5 max-w-xs text-center">
            Everything is running smoothly. Alerts will appear here when thresholds are exceeded.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alertList.map((alert) => {
            const borderColors: Record<string, string> = {
              critical: 'border-l-red-500',
              high: 'border-l-orange-500',
              medium: 'border-l-amber-500',
              low: 'border-l-blue-500',
            }
            const bgColors: Record<string, string> = {
              critical: 'bg-gradient-to-r from-red-50/60 to-white',
              high: 'bg-gradient-to-r from-orange-50/40 to-white',
              medium: 'bg-white',
              low: 'bg-white',
            }
            const exceeded = alert.actual_value > alert.threshold_value
            return (
              <div
                key={alert.alert_id}
                className={`rounded-2xl border border-gray-200 border-l-4 ${borderColors[alert.severity] ?? 'border-l-gray-400'} p-6 shadow-sm hover:shadow-md transition-all ${
                  alert.acknowledged ? 'opacity-60' : ''
                } ${bgColors[alert.severity] ?? 'bg-white'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3 flex-1">
                    <SeverityIcon severity={alert.severity} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <SeverityBadge severity={alert.severity} />
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">{alert.type}</span>
                        {alert.acknowledged && (
                          <span className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Acknowledged
                          </span>
                        )}
                        {alert.created_at && (
                          <span className="text-[10px] text-gray-400 ml-auto">
                            {new Date(alert.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 text-base">{alert.title}</h3>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">{alert.message}</p>
                      {/* Threshold vs Actual Values */}
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
                          <span className="text-xs text-gray-500 font-medium">Threshold</span>
                          <span className="text-sm font-bold text-gray-700">{alert.threshold_value}</span>
                        </div>
                        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                          exceeded ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                        }`}>
                          <span className={`text-xs font-medium ${exceeded ? 'text-red-500' : 'text-green-500'}`}>Actual</span>
                          <span className={`text-sm font-bold ${exceeded ? 'text-red-700' : 'text-green-700'}`}>{alert.actual_value}</span>
                          {exceeded && (
                            <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  {!alert.acknowledged && user?.role !== 'viewer' && (
                    <button
                      onClick={() => handleAcknowledge(alert.alert_id)}
                      className="flex items-center gap-1.5 px-4 py-2.5 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm hover:shadow-md shrink-0 font-medium active:scale-[0.97]"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SeverityIcon({ severity }: { severity: string }) {
  const wrapperColors: Record<string, string> = {
    critical: 'bg-red-100 text-red-600',
    high: 'bg-orange-100 text-orange-600',
    medium: 'bg-yellow-100 text-yellow-600',
    low: 'bg-blue-100 text-blue-600',
  }
  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${wrapperColors[severity] ?? 'bg-gray-100 text-gray-600'}`}>
      {(severity === 'critical' || severity === 'high') ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
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
