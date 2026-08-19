import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import axios from '../lib/api'
import {
  AlertCircle,
  Building2,
  Loader2,
  MapPin,
  Minus,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'

const cardStyle = {
  background: 'rgba(255,255,255,0.9)',
  border: '1px solid rgba(148,163,184,0.18)',
  borderRadius: 22,
  padding: 24,
  backdropFilter: 'blur(20px)',
  boxShadow: '0 18px 50px rgba(15,23,42,0.1)',
}

const ghostButtonStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '9px 16px', borderRadius: 999, border: '1px solid rgba(148,163,184,0.2)',
  background: 'rgba(255,255,255,0.85)', color: '#475569', fontWeight: 700, fontSize: 13, cursor: 'pointer',
}

function TrendIcon({ trend }) {
  if (trend === 'up') return <TrendingUp size={16} style={{ color: '#16a34a' }} />
  if (trend === 'down') return <TrendingDown size={16} style={{ color: '#dc2626' }} />
  return <Minus size={16} style={{ color: '#94a3b8' }} />
}

function SectionHeading({ eyebrow, title }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ color: '#4f46e5', fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{eyebrow}</div>
      <h3 style={{ margin: '4px 0 0', color: '#0f172a', fontSize: 17, fontWeight: 800 }}>{title}</h3>
    </div>
  )
}

export default function MarketAnalytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = async (force = false) => {
    setError('')
    if (force) setRefreshing(true); else setLoading(true)
    try {
      const res = await axios.get('/api/market/dashboard', {
        params: force ? { refresh: 'true' } : {},
        withCredentials: true,
      })
      setData(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load market analytics right now.')
    }
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { load(false) }, [])

  return (
    <div className="min-h-screen mesh-bg">
      <Navbar />
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '32px 20px 60px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 999, background: 'rgba(84,104,255,0.08)', border: '1px solid rgba(84,104,255,0.16)', color: '#4f46e5', fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
              <Sparkles size={13} /> Market Analytics
            </div>
            <h1 style={{ color: '#0f172a', fontSize: 26, fontWeight: 800, margin: 0 }}>
              This week in {data?.city || 'Bangalore'} tech jobs
            </h1>
            {data?.lastUpdated && (
              <p style={{ color: '#94a3b8', fontSize: 13, margin: '6px 0 0' }}>
                Live data via {data.source} · updated {new Date(data.lastUpdated).toLocaleDateString()}
              </p>
            )}
          </div>
          <button onClick={() => load(true)} disabled={loading || refreshing} className="interactive" style={{ ...ghostButtonStyle, opacity: (loading || refreshing) ? 0.6 : 1 }}>
            {refreshing ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />}
            Refresh
          </button>
        </div>

        {error && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 18, color: '#b91c1c', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 14, padding: '12px 14px', fontSize: 13, fontWeight: 600 }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        {loading && !data && (
          <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 10, color: '#64748b', fontWeight: 700 }}>
            <Loader2 size={18} className="spin" /> Loading live job-market data…
          </div>
        )}

        {data && (
          <div style={{ display: 'grid', gap: 20 }}>
            {/* Skill Demand Trends */}
            <div style={cardStyle}>
              <SectionHeading eyebrow="Skill Demand" title="Skill demand trends" />
              <div style={{ display: 'grid', gap: 10 }}>
                {data.skillTrends.map(item => (
                  <div key={item.skill} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 12, background: 'rgba(15,23,42,0.03)' }}>
                    <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>{item.skill}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: '#475569', fontSize: 13 }}>{item.count.toLocaleString('en-IN')} postings</span>
                      <TrendIcon trend={item.trend} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Hiring Companies */}
            <div style={cardStyle}>
              <SectionHeading eyebrow="This week" title="Top hiring companies" />
              {data.topCompanies.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: 13 }}>No company data available right now.</p>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {data.topCompanies.map(company => (
                    <div key={company.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 12, background: 'rgba(15,23,42,0.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Building2 size={16} style={{ color: '#4f46e5' }} />
                        <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>{company.name}</span>
                      </div>
                      <span style={{ color: '#475569', fontSize: 13, fontWeight: 700 }}>{company.count} openings</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Salary Ranges */}
            <div style={cardStyle}>
              <SectionHeading eyebrow="Compensation" title="Salary ranges by skill" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                {data.salaryRanges.map(range => (
                  <div key={range.label} style={{ border: '1px solid rgba(148,163,184,0.18)', borderRadius: 14, padding: 16 }}>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14, marginBottom: 6 }}>{range.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#4f46e5' }}>
                      ₹{range.minLpa}-{range.maxLpa} <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 700 }}>LPA</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Role Demand by City */}
            <div style={cardStyle}>
              <SectionHeading eyebrow="Geography" title="Role demand by city" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                {data.cityRoleDemand.map(cityData => (
                  <div key={cityData.city}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                      <MapPin size={15} style={{ color: '#4f46e5' }} />
                      <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>{cityData.city}</span>
                    </div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {cityData.roles.map(role => (
                        <div key={role.role}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#334155', marginBottom: 4 }}>
                            <span>{role.role}</span>
                            <span style={{ fontWeight: 800 }}>{role.percent}%</span>
                          </div>
                          <div style={{ height: 7, background: 'rgba(15,23,42,0.08)', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min(100, role.percent)}%`, background: 'linear-gradient(90deg,#5468ff,#0ea5e9)' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending Skills */}
            <div style={cardStyle}>
              <SectionHeading eyebrow="This month" title="Trending skills" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16a34a', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                    <TrendingUp size={14} /> Rising
                  </div>
                  {data.trendingSkills.rising.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: 13 }}>Not enough history yet — check back after the next weekly refresh.</p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {data.trendingSkills.rising.map(skill => (
                        <span key={skill} style={{ padding: '6px 12px', borderRadius: 999, background: 'rgba(22,163,74,0.1)', color: '#16a34a', fontWeight: 800, fontSize: 13 }}>{skill}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                    <TrendingDown size={14} /> Falling
                  </div>
                  {data.trendingSkills.falling.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: 13 }}>Not enough history yet — check back after the next weekly refresh.</p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {data.trendingSkills.falling.map(skill => (
                        <span key={skill} style={{ padding: '6px 12px', borderRadius: 999, background: 'rgba(220,38,38,0.1)', color: '#dc2626', fontWeight: 800, fontSize: 13 }}>{skill}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
