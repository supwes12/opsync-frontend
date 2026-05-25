import api from './client'
import type {
  AuthResponse,
  DashboardState,
  DashboardMetrics,
  Recommendation,
  Alert,
  Shift,
  ShiftSummary,
  Restaurant,
  TrendsData,
  Settings,
  AuditLog,
} from '../types'

export const auth = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
  me: () => api.get<{ user: AuthResponse['user'] }>('/auth/me'),
}

export const dashboard = {
  current: () => api.get<DashboardState>('/dashboard/current'),
  metrics: (params?: { hours?: number }) =>
    api.get<DashboardMetrics>('/dashboard/metrics', { params }),
  evaluate: () => api.post('/dashboard/evaluate'),
  trends: (params?: { days?: number; shift_id?: string }) =>
    api.get<TrendsData>('/dashboard/trends', { params }),
}

export const settings = {
  get: () => api.get<{ settings: Settings }>('/settings'),
  update: (data: Partial<Settings>) =>
    api.put<{ settings: Settings }>('/settings', data),
}

export const recommendations = {
  list: (params?: { status?: string; priority?: string }) =>
    api.get<{ recommendations: Recommendation[] }>('/recommendations', { params }),
  get: (id: string) =>
    api.get<{ recommendation: Recommendation }>(`/recommendations/${id}`),
  act: (id: string, response_type: string, notes?: string) =>
    api.post(`/recommendations/${id}/action`, { response_type, notes }),
}

export const alerts = {
  list: (params?: { acknowledged?: boolean; severity?: string }) =>
    api.get<{ alerts: Alert[] }>('/alerts', { params }),
  acknowledge: (id: string) =>
    api.put(`/alerts/${id}/acknowledge`),
}

export const shifts = {
  list: (params?: { status?: string }) =>
    api.get<{ shifts: Shift[] }>('/shifts', { params }),
  create: (data: Partial<Shift>) =>
    api.post<{ shift: Shift }>('/shifts', data),
  update: (id: string, data: Partial<Shift>) =>
    api.put<{ shift: Shift }>(`/shifts/${id}`, data),
  summary: (id: string) =>
    api.get<ShiftSummary>(`/shifts/${id}/summary`),
}

export const audit = {
  list: (params?: { limit?: number }) =>
    api.get<{ audit_logs: AuditLog[] }>('/audit', { params }),
}

export const restaurants = {
  list: () => api.get<{ restaurants: Restaurant[] }>('/restaurants'),
  get: (id: string) => api.get<{ restaurant: Restaurant }>(`/restaurants/${id}`),
  create: (data: Partial<Restaurant>) =>
    api.post<{ restaurant: Restaurant }>('/restaurants', data),
  update: (id: string, data: Partial<Restaurant>) =>
    api.put<{ restaurant: Restaurant }>(`/restaurants/${id}`, data),
  delete: (id: string) => api.delete(`/restaurants/${id}`),
}
