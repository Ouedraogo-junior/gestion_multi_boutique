import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { Role } from '@/utils/constants'

interface ProtectedRouteProps {
  children: React.ReactNode
  roles?: Role[]
}

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { token, user } = useAuth()

  if (!token || !user) return <Navigate to="/login" replace />

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}