import { useEffect, useState } from 'react'
import { recommendations as recApi } from '../api/endpoints'
import { useAuth } from '../contexts/AuthContext'
import type { Recommendation } from '../types'

export default function Recommendations() {
  const { user } = useAuth()
  const [recs, setRecs] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    const params = filter === 'all' ? {} : { status: filter }
    recApi.list(params)
      .then((res) => setRecs(res.data.recommendations))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filter])

  const handleAction = async (id: string, actionType: string) => {
    try {
      await recApi.act(id, actionType)
      setRecs((prev) =>
        prev.map((r) =>
          r.recommendation_id === id ? { ...r, status: actionType as Recommendation['status'] } : r,
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
        <h1 className="text-2xl font-bold text-gray-900">Recommendations</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </div>

      {recs.length === 0 ? (
        <p className="text-gray-500">No recommendations found.</p>
      ) : (
        <div className="space-y-4">
          {recs.map((rec) => (
            <div key={rec.recommendation_id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <PriorityBadge priority={rec.priority} />
                    <StatusBadge status={rec.status} />
                    <span className="text-xs text-gray-400">{rec.type}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{rec.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                  <p className="text-sm text-blue-600 mt-2">
                    <span className="font-medium">Suggested:</span> {rec.suggested_action}
                  </p>
                </div>
                {rec.status === 'pending' && user?.role !== 'viewer' && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleAction(rec.recommendation_id, 'accepted')}
                      className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleAction(rec.recommendation_id, 'dismissed')}
                      className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-blue-100 text-blue-700',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[priority] ?? 'bg-gray-100 text-gray-700'}`}>
      {priority}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    accepted: 'bg-green-50 text-green-700 border-green-200',
    dismissed: 'bg-gray-50 text-gray-500 border-gray-200',
    expired: 'bg-red-50 text-red-500 border-red-200',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${colors[status] ?? ''}`}>
      {status}
    </span>
  )
}
