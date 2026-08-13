import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  ChevronRight,
  Download,
  Edit3,
  FileText,
  GripVertical,
  LayoutTemplate,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  UserCircle2,
} from 'lucide-react'
import { generateResumePdf } from '../utils/resumePdf'

const STORAGE_KEY = 'careerlens.resume-builder.v1'

const defaultTemplates = [
  {
    id: 'clean',
    name: 'Clean',
    tag: 'Simple • ATS safe',
    tone: 'A polished single-column layout that keeps the content easy to scan and clean to read.',
    accent: '#6d5efc',
    surface: 'linear-gradient(135deg, rgba(109,94,252,0.12), rgba(14,165,233,0.08))',
  },
  {
    id: 'ats',
    name: 'ATS',
    tag: 'Structured • recruiter friendly',
    tone: 'A compact, structured layout that keeps sections aligned and ATS parsing straightforward.',
    accent: '#0ea5e9',
    surface: 'linear-gradient(135deg, rgba(14,165,233,0.12), rgba(84,104,255,0.08))',
  },
]

const progressSteps = [
  { id: 1, title: 'Choose template', detail: 'Pick the layout that fits your target role.' },
  { id: 2, title: 'Fill in content', detail: 'Add your experience, skills, and summary.' },
  { id: 3, title: 'Live preview', detail: 'Review the layout and content in real time.' },
  { id: 4, title: 'ATS score', detail: 'Improve your score with targeted suggestions.' },
  { id: 5, title: 'Download PDF', detail: 'Export your resume when you are happy with it.' },
]

function createStarterResume() {
  return {
    id: crypto.randomUUID(),
    title: 'My Resume',
    status: 'Editing',
    targetRole: 'Full Stack Developer',
    templateId: 'clean',
    updatedAt: 'Just now',
    profile: {
      fullName: 'Your Name',
      headline: 'Full Stack Developer',
      email: 'you@example.com',
      phone: '+91 98765 43210',
      location: 'Bengaluru, India',
      website: 'portfolio.example.com',
      linkedin: 'linkedin.com/in/yourname',
      github: 'github.com/yourname',
    },
    summary:
      'Engineering student building web applications with React, Node.js, and MongoDB. Focused on clean UI, efficient APIs, and placement-ready projects.',
    experience: [
      {
        company: 'Skillfinity Labs',
        role: 'Frontend Intern',
        duration: 'Jun 2025 - Aug 2025',
        points: [
          'Built reusable UI components for an internal learning dashboard.',
          'Improved page load performance by restructuring asset usage and layout flow.',
        ],
      },
    ],
    education: [
      {
        school: 'ABC College of Engineering',
        degree: 'B.Tech in Computer Science',
        duration: '2022 - 2026',
        score: 'CGPA: 8.6/10',
      },
    ],
    skills: ['React', 'Node.js', 'MongoDB', 'Express', 'JavaScript', 'Tailwind CSS', 'Git'],
    projects: [
      {
        name: 'CareerLens',
        stack: 'React, Node.js, MongoDB',
        detail: 'An AI career mentor with resume analysis, roadmap generation, and progress tracking.',
      },
    ],
    certifications: ['Full Stack Web Development', 'Cloud Foundations'],
  }
}

const starterResume = createStarterResume()

function loadResumes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return [starterResume]
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return [starterResume]
    return parsed
  } catch {
    return [starterResume]
  }
}

function getTemplate(templateId) {
  return defaultTemplates.find(template => template.id === templateId) || defaultTemplates[0]
}

function scoreResume(resume) {
  const hasSummary = resume.summary.trim().length > 50
  const hasExperience = resume.experience.some(item => item.company.trim() && item.role.trim())
  const hasEducation = resume.education.some(item => item.school.trim() && item.degree.trim())
  const hasProjects = resume.projects.some(item => item.name.trim())
  const skillsCount = resume.skills.filter(Boolean).length
  const contactCount = [resume.profile.email, resume.profile.phone, resume.profile.linkedin, resume.profile.github].filter(Boolean).length
  const score =
    30 +
    (hasSummary ? 12 : 0) +
    (hasExperience ? 16 : 0) +
    (hasEducation ? 10 : 0) +
    (hasProjects ? 12 : 0) +
    Math.min(14, skillsCount * 2) +
    Math.min(8, contactCount * 2)

  return Math.min(100, score)
}

function formatUpdatedAt() {
  return new Date().toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function ResumePreview({ resume }) {
  const template = getTemplate(resume.templateId)
  return (
    <div className="theme-surface" style={{ borderRadius: 28, overflow: 'hidden' }}>
      <div style={{ height: 12, background: template.surface }} />
      <div style={{ padding: 24, background: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
          <div>
            <div style={{ color: template.accent, fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 8 }}>
              {template.name}
            </div>
            <h3 style={{ color: '#0f172a', fontSize: 26, lineHeight: 1.1, margin: 0 }}>{resume.profile.fullName}</h3>
            <p style={{ color: '#475569', margin: '6px 0 0', fontWeight: 600 }}>{resume.profile.headline}</p>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: template.surface, display: 'grid', placeItems: 'center', color: template.accent, fontWeight: 800 }}>
            {resume.profile.fullName?.[0] || 'Y'}
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 18, color: '#475569', fontSize: 12 }}>
          {[resume.profile.email, resume.profile.phone, resume.profile.location, resume.profile.linkedin, resume.profile.github].filter(Boolean).map((item, index) => (
            <span key={index} style={{ background: 'rgba(15,23,42,0.04)', border: '1px solid rgba(148,163,184,0.18)', borderRadius: 999, padding: '6px 10px' }}>{item}</span>
          ))}
        </div>

        <Section title="Summary" accent={template.accent}>
          <p style={{ margin: 0, color: '#334155', lineHeight: 1.7 }}>{resume.summary}</p>
        </Section>

        <Section title="Experience" accent={template.accent}>
          {resume.experience.map((item, index) => (
            <div key={index} style={{ marginBottom: index === resume.experience.length - 1 ? 0 : 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
                <div>
                  <h4 style={{ margin: 0, color: '#0f172a' }}>{item.role || 'Role title'}</h4>
                  <p style={{ margin: '2px 0 0', color: '#2563eb', fontWeight: 700 }}>{item.company || 'Company'}</p>
                </div>
                <span style={{ color: '#64748b', fontSize: 13 }}>{item.duration || 'Duration'}</span>
              </div>
              <ul style={{ margin: '8px 0 0', paddingLeft: 18, color: '#334155', lineHeight: 1.7 }}>
                {(item.points.length ? item.points : ['Add achievement bullets here.']).map((point, pointIndex) => (
                  <li key={pointIndex}>{point}</li>
                ))}
              </ul>
            </div>
          ))}
        </Section>

        <Section title="Projects" accent={template.accent}>
          {resume.projects.map((project, index) => (
            <div key={index} style={{ marginBottom: index === resume.projects.length - 1 ? 0 : 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                <h4 style={{ margin: 0, color: '#0f172a' }}>{project.name || 'Project name'}</h4>
                <span style={{ color: '#64748b', fontSize: 13 }}>{project.stack || 'Tech stack'}</span>
              </div>
              <p style={{ margin: 0, color: '#334155', lineHeight: 1.7 }}>{project.detail || 'Project description goes here.'}</p>
            </div>
          ))}
        </Section>

        <Section title="Education" accent={template.accent}>
          {resume.education.map((item, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: index === resume.education.length - 1 ? 0 : 10 }}>
              <div>
                <h4 style={{ margin: 0, color: '#0f172a' }}>{item.degree || 'Degree'}</h4>
                <p style={{ margin: '2px 0 0', color: '#2563eb', fontWeight: 700 }}>{item.school || 'School'}</p>
              </div>
              <div style={{ textAlign: 'right', color: '#64748b', fontSize: 13 }}>
                <div>{item.duration || 'Duration'}</div>
                <div>{item.score || 'CGPA / Percentage'}</div>
              </div>
            </div>
          ))}
        </Section>

        <Section title="Skills" accent={template.accent}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {resume.skills.filter(Boolean).map((skill, index) => (
              <span key={index} style={{ background: template.surface, color: '#0f172a', border: `1px solid ${template.accent}30`, borderRadius: 999, padding: '7px 12px', fontSize: 13, fontWeight: 700 }}>
                {skill}
              </span>
            ))}
          </div>
        </Section>

        <Section title="Certifications" accent={template.accent}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {resume.certifications.filter(Boolean).map((cert, index) => (
              <span key={index} style={{ background: 'rgba(15,23,42,0.04)', color: '#334155', border: '1px solid rgba(148,163,184,0.18)', borderRadius: 999, padding: '7px 12px', fontSize: 13, fontWeight: 600 }}>
                {cert}
              </span>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, accent, children }) {
  return (
    <section style={{ marginBottom: 18 }}>
      <h4 style={{ margin: '0 0 10px', color: accent, fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 800 }}>
        {title}
      </h4>
      {children}
    </section>
  )
}

export default function ResumeBuilder() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('resumes')
  const [activeStep, setActiveStep] = useState(1)
  const [resumes, setResumes] = useState(loadResumes)
  const [activeResumeId, setActiveResumeId] = useState(loadResumes()[0].id)
  const [savedNotice, setSavedNotice] = useState('')
  const [exportingVariant, setExportingVariant] = useState('')
  const [exportError, setExportError] = useState('')
  const stepRefs = useRef({})

  const activeResume = useMemo(
    () => resumes.find(item => item.id === activeResumeId) || resumes[0],
    [resumes, activeResumeId]
  )

  const activeTemplate = getTemplate(activeResume?.templateId)
  const atsScore = activeResume ? scoreResume(activeResume) : 0

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resumes))
  }, [resumes])

  useEffect(() => {
    if (savedNotice) {
      const timer = setTimeout(() => setSavedNotice(''), 2200)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [savedNotice])

  const updateActiveResume = (updater) => {
    setResumes(prev => prev.map(resume => (resume.id === activeResumeId ? { ...resume, ...updater(resume), updatedAt: formatUpdatedAt() } : resume)))
  }

  const updateProfileField = (field, value) => {
    updateActiveResume(resume => ({
      profile: { ...resume.profile, [field]: value },
    }))
  }

  const updateTopLevel = (field, value) => {
    updateActiveResume(() => ({ [field]: value }))
  }

  const updateExperience = (index, field, value) => {
    updateActiveResume(resume => ({
      experience: resume.experience.map((item, currentIndex) => currentIndex === index ? { ...item, [field]: value } : item),
    }))
  }

  const updateExperiencePoint = (expIndex, pointIndex, value) => {
    updateActiveResume(resume => ({
      experience: resume.experience.map((item, currentIndex) => {
        if (currentIndex !== expIndex) return item
        return {
          ...item,
          points: item.points.map((point, currentPointIndex) => (currentPointIndex === pointIndex ? value : point)),
        }
      }),
    }))
  }

  const updateEducation = (index, field, value) => {
    updateActiveResume(resume => ({
      education: resume.education.map((item, currentIndex) => currentIndex === index ? { ...item, [field]: value } : item),
    }))
  }

  const updateProject = (index, field, value) => {
    updateActiveResume(resume => ({
      projects: resume.projects.map((item, currentIndex) => currentIndex === index ? { ...item, [field]: value } : item),
    }))
  }

  const updateSkills = (value) => {
    updateActiveResume(() => ({
      skills: value.split(',').map(item => item.trim()).filter(Boolean),
    }))
  }

  const updateCertifications = (value) => {
    updateActiveResume(() => ({
      certifications: value.split(',').map(item => item.trim()).filter(Boolean),
    }))
  }

  const addExperience = () => {
    updateActiveResume(resume => ({
      experience: [...resume.experience, { company: '', role: '', duration: '', points: [''] }],
    }))
  }

  const removeExperience = (index) => {
    updateActiveResume(resume => ({
      experience: resume.experience.filter((_, currentIndex) => currentIndex !== index),
    }))
  }

  const addEducation = () => {
    updateActiveResume(resume => ({
      education: [...resume.education, { school: '', degree: '', duration: '', score: '' }],
    }))
  }

  const removeEducation = (index) => {
    updateActiveResume(resume => ({
      education: resume.education.filter((_, currentIndex) => currentIndex !== index),
    }))
  }

  const addProject = () => {
    updateActiveResume(resume => ({
      projects: [...resume.projects, { name: '', stack: '', detail: '' }],
    }))
  }

  const removeProject = (index) => {
    updateActiveResume(resume => ({
      projects: resume.projects.filter((_, currentIndex) => currentIndex !== index),
    }))
  }

  const addExperiencePoint = (expIndex) => {
    updateActiveResume(resume => ({
      experience: resume.experience.map((item, index) => (
        index === expIndex ? { ...item, points: [...item.points, ''] } : item
      )),
    }))
  }

  const removeExperiencePoint = (expIndex, pointIndex) => {
    updateActiveResume(resume => ({
      experience: resume.experience.map((item, index) => {
        if (index !== expIndex) return item
        return { ...item, points: item.points.filter((_, currentPointIndex) => currentPointIndex !== pointIndex) }
      }),
    }))
  }

  const createResume = () => {
    const resume = createStarterResume()
    resume.title = `Resume ${resumes.length + 1}`
    resume.updatedAt = formatUpdatedAt()
    setResumes(prev => [resume, ...prev])
    setActiveResumeId(resume.id)
    setTab('build')
  }

  const duplicateResume = (resumeId) => {
    const source = resumes.find(item => item.id === resumeId)
    if (!source) return
    const duplicate = {
      ...JSON.parse(JSON.stringify(source)),
      id: crypto.randomUUID(),
      title: `${source.title} Copy`,
      status: 'Editing',
      updatedAt: formatUpdatedAt(),
    }
    setResumes(prev => [duplicate, ...prev])
    setActiveResumeId(duplicate.id)
    setTab('build')
  }

  const deleteResume = (resumeId) => {
    if (resumes.length === 1) return
    if (!window.confirm('Delete this resume?')) return
    setResumes(prev => prev.filter(item => item.id !== resumeId))
    if (activeResumeId === resumeId) {
      const next = resumes.find(item => item.id !== resumeId)
      setActiveResumeId(next?.id || '')
    }
  }

  const saveNow = () => {
    setSavedNotice('Resume saved locally')
  }

  const exportResume = async (variant) => {
    setExportError('')
    setExportingVariant(variant)
    try {
      // Let the UI paint the loading state before the (synchronous) PDF build runs.
      await new Promise(resolve => setTimeout(resolve, 30))
      generateResumePdf(activeResume, variant)
    } catch (err) {
      setExportError('Could not generate the PDF. Please try again.')
    } finally {
      setExportingVariant('')
    }
  }

  const goToStep = (stepId) => {
    setActiveStep(stepId)
    if (stepId === 1) setTab('resumes')
    if (stepId === 2) setTab('build')

    const section = stepRefs.current[stepId]
    if (section?.scrollIntoView) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const resetActive = () => {
    if (!window.confirm('Reset this resume to the starter version?')) return
    setResumes(prev => prev.map(item => (item.id === activeResumeId ? { ...createStarterResume(), id: item.id, title: item.title, templateId: item.templateId, updatedAt: formatUpdatedAt() } : item)))
  }

  if (!activeResume) {
    return null
  }

  return (
    <div className="page-enter" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fbff 0%, #eef4ff 45%, #f6f8fc 100%)' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '28px 20px 44px' }}>
        <div className="theme-surface" style={{ borderRadius: 36, padding: '26px 28px', marginBottom: 26 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg, #6d5efc, #0ea5e9)', display: 'grid', placeItems: 'center', color: '#fff', boxShadow: '0 14px 32px rgba(84,104,255,0.18)' }}>
                <FileText size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 15 }}>SkillfinityAI</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>AI Placement Platform</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/dashboard')} className="interactive" style={secondaryButtonStyle}>Back to Dashboard</button>
              <button onClick={() => navigate('/analysis')} className="interactive" style={primaryButtonStyle}>Review Resume Analysis</button>
            </div>
          </div>

          <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto' }}>
            <div style={{ color: '#8b7cf6', fontSize: 12, fontWeight: 800, letterSpacing: '0.24em', textTransform: 'uppercase', marginBottom: 12 }}>Resume Workspace</div>
            <h1 style={{ fontSize: 36, color: '#0f172a', margin: '0 0 12px' }}>Resume Builder</h1>
            <p style={{ margin: '0 auto 24px', maxWidth: 660, color: '#64748b', lineHeight: 1.75 }}>
              Build a professional, standout resume with curated templates, a live preview, and export-ready formatting.
            </p>

              <div style={{ display: 'inline-flex', gap: 8, padding: 6, background: 'rgba(15,23,42,0.05)', borderRadius: 999 }}>
              <button onClick={() => setTab('resumes')} className="interactive" style={pillButton(tab === 'resumes')}>
                My Resumes
              </button>
              <button onClick={() => setTab('build')} className="interactive" style={pillButton(tab === 'build')}>
                Build Resume
              </button>
            </div>
          </div>
        </div>

        {tab === 'resumes' ? (
          <section className="theme-surface" style={{ borderRadius: 32, padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ margin: 0, color: '#0f172a', fontSize: 22 }}>My Resumes</h2>
                <p style={{ margin: '6px 0 0', color: '#64748b' }}>Manage versions, duplicate a draft, or start fresh.</p>
              </div>
              <button onClick={createResume} className="interactive" style={primaryButtonStyle}>
                <Plus size={16} /> New Resume
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 18 }}>
              {resumes.map(resume => {
                const template = getTemplate(resume.templateId)
                const active = resume.id === activeResumeId
                const score = scoreResume(resume)
                return (
                  <article key={resume.id} className="interactive" onClick={() => { setActiveResumeId(resume.id); setTab('build') }} style={{ cursor: 'pointer', background: active ? 'rgba(84,104,255,0.08)' : 'rgba(255,255,255,0.92)', border: active ? '1px solid rgba(84,104,255,0.28)' : '1px solid rgba(148,163,184,0.18)', borderRadius: 22, overflow: 'hidden', boxShadow: active ? '0 18px 50px rgba(84,104,255,0.12)' : '0 18px 50px rgba(15,23,42,0.08)' }}>
                    <div style={{ height: 180, background: template.surface, position: 'relative', padding: 14 }}>
                      <div style={{ position: 'absolute', top: 14, left: 14, right: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ background: 'rgba(255,255,255,0.9)', color: template.accent, padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <Edit3 size={12} /> {resume.status}
                        </div>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', color: '#0f172a', display: 'grid', placeItems: 'center', fontWeight: 800, boxShadow: '0 10px 28px rgba(15,23,42,0.08)' }}>{Math.round(score / 10)}</div>
                      </div>
                      <div style={{ position: 'absolute', inset: '56px 18px 18px', borderRadius: 18, background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(148,163,184,0.2)', padding: 16, overflow: 'hidden' }}>
                        <div style={{ height: 6, width: '38%', borderRadius: 999, background: template.accent, marginBottom: 12, opacity: 0.9 }} />
                        <div style={{ height: 6, width: '62%', borderRadius: 999, background: 'rgba(15,23,42,0.12)', marginBottom: 8 }} />
                        <div style={{ height: 6, width: '46%', borderRadius: 999, background: 'rgba(15,23,42,0.12)', marginBottom: 14 }} />
                        <div style={{ display: 'grid', gap: 8 }}>
                          <div style={{ height: 8, width: '70%', borderRadius: 999, background: 'rgba(15,23,42,0.12)' }} />
                          <div style={{ height: 8, width: '85%', borderRadius: 999, background: 'rgba(15,23,42,0.08)' }} />
                          <div style={{ height: 8, width: '60%', borderRadius: 999, background: 'rgba(15,23,42,0.08)' }} />
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px', color: '#0f172a', fontSize: 18 }}>{resume.title}</h3>
                          <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>{resume.targetRole}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 12, color: '#94a3b8' }}>ATS</div>
                          <div style={{ color: '#0f172a', fontWeight: 800 }}>{score}%</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, color: '#64748b', fontSize: 12 }}>
                        <span>{template.name}</span>
                        <span>{resume.updatedAt}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px' }}>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setActiveResumeId(resume.id); setTab('build') }} style={secondaryButtonStyle} className="interactive">Open</button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); duplicateResume(resume.id) }} style={secondaryButtonStyle} className="interactive">Duplicate</button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); deleteResume(resume.id) }} style={dangerButtonStyle} className="interactive">Delete</button>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        ) : (
          <section style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 24 }}>
            <div style={{ display: 'grid', gap: 18 }}>
              <div ref={el => { stepRefs.current[1] = el }} className="theme-surface" style={{ borderRadius: 28, padding: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <div style={{ color: '#8b7cf6', fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Builder Steps</div>
                    <h2 style={{ margin: '8px 0 0', color: '#0f172a', fontSize: 22 }}>Template first, content second</h2>
                  </div>
                  <button onClick={saveNow} className="interactive" style={primaryButtonStyle}>
                    <Save size={16} /> Save
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 10 }}>
                  {progressSteps.map(step => (
                    <button
                      key={step.id}
                      onClick={() => goToStep(step.id)}
                      className="interactive"
                      style={{
                        borderRadius: 18,
                        padding: 14,
                        background: activeStep === step.id ? 'linear-gradient(135deg, rgba(84,104,255,0.1), rgba(14,165,233,0.08))' : 'rgba(15,23,42,0.03)',
                        border: activeStep === step.id ? '1px solid rgba(84,104,255,0.24)' : '1px solid rgba(148,163,184,0.16)',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: activeStep >= step.id ? 'linear-gradient(135deg, #6d5efc, #0ea5e9)' : 'rgba(148,163,184,0.18)', color: activeStep >= step.id ? '#fff' : '#64748b', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800 }}>
                          {step.id}
                        </div>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 13 }}>{step.title}</div>
                      </div>
                      <div style={{ color: '#64748b', fontSize: 12, lineHeight: 1.5 }}>{step.detail}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div ref={el => { stepRefs.current[2] = el }} className="theme-surface" style={{ borderRadius: 28, padding: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#0f172a', fontSize: 20 }}>Template Gallery</h3>
                    <p style={{ margin: '6px 0 0', color: '#64748b' }}>Pick the resume format that matches your target role.</p>
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(84,104,255,0.08)', color: '#4f46e5', padding: '8px 12px', borderRadius: 999, fontSize: 12, fontWeight: 800 }}>
                    <LayoutTemplate size={14} /> {activeTemplate.name}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  {defaultTemplates.map(template => {
                    const selected = activeResume.templateId === template.id
                    return (
                      <button key={template.id} onClick={() => updateTopLevel('templateId', template.id)} className="interactive" style={{ textAlign: 'left', background: selected ? 'rgba(84,104,255,0.08)' : 'rgba(255,255,255,0.92)', border: selected ? '1px solid rgba(84,104,255,0.28)' : '1px solid rgba(148,163,184,0.18)', borderRadius: 22, overflow: 'hidden', padding: 0, cursor: 'pointer' }}>
                        <div style={{ height: 100, background: template.surface, padding: 14, position: 'relative' }}>
                          <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(255,255,255,0.92)', color: template.accent, borderRadius: 999, padding: '5px 10px', fontSize: 11, fontWeight: 800 }}>
                            {template.tag}
                          </div>
                          <div style={{ position: 'absolute', right: 12, bottom: 12, width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', display: 'grid', placeItems: 'center', color: template.accent, fontWeight: 800 }}>Aa</div>
                        </div>
                        <div style={{ padding: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                            <h4 style={{ margin: 0, color: '#0f172a' }}>{template.name}</h4>
                            {selected ? <CheckCircle2 size={16} color={template.accent} /> : <ChevronRight size={16} color="#94a3b8" />}
                          </div>
                          <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 13, lineHeight: 1.55 }}>{template.tone}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div ref={el => { stepRefs.current[3] = el }} className="theme-surface" style={{ borderRadius: 28, padding: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#0f172a', fontSize: 20 }}>Edit Resume</h3>
                    <p style={{ margin: '6px 0 0', color: '#64748b' }}>Every change updates the live preview automatically.</p>
                  </div>
                  <button onClick={resetActive} className="interactive" style={secondaryButtonStyle}>
                    <RotateCcw size={16} /> Reset
                  </button>
                </div>

                <div style={{ display: 'grid', gap: 16 }}>
                  <InputGrid label="Resume Title" value={activeResume.title} onChange={value => updateTopLevel('title', value)} />
                  <InputGrid label="Target Role" value={activeResume.targetRole} onChange={value => updateTopLevel('targetRole', value)} />

                  <div style={formSectionStyle}>
                    <SectionHeader icon={<UserCircle2 size={16} />} title="Personal Info" />
                    <div className="form-grid-two" style={gridTwo}>
                      <InputGrid label="Full Name" value={activeResume.profile.fullName} onChange={value => updateProfileField('fullName', value)} />
                      <InputGrid label="Headline" value={activeResume.profile.headline} onChange={value => updateProfileField('headline', value)} />
                      <InputGrid label="Email" value={activeResume.profile.email} onChange={value => updateProfileField('email', value)} />
                      <InputGrid label="Phone" value={activeResume.profile.phone} onChange={value => updateProfileField('phone', value)} />
                      <InputGrid label="Location" value={activeResume.profile.location} onChange={value => updateProfileField('location', value)} />
                      <InputGrid label="Website" value={activeResume.profile.website} onChange={value => updateProfileField('website', value)} />
                      <InputGrid label="LinkedIn" value={activeResume.profile.linkedin} onChange={value => updateProfileField('linkedin', value)} />
                      <InputGrid label="GitHub" value={activeResume.profile.github} onChange={value => updateProfileField('github', value)} />
                    </div>
                  </div>

                  <div style={formSectionStyle}>
                    <SectionHeader icon={<Edit3 size={16} />} title="Professional Summary" />
                    <TextareaGrid label="Summary" value={activeResume.summary} onChange={value => updateTopLevel('summary', value)} rows={4} />
                  </div>

                  <div style={formSectionStyle}>
                    <SectionHeader icon={<GripVertical size={16} />} title="Experience" action={<button onClick={addExperience} className="interactive" style={smallGhostButtonStyle}><Plus size={14} /> Add</button>} />
                    <div style={{ display: 'grid', gap: 14 }}>
                      {activeResume.experience.map((item, index) => (
                        <div key={index} style={{ border: '1px solid rgba(148,163,184,0.18)', borderRadius: 18, padding: 14, background: 'rgba(255,255,255,0.9)' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                            <button type="button" onClick={() => removeExperience(index)} className="interactive" style={dangerButtonStyle}>
                              <Trash2 size={14} /> Remove
                            </button>
                          </div>
                          <div className="form-grid-two" style={gridTwo}>
                            <InputGrid label="Company" value={item.company} onChange={value => updateExperience(index, 'company', value)} />
                            <InputGrid label="Role" value={item.role} onChange={value => updateExperience(index, 'role', value)} />
                            <InputGrid label="Duration" value={item.duration} onChange={value => updateExperience(index, 'duration', value)} />
                          </div>
                          <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                            {item.points.map((point, pointIndex) => (
                              <div key={pointIndex} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                                <div style={{ flex: 1 }}>
                                  <InputGrid label={`Bullet ${pointIndex + 1}`} value={point} onChange={value => updateExperiencePoint(index, pointIndex, value)} />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeExperiencePoint(index, pointIndex)}
                                  className="interactive"
                                  style={{ ...smallGhostButtonStyle, color: '#b91c1c', flexShrink: 0 }}
                                  aria-label="Remove bullet"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                            <button type="button" onClick={() => addExperiencePoint(index)} className="interactive" style={smallGhostButtonStyle}><Plus size={14} /> Add bullet</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={formSectionStyle}>
                    <SectionHeader icon={<FileText size={16} />} title="Projects" action={<button onClick={addProject} className="interactive" style={smallGhostButtonStyle}><Plus size={14} /> Add</button>} />
                    <div style={{ display: 'grid', gap: 14 }}>
                      {activeResume.projects.map((item, index) => (
                        <div key={index} style={{ border: '1px solid rgba(148,163,184,0.18)', borderRadius: 18, padding: 14, background: 'rgba(255,255,255,0.9)' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                            <button type="button" onClick={() => removeProject(index)} className="interactive" style={dangerButtonStyle}>
                              <Trash2 size={14} /> Remove
                            </button>
                          </div>
                          <div className="form-grid-two" style={gridTwo}>
                            <InputGrid label="Project name" value={item.name} onChange={value => updateProject(index, 'name', value)} />
                            <InputGrid label="Stack" value={item.stack} onChange={value => updateProject(index, 'stack', value)} />
                          </div>
                          <div style={{ marginTop: 12 }}>
                            <TextareaGrid label="Description" value={item.detail} onChange={value => updateProject(index, 'detail', value)} rows={3} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={formSectionStyle}>
                    <SectionHeader icon={<LayoutTemplate size={16} />} title="Education" action={<button onClick={addEducation} className="interactive" style={smallGhostButtonStyle}><Plus size={14} /> Add</button>} />
                    <div style={{ display: 'grid', gap: 14 }}>
                      {activeResume.education.map((item, index) => (
                        <div key={index} style={{ border: '1px solid rgba(148,163,184,0.18)', borderRadius: 18, padding: 14, background: 'rgba(255,255,255,0.9)' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                            <button type="button" onClick={() => removeEducation(index)} className="interactive" style={dangerButtonStyle}>
                              <Trash2 size={14} /> Remove
                            </button>
                          </div>
                          <div className="form-grid-two" style={gridTwo}>
                            <InputGrid label="Institute" value={item.school} onChange={value => updateEducation(index, 'school', value)} />
                            <InputGrid label="Degree" value={item.degree} onChange={value => updateEducation(index, 'degree', value)} />
                            <InputGrid label="Duration" value={item.duration} onChange={value => updateEducation(index, 'duration', value)} />
                            <InputGrid label="CGPA / Score" value={item.score} onChange={value => updateEducation(index, 'score', value)} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={formSectionStyle}>
                    <SectionHeader icon={<Sparkles size={16} />} title="Skills & Certifications" />
                    <div className="form-grid-two" style={gridTwo}>
                      <TextareaGrid label="Skills (comma separated)" value={activeResume.skills.join(', ')} onChange={updateSkills} rows={3} />
                      <TextareaGrid label="Certifications (comma separated)" value={activeResume.certifications.join(', ')} onChange={updateCertifications} rows={3} />
                    </div>
                  </div>
                </div>

                {savedNotice && (
                  <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, color: '#166534', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.18)', borderRadius: 14, padding: '10px 12px', fontSize: 13, fontWeight: 700 }}>
                    <CheckCircle2 size={16} /> {savedNotice}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gap: 18, alignContent: 'start', position: 'sticky', top: 96, height: 'fit-content' }}>
              <div ref={el => { stepRefs.current[4] = el }} className="theme-surface" style={{ borderRadius: 28, padding: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ color: '#8b7cf6', fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase' }}>ATS Score</div>
                    <h3 style={{ margin: '6px 0 0', color: '#0f172a', fontSize: 20 }}>{atsScore}% ready</h3>
                  </div>
                </div>
                <div style={{ height: 12, background: 'rgba(15,23,42,0.08)', borderRadius: 999, overflow: 'hidden', marginBottom: 10 }}>
                  <div style={{ height: '100%', width: `${atsScore}%`, borderRadius: 999, background: 'linear-gradient(90deg, #5468ff, #0ea5e9, #14b8a6)' }} />
                </div>
                <div style={{ color: '#64748b', fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>
                  Higher scores come from having a summary, experience, education, projects, skills, and complete contact details.
                </div>
                <div style={{ display: 'grid', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => exportResume('ats')}
                    disabled={exportingVariant !== ''}
                    className="interactive"
                    style={{ ...primaryButtonStyle, opacity: exportingVariant && exportingVariant !== 'ats' ? 0.6 : 1, cursor: exportingVariant ? 'wait' : 'pointer' }}
                  >
                    {exportingVariant === 'ats' ? <Loader2 size={16} className="spin" /> : <Download size={16} />}
                    {exportingVariant === 'ats' ? 'Generating…' : 'Download ATS-friendly PDF'}
                  </button>
                  <button
                    type="button"
                    onClick={() => exportResume('simple')}
                    disabled={exportingVariant !== ''}
                    className="interactive"
                    style={{ ...secondaryButtonStyle, opacity: exportingVariant && exportingVariant !== 'simple' ? 0.6 : 1, cursor: exportingVariant ? 'wait' : 'pointer' }}
                  >
                    {exportingVariant === 'simple' ? <Loader2 size={16} className="spin" /> : <Download size={16} />}
                    {exportingVariant === 'simple' ? 'Generating…' : 'Download Simple PDF'}
                  </button>
                </div>
                <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 10, lineHeight: 1.6 }}>
                  Both PDFs auto-fit to 1-2 pages. The ATS version uses a plain single-column layout for parsing software; the Simple version keeps light styling for human readers.
                </div>
                {exportError && (
                  <div style={{ marginTop: 10, color: '#b91c1c', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 12, padding: '10px 12px', fontSize: 13, fontWeight: 700 }}>
                    {exportError}
                  </div>
                )}
              </div>

              <div ref={el => { stepRefs.current[5] = el }} className="theme-surface" style={{ borderRadius: 28, padding: 0, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid rgba(148,163,184,0.16)' }}>
                  <div>
                    <div style={{ color: '#8b7cf6', fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Live Preview</div>
                    <h3 style={{ margin: '6px 0 0', color: '#0f172a', fontSize: 20 }}>{activeResume.title}</h3>
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 999, background: templateBadgeBg(activeTemplate.accent), color: activeTemplate.accent, fontSize: 12, fontWeight: 800 }}>
                    <Sparkles size={14} /> {activeTemplate.name}
                  </div>
                </div>
                <div style={{ padding: 18, background: 'linear-gradient(180deg, rgba(248,251,255,0.92), rgba(255,255,255,0.96))' }}>
                  <ResumePreview resume={activeResume} />
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      <style>{printStyles}</style>
    </div>
  )
}

function SectionHeader({ icon, title, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, rgba(84,104,255,0.12), rgba(14,165,233,0.1))', display: 'grid', placeItems: 'center', color: '#4f46e5' }}>{icon}</div>
        <h4 style={{ margin: 0, color: '#0f172a', fontSize: 16 }}>{title}</h4>
      </div>
      {action}
    </div>
  )
}

function InputGrid({ label, value, onChange }) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ color: '#334155', fontSize: 13, fontWeight: 700 }}>{label}</span>
      <input value={value} onChange={e => onChange(e.target.value)} className="interactive" style={fieldStyle} />
    </label>
  )
}

function TextareaGrid({ label, value, onChange, rows = 3 }) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ color: '#334155', fontSize: 13, fontWeight: 700 }}>{label}</span>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} className="interactive" style={{ ...fieldStyle, minHeight: 96, resize: 'vertical' }} />
    </label>
  )
}

function templateBadgeBg(accent) {
  return `color-mix(in srgb, ${accent} 10%, white)`
}

function pillButton(active) {
  return {
    border: '1px solid rgba(148,163,184,0.16)',
    borderRadius: 999,
    padding: '11px 18px',
    minWidth: 140,
    background: active ? 'linear-gradient(135deg, rgba(84,104,255,0.96), rgba(14,165,233,0.88))' : 'transparent',
    color: active ? '#fff' : '#475569',
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: active ? '0 14px 28px rgba(84,104,255,0.18)' : 'none',
  }
}

const fieldStyle = {
  width: '100%',
  borderRadius: 14,
  border: '1px solid rgba(148,163,184,0.18)',
  background: 'rgba(255,255,255,0.9)',
  padding: '11px 12px',
  fontSize: 14,
  color: '#0f172a',
  outline: 'none',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
}

const gridTwo = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 12,
}

const formSectionStyle = {
  border: '1px solid rgba(148,163,184,0.18)',
  background: 'rgba(255,255,255,0.88)',
  borderRadius: 22,
  padding: 18,
}

const softButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  borderRadius: 14,
  padding: '11px 16px',
  border: '1px solid rgba(148,163,184,0.18)',
  background: 'rgba(255,255,255,0.86)',
  color: '#0f172a',
  fontWeight: 700,
  cursor: 'pointer',
}

const primaryButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  borderRadius: 14,
  padding: '11px 16px',
  border: '1px solid rgba(84,104,255,0.24)',
  background: 'linear-gradient(135deg, rgba(84,104,255,0.94), rgba(14,165,233,0.84))',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
}

const secondaryButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  borderRadius: 14,
  padding: '10px 14px',
  border: '1px solid rgba(148,163,184,0.18)',
  background: 'rgba(255,255,255,0.9)',
  color: '#0f172a',
  fontWeight: 700,
  cursor: 'pointer',
}

const smallGhostButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  borderRadius: 12,
  padding: '8px 12px',
  border: '1px solid rgba(148,163,184,0.18)',
  background: 'rgba(255,255,255,0.9)',
  color: '#334155',
  fontWeight: 700,
  cursor: 'pointer',
}

const dangerButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  borderRadius: 12,
  padding: '8px 12px',
  border: '1px solid rgba(239,68,68,0.18)',
  background: 'rgba(255,255,255,0.9)',
  color: '#b91c1c',
  fontWeight: 700,
  cursor: 'pointer',
}

const printStyles = `
@media print {
  body { background: #fff !important; }
  nav, aside, button { display: none !important; }
  .resume-builder-shell { display: block !important; }
  .theme-surface { box-shadow: none !important; border: none !important; }
}
.spin {
  animation: resume-builder-spin 0.9s linear infinite;
}
@keyframes resume-builder-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`