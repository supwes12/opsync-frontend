import api from './client'
import type {
  AuthResponse,
  DashboardState,
  DashboardMetrics,
  Recommendation,
  Alert,
  Shift,
  Restaurant,
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
}

export const recommendations = {
  list: (params?: { status?: string; priority?: string }) =>
    api.get<{ recommendations: Recommendation[] }>('/recommendations', { params }),
  get: (id: string) =>
    api.get<{ recommendation: Recommendation }>(`/recommendations/${id}`),
  act: (id: string, action_type: string, notes?: string) =>
    api.post(`/recommendations/${id}/action`, { action_type, notes }),
}

export const alerts = {
  list: (params?: { acknowledged?: boolean; severity?: string }) =>
    api.get<{ alerts: Alert[] }>('/alerts', { params }),
  acknowledge: (id: string) =>
    api.post(`/alerts/${id}/acknowledge`),
}

export const shifts = {
  list: (params?: { status?: string }) =>
    api.get<{ shifts: Shift[] }>('/shifts', { params }),
  create: (data: Partial<Shift>) =>
    api.post<{ shift: Shift }>('/shifts', data),
  update: (id: string, data: Partial<Shift>) =>
    api.put<{ shift: Shift }>(`/shifts/${id}`, data),
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
