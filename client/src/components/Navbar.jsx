import { useAuth } from '../context/AuthContext'
import { Link, useLocation } from 'react-router-dom'
import axios from '../lib/api'

export default function Navbar() {
  const { user } = useAuth()
  const location = useLocation()

  const logout = async () => {
  try {
    await axios.get('/auth/logout', { withCredentials: true })
  } catch (e) {
    console.error(e)
  }
  window.location.href = '/'
}

  const links = [
    { to: '/dashboard', label: '🏠 Dashboard' },
    { to: '/analysis', label: '🔍 Analysis' },
    { to: '/progress', label: '📈 Progress' },
    { to: '/resume-builder', label: '✍️ Resume Builder' },
    { to: '/interview', label: '🎤 Mock Interview' },
    { to: '/market-analytics', label: '📊 Market Analytics' },
    { to: '/chat', label: '🤖 AI Chat' },
  ]

  return (
    <nav style={{
      background: 'rgba(255,255,255,0.82)',
      backdropFilter: 'blur(24px)',
      borderBottom: '1px solid rgba(148,163,184,0.18)',
      boxShadow: '0 12px 40px rgba(15, 23, 42, 0.08)',
      position: 'sticky', top: 0, zIndex: 50,
      padding: '0 24px'
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        height: 64, display: 'flex',
        alignItems: 'center', justifyContent: 'space-between'
      }}>
        {/* Logo */}
        <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 34, height: 34, borderRadius: 12,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, rgba(84,104,255,0.14), rgba(14,165,233,0.14))',
            border: '1px solid rgba(84,104,255,0.18)',
            boxShadow: '0 8px 24px rgba(84,104,255,0.08)'
          }}>🎯</span>
          <span style={{
            fontSize: 20, fontWeight: 800,
            letterSpacing: '-0.03em',
            background: 'linear-gradient(90deg,#1e293b,#2563eb)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>CareerLens</span>
        </Link>
        {/* Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {links.map(link => {
            const active = location.pathname === link.to
            return (
              <Link key={link.to} to={link.to} style={{
                textDecoration: 'none',
                padding: '10px 16px',
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 700,
                color: active ? '#0f172a' : 'rgba(15,23,42,0.68)',
                background: active
                  ? 'linear-gradient(135deg, rgba(84,104,255,0.12), rgba(14,165,233,0.1))'
                  : 'rgba(255,255,255,0.7)',
                border: active
                  ? '1px solid rgba(84,104,255,0.22)'
                  : '1px solid transparent',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
              className="interactive"
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.color = '#0f172a'
                  e.currentTarget.style.border = '1px solid rgba(84,104,255,0.22)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.98)'
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.color = 'rgba(15,23,42,0.68)'
                  e.currentTarget.style.border = '1px solid transparent'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.7)'
                }
              }}>
                {link.label}
              </Link>
            )
          })}
        </div>
        {/* User + Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {user?.photo
          ? <img
              src={user.photo} 
              alt="" 
              onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }}
              style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(84,104,255,0.24)', boxShadow: '0 0 0 4px rgba(84,104,255,0.06)' }} 
            />
          : null
        }
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg,#5468ff,#0ea5e9)',
          display: user?.photo ? 'none' : 'flex',
          alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 800, fontSize: 15,
          border: '2px solid rgba(84,104,255,0.24)',
          boxShadow: '0 10px 28px rgba(84,104,255,0.14)'
        }}>{user?.name?.[0]?.toUpperCase() || 'U'}</div>
          <button
            onClick={logout}
            style={{
              padding: '9px 16px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 700,
              color: 'rgba(15,23,42,0.72)',
              background: 'rgba(255,255,255,0.8)',
              border: '1px solid rgba(148,163,184,0.2)',
              cursor: 'pointer',
              transition: 'all 0.25s ease'
            }}
            className="interactive"
            onMouseEnter={e => {
              e.currentTarget.style.color = '#0f172a'
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.8)'
              e.currentTarget.style.background = 'rgba(254,226,226,0.96)'
              e.currentTarget.style.boxShadow = '0 14px 30px rgba(239,68,68,0.12)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'rgba(15,23,42,0.72)'
              e.currentTarget.style.borderColor = 'rgba(148,163,184,0.18)'
              e.currentTarget.style.background = 'rgba(255,255,255,0.8)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            Logout
          </button>
        </div>
        </div>
    </nav>
  )
}
