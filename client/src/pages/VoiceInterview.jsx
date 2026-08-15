import { useCallback, useEffect, useRef, useState } from 'react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import axios from '../lib/api'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  History,
  Keyboard,
  Loader2,
  Mic,
  RotateCcw,
  Sparkles,
  Square,
  Trash2,
  TrendingUp,
  Volume2,
} from 'lucide-react'

const DIFFICULTIES = [
  { id: 'easy', label: 'Easy', hint: 'Fundamentals & warm-up questions' },
  { id: 'medium', label: 'Medium', hint: 'Standard placement-round depth' },
  { id: 'hard', label: 'Hard', hint: 'Deep-dive, follow-up style questions' },
]
const QUESTION_COUNTS = [3, 5, 8]

const cardStyle = {
  background: 'rgba(255,255,255,0.9)',
  border: '1px solid rgba(148,163,184,0.18)',
  borderRadius: 22,
  padding: 26,
  backdropFilter: 'blur(20px)',
  boxShadow: '0 18px 50px rgba(15,23,42,0.1)',
}

const primaryButtonStyle = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  padding: '13px 22px', borderRadius: 14, border: '1px solid rgba(84,104,255,0.24)',
  background: 'linear-gradient(135deg,rgba(84,104,255,0.94),rgba(14,165,233,0.84))',
  color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer',
}

const secondaryButtonStyle = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  padding: '13px 22px', borderRadius: 14, border: '1px solid rgba(148,163,184,0.24)',
  background: 'rgba(255,255,255,0.9)', color: '#0f172a', fontWeight: 800, fontSize: 14, cursor: 'pointer',
}

const ghostButtonStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '8px 14px', borderRadius: 999, border: '1px solid rgba(148,163,184,0.2)',
  background: 'rgba(255,255,255,0.8)', color: '#475569', fontWeight: 700, fontSize: 13, cursor: 'pointer',
}

function ScoreBadge({ score }) {
  const value = typeof score === 'number' ? score : 0
  const color = value >= 7 ? '#16a34a' : value >= 4 ? '#d97706' : '#dc2626'
  const bg = value >= 7 ? 'rgba(22,163,74,0.1)' : value >= 4 ? 'rgba(217,119,6,0.1)' : 'rgba(220,38,38,0.1)'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px',
      borderRadius: 999, background: bg, color, fontWeight: 800, fontSize: 13,
    }}>
      {value}/10
    </span>
  )
}

