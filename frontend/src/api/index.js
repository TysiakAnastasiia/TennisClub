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

// Auth
export const authApi = {
  register:   (data)        => api.post('/auth/register', data),
  login:      (data)        => api.post('/auth/login', data),
  activate:   (id)          => api.post(`/auth/activate/${id}`),
  deactivate: (id)          => api.post(`/auth/deactivate/${id}`),
  listUsers:  ()            => api.get('/auth/users'),
  updateRole: (id, role)    => api.patch(`/auth/users/${id}/role`, { role }),
  updateUser: (id, data)    => api.put(`/auth/users/${id}`, data),
}

// Clubs
export const clubApi = {
  list:        ()                    => api.get('/clubs'),
  get:         (id)                  => api.get(`/clubs/${id}`),
  create:      (data)                => api.post('/clubs', data),
  update:      (id, data)            => api.put(`/clubs/${id}`, data),
  deactivate:  (id)                  => api.delete(`/clubs/${id}`),
  listCourts:  (clubId)              => api.get(`/clubs/${clubId}/courts`),
  addCourt:    (clubId, data)        => api.post(`/clubs/${clubId}/courts`, data),
  updateCourt: (clubId, cId, data)   => api.put(`/clubs/${clubId}/courts/${cId}`, data),
  deleteCourt: (clubId, cId)         => api.delete(`/clubs/${clubId}/courts/${cId}`),
}

// Bookings
export const bookingApi = {
  list:          ()     => api.get('/bookings'),
  create:        (data) => api.post('/bookings', data),
  cancel:        (id)   => api.delete(`/bookings/${id}`),
  courtBookings: (cId)  => api.get(`/bookings/court/${cId}`),
  pay:           (id)   => api.post(`/bookings/${id}/pay`),
}

// Events
export const eventApi = {
  list:            ()     => api.get('/events'),
  get:             (id)   => api.get(`/events/${id}`),
  create:          (data) => api.post('/events', data),
  deactivate:      (id)   => api.delete(`/events/${id}`),
  register:        (id)   => api.post(`/events/${id}/register`),
  unregister:      (id)   => api.delete(`/events/${id}/register`),
  participants:    (id)   => api.get(`/events/${id}/participants`),
  myRegistrations: ()     => api.get('/events/my-registrations'),
}

// Users/Profile
export const userApi = {
  me:            ()                      => api.get('/users/me'),
  update:        (data)                  => api.put('/users/me', data),
  getById:       (id)                    => api.get(`/users/by-auth/${id}`),
  list:          ()                      => api.get('/users'),
  joinClub:      (clubId, body)          => api.post(`/users/membership/${clubId}`, body),
  leaveClub:     (clubId)               => api.delete(`/users/membership/${clubId}`),
  getMembership: ()                      => api.get('/users/membership'),
}
