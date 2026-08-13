import { useState, useEffect } from 'react'
import axios from '../lib/api'
import Navbar from '../components/Navbar'
export default function Progress() {
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    axios.get('/api/user/profile', { withCredentials: true })
      .then(res => setProfile(res.data))
  }, [])

  const toggleWeek = async (index, completed) => {
    await axios.put(`/api/progress/roadmap/${index}`, { completed }, { withCredentials: true })
    const profileRes = await axios.get('/api/user/profile', { withCredentials: true })
    setProfile(profileRes.data)
  }

  if (!profile) return (
    <div className="min-h-screen w-full" style={{ background: 'radial-gradient(circle at top left, rgba(84,104,255,0.14), transparent 30%), radial-gradient(circle at bottom right, rgba(14,165,233,0.08), transparent 28%), linear-gradient(135deg, #f8fbff 0%, #eef4ff 45%, #f6f8fc 100%)' }}>
      <Navbar />
      <div className="flex items-center justify-center h-64 text-slate-700">Loading...</div>
    </div>
  )

  const completed = profile.roadmap?.filter(w => w.completed).length || 0
  const total = profile.roadmap?.length || 0
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  return (
    <div className="page-enter" style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 16% 14%, rgba(84,104,255,0.14), transparent 30%), radial-gradient(circle at 84% 86%, rgba(14,165,233,0.08), transparent 26%), linear-gradient(135deg, #f8fbff 0%, #eef4ff 45%, #f6f8fc 100%)',
      position: 'relative'
    }}>
      <Navbar />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>

        <h1 style={{ color: '#0f172a', fontSize: 26, fontWeight: 800, margin: '0 0 6px' }}>📈 Learning Progress</h1>
        <p style={{ color: 'rgba(15,23,42,0.58)', fontSize: 14, marginBottom: 28 }}>Track your roadmap completion week by week.</p>

        {/* Progress Bar Card */}
        <div style={{
          background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(148,163,184,0.18)',
          borderRadius: 20, padding: 24, marginBottom: 24, backdropFilter: 'blur(16px)',
          boxShadow: '0 16px 48px rgba(15,23,42,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ color: 'rgba(15,23,42,0.56)', fontSize: 14 }}>{completed} of {total} weeks completed</span>
            <span style={{ color: '#2563eb', fontWeight: 800, fontSize: 16 }}>{pct}%</span>
          </div>
          <div style={{ background: 'rgba(15,23,42,0.08)', borderRadius: 10, height: 12 }}>
            <div style={{
              height: 12, borderRadius: 10,
              background: 'linear-gradient(90deg, #5468ff, #0ea5e9, #14b8a6)',
              width: `${pct}%`, transition: 'width 0.5s ease'
            }} />
          </div>
        </div>

        {total === 0 ? (
          <div style={{
            background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(148,163,184,0.18)',
            borderRadius: 20, padding: '40px 24px', textAlign: 'center', backdropFilter: 'blur(16px)',
            boxShadow: '0 16px 48px rgba(15,23,42,0.1)'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗺️</div>
            <p style={{ color: 'rgba(15,23,42,0.56)', fontSize: 15 }}>No roadmap yet.</p>
            <p style={{ color: 'rgba(15,23,42,0.38)', fontSize: 13 }}>Go to Analysis and run AI analysis first.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {profile.roadmap.map((week, i) => (
              <div key={i} style={{
                background: week.completed ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.88)',
                border: `1px solid ${week.completed ? 'rgba(34,197,94,0.22)' : 'rgba(148,163,184,0.18)'}`,
                borderRadius: 16, padding: 20, backdropFilter: 'blur(16px)',
                transition: 'all 0.3s ease',
                boxShadow: '0 14px 40px rgba(15,23,42,0.08)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: week.completed ? 'rgba(34,197,94,0.18)' : 'rgba(84,104,255,0.12)',
                      border: `2px solid ${week.completed ? 'rgba(34,197,94,0.34)' : 'rgba(84,104,255,0.24)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: week.completed ? '#166534' : '#1d4ed8',
                      fontWeight: 700, fontSize: 13, flexShrink: 0
                    }}>{week.completed ? '✓' : week.week}</div>
                    <h3 style={{
                      color: week.completed ? '#166534' : '#0f172a',
                      fontWeight: 700, fontSize: 15, margin: 0,
                      textDecoration: week.completed ? 'line-through' : 'none',
                      opacity: week.completed ? 0.7 : 1
                    }}>Week {week.week}: {week.title}</h3>
                  </div>
                  <button onClick={() => toggleWeek(i, !week.completed)} style={{
                    padding: '8px 20px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', transition: 'all 0.25s', flexShrink: 0,
                    background: week.completed
                      ? 'linear-gradient(135deg,rgba(34,197,94,0.92),rgba(16,185,129,0.82))'
                      : 'linear-gradient(135deg,rgba(84,104,255,0.92),rgba(14,165,233,0.82))',
                    border: `1.5px solid ${week.completed ? 'rgba(34,197,94,0.24)' : 'rgba(84,104,255,0.24)'}`,
                    color: 'white',
                    boxShadow: week.completed ? '0 0 15px rgba(34,197,94,0.14)' : '0 0 15px rgba(84,104,255,0.14)'
                  }} className="interactive">
                    {week.completed ? '✅ Completed' : '○ Mark Done'}
                  </button>
                </div>
                <div style={{ paddingLeft: 48 }}>
                  {week.tasks?.map((task, j) => (
                    <div key={j} style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
                      <span style={{ color: '#2563eb', fontSize: 12, marginTop: 2 }}>→</span>
                      <span style={{ color: 'rgba(15,23,42,0.58)', fontSize: 13, lineHeight: 1.6, wordBreak: 'break-word', flex: 1 }}>{task}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}    