import { useEffect, useState, useMemo } from 'react'
import { staff as staffApi } from '../api/endpoints'
import ErrorState from '../components/ErrorState'
import type { StaffMember, StaffScheduleEntry } from '../types'

const POSITION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Shift Lead': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  'Line Cook': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  'Cashier': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  'Drive-Thru': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Prep Cook': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Dishwasher': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getPositionColor(position: string) {
  return POSITION_COLORS[position] ?? { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }
}

function getShiftAbbr(shiftType: string | null): string {
  if (!shiftType) return 'OFF'
  const map: Record<string, string> = { morning: 'AM', afternoon: 'PM', evening: 'EVE' }
  return map[shiftType] ?? shiftType.slice(0, 3).toUpperCase()
}

function getScheduleColor(status: string): { bg: string; text: string } {
  const map: Record<string, { bg: string; text: string }> = {
    completed: { bg: 'bg-green-100', text: 'text-green-700' },
    scheduled: { bg: 'bg-blue-100', text: 'text-blue-700' },
    off: { bg: 'bg-gray-100', text: 'text-gray-400' },
    called_out: { bg: 'bg-red-100', text: 'text-red-700' },
  }
  return map[status] ?? { bg: 'bg-gray-100', text: 'text-gray-400' }
}

function getCurrentWeekDates(): string[] {
  const now = new Date()
  const day = now.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + mondayOffset)

  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    dates.push(`${yyyy}-${mm}-${dd}`)
  }
  return dates
}

function getTodayStr(): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function formatHireDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return iso
  }
}

export default function Staff() {
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [positionFilter, setPositionFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchStaff = () => {
    setLoading(true)
    setError(null)
    staffApi.list()
      .then((res) => setStaffList(res.data.staff))
      .catch(() => setError('Failed to load staff.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchStaff()
  }, [])

  const filtered = useMemo(() => {
    return staffList.filter((s) => {
      if (positionFilter !== 'all' && s.position !== positionFilter) return false
      if (statusFilter !== 'all' && s.status !== statusFilter) return false
      return true
    })
  }, [staffList, positionFilter, statusFilter])

  const weekDates = useMemo(() => getCurrentWeekDates(), [])
  const today = useMemo(() => getTodayStr(), [])

  const activeCount = staffList.filter((s) => s.status === 'active').length
  const onShiftToday = staffList.filter((s) => {
    const todayEntry = s.schedule.find((e) => e.date === today)
    return todayEntry && todayEntry.status !== 'off' && todayEntry.status !== 'called_out'
  }).length
  const offToday = staffList.filter((s) => {
    const todayEntry = s.schedule.find((e) => e.date === today)
    return !todayEntry || todayEntry.status === 'off'
  }).length
  const calledOutToday = staffList.filter((s) => {
    const todayEntry = s.schedule.find((e) => e.date === today)
    return todayEntry && todayEntry.status === 'called_out'
  }).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchStaff} />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Staff</h1>
            <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
              {filtered.length}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">View employee schedules and availability</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
          >
            <option value="all">All Positions</option>
            <option value="Shift Lead">Shift Lead</option>
            <option value="Line Cook">Line Cook</option>
            <option value="Cashier">Cashier</option>
            <option value="Drive-Thru">Drive-Thru</option>
            <option value="Prep Cook">Prep Cook</option>
            <option value="Dishwasher">Dishwasher</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-xl text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-soft" />
          {activeCount} Active
        </div>
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-xl text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          {onShiftToday} On Shift Today
        </div>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-gray-400" />
          {offToday} Off Today
        </div>
        {calledOutToday > 0 && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            {calledOutToday} Called Out
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <p className="text-base font-semibold text-gray-600">No staff found</p>
          <p className="text-sm text-gray-400 mt-1.5 max-w-xs text-center">
            Staff members will appear here once they are added to the system.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((member) => (
            <StaffCard key={member.staff_id} member={member} weekDates={weekDates} today={today} />
          ))}
        </div>
      )}
    </div>
  )
}

function StaffCard({
  member,
  weekDates,
  today,
}: {
  member: StaffMember
  weekDates: string[]
  today: string
}) {
  const posColor = getPositionColor(member.position)
  const scheduleMap = new Map<string, StaffScheduleEntry>()
  for (const entry of member.schedule) {
    scheduleMap.set(entry.date, entry)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {member.first_name[0]}{member.last_name[0]}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-900 truncate">
              {member.first_name} {member.last_name}
            </h3>
            <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${posColor.bg} ${posColor.text} ${posColor.border}`}>
              {member.position}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`w-2 h-2 rounded-full ${member.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className={`text-xs font-medium ${member.status === 'active' ? 'text-green-600' : 'text-gray-400'}`}>
            {member.status === 'active' ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="space-y-1.5 text-xs text-gray-500 mb-4">
        {member.phone && (
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>{member.phone}</span>
          </div>
        )}
        {member.email && (
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="truncate">{member.email}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Hired {formatHireDate(member.hire_date)}</span>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">This Week</p>
        <div className="grid grid-cols-7 gap-1">
          {weekDates.map((date, i) => {
            const entry = scheduleMap.get(date)
            const isToday = date === today
            const status = entry?.status ?? 'off'
            const shiftType = entry?.shift_type ?? null
            const color = getScheduleColor(status)
            const abbr = status === 'called_out' ? 'OUT' : getShiftAbbr(shiftType)

            return (
              <div key={date} className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-medium text-gray-400">{DAY_LABELS[i]}</span>
                <div
                  className={`w-full aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold ${color.bg} ${color.text} ${
                    isToday ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                  }`}
                >
                  {abbr}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">{member.stats.days_worked_this_week}d / {member.stats.hours_this_week}h</span>
          <span className="text-gray-300">this week</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-medium">{member.stats.days_worked_this_month}d / {member.stats.hours_this_month}h</span>
          <span className="text-gray-300">this month</span>
        </div>
      </div>
    </div>
  )
}
