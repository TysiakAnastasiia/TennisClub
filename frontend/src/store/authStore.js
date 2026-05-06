import { create } from 'zustand'

const stored = localStorage.getItem('user')

export const useAuthStore = create((set, get) => ({
  user:  stored ? JSON.parse(stored) : null,
  token: localStorage.getItem('token') || null,

  login: (token, role, email) => {
    const user = { role, email }
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ token, user })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ token: null, user: null })
  },

  isAdmin:  () => get().user?.role === 'admin',
  isStaff:  () => get().user?.role === 'staff',
  isClient: () => get().user?.role === 'client',
  canManage:() => ['admin', 'staff'].includes(get().user?.role),
}))
