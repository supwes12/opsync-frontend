import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './layouts/DashboardLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Recommendations from './pages/Recommendations'
import Alerts from './pages/Alerts'
import Shifts from './pages/Shifts'
import Restaurants from './pages/Restaurants'
import Trends from './pages/Trends'
import Settings from './pages/Settings'
import AuditTrail from './pages/AuditTrail'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/trends" element={<Trends />} />
        <Route
          path="/shifts"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <Shifts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <AuditTrail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/restaurants"
          element={
            <ProtectedRoute roles={['admin']}>
              <Restaurants />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
