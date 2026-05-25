import { useEffect, useState } from 'react'
import { recommendations as recApi } from '../api/endpoints'
import { useAuth } from '../contexts/AuthContext'
import ErrorState from '../components/ErrorState'
import type { Recommendation } from '../types'

export default function Recommendations() {
  const { user } = useAuth()
  const [recs, setRecs] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null)
  const [confirmDismiss, setConfirmDismiss] = useState<string | null>(null)

  const fetchRecs = () => {
    setLoading(true)
    setError(null)
    const params = filter === 'all' ? {} : { status: filter }
    recApi.list(params)
      .then((res) => setRecs(res.data.recommendations))
      .catch(() => setError('Failed to load recommendations.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchRecs()
  }, [filter])

  const handleAction = async (id: string, actionType: string) => {
    try {
      await recApi.act(id, actionType)
      setRecs((prev) =>
        prev.map((r) =>
          r.recommendation_id === id ? { ...r, status: actionType as Recommendation['status'] } : r,
        ),
      )
      // Also update the modal if it's showing the same recommendation
      if (selectedRec?.recommendation_id === id) {
        setSelectedRec((prev) => prev ? { ...prev, status: actionType as Recommendation['status'] } : null)
      }
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
    return <ErrorState message={error} onRetry={fetchRecs} />
  }

  const pendingCount = recs.filter(r => r.status === 'pending').length
  const acceptedCount = recs.filter(r => r.status === 'accepted').length
  const rejectedCount = recs.filter(r => r.status === 'rejected').length
  const deferredCount = recs.filter(r => r.status === ('deferred' as Recommendation['status'])).length

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Recommendations</h1>
          <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
            {recs.length}
          </span>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="deferred">Deferred</option>
        </select>
      </div>

      {/* Summary bar */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2 rounded-xl text-sm font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {pendingCount} Pending
        </div>
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-xl text-sm font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {acceptedCount} Accepted
        </div>
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-xl text-sm font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {deferredCount} Deferred
        </div>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {rejectedCount} Dismissed
        </div>
      </div>

      {recs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <p className="text-base font-semibold text-gray-600">No recommendations right now</p>
          <p className="text-sm text-gray-400 mt-1.5 max-w-xs text-center">
            Recommendations will appear here after the system evaluates current operational data.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {recs.map((rec) => (
            <div key={rec.recommendation_id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <PriorityBadge priority={rec.priority} />
                    <StatusBadge status={rec.status} />
                    <span className="text-xs text-gray-400">{rec.type}</span>
                    {rec.created_at && (
                      <span className="text-[10px] text-gray-400 ml-auto">
                        {new Date(rec.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedRec(rec)}
                    className="font-semibold text-gray-900 hover:text-blue-600 transition-colors text-left"
                  >
                    {rec.title}
                  </button>
                  <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                  <div className="flex items-center gap-1.5 mt-2.5 text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg w-fit">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <span className="font-medium">Suggested:</span> {rec.suggested_action}
                  </div>
                </div>
                {rec.status === 'pending' && user?.role !== 'viewer' && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleAction(rec.recommendation_id, 'accepted')}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-sm hover:shadow-md font-medium active:scale-[0.97]"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Accept
                    </button>
                    <button
                      onClick={() => handleAction(rec.recommendation_id, 'deferred')}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all shadow-sm hover:shadow-md font-medium active:scale-[0.97]"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Defer
                    </button>
                    <button
                      onClick={() => setConfirmDismiss(rec.recommendation_id)}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition-all font-medium active:scale-[0.97]"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recommendation Detail Modal */}
      {selectedRec && (
        <RecommendationModal
          rec={selectedRec}
          onClose={() => setSelectedRec(null)}
          onAction={user?.role !== 'viewer' ? handleAction : undefined}
          onDismissRequest={(id) => setConfirmDismiss(id)}
        />
      )}

      {/* Confirm Dismiss Dialog */}
      {confirmDismiss && (
        <ConfirmDialog
          title="Dismiss Recommendation"
          message="Are you sure you want to dismiss this recommendation? This action cannot be undone."
          confirmLabel="Dismiss"
          confirmVariant="danger"
          onConfirm={() => {
            handleAction(confirmDismiss, 'rejected')
            setConfirmDismiss(null)
          }}
          onCancel={() => setConfirmDismiss(null)}
        />
      )}
    </div>
  )
}

function RecommendationModal({
  rec,
  onClose,
  onAction,
  onDismissRequest,
}: {
  rec: Recommendation
  onClose: () => void
  onAction?: (id: string, actionType: string) => void
  onDismissRequest?: (id: string) => void
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
        className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-6 py-4 flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <PriorityBadge priority={rec.priority} />
              <StatusBadge status={rec.status} />
              <span className="text-xs text-gray-400">{rec.type}</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900">{rec.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Description */}
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Description</label>
            <p className="text-sm text-gray-700 mt-1 leading-relaxed">{rec.description}</p>
          </div>

          {/* Suggested Action */}
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Suggested Action</label>
            <div className="flex items-start gap-2 mt-1.5 text-sm text-blue-700 bg-blue-50 px-4 py-3 rounded-xl">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <span>{rec.suggested_action}</span>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Status</label>
              <div className="mt-1">
                <StatusBadge status={rec.status} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Created</label>
              <p className="text-sm text-gray-700 mt-1">
                {rec.created_at
                  ? new Date(rec.created_at).toLocaleString([], {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })
                  : '-'}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Priority</label>
              <div className="mt-1">
                <PriorityBadge priority={rec.priority} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Type</label>
              <p className="text-sm text-gray-700 mt-1 capitalize">{rec.type}</p>
            </div>
          </div>

          {/* Action history */}
          {rec.actions && rec.actions.length > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Action History</label>
              <div className="mt-2 space-y-2">
                {rec.actions.map((action) => (
                  <div key={action.action_id} className="flex items-center gap-3 text-sm bg-gray-50 px-3 py-2 rounded-lg">
                    <StatusBadge status={action.action_type} />
                    {action.notes && <span className="text-gray-600 truncate">{action.notes}</span>}
                    <span className="text-xs text-gray-400 ml-auto shrink-0">
                      {new Date(action.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {rec.status === 'pending' && onAction && (
          <div className="sticky bottom-0 bg-white rounded-b-2xl border-t border-gray-100 px-6 py-4 flex justify-end gap-2">
            <button
              onClick={() => onAction(rec.recommendation_id, 'accepted')}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-sm font-medium active:scale-[0.97]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Accept
            </button>
            <button
              onClick={() => onAction(rec.recommendation_id, 'deferred')}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all shadow-sm font-medium active:scale-[0.97]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Defer
            </button>
            <button
              onClick={() => onDismissRequest ? onDismissRequest(rec.recommendation_id) : onAction(rec.recommendation_id, 'rejected')}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition-all font-medium active:scale-[0.97]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Dismiss
            </button>
          </div>
        )}
      </div>
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
    rejected: 'bg-gray-50 text-gray-500 border-gray-200',
    deferred: 'bg-amber-50 text-amber-700 border-amber-200',
    expired: 'bg-red-50 text-red-500 border-red-200',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${colors[status] ?? 'bg-gray-50 text-gray-500 border-gray-200'}`}>
      {status}
    </span>
  )
}

function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
}: {
  title: string
  message: string
  confirmLabel?: string
  confirmVariant?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}) {
  const confirmStyles =
    confirmVariant === 'danger'
      ? 'bg-red-600 text-white hover:bg-red-700 shadow-sm'
      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all active:scale-[0.97] ${confirmStyles}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
