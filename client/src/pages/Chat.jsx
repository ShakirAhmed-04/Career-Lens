import { useState, useEffect, useRef } from 'react'
import axios from '../lib/api'
import Navbar from '../components/Navbar'
import ReactMarkdown from 'react-markdown'

const JOB_ROLES = [
  'Full Stack Developer', 'Frontend Developer', 'Backend Developer',
  'Data Analyst', 'Machine Learning Engineer', 'DevOps Engineer',
  'Android Developer', 'Cloud Engineer', 'QA Engineer',
  'Cybersecurity Analyst', 'Blockchain Developer'
]

const SKILLS_BY_ROLE = {
  'Full Stack Developer': ['React', 'Node.js', 'MongoDB', 'Express', 'REST APIs', 'Git', 'JavaScript'],
  'Frontend Developer': ['React', 'Vue.js', 'TypeScript', 'Tailwind CSS', 'Next.js', 'HTML/CSS'],
  'Backend Developer': ['Node.js', 'Python', 'Java', 'REST APIs', 'SQL', 'MongoDB', 'Docker'],
  'Data Analyst': ['Python', 'SQL', 'Excel', 'Power BI', 'Pandas', 'NumPy', 'Statistics'],
  'Machine Learning Engineer': ['Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'SQL', 'Deep Learning'],
  'DevOps Engineer': ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Linux', 'Terraform', 'Jenkins'],
  'Android Developer': ['Java', 'Kotlin', 'Android SDK', 'Firebase', 'REST APIs', 'Git'],
  'Cloud Engineer': ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'Linux'],
  'QA Engineer': ['Selenium', 'JUnit', 'Postman', 'JIRA', 'Manual Testing', 'API Testing'],
  'Cybersecurity Analyst': ['Networking', 'Linux', 'Python', 'Ethical Hacking', 'SIEM', 'OWASP'],
  'Blockchain Developer': ['Solidity', 'Web3.js', 'Ethereum', 'Smart Contracts', 'JavaScript']
}