export default function VoiceInterview() {
  const { user } = useAuth()

  // setup | interview | feedback | report | history
  const [phase, setPhase] = useState('setup')
  // speaking | listening | submitting  (only meaningful while phase === 'interview')
  const [interviewStatus, setInterviewStatus] = useState('speaking')

  const [role, setRole] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [totalQuestions, setTotalQuestions] = useState(5)

  const [interviewId, setInterviewId] = useState(null)
  const [questionNumber, setQuestionNumber] = useState(1)
  const [questionTotal, setQuestionTotal] = useState(5)
  const [questionText, setQuestionText] = useState('')

  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [manualMode, setManualMode] = useState(false)
  const [manualAnswer, setManualAnswer] = useState('')
  const [nextQuestionText, setNextQuestionText] = useState('')

  const [lastResult, setLastResult] = useState(null)
  const [viewedInterview, setViewedInterview] = useState(null)

  const [error, setError] = useState('')
  const [speechSupported, setSpeechSupported] = useState(true)
  const [starting, setStarting] = useState(false)

  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const recognitionRef = useRef(null)
  const finalTranscriptRef = useRef('')

  useEffect(() => {
    setRole(user?.targetRole || '')
  }, [user])

  useEffect(() => {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionCtor || !window.speechSynthesis) {
      setSpeechSupported(false)
      setManualMode(true)
    }
    return () => {
      window.speechSynthesis?.cancel()
      recognitionRef.current?.stop()
    }
  }, [])

  const speak = useCallback((text) => new Promise(resolve => {
    if (!window.speechSynthesis) { resolve(); return }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.98
    utterance.pitch = 1
    utterance.onend = resolve
    utterance.onerror = resolve
    window.speechSynthesis.speak(utterance)
  }), [])

  const startListening = useCallback(() => {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionCtor) { setManualMode(true); setInterviewStatus('listening'); return }

    finalTranscriptRef.current = ''
    setTranscript('')
    setInterimTranscript('')

    const recognition = new SpeechRecognitionCtor()
    recognition.lang = 'en-IN'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const text = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += `${text} `
        } else {
          interim += text
        }
      }
      setTranscript(finalTranscriptRef.current)
      setInterimTranscript(interim)
    }

    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError('Microphone access was blocked. Allow mic permissions, or type your answer instead.')
        setManualMode(true)
      } else {
        setError(`Speech recognition issue (${event.error}). You can type your answer instead.`)
      }
    }

    recognitionRef.current = recognition
    recognition.start()
    setInterviewStatus('listening')
  }, [])

  const askQuestion = useCallback(async (text) => {
    setInterviewStatus('speaking')
    setTranscript('')
    setInterimTranscript('')
    setManualAnswer('')
    await speak(text)
    if (!manualMode) startListening()
    else setInterviewStatus('listening')
  }, [speak, startListening, manualMode])

  const startInterview = async () => {
    setError('')
    setLastResult(null)
    setViewedInterview(null)
    setStarting(true)
    try {
      const res = await axios.post('/api/interview/start', {
        role: role || 'Software Developer',
        difficulty,
        totalQuestions,
      }, { withCredentials: true })
      setInterviewId(res.data.interviewId)
      setQuestionNumber(res.data.questionNumber)
      setQuestionTotal(res.data.totalQuestions)
      setQuestionText(res.data.question)
      setPhase('interview')
      askQuestion(res.data.question)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start the interview. Try again.')
    }
    setStarting(false)
  }

  const submitAnswer = async () => {
    recognitionRef.current?.stop()
    window.speechSynthesis?.cancel()
    const answerText = (manualMode ? manualAnswer : `${transcript} ${interimTranscript}`).trim()
    if (!answerText) {
      setError('Please say or type an answer before submitting.')
      return
    }
    setError('')
    setInterviewStatus('submitting')
    try {
      const res = await axios.post(`/api/interview/${interviewId}/answer`, { answer: answerText }, { withCredentials: true })
      setLastResult(res.data)
      if (res.data.isComplete) {
        setViewedInterview(res.data.interview)
        setPhase('report')
      } else {
        setNextQuestionText(res.data.nextQuestion)
        setPhase('feedback')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not evaluate that answer. Try again.')
      setInterviewStatus('listening')
    }
  }

  const continueToNext = () => {
    setQuestionNumber(prev => prev + 1)
    setQuestionText(nextQuestionText)
    setPhase('interview')
    askQuestion(nextQuestionText)
  }

  const resetInterview = () => {
    window.speechSynthesis?.cancel()
    recognitionRef.current?.stop()
    setPhase('setup')
    setInterviewId(null)
    setQuestionNumber(1)
    setQuestionText('')
    setTranscript('')
    setInterimTranscript('')
    setManualAnswer('')
    setLastResult(null)
    setViewedInterview(null)
    setError('')
  }

  const loadHistory = async () => {
    setError('')
    setLoadingHistory(true)
    try {
      const res = await axios.get('/api/interview', { withCredentials: true })
      setHistory(res.data)
      setPhase('history')
    } catch (err) {
      setError('Could not load past interviews.')
    }
    setLoadingHistory(false)
  }

  const viewPastReport = async (id) => {
    setError('')
    try {
      const res = await axios.get(`/api/interview/${id}`, { withCredentials: true })
      setViewedInterview(res.data)
      setPhase('report')
    } catch (err) {
      setError('Could not load that interview.')
    }
  }

  const deletePastInterview = async (id) => {
    try {
      await axios.delete(`/api/interview/${id}`, { withCredentials: true })
      setHistory(prev => prev.filter(item => item._id !== id))
    } catch (err) {
      setError('Could not delete that interview.')
    }
  }

  return (
    <div className="min-h-screen mesh-bg">
      <Navbar />
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '32px 20px 60px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 999, background: 'rgba(84,104,255,0.08)', border: '1px solid rgba(84,104,255,0.16)', color: '#4f46e5', fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
              <Sparkles size={13} /> Voice Mock Interview
            </div>
            <h1 style={{ color: '#0f172a', fontSize: 26, fontWeight: 800, margin: 0 }}>Practice interviews out loud, get scored like a real panel.</h1>
          </div>
          {phase !== 'setup' && (
            <button onClick={resetInterview} className="interactive" style={ghostButtonStyle}>
              <RotateCcw size={14} /> New interview
            </button>
          )}
        </div>

        {error && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 18, color: '#b91c1c', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 14, padding: '12px 14px', fontSize: 13, fontWeight: 600 }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        {phase === 'setup' && (
          <div style={cardStyle}>
            {!speechSupported && (
              <div style={{ marginBottom: 18, color: '#92400e', background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.2)', borderRadius: 14, padding: '12px 14px', fontSize: 13, fontWeight: 600 }}>
                Your browser doesn't support voice input/output (this works best in Chrome or Edge). You can still do the interview by typing your answers instead.
              </div>
            )}
            <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 8 }}>Role you're interviewing for</label>
            <input
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="e.g. Frontend Developer"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(148,163,184,0.3)', fontSize: 14, marginBottom: 20, boxSizing: 'border-box' }}
            />

            <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 8 }}>Difficulty</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 20 }}>
              {DIFFICULTIES.map(d => (
                <button
                  key={d.id}
                  onClick={() => setDifficulty(d.id)}
                  className="interactive"
                  style={{
                    textAlign: 'left', padding: '12px 14px', borderRadius: 14, cursor: 'pointer',
                    border: difficulty === d.id ? '1px solid rgba(84,104,255,0.5)' : '1px solid rgba(148,163,184,0.2)',
                    background: difficulty === d.id ? 'rgba(84,104,255,0.08)' : 'rgba(255,255,255,0.7)',
                  }}
                >
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>{d.label}</div>
                  <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{d.hint}</div>
                </button>
              ))}
            </div>

            <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 8 }}>Number of questions</label>
            <div style={{ display: 'flex', gap: 10, marginBottom: 26 }}>
              {QUESTION_COUNTS.map(count => (
                <button
                  key={count}
                  onClick={() => setTotalQuestions(count)}
                  className="interactive"
                  style={{
                    padding: '10px 18px', borderRadius: 12, cursor: 'pointer', fontWeight: 800,
                    border: totalQuestions === count ? '1px solid rgba(84,104,255,0.5)' : '1px solid rgba(148,163,184,0.2)',
                    background: totalQuestions === count ? 'rgba(84,104,255,0.08)' : 'rgba(255,255,255,0.7)',
                    color: totalQuestions === count ? '#4f46e5' : '#334155',
                  }}
                >
                  {count}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={startInterview} disabled={starting} className="interactive" style={{ ...primaryButtonStyle, opacity: starting ? 0.7 : 1, cursor: starting ? 'wait' : 'pointer' }}>
                {starting ? <Loader2 size={16} className="spin" /> : <Mic size={16} />}
                {starting ? 'Preparing questions…' : 'Start Interview'}
              </button>
              <button onClick={loadHistory} disabled={loadingHistory} className="interactive" style={secondaryButtonStyle}>
                {loadingHistory ? <Loader2 size={16} className="spin" /> : <History size={16} />}
                Past interviews
              </button>
            </div>
          </div>
        )}

        {(phase === 'interview' || phase === 'feedback') && (
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ color: '#4f46e5', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Question {questionNumber} of {questionTotal}
              </span>
              <div style={{ height: 8, width: 140, background: 'rgba(15,23,42,0.08)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(questionNumber - (phase === 'interview' ? 1 : 0)) / questionTotal * 100}%`, background: 'linear-gradient(90deg,#5468ff,#0ea5e9)' }} />
              </div>
            </div>

            <h2 style={{ color: '#0f172a', fontSize: 19, fontWeight: 800, lineHeight: 1.5, marginBottom: 20 }}>{questionText}</h2>

            {phase === 'interview' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, color: '#475569', fontSize: 13, fontWeight: 700 }}>
                  {interviewStatus === 'speaking' && (<><Volume2 size={16} className="spin-slow" /> Reading the question aloud…</>)}
                  {interviewStatus === 'listening' && !manualMode && (<><Mic size={16} style={{ color: '#16a34a' }} /> Listening — speak your answer, then submit.</>)}
                  {interviewStatus === 'listening' && manualMode && (<><Keyboard size={16} /> Type your answer below.</>)}
                  {interviewStatus === 'submitting' && (<><Loader2 size={16} className="spin" /> Evaluating your answer…</>)}
                </div>

                {!manualMode ? (
                  <div style={{ minHeight: 90, background: 'rgba(15,23,42,0.03)', border: '1px solid rgba(148,163,184,0.18)', borderRadius: 14, padding: 14, fontSize: 14, color: '#334155', lineHeight: 1.6, marginBottom: 16 }}>
                    {transcript || interimTranscript
                      ? <>{transcript}<span style={{ color: '#94a3b8' }}>{interimTranscript}</span></>
                      : <span style={{ color: '#94a3b8' }}>Your spoken answer will appear here as you talk…</span>}
                  </div>
                ) : (
                  <textarea
                    value={manualAnswer}
                    onChange={e => setManualAnswer(e.target.value)}
                    rows={4}
                    placeholder="Type your answer here…"
                    style={{ width: '100%', padding: 14, borderRadius: 14, border: '1px solid rgba(148,163,184,0.3)', fontSize: 14, marginBottom: 16, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }}
                  />
                )}

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    onClick={submitAnswer}
                    disabled={interviewStatus === 'speaking' || interviewStatus === 'submitting'}
                    className="interactive"
                    style={{ ...primaryButtonStyle, opacity: (interviewStatus === 'speaking' || interviewStatus === 'submitting') ? 0.6 : 1, cursor: (interviewStatus === 'speaking' || interviewStatus === 'submitting') ? 'not-allowed' : 'pointer' }}
                  >
                    {interviewStatus === 'submitting' ? <Loader2 size={16} className="spin" /> : <Square size={14} />}
                    Submit Answer
                  </button>
                  {speechSupported && (
                    <button
                      onClick={() => {
                        setManualMode(m => {
                          const next = !m
                          if (next) {
                            recognitionRef.current?.stop()
                          } else if (interviewStatus === 'listening') {
                            startListening()
                          }
                          return next
                        })
                      }}
                      className="interactive"
                      style={ghostButtonStyle}
                    >
                      <Keyboard size={14} /> {manualMode ? 'Switch to voice' : 'Type instead'}
                    </button>
                  )}
                </div>
              </>
            )}

            {phase === 'feedback' && lastResult && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <CheckCircle2 size={18} style={{ color: '#16a34a' }} />
                  <span style={{ fontWeight: 800, color: '#0f172a' }}>Answer recorded</span>
                  <ScoreBadge score={lastResult.score} />
                </div>
                <p style={{ color: '#334155', fontSize: 14, lineHeight: 1.7, marginBottom: 14 }}>{lastResult.feedback}</p>
                {lastResult.strengths?.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>What worked</div>
                    <ul style={{ margin: 0, paddingLeft: 18, color: '#334155', fontSize: 13, lineHeight: 1.7 }}>
                      {lastResult.strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {lastResult.improvements?.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Could improve</div>
                    <ul style={{ margin: 0, paddingLeft: 18, color: '#334155', fontSize: 13, lineHeight: 1.7 }}>
                      {lastResult.improvements.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
                <button onClick={continueToNext} className="interactive" style={primaryButtonStyle}>
                  Next Question <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {phase === 'report' && viewedInterview && (
          <div>
            <div style={{ ...cardStyle, marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
                <div>
                  <div style={{ color: '#4f46e5', fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Interview Report</div>
                  <h2 style={{ margin: '6px 0 0', color: '#0f172a', fontSize: 20 }}>{viewedInterview.role} · {viewedInterview.difficulty}</h2>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 34, fontWeight: 900, color: '#4f46e5' }}>{viewedInterview.report?.overallScore ?? '-'}<span style={{ fontSize: 16, color: '#94a3b8' }}>/10</span></div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Overall score</div>
                </div>
              </div>
              <p style={{ color: '#334155', fontSize: 14, lineHeight: 1.7, marginBottom: 18 }}>{viewedInterview.report?.summary}</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Strengths</div>
                  <ul style={{ margin: 0, paddingLeft: 18, color: '#334155', fontSize: 13, lineHeight: 1.8 }}>
                    {viewedInterview.report?.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Focus areas</div>
                  <ul style={{ margin: 0, paddingLeft: 18, color: '#334155', fontSize: 13, lineHeight: 1.8 }}>
                    {viewedInterview.report?.improvements?.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              </div>

              <div style={{ background: 'rgba(84,104,255,0.06)', border: '1px solid rgba(84,104,255,0.14)', borderRadius: 14, padding: 16, marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, color: '#4f46e5', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  <TrendingUp size={14} /> Recommendation
                </div>
                <p style={{ margin: 0, color: '#334155', fontSize: 14, lineHeight: 1.7 }}>{viewedInterview.report?.recommendation}</p>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={resetInterview} className="interactive" style={primaryButtonStyle}>
                  <RotateCcw size={16} /> Practice Again
                </button>
                <button onClick={loadHistory} className="interactive" style={secondaryButtonStyle}>
                  <History size={16} /> Past interviews
                </button>
              </div>
            </div>

            <div style={cardStyle}>
              <h3 style={{ margin: '0 0 16px', color: '#0f172a', fontSize: 16, fontWeight: 800 }}>Question-by-question breakdown</h3>
              <div style={{ display: 'grid', gap: 14 }}>
                {viewedInterview.questions?.map((q, i) => (
                  <div key={i} style={{ border: '1px solid rgba(148,163,184,0.18)', borderRadius: 14, padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                      <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 13 }}>Q{i + 1}. {q.question}</span>
                      <ScoreBadge score={q.score} />
                    </div>
                    {q.answer && <p style={{ margin: '0 0 8px', color: '#64748b', fontSize: 13, lineHeight: 1.6, fontStyle: 'italic' }}>"{q.answer}"</p>}
                    {q.feedback && <p style={{ margin: 0, color: '#334155', fontSize: 13, lineHeight: 1.6 }}>{q.feedback}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {phase === 'history' && (
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 16px', color: '#0f172a', fontSize: 16, fontWeight: 800 }}>Past interviews</h3>
            {history.length === 0 && <p style={{ color: '#64748b', fontSize: 14 }}>No interviews yet — start your first one above.</p>}
            <div style={{ display: 'grid', gap: 10 }}>
              {history.map(item => (
                <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, border: '1px solid rgba(148,163,184,0.18)', borderRadius: 14, padding: 14, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>{item.role} · {item.difficulty}</div>
                    <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>
                      {new Date(item.createdAt).toLocaleDateString()} · {item.status === 'completed' ? 'Completed' : 'In progress'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {item.status === 'completed' && <ScoreBadge score={item.report?.overallScore} />}
                    {item.status === 'completed' && (
                      <button onClick={() => viewPastReport(item._id)} className="interactive" style={ghostButtonStyle}>View report</button>
                    )}
                    <button onClick={() => deletePastInterview(item._id)} className="interactive" style={{ ...ghostButtonStyle, color: '#b91c1c' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={resetInterview} className="interactive" style={{ ...secondaryButtonStyle, marginTop: 18 }}>
              Back to setup
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
