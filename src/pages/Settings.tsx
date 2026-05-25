import { useEffect, useState } from 'react'
import { settings as settingsApi } from '../api/endpoints'
import { useAuth } from '../contexts/AuthContext'
import ErrorState from '../components/ErrorState'
import type { Settings as SettingsType } from '../types'

type Tab = 'alerts' | 'staffing' | 'inventory' | 'account'

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
  {
    key: 'alerts',
    label: 'Alerts',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    key: 'staffing',
    label: 'Staffing',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    key: 'inventory',
    label: 'Inventory',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    key: 'account',
    label: 'Account',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
]

export default function Settings() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('alerts')
  const [settings, setSettings] = useState<SettingsType | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Form values
  const [queueSurge, setQueueSurge] = useState('')
  const [lowInventory, setLowInventory] = useState('')
  const [laborImbalance, setLaborImbalance] = useState('')
  const [ticketTimeMax, setTicketTimeMax] = useState('')

  const fetchSettings = () => {
    setLoading(true)
    setError(null)
    settingsApi.get()
      .then((res) => {
        const s = res.data.settings
        setSettings(s)
        setQueueSurge(String(s.queue_surge_threshold))
        setLowInventory(String(s.low_inventory_threshold))
        setLaborImbalance(String(s.labor_imbalance_threshold))
        setTicketTimeMax(String(s.ticket_time_max_threshold))
      })
      .catch(() => setError('Failed to load settings.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    const fields = [
      { key: 'queue_surge_threshold', value: queueSurge, label: 'Queue surge threshold' },
      { key: 'low_inventory_threshold', value: lowInventory, label: 'Low inventory threshold' },
      { key: 'labor_imbalance_threshold', value: laborImbalance, label: 'Labor imbalance threshold' },
      { key: 'ticket_time_max_threshold', value: ticketTimeMax, label: 'Ticket time max threshold' },
    ]
    for (const f of fields) {
      if (f.value.trim() === '') {
        errs[f.key] = `${f.label} is required`
      } else if (isNaN(Number(f.value)) || Number(f.value) < 0) {
        errs[f.key] = `${f.label} must be a non-negative number`
      }
    }
    setValidationErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await settingsApi.update({
        queue_surge_threshold: Number(queueSurge),
        low_inventory_threshold: Number(lowInventory),
        labor_imbalance_threshold: Number(laborImbalance),
        ticket_time_max_threshold: Number(ticketTimeMax),
      })
      setSettings(res.data.settings)
      setSuccess('Settings saved successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch {
      setError('Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error && !settings) {
    return <ErrorState message={error} onRetry={fetchSettings} />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configure thresholds and account preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        {/* Success / Error banners */}
        {success && (
          <div className="mb-6 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-medium">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {success}
          </div>
        )}
        {error && settings && (
          <div className="mb-6 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {error}
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Alert Thresholds</h3>
              <p className="text-sm text-gray-500">Configure when alerts should be triggered</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ThresholdField
                label="Queue Surge Threshold"
                description="Trigger alert when queue depth exceeds this value"
                value={queueSurge}
                onChange={setQueueSurge}
                error={validationErrors.queue_surge_threshold}
                unit="orders"
              />
              <ThresholdField
                label="Ticket Time Max Threshold"
                description="Alert when avg ticket time exceeds this (in seconds)"
                value={ticketTimeMax}
                onChange={setTicketTimeMax}
                error={validationErrors.ticket_time_max_threshold}
                unit="seconds"
              />
            </div>
            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <SaveButton saving={saving} onClick={handleSave} />
            </div>
          </div>
        )}

        {activeTab === 'staffing' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Staffing Configuration</h3>
              <p className="text-sm text-gray-500">Set labor balance thresholds</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ThresholdField
                label="Labor Imbalance Threshold"
                description="Trigger alert when staff utilization ratio exceeds or drops below this"
                value={laborImbalance}
                onChange={setLaborImbalance}
                error={validationErrors.labor_imbalance_threshold}
                unit="ratio"
              />
            </div>
            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <SaveButton saving={saving} onClick={handleSave} />
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Inventory Configuration</h3>
              <p className="text-sm text-gray-500">Set minimum stock level thresholds</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ThresholdField
                label="Low Inventory Threshold"
                description="Alert when any inventory item falls below this quantity"
                value={lowInventory}
                onChange={setLowInventory}
                error={validationErrors.low_inventory_threshold}
                unit="units"
              />
            </div>
            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <SaveButton saving={saving} onClick={handleSave} />
            </div>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Account Information</h3>
              <p className="text-sm text-gray-500">Your profile details</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ReadonlyField label="Name" value={`${user?.first_name ?? ''} ${user?.last_name ?? ''}`} />
              <ReadonlyField label="Email" value={user?.email ?? ''} />
              <ReadonlyField label="Role" value={user?.role ?? ''} />
              <ReadonlyField label="Restaurant" value={user?.restaurant_name ?? ''} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ThresholdField({
  label,
  description,
  value,
  onChange,
  error,
  unit,
}: {
  label: string
  description: string
  value: string
  onChange: (v: string) => void
  error?: string
  unit?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <p className="text-xs text-gray-400 mb-2">{description}</p>
      <div className="relative">
        <input
          type="number"
          min="0"
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
            error ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
          }`}
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{unit}</span>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-600 capitalize">
        {value}
      </div>
    </div>
  )
}

function SaveButton({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm hover:shadow-md"
    >
      {saving ? (
        <>
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Saving...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Save Changes
        </>
      )}
    </button>
  )
}
