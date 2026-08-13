import { useState, useEffect } from 'react'
import axios from '../lib/api'
import Navbar from '../components/Navbar'
import { useNavigate } from 'react-router-dom'

// ── Analyzing Animation Component ──────────────────────────────
function AnalyzingAnimation() {
  const steps = [
    { icon: '📄', label: 'Reading your resume...', color: 'text-blue-600' },
    { icon: '🔍', label: 'Identifying your skills...', color: 'text-cyan-600' },
    { icon: '⚡', label: 'Finding skill gaps...', color: 'text-amber-600' },
    { icon: '🗓️', label: 'Building your roadmap...', color: 'text-violet-600' },
    { icon: '💼', label: 'Matching job roles...', color: 'text-emerald-600' },
    { icon: '✨', label: 'Finalizing your report...', color: 'text-indigo-600' },
  ]
  const [step, setStep] = useState(0)

  useEffect(() => {
  const interval = setInterval(() => {
    setStep(s => (s < 5 ? s + 1 : s))  // hardcode 5 instead of steps.length - 1
  }, 5000)
  return () => clearInterval(interval)
}, [])  // empty deps — no warning

  return (
    <div className="glass-card p-10 text-center mb-6">
      <div className="text-5xl mb-6 animate-pulse">
        🤖
      </div>
      <h3 className="text-slate-900 font-bold text-xl mb-2">Gemini AI is at work</h3>
      <p className="text-slate-500 text-sm mb-8">Building your personalized career report...</p>

      <div className="space-y-3 text-left max-w-xs mx-auto mb-8">
        {steps.map((s, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 transition-opacity duration-300 ${i <= step ? 'opacity-100' : 'opacity-20'}`}
          >
            <span className="text-lg">{s.icon}</span>
            <span className={`text-sm font-medium ${i <= step ? s.color : 'text-white/30'}`}>
              {s.label}
            </span>
            {i < step && <span className="ml-auto text-green-400 text-xs">✓</span>}
            {i === step && (
              <span className="ml-auto text-slate-400 text-xs animate-pulse">
                ...
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="w-full bg-slate-200 rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-700 ease-out"
          style={{ width: `${((step + 1) / steps.length) * 95}%` }}
        />
      </div>
    </div>
  )
}
// ── Main Analysis Page ──────────────────────────────────────────
export default function Analysis() {
  const [profile, setProfile] = useState(null)
  const [report, setReport] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    axios.get('/api/user/profile', { withCredentials: true })
      .then(res => {
        setProfile(res.data)
        if (res.data.skillGapReport) {
          try {
            setReport(JSON.parse(res.data.skillGapReport))
          } catch {
            setReport(res.data.skillGapReport)
          }
        }
      })
  }, [])

  const runAnalysis = async () => {
    setAnalyzing(true)
    setError('')
    try {
      const res = await axios.post('/api/ai/analyze', {}, { withCredentials: true })
      setReport(res.data.skillGapReport)
      const profileRes = await axios.get('/api/user/profile', { withCredentials: true })
      setProfile(profileRes.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Analysis failed. Try again.')
    }
    setAnalyzing(false)
  }
  return (
    <div className="page-enter" style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 18% 15%, rgba(84,104,255,0.12), transparent 30%), radial-gradient(circle at 82% 88%, rgba(14,165,233,0.08), transparent 28%), linear-gradient(135deg, #f8fbff 0%, #eef4ff 45%, #f6f8fc 100%)',
      position: 'relative'
    }}>
      <Navbar />
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ color: '#0f172a', fontSize: 26, fontWeight: 800, margin: '0 0 4px' }}>🔍 AI Resume Analysis</h1>
            <p style={{ color: 'rgba(15,23,42,0.58)', fontSize: 14, margin: 0 }}>AI-powered skill gap analysis based on your resume</p>
          </div>
          {!profile?.resumePath && (
            <button onClick={() => navigate('/dashboard')} style={{
              color: '#0f172a', fontSize: 14, background: 'rgba(255,255,255,0.84)',
              border: '1px solid rgba(84,104,255,0.18)', borderRadius: 999,
              padding: '9px 16px', cursor: 'pointer', fontWeight: 700
            }}>← Upload Resume First</button>
          )}
        </div>

        {/* No Resume Warning */}
        {!profile?.resumePath && (
          <div style={{
            background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.24)',
            borderRadius: 16, padding: '16px 20px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 12
          }}>
            <span style={{ fontSize: 24 }}>⚠️</span>
            <div>
              <p style={{ color: '#92400e', fontWeight: 700, margin: '0 0 2px' }}>No resume uploaded</p>
              <p style={{ color: 'rgba(146,64,14,0.8)', fontSize: 13, margin: 0 }}>Go to Dashboard and upload your resume PDF first.</p>
            </div>
          </div>
        )}

        {/* Ready to Analyze */}
        {profile?.resumePath && !report && !analyzing && (
          <div style={{
            background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(148,163,184,0.18)',
            borderRadius: 20, padding: '48px 24px', textAlign: 'center', marginBottom: 20,
            boxShadow: '0 16px 48px rgba(15,23,42,0.1)'
          }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🤖</div>
            <h3 style={{ color: '#0f172a', fontWeight: 700, fontSize: 20, margin: '0 0 8px' }}>Ready to analyze your resume</h3>
            <p style={{ color: 'rgba(15,23,42,0.58)', fontSize: 14, margin: '0 0 28px' }}>
              AI will identify skill gaps, generate a 6-week learning roadmap, and recommend job roles
            </p>
            <button onClick={runAnalysis} style={{
              padding: '14px 36px', borderRadius: 14, fontWeight: 700,
              fontSize: 16, color: 'white', cursor: 'pointer',
              background: 'linear-gradient(135deg, rgba(84,104,255,0.95), rgba(14,165,233,0.86))',
              border: '1px solid rgba(84,104,255,0.24)',
              boxShadow: '0 18px 40px rgba(84,104,255,0.18)'
            }}>🚀 Run AI Analysis</button>
          </div>
        )}
        {/* Action Buttons when report exists */}
        {report && !analyzing && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <button onClick={runAnalysis} style={{
              padding: '10px 20px', borderRadius: 10, fontWeight: 600,
              fontSize: 14, color: '#0f172a', cursor: 'pointer',
              background: 'rgba(255,255,255,0.84)', border: '1px solid rgba(148,163,184,0.18)'
            }}>🔄 Re-analyze</button>
            <button onClick={() => navigate('/progress')} style={{
              padding: '10px 20px', borderRadius: 10, fontWeight: 600,
              fontSize: 14, color: 'white', cursor: 'pointer',
              background: 'linear-gradient(135deg,rgba(84,104,255,0.92),rgba(14,165,233,0.82))',
              border: '1px solid rgba(84,104,255,0.24)',
              boxShadow: '0 16px 32px rgba(84,104,255,0.16)'
            }}>📈 View Progress →</button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.24)',
            borderRadius: 14, padding: '14px 18px', marginBottom: 20,
            display: 'flex', gap: 10, alignItems: 'center'
          }}>
            <span>❌</span>
            <p style={{ color: '#991b1b', margin: 0, fontSize: 14 }}>{error}</p>
          </div>
        )}

        {/* Analyzing Animation */}
        {analyzing && <AnalyzingAnimation />}

        {/* Report Cards */}
        {report && !analyzing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Skill Gaps */}
            <div style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 18, padding: '22px 24px'
            }}>
              <h2 style={{ color: '#f87171', fontWeight: 700, fontSize: 16, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>❌</span> Skill Gaps Identified
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {report.missingSkills?.map((skill, i) => (
                  <span key={i} style={{
                    background: 'rgba(239,68,68,0.1)', color: '#991b1b',
                    padding: '7px 16px', borderRadius: 100,
                    border: '1px solid rgba(239,68,68,0.3)', fontSize: 13, fontWeight: 500
                  }}>{skill}</span>
                ))}
              </div>
            </div>

            {/* Strengths */}
            <div style={{
              background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: 18, padding: '22px 24px'
            }}>
              <h2 style={{ color: '#4ade80', fontWeight: 700, fontSize: 16, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>✅</span> Your Strengths
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {report.strengths?.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ color: '#4ade80', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span style={{ color: 'rgba(15,23,42,0.78)', fontSize: 14, lineHeight: 1.6 }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Areas to Improve */}
            <div style={{
              background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.25)',
              borderRadius: 18, padding: '22px 24px'
            }}>
              <h2 style={{ color: '#fbbf24', fontWeight: 700, fontSize: 16, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>⚡</span> Areas to Improve
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {report.improvements?.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ color: '#fbbf24', flexShrink: 0, marginTop: 1 }}>→</span>
                    <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 1.6 }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Roadmap */}
            {profile?.roadmap?.length > 0 && (
              <div style={{
                background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: 18, padding: '22px 24px'
              }}>
                <h2 style={{ color: '#818cf8', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>🗓️ Your 6-Week Learning Roadmap</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {profile.roadmap.map((week, i) => (
                    <div key={i} style={{
                      background: week.completed ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${week.completed ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 14, padding: '16px 18px', transition: 'all 0.2s'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: week.tasks?.length ? 10 : 0 }}>
                        <h3 style={{
                          color: week.completed ? '#4ade80' : 'white',
                          fontWeight: 700, fontSize: 14, margin: 0,
                          textDecoration: week.completed ? 'line-through' : 'none'
                        }}>Week {week.week}: {week.title}</h3>
                        {week.completed && <span style={{ color: '#4ade80', fontSize: 12, fontWeight: 600 }}>✅ Done</span>}
                      </div>
                      {week.tasks?.map((task, j) => (
                        <div key={j} style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
                          <span style={{ color: '#818cf8', fontSize: 12, flexShrink: 0, marginTop: 2 }}>→</span>
                          <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 1.6, wordBreak: 'break-word' }}>{task}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Job Recommendations */}
            {profile?.jobRecommendations?.length > 0 && (
              <div style={{
                background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.25)',
                borderRadius: 18, padding: '22px 24px'
              }}>
                <h2 style={{ color: '#a78bfa', fontWeight: 700, fontSize: 16, marginBottom: 14 }}>💼 Recommended Job Roles</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {profile.jobRecommendations.map((job, i) => (
                    <span key={i} style={{
                      background: 'rgba(139,92,246,0.12)', color: '#c4b5fd',
                      padding: '8px 18px', borderRadius: 100,
                      border: '1px solid rgba(139,92,246,0.35)', fontSize: 13, fontWeight: 500
                    }}>{job}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}