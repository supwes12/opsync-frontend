import { useEffect, useState } from 'react'
import { shifts as shiftsApi } from '../api/endpoints'
import type { Shift } from '../types'

export default function Shifts() {
  const [shiftList, setShiftList] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    const params = filter === 'all' ? {} : { status: filter }
    shiftsApi.list(params)
      .then((res) => setShiftList(res.data.shifts))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filter])

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
        <h1 className="text-2xl font-bold text-gray-900">Shifts</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {shiftList.length === 0 ? (
        <p className="text-gray-500">No shifts found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Start</th>
                <th className="pb-3 font-medium">End</th>
                <th className="pb-3 font-medium">Staff</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {shiftList.map((shift) => (
                <tr key={shift.shift_id} className="hover:bg-gray-50">
                  <td className="py-3 font-medium text-gray-900 capitalize">{shift.shift_type}</td>
                  <td className="py-3 text-gray-600">{new Date(shift.start_time).toLocaleString()}</td>
                  <td className="py-3 text-gray-600">
                    {shift.end_time ? new Date(shift.end_time).toLocaleString() : '—'}
                  </td>
                  <td className="py-3 text-gray-600">{shift.staff_count}</td>
                  <td className="py-3">
                    <StatusBadge status={shift.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    scheduled: 'bg-blue-100 text-blue-700',
    completed: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  )
}
