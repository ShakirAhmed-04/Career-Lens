import { useState, useEffect } from 'react'
import axios from '../lib/api'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')

  useEffect(() => {
    axios.get('/api/user/profile', { withCredentials: true })
      .then(res => setProfile(res.data))
  }, [])

  const uploadResume = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setUploadMsg('')
    const formData = new FormData()
    formData.append('resume', file)
    try {
      await axios.post('/api/resume/upload', formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setUploadMsg('✅ Resume uploaded successfully!')
      const res = await axios.get('/api/user/profile', { withCredentials: true })
      setProfile(res.data)
    } catch (err) {
      setUploadMsg(err.response?.data?.message || '❌ Upload failed. Try again.')
    }
    setUploading(false)
  }

  const removeResume = async () => {
    if (!window.confirm('Remove your resume? This will also clear your analysis results.')) return
    setRemoving(true)
    try {
      await axios.delete('/api/resume/remove', { withCredentials: true })
      setUploadMsg('🗑️ Resume removed.')
      const res = await axios.get('/api/user/profile', { withCredentials: true })
      setProfile(res.data)
    } catch {
      setUploadMsg('❌ Failed to remove resume.')
    }
    setRemoving(false)
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'

  if (!profile) return (
    <div className="min-h-screen mesh-bg">
      <Navbar />
      <div className="flex items-center justify-center h-64 text-sky-200 text-lg">Loading...</div>
    </div>
  )

  const completedWeeks = profile.roadmap?.filter(w => w.completed).length || 0
  const totalWeeks = profile.roadmap?.length || 0
  const progress = totalWeeks > 0 ? Math.round((completedWeeks / totalWeeks) * 100) : 0
  return (
    <div className="page-enter" style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 12% 12%, rgba(84,104,255,0.14), transparent 28%), radial-gradient(circle at 88% 84%, rgba(14,165,233,0.08), transparent 26%), linear-gradient(135deg, #f8fbff 0%, #eef4ff 45%, #f6f8fc 100%)',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Background decorative elements */}
      <div style={{ position: 'fixed', top: '-20%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'rgba(84,104,255,0.08)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-20%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'rgba(14,165,233,0.06)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: '40%', left: '30%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(14,165,233,0.04)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }} />

      <Navbar />

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '36px 24px', position: 'relative', zIndex: 1 }}>

        {/* Welcome Banner */}
        <div className="card-hover" style={{
          background: 'rgba(255,255,255,0.88)',
          border: '1px solid rgba(148,163,184,0.18)',
          borderRadius: 24, padding: '28px 32px',
          display: 'flex', alignItems: 'center', gap: 20, marginBottom: 36,
          backdropFilter: 'blur(20px)',
          boxShadow: '0 16px 50px rgba(15,23,42,0.1), inset 0 1px 0 rgba(255,255,255,0.65)'
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg,#5468ff,#0ea5e9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 800, fontSize: 26,
            border: '3px solid rgba(84,104,255,0.24)',
            boxShadow: '0 0 24px rgba(84,104,255,0.14)',
            flexShrink: 0
          }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: '#0f172a', fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>
              {greeting}, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p style={{ color: 'rgba(15,23,42,0.62)', fontSize: 14, margin: 0 }}>
              Welcome to your AI Career Mentor 
            </p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ color: 'rgba(15,23,42,0.34)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Today</div>
            <div style={{ color: 'rgba(15,23,42,0.68)', fontSize: 14, fontWeight: 700 }}>
              {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>
        {/* Section Title */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{ color: '#0f172a', fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>How would you like to get started?</h2>
          <p style={{ color: 'rgba(15,23,42,0.48)', fontSize: 14, margin: 0 }}>Choose your path to placement success</p>
        </div>

        {/* Two Path Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

          {/* PATH 1 */}
          <div className="card-hover" style={{
            background: 'rgba(255,255,255,0.88)',
            border: '1px solid rgba(148,163,184,0.18)',
            borderRadius: 20, padding: 24,
            backdropFilter: 'blur(20px)',
            boxShadow: '0 18px 50px rgba(15,23,42,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'linear-gradient(135deg,rgba(84,104,255,0.14),rgba(14,165,233,0.12))',
                border: '1px solid rgba(84,104,255,0.16)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
              }}>📄</div>
              <div>
                <h3 style={{ color: '#0f172a', fontWeight: 700, fontSize: 16, margin: '0 0 2px' }}>I have a Resume</h3>
                <p style={{ color: 'rgba(15,23,42,0.48)', fontSize: 13, margin: 0 }}>Upload PDF for AI analysis</p>
              </div>
            </div>

            {profile.resumePath ? (
              <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.18)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, color: '#166534', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>✅</span> Resume uploaded and ready for analysis
              </div>
            ) : (
              <div style={{ background: 'rgba(15,23,42,0.04)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, color: 'rgba(15,23,42,0.54)', fontSize: 13 }}>
                No resume uploaded yet. Upload your PDF resume below.
              </div>
            )}

            {uploadMsg && (
              <div style={{
                borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13,
                background: uploadMsg.includes('✅') ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                color: uploadMsg.includes('✅') ? '#86efac' : '#fca5a5',
                border: `1px solid ${uploadMsg.includes('✅') ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`
              }}>{uploadMsg}</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input type="file" accept=".pdf" onChange={uploadResume} className="hidden" id="resumeUpload" />
              <label htmlFor="resumeUpload" className="btn-pulse" style={{
                background: 'linear-gradient(135deg,rgba(84,104,255,0.94),rgba(14,165,233,0.84))',
                border: '1px solid rgba(84,104,255,0.24)',
                borderRadius: 12, padding: '11px 16px',
                color: 'white', fontWeight: 600, fontSize: 14,
                textAlign: 'center', cursor: 'pointer',
                transition: 'all 0.2s ease', display: 'block'
              }}>
                {uploading ? '⏳ Uploading...' : profile.resumePath ? '🔄 Re-upload Resume' : '📤 Choose PDF File'}
              </label>

              {profile.resumePath && (
                <>
                  <button onClick={removeResume} disabled={removing} style={{
                    background: 'rgba(255,255,255,0.84)', border: '1px solid rgba(239,68,68,0.18)',
                    borderRadius: 12, padding: '10px 16px',
                    color: '#b91c1c', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background='rgba(254,226,226,0.95)'; e.currentTarget.style.boxShadow='0 10px 20px rgba(239,68,68,0.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.84)'; e.currentTarget.style.boxShadow='none' }}
                  >{removing ? 'Removing...' : '🗑️ Remove Resume'}</button>

                  <button onClick={() => navigate('/analysis')} style={{
                    background: 'linear-gradient(135deg,rgba(34,197,94,0.92),rgba(16,185,129,0.82))',
                    border: '1px solid rgba(34,197,94,0.24)',
                    borderRadius: 12, padding: '11px 16px',
                    color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 0 20px rgba(34,197,94,0.15)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow='0 0 30px rgba(34,197,94,0.35)'; e.currentTarget.style.transform='translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow='0 0 20px rgba(34,197,94,0.15)'; e.currentTarget.style.transform='translateY(0)' }}
                  >🚀 Analyze Resume with AI →</button>
                </>
              )}
            </div>
          </div>

          {/* PATH 2 */}
          <div className="card-hover" style={{
            background: 'rgba(255,255,255,0.88)',
            border: '1px solid rgba(148,163,184,0.18)',
            borderRadius: 20, padding: 24,
            backdropFilter: 'blur(20px)',
            boxShadow: '0 18px 50px rgba(15,23,42,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'linear-gradient(135deg,rgba(84,104,255,0.14),rgba(14,165,233,0.12))',
                border: '1px solid rgba(84,104,255,0.16)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
              }}>💬</div>
              <div>
                <h3 style={{ color: '#0f172a', fontWeight: 700, fontSize: 16, margin: '0 0 2px' }}>I don't have a Resume</h3>
                <p style={{ color: 'rgba(15,23,42,0.48)', fontSize: 13, margin: 0 }}>Chat with AI to get guidance</p>
              </div>
            </div>
            <div style={{ background: 'rgba(15,23,42,0.04)', borderRadius: 12, padding: '14px 16px', marginBottom: 18 }}>
              <p style={{ color: 'rgba(15,23,42,0.6)', fontSize: 13, fontWeight: 700, margin: '0 0 10px' }}>In AI Chat you can:</p>
              {[
                ['🗺️', 'Tell your skills and get a roadmap'],
                ['💼', 'Ask about job roles for your stream'],
                ['🎯', 'Get interview preparation tips'],
                ['❓', 'Ask any career related question'],
              ].map(([icon, text], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                  <span style={{ fontSize: 14 }}>{icon}</span>
                  <span style={{ color: 'rgba(15,23,42,0.56)', fontSize: 13 }}>{text}</span>
                </div>
              ))}
            </div>

            <button onClick={() => navigate('/chat')} style={{
              width: '100%',
              background: 'linear-gradient(135deg,rgba(84,104,255,0.94),rgba(14,165,233,0.84))',
              border: '1px solid rgba(84,104,255,0.24)',
              borderRadius: 12, padding: '12px 16px',
              color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 0 20px rgba(139,92,246,0.2)'
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow='0 0 30px rgba(139,92,246,0.4)'; e.currentTarget.style.transform='translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow='0 0 20px rgba(139,92,246,0.2)'; e.currentTarget.style.transform='translateY(0)' }}
            className="interactive">💬 Start AI Career Chat →</button>
          </div>
        </div>

        {/* Resume Builder */}
        <div className="card-hover" style={{
          background: 'rgba(255,255,255,0.88)',
          border: '1px solid rgba(148,163,184,0.18)',
          borderRadius: 24,
          padding: 24,
          backdropFilter: 'blur(20px)',
          boxShadow: '0 18px 50px rgba(15,23,42,0.1)',
          marginBottom: 24
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
            <div style={{ maxWidth: 560 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 999, background: 'rgba(84,104,255,0.08)', border: '1px solid rgba(84,104,255,0.16)', color: '#4f46e5', fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
                <span>✍️</span> Resume Workspace
              </div>
              <h3 style={{ color: '#0f172a', fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Build a resume that looks like the sample, but feels personal to you.</h3>
              <p style={{ color: 'rgba(15,23,42,0.58)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                Choose from ATS-safe and creative templates, edit your sections live, duplicate drafts, and export a printable PDF when you are ready.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 220 }}>
              <button onClick={() => navigate('/resume-builder')} className="interactive" style={{
                padding: '12px 18px', borderRadius: 14,
                background: 'linear-gradient(135deg,rgba(84,104,255,0.94),rgba(14,165,233,0.84))',
                border: '1px solid rgba(84,104,255,0.24)', color: 'white',
                fontWeight: 800, cursor: 'pointer'
              }}>
                Open Resume Builder
              </button>
              <button onClick={() => navigate('/analysis')} className="interactive" style={{
                padding: '12px 18px', borderRadius: 14,
                background: 'rgba(255,255,255,0.88)',
                border: '1px solid rgba(148,163,184,0.18)', color: '#0f172a',
                fontWeight: 800, cursor: 'pointer'
              }}>
                Compare with AI Analysis
              </button>
            </div>
          </div>
        </div>

        {/* Progress Card */}
        {totalWeeks > 0 && (
          <div className="card-hover" style={{
            background: 'rgba(255,255,255,0.88)',
            border: '1px solid rgba(148,163,184,0.18)',
            borderRadius: 20, padding: '22px 24px',
            backdropFilter: 'blur(20px)', marginBottom: 16,
            boxShadow: '0 18px 50px rgba(15,23,42,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 style={{ color: '#2563eb', fontWeight: 700, fontSize: 16, margin: 0 }}>📈 Your Learning Progress</h2>
              <button onClick={() => navigate('/progress')} style={{
                color: '#0f172a', fontSize: 13, background: 'rgba(255,255,255,0.88)',
                border: '1px solid rgba(84,104,255,0.18)', borderRadius: 8,
                padding: '5px 12px', cursor: 'pointer', fontWeight: 600,
                transition: 'all 0.2s'
              }} className="interactive">View Full →</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'rgba(15,23,42,0.52)', fontSize: 13 }}>{completedWeeks} of {totalWeeks} weeks completed</span>
              <span style={{ color: '#2563eb', fontWeight: 800, fontSize: 15 }}>{progress}%</span>
            </div>
            <div style={{ background: 'rgba(15,23,42,0.08)', borderRadius: 10, height: 10 }}>
              <div style={{
                height: 10, borderRadius: 10,
                background: 'linear-gradient(90deg, #5468ff, #0ea5e9, #14b8a6)',
                width: `${progress}%`, transition: 'width 0.8s ease',
                boxShadow: '0 0 10px rgba(84,104,255,0.18)'
              }} />
            </div>
          </div>
        )}
        {/* Job Recommendations */}
        {profile.jobRecommendations?.length > 0 && (
          <div className="card-hover" style={{
            background: 'rgba(255,255,255,0.88)',
            border: '1px solid rgba(148,163,184,0.18)',
            borderRadius: 20, padding: '22px 24px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 18px 50px rgba(15,23,42,0.1)'
          }}>
            <h2 style={{ color: '#2563eb', fontWeight: 700, fontSize: 16, marginBottom: 14 }}>💼 Recommended Job Roles</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {profile.jobRecommendations.map((job, i) => (
                <span key={i} className="card-hover" style={{
                  background: 'rgba(84,104,255,0.08)', color: '#1e3a8a',
                  padding: '8px 18px', borderRadius: 100,
                  border: '1px solid rgba(84,104,255,0.18)', fontSize: 13, fontWeight: 700,
                  cursor: 'default'
                }} className="interactive">{job}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}