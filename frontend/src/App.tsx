import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Progress from './pages/Progress'
import Lifestyle from './pages/Lifestyle'
import WorkoutSession from './pages/WorkoutSession'
import BottomNav from './components/BottomNav'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  const token = useAuthStore((s) => s.token)

  return (
    <BrowserRouter>
      <div className="max-w-md mx-auto min-h-screen flex flex-col">
        <Routes>
          <Route path="/login" element={token ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/session/:id" element={<PrivateRoute><WorkoutSession /></PrivateRoute>} />
          <Route path="/progress" element={<PrivateRoute><Progress /></PrivateRoute>} />
          <Route path="/lifestyle" element={<PrivateRoute><Lifestyle /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {token && <BottomNav />}
      </div>
    </BrowserRouter>
  )
}