export default function Chat() {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: "Hi! I'm your AI Career Mentor. Ask me anything about your career, skills, or job preparation! 🚀"
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedSkills, setSelectedSkills] = useState([])
  const bottomRef = useRef(null)

  useEffect(() => {
  axios.get('/api/chat/history', { withCredentials: true })
    .then(res => {
      if (res.data && res.data.length > 0) {
        setMessages([
          { role: 'assistant', content: "Hi! I'm your AI Career Mentor. Here's your previous conversation:" },
          ...res.data.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
        ])
      }
    })
    .catch(() => {})
  }, [])
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    const userText = text || input.trim()
    if (!userText) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userText }])
    setLoading(true)
    try {
      const res = await axios.post('/api/chat', { message: userText }, { withCredentials: true })
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Something went wrong. Please try again.' }])
    }
    setLoading(false)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const toggleSkill = (skill) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    )
  }

  const generateRoadmap = () => {
    if (!selectedRole) return
    const msg = `I want to become a ${selectedRole}. Skills I already know: ${selectedSkills.length > 0 ? selectedSkills.join(', ') : 'none yet'}. Please give me a detailed week-by-week roadmap to become placement-ready.`
    sendMessage(msg)
    setSelectedRole('')
    setSelectedSkills([])
  }
  return (
    <div className="page-enter" style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 18% 15%, rgba(84,104,255,0.12), transparent 30%), radial-gradient(circle at 82% 88%, rgba(14,165,233,0.08), transparent 28%), linear-gradient(135deg, #f8fbff 0%, #eef4ff 45%, #f6f8fc 100%)',
      position: 'relative'
    }}>
      <Navbar />

      <div style={{ flex: 1, maxWidth: 800, width: '100%', margin: '0 auto', padding: '24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Quick Start Panel */}
        <div style={{
          background: 'rgba(255,255,255,0.88)',
          border: '1px solid rgba(148,163,184,0.18)',
          borderRadius: 18, padding: '16px 20px',
          boxShadow: '0 16px 48px rgba(15,23,42,0.1)'
        }}>
          <p style={{ color: '#2563eb', fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            ⚡ Quick Start — Pick a role to get your roadmap instantly:
          </p>

          <select
            value={selectedRole}
            onChange={e => { setSelectedRole(e.target.value); setSelectedSkills([]) }}
            style={{
              width: '100%', marginBottom: 10, padding: '10px 14px',
              borderRadius: 12, color: '#0f172a', fontSize: 14,
              background: 'rgba(255,255,255,0.9)',
              border: '1px solid rgba(148,163,184,0.2)',
              outline: 'none', cursor: 'pointer'
            }}
          >
            <option value="" style={{ background: '#ffffff' }}>🎯 Select your target job role...</option>
            {JOB_ROLES.map(r => <option key={r} value={r} style={{ background: '#ffffff' }}>{r}</option>)}
          </select>

          {selectedRole && (
            <>
              <p style={{ color: 'rgba(15,23,42,0.52)', fontSize: 12, marginBottom: 8 }}>
                Tap skills you already know (optional):
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {SKILLS_BY_ROLE[selectedRole]?.map(skill => (
                  <button key={skill} onClick={() => toggleSkill(skill)} style={{
                    padding: '5px 12px', borderRadius: 100, fontSize: 12, fontWeight: 500,
                    cursor: 'pointer', transition: 'all 0.2s',
                    background: selectedSkills.includes(skill) ? 'rgba(84,104,255,0.12)' : 'rgba(255,255,255,0.86)',
                    border: `1px solid ${selectedSkills.includes(skill) ? 'rgba(84,104,255,0.28)' : 'rgba(148,163,184,0.16)'}`,
                    color: selectedSkills.includes(skill) ? '#1d4ed8' : 'rgba(15,23,42,0.72)'
                  }} className="interactive">{skill}</button>
                ))}
              </div>
              <button onClick={generateRoadmap} style={{
                padding: '9px 20px', borderRadius: 10, fontWeight: 700,
                fontSize: 13, color: 'white', cursor: 'pointer',
                background: 'linear-gradient(135deg,rgba(84,104,255,0.94),rgba(14,165,233,0.84))',
                border: '1px solid rgba(84,104,255,0.24)',
                boxShadow: '0 16px 32px rgba(84,104,255,0.16)'
              }} className="interactive">🚀 Generate My Roadmap</button>
            </>
          )}
        </div>
        {/* Messages */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', paddingBottom: 8 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '78%',
                padding: '12px 18px',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                fontSize: 14, lineHeight: 1.6,
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, rgba(84,104,255,0.94), rgba(14,165,233,0.84))'
                  : 'rgba(255,255,255,0.9)',
                border: `1px solid ${msg.role === 'user' ? 'rgba(84,104,255,0.24)' : 'rgba(148,163,184,0.18)'}`,
                color: msg.role === 'user' ? 'white' : 'rgba(15,23,42,0.88)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 16px 36px rgba(15,23,42,0.08)'
              }}>
                {msg.role === 'user' ? (
                  <span>{msg.content}</span>
                ) : (
                  <div style={{ whiteSpace: 'pre-wrap' }}
                    dangerouslySetInnerHTML={{
                      __html: msg.content
                        .replace(/\*\*(.+?)\*\*/g, '<strong style="color:white;font-weight:700">$1</strong>')
                        .replace(/^## (.+)$/gm, '<div style="color:#a5b4fc;font-weight:700;font-size:15px;margin:10px 0 6px">$1</div>')
                        .replace(/^### (.+)$/gm, '<div style="color:#c7d2fe;font-weight:600;margin:8px 0 4px">$1</div>')
                        .replace(/^\* (.+)$/gm, '<div style="padding-left:12px;margin-bottom:3px">• $1</div>')
                        .replace(/^- (.+)$/gm, '<div style="padding-left:12px;margin-bottom:3px">• $1</div>')
                    }}
                  />
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                padding: '12px 18px', borderRadius: '18px 18px 18px 4px',
                background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(148,163,184,0.18)',
                minWidth: 180
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>🤖</span>
                  <span style={{ color: 'rgba(15,23,42,0.58)', fontSize: 13, fontWeight: 600 }}>AI is thinking...</span>
                </div>
                {['Reading your message...', 'Generating response...', 'Almost done...'].map((label, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: i === 0 ? '#60a5fa' : i === 1 ? '#a78bfa' : '#34d399',
                      opacity: 0.8
                    }} />
                    <span style={{ color: 'rgba(15,23,42,0.44)', fontSize: 11 }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        {/* Input */}
        <div style={{
          display: 'flex', gap: 10, alignItems: 'flex-end',
          background: 'rgba(255,255,255,0.88)',
          border: '1px solid rgba(148,163,184,0.18)',
          borderRadius: 16, padding: '10px 12px',
          backdropFilter: 'blur(16px)'
        }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about career paths, skills, interviews..."
            rows={1}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#0f172a', fontSize: 14, resize: 'none',
              lineHeight: 1.5, maxHeight: 120,
              caretColor: '#2563eb'
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            style={{
              width: 40, height: 40, borderRadius: 12, border: 'none',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              background: 'linear-gradient(135deg, #5468ff, #0ea5e9)',
              boxShadow: '0 0 20px rgba(84,104,255,0.22)',
              color: 'white', fontSize: 18, fontWeight: 700,
              opacity: input.trim() && !loading ? 1 : 0.35,
              flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }} className="interactive">↑</button>
        </div>
      </div>
    </div>
  )
}