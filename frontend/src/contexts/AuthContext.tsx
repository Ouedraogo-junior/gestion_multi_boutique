import { createContext, useReducer, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import api from '../api/axios'
import type { Role } from '../utils/constants'
import type { Boutique } from '@/contexts/BoutiqueContext'

export interface User {
  id: number
  nom: string
  prenom: string
  pseudo: string
  role: Role
  boutique_id: number | null
  boutique?: Boutique
}

interface AuthState {
  token: string | null
  user: User | null
}

interface AuthContextType extends AuthState {
  ready: boolean
  login: (pseudo: string, password: string) => Promise<User>
  logout: () => Promise<void>
}

type AuthAction =
  | { type: 'LOGIN'; token: string; user: User }
  | { type: 'LOGOUT' }

const initialState: AuthState = {
  token: localStorage.getItem('token'),
  user:  JSON.parse(localStorage.getItem('user') ?? 'null'),
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN':  return { token: action.token, user: action.user }
    case 'LOGOUT': return { token: null, user: null }
    default:       return state
  }
}

// Contexte dans un fichier séparé du provider pour Fast Refresh
export const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
  }, [])

  useEffect(() => {
    if (!state.token) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }, [state.token])

  const login = async (pseudo: string, password: string): Promise<User> => {
    const { data } = await api.post('/auth/login', { pseudo, password })
    // Stocker immédiatement AVANT le dispatch
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    dispatch({ type: 'LOGIN', token: data.token, user: data.user })
    return data.user
  }

  const logout = async (): Promise<void> => {
    try { await api.post('/auth/logout') } catch (_) {}
    dispatch({ type: 'LOGOUT' })
    localStorage.clear()
  }

  return (
    <AuthContext.Provider value={{ ...state, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}