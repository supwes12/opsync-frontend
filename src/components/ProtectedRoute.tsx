import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { User } from '../types'

interface Props {
  children: React.ReactNode
  roles?: User['role'][]
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />

  return <>{children}</>
}
