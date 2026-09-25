import { useAuthContext } from '../features/auth/authContext'

/**
 * Session, role and login/logout from the single AuthProvider (A1). Every consumer shares
 * one auth subscription and one `user_roles` read per user id.
 */
export function useAuth() {
  return useAuthContext()
}
