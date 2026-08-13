import { useEffect, useRef } from 'react'

export default function Landing() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const particles = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.6 + 0.2
    }))

    let animId
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(129,140,248,${p.opacity})`
        ctx.fill()
        p.x += p.dx; p.y += p.dy
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1
      })
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', overflow: 'hidden', background: 'radial-gradient(circle at 18% 18%, rgba(84,104,255,0.14) 0%, transparent 36%), radial-gradient(circle at 82% 82%, rgba(14,165,233,0.12) 0%, transparent 32%), linear-gradient(135deg, #f8fbff 0%, #eef4ff 45%, #f6f8fc 100%)' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }} />

      {/* Glow blobs */}
      <div style={{ position: 'absolute', top: '-10%', left: '10%', width: 500, height: 500, borderRadius: '50%', background: 'rgba(84,104,255,0.12)', filter: 'blur(110px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '10%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(14,165,233,0.08)', filter: 'blur(90px)', pointerEvents: 'none' }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, maxWidth: 1100, margin: '0 auto', padding: '0 32px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 60 }}>

        {/* LEFT */}
        <div style={{ flex: 1, maxWidth: 520 }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(84,104,255,0.16)', marginBottom: 28, boxShadow: '0 12px 30px rgba(15,23,42,0.06)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'linear-gradient(135deg, #5468ff, #0ea5e9)', display: 'inline-block', boxShadow: '0 0 12px rgba(14,165,233,0.35)' }} />
            <span style={{ color: '#334155', fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Powered by Artificial Intelligence</span>
          </div>

          <h1 style={{ fontSize: 58, fontWeight: 800, lineHeight: 1.04, margin: '0 0 16px', color: 'white' }}>
            Your{' '}
            <span style={{ background: 'linear-gradient(135deg, #c7d2fe, #67e8f9, #f7b955)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              AI-Powered
            </span>
            <br />Career Mentor
          </h1>

          <p style={{ color: 'rgba(15,23,42,0.72)', fontSize: 17, lineHeight: 1.75, margin: '0 0 32px', maxWidth: 470 }}>
            Upload your resume or just chat, then get personalized skill-gap analysis, learning roadmaps, and job recommendations built for <span style={{ color: '#2563eb', fontWeight: 800 }}>Indian engineering students</span>.
          </p>

          {/* Feature list */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 36 }}>
            {[
              ['🔍', 'Resume Analysis'],
              ['⚡', 'Skill Gap Report'],
              ['🗓️', 'Learning Roadmap'],
              ['💼', 'Job Matching'],
              ['🤖', 'AI Career Chat'],
              ['📈', 'Progress Tracker'],
            ].map(([icon, label], i) => (
              <div key={i} className="interactive" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 16, background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(148,163,184,0.16)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55)' }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span style={{ color: 'rgba(15,23,42,0.72)', fontSize: 13, fontWeight: 700 }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 32 }}>
            {[['🆓', 'Free Forever'], ['⚡', 'Fast Analysis'], ['🎓', 'For Engineers']].map(([icon, label], i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
                <div style={{ color: 'rgba(15,23,42,0.58)', fontSize: 12, fontWeight: 700 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
        {/* RIGHT — Sign In Card */}
        <div style={{ width: 380, flexShrink: 0 }}>
          <div style={{
            borderRadius: 28, padding: 32,
            background: 'rgba(255,255,255,0.88)',
            border: '1px solid rgba(148,163,184,0.18)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 30px 70px rgba(15,23,42,0.12), 0 0 0 1px rgba(84,104,255,0.08)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
              <h2 style={{ color: '#0f172a', fontSize: 24, fontWeight: 800, margin: '0 0 6px' }}>Welcome back 👋</h2>
              <p style={{ color: 'rgba(15,23,42,0.56)', fontSize: 14, margin: 0 }}>Sign in to access your AI career mentor</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 24 }}>
              {[['🤖', 'AI-Powered'], ['✨', 'Free Forever'], ['🎓', 'For Engineers']].map(([icon, label], i) => (
                <div key={i} className="interactive" style={{ textAlign: 'center', padding: '12px 6px', borderRadius: 14, background: 'rgba(84,104,255,0.08)', border: '1px solid rgba(84,104,255,0.14)' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
                  <div style={{ color: 'rgba(15,23,42,0.6)', fontSize: 11, fontWeight: 800 }}>{label}</div>
                </div>
              ))}
            </div>

            <a href={`${import.meta.env.VITE_API_URL || ''}/auth/google`} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              width: '100%', padding: '14px 20px', borderRadius: 16,
              fontWeight: 700, fontSize: 16, color: 'white',
              background: 'linear-gradient(135deg, rgba(84,104,255,0.92), rgba(14,165,233,0.86))',
              border: '1px solid rgba(84,104,255,0.24)',
              boxShadow: '0 18px 40px rgba(84,104,255,0.18), inset 0 1px 0 rgba(255,255,255,0.2)',
              textDecoration: 'none', marginBottom: 12, boxSizing: 'border-box'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </a>

            <p style={{ textAlign: 'center', color: 'rgba(15,23,42,0.42)', fontSize: 12, margin: 0 }}>
              Free • No credit card • Use your college Gmail
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}