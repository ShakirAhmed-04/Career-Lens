//client/src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Chat from './pages/Chat'
import Analysis from './pages/Analysis'
import Progress from './pages/Progress'
import ResumeBuilder from './pages/ResumeBuilder'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen mesh-bg flex items-center justify-center">
      <div className="theme-heading text-slate-700 text-xl">Loading...</div>
    </div>
  )
  return user ? children : <Navigate to="/" />
}

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/resume-builder" element={<ResumeBuilder />} />
    <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
    <Route path="/analysis" element={<ProtectedRoute><Analysis /></ProtectedRoute>} />
    <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
  </Routes>
)

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}