import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { useAuthStore } from './store/authStore'

import Home       from './pages/Home'
import Login      from './pages/Login'
import Register   from './pages/Register'
import Clubs      from './pages/Clubs'
import ClubDetail from './pages/ClubDetail'
import Events     from './pages/Events'
import Bookings   from './pages/Bookings'
import Profile    from './pages/Profile'
import Admin      from './pages/Admin'
import CancelPage from './pages/CancelPage'

function Protected({ children }) {
  const { user } = useAuthStore()
  return user ? children : <Navigate to="/login" replace />
}

function StaffOnly({ children }) {
  const { canManage } = useAuthStore()
  return canManage() ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            borderRadius: '8px',
            border: '1px solid var(--emerald-100)',
          },
          success: { iconTheme: { primary: '#059669', secondary: '#fff' } },
        }}
      />
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/"                           element={<Home />} />
          <Route path="/login"                      element={<Login />} />
          <Route path="/register"                   element={<Register />} />
          <Route path="/clubs"                      element={<Clubs />} />
          <Route path="/clubs/:id"                  element={<ClubDetail />} />
          <Route path="/events"                     element={<Events />} />
          <Route path="/cancel-registration/:token" element={<CancelPage />} />
          <Route path="/bookings"  element={<Protected><Bookings /></Protected>} />
          <Route path="/profile"   element={<Protected><Profile /></Protected>} />
          <Route path="/admin"     element={<StaffOnly><Admin /></StaffOnly>} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
