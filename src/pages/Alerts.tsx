import { useEffect, useState } from 'react'
import { alerts as alertsApi } from '../api/endpoints'
import { useAuth } from '../contexts/AuthContext'
import type { Alert } from '../types'

export default function Alerts() {
  const { user } = useAuth()
  const [alertList, setAlertList] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('unacknowledged')

  useEffect(() => {
    const params = filter === 'all' ? {} : { acknowledged: filter === 'acknowledged' }
    alertsApi.list(params)
      .then((res) => setAlertList(res.data.alerts))
      .catch(() => {})
      .finally(() => setLoading(false))
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="unacknowledged">Unacknowledged</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="all">All</option>
        </select>
      </div>

      {alertList.length === 0 ? (
        <p className="text-gray-500">No alerts found.</p>
      ) : (
        <div className="space-y-4">
          {alertList.map((alert) => (
            <div key={alert.alert_id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <SeverityBadge severity={alert.severity} />
                    <span className="text-xs text-gray-400">{alert.type}</span>
                    {alert.acknowledged && (
                      <span className="text-xs text-green-600 font-medium">Acknowledged</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Threshold: {alert.threshold_value} | Actual: {alert.actual_value}
                  </p>
                </div>
                {!alert.acknowledged && user?.role !== 'viewer' && (
                  <button
                    onClick={() => handleAcknowledge(alert.alert_id)}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 shrink-0"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
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
