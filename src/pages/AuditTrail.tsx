import { useEffect, useState } from 'react'
import { audit as auditApi } from '../api/endpoints'
import ErrorState from '../components/ErrorState'
import type { AuditLog } from '../types'

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch {
    return iso
  }
}

const actionColors: Record<string, { bg: string; text: string }> = {
  create: { bg: 'bg-green-50 border-green-200', text: 'text-green-700' },
  update: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
  delete: { bg: 'bg-red-50 border-red-200', text: 'text-red-700' },
  login: { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700' },
  acknowledge: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
  accept: { bg: 'bg-green-50 border-green-200', text: 'text-green-700' },
  reject: { bg: 'bg-red-50 border-red-200', text: 'text-red-700' },
  defer: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
}

function getActionStyle(action: string): { bg: string; text: string } {
  const lower = action.toLowerCase()
  for (const key of Object.keys(actionColors)) {
    if (lower.includes(key)) return actionColors[key]
  }
  return { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-700' }
}

const objectIcons: Record<string, React.ReactNode> = {
  recommendation: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  alert: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  shift: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  settings: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    </svg>
  ),
  user: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
}

function getObjectIcon(objectType: string): React.ReactNode {
  const lower = objectType.toLowerCase()
  for (const key of Object.keys(objectIcons)) {
    if (lower.includes(key)) return objectIcons[key]
  }
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

export default function AuditTrail() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = () => {
    setLoading(true)
    setError(null)
    auditApi.list({ limit: 100 })
      .then((res) => setLogs(res.data.audit_logs))
      .catch(() => setError('Failed to load audit logs.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchLogs} />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
          <p className="text-sm text-gray-500 mt-0.5">Complete history of system actions and changes</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
            {logs.length} entries
          </span>
          <button
            onClick={fetchLogs}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-base font-semibold text-gray-600">No audit entries yet</p>
          <p className="text-sm text-gray-400 mt-1.5 max-w-xs text-center">
            Activity will be recorded here as users interact with the system.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left text-gray-500">
                  <th className="px-6 py-3.5 font-medium">Timestamp</th>
                  <th className="px-6 py-3.5 font-medium">User</th>
                  <th className="px-6 py-3.5 font-medium">Action</th>
                  <th className="px-6 py-3.5 font-medium">Object</th>
                  <th className="px-6 py-3.5 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => {
                  const style = getActionStyle(log.action)
                  return (
                    <tr
                      key={log.audit_id}
                      className={`border-b border-gray-100 hover:bg-blue-50/50 transition-colors ${
                        idx % 2 === 1 ? 'bg-gray-50/50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap text-xs">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                            {log.user_email.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-gray-700 truncate max-w-[180px]" title={log.user_email}>
                            {log.user_email}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${style.bg} ${style.text}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="text-gray-400">{getObjectIcon(log.object_type)}</span>
                          <span className="capitalize">{log.object_type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 max-w-[300px]">
                        <span className="truncate block" title={log.details ?? ''}>
                          {log.details || <span className="text-gray-300">--</span>}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
