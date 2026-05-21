export interface User {
  user_id: string
  email: string
  first_name: string
  last_name: string
  role: 'admin' | 'manager' | 'viewer'
  restaurant_id: string
  restaurant_name?: string
}

export interface Restaurant {
  restaurant_id: string
  name: string
  address: string
  city: string
  state: string
  zip_code: string
  phone: string
  timezone: string
}

export interface Shift {
  shift_id: string
  restaurant_id: string
  manager_id: string
  shift_type: string
  start_time: string
  end_time: string | null
  status: 'scheduled' | 'active' | 'completed'
  staff_count: number
  notes: string | null
}

export interface OperationalSnapshot {
  snapshot_id: string
  shift_id: string
  timestamp: string
  current_orders: number
  orders_last_15min: number
  orders_last_30min: number
  orders_last_60min: number
  avg_ticket_time_seconds: number
  queue_depth: number
  staff_on_duty: number
  drive_thru_count: number
  dine_in_count: number
  delivery_count: number
  inventory_json: string
}

export interface Recommendation {
  recommendation_id: string
  shift_id: string
  snapshot_id: string
  type: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  suggested_action: string
  status: 'pending' | 'accepted' | 'dismissed' | 'expired'
  created_at: string
  actions?: RecommendationAction[]
}

export interface RecommendationAction {
  action_id: string
  recommendation_id: string
  user_id: string
  action_type: 'accepted' | 'dismissed' | 'deferred'
  notes: string | null
  created_at: string
}

export interface Alert {
  alert_id: string
  shift_id: string
  snapshot_id: string
  type: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  message: string
  threshold_value: number
  actual_value: number
  acknowledged: boolean
  acknowledged_by: string | null
  created_at: string
}

export interface DashboardState {
  restaurant: Restaurant
  active_shift: Shift | null
  latest_snapshot: OperationalSnapshot | null
  recent_recommendations: Recommendation[]
  active_alerts: Alert[]
}

export interface DashboardMetrics {
  orders_over_time: { timestamp: string; count: number }[]
  channel_breakdown: { channel: string; count: number }[]
  avg_ticket_time_trend: { timestamp: string; seconds: number }[]
  staff_utilization: { timestamp: string; ratio: number }[]
}

export interface AuthResponse {
  access_token: string
  user: User
}
