import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ── Auth ──────────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  activate: (id)   => api.post(`/auth/activate/${id}`),
  listUsers:()     => api.get('/auth/users'),
}

// ── Clubs ─────────────────────────────────────────────────
export const clubApi = {
  list:        ()              => api.get('/clubs'),
  get:         (id)            => api.get(`/clubs/${id}`),
  create:      (data)          => api.post('/clubs', data),
  update:      (id, data)      => api.put(`/clubs/${id}`, data),
  delete:      (id)            => api.delete(`/clubs/${id}`),
  listCourts:  (clubId)        => api.get(`/clubs/${clubId}/courts`),
  addCourt:    (clubId, data)  => api.post(`/clubs/${clubId}/courts`, data),
  deleteCourt: (clubId, cId)   => api.delete(`/clubs/${clubId}/courts/${cId}`),
}

// ── Bookings ──────────────────────────────────────────────
export const bookingApi = {
  list:          ()     => api.get('/bookings'),
  create:        (data) => api.post('/bookings', data),
  cancel:        (id)   => api.delete(`/bookings/${id}`),
  courtBookings: (cId)  => api.get(`/bookings/court/${cId}`),
}

// ── Events ────────────────────────────────────────────────
export const eventApi = {
  list:          ()      => api.get('/events'),
  get:           (id)    => api.get(`/events/${id}`),
  create:        (data)  => api.post('/events', data),
  delete:        (id)    => api.delete(`/events/${id}`),
  register:      (id)    => api.post(`/events/${id}/register`),
  unregister:    (id)    => api.delete(`/events/${id}/register`),
  participants:  (id)    => api.get(`/events/${id}/participants`),
}

// ── Users ─────────────────────────────────────────────────
export const userApi = {
  me:     ()     => api.get('/users/me'),
  update: (data) => api.put('/users/me', data),
}
