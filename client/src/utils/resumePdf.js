import { jsPDF } from 'jspdf'

// Shared layout constants (A4, millimetres)
const PAGE_W = 210
const PAGE_H = 297
const MARGIN = 15
const CONTENT_W = PAGE_W - MARGIN * 2
const MAX_PAGES = 2

// Approx line height (mm) for a given font size (pt), including line spacing.
function lineHeight(fontSizePt, spacing = 1.22) {
  return fontSizePt * 0.3527 * spacing
}

function sanitizeFileName(name) {
  return (name || 'resume')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'resume'
}

// Turn the raw resume object into a template-agnostic content tree.
function buildContent(resume) {
  const profile = resume.profile || {}
  const contact = [
    profile.email,
    profile.phone,
    profile.location,
    profile.linkedin,
    profile.github,
    profile.website,
  ].filter(Boolean)

  const sections = []

  if (resume.summary?.trim()) {
    sections.push({ heading: 'Summary', paragraphs: [resume.summary.trim()] })
  }

  const experience = (resume.experience || []).filter(item => item.company?.trim() || item.role?.trim())
  if (experience.length) {
    sections.push({
      heading: 'Experience',
      entries: experience.map(item => ({
        title: item.role?.trim() || 'Role',
        subtitle: item.company?.trim() || 'Company',
        meta: item.duration?.trim() || '',
        bullets: (item.points || []).filter(point => point?.trim()),
      })),
    })
  }

  const projects = (resume.projects || []).filter(item => item.name?.trim())
  if (projects.length) {
    sections.push({
      heading: 'Projects',
      entries: projects.map(item => ({
        title: item.name?.trim() || 'Project',
        meta: item.stack?.trim() || '',
        bullets: item.detail?.trim() ? [item.detail.trim()] : [],
      })),
    })
  }

  const education = (resume.education || []).filter(item => item.school?.trim() || item.degree?.trim())
  if (education.length) {
    sections.push({
      heading: 'Education',
      entries: education.map(item => ({
        title: item.degree?.trim() || 'Degree',
        subtitle: item.school?.trim() || 'Institute',
        meta: [item.duration, item.score].filter(Boolean).join('  •  '),
      })),
    })
  }

  const skills = (resume.skills || []).filter(Boolean)
  if (skills.length) {
    sections.push({ heading: 'Skills', paragraphs: [skills.join('   •   ')] })
  }

  const certifications = (resume.certifications || []).filter(Boolean)
  if (certifications.length) {
    sections.push({ heading: 'Certifications', paragraphs: [certifications.join('   •   ')] })
  }

  return {
    name: profile.fullName?.trim() || 'Your Name',
    headline: profile.headline?.trim() || '',
    contact,
    sections,
  }
}

const THEMES = {
  simple: {
    nameColor: [15, 23, 42],
    subText: [71, 85, 105],
    accentText: [79, 70, 229],
    bodyText: [30, 41, 59],
    ruleColor: [79, 70, 229],
    headerRule: true,
    contactSep: '   •   ',
    bulletChar: '•',
  },
  ats: {
    nameColor: [0, 0, 0],
    subText: [35, 35, 35],
    accentText: [0, 0, 0],
    bodyText: [0, 0, 0],
    ruleColor: [0, 0, 0],
    headerRule: false,
    contactSep: '  |  ',
    bulletChar: '-',
  },
}

// Draws the full resume into `doc` at the given base font size, paginating
// automatically. Returns nothing - inspect doc.internal.getNumberOfPages()
// afterwards to see how many pages it took.
function drawResume(doc, content, fontSize, theme) {
  let y = MARGIN
  const bottom = PAGE_H - MARGIN

  const ensureSpace = (h) => {
    if (y + h > bottom) {
      doc.addPage()
      y = MARGIN
    }
  }

  const setStyle = (style, size, color) => {
    doc.setFont('helvetica', style)
    doc.setFontSize(size)
    doc.setTextColor(color[0], color[1], color[2])
  }

  const writeParagraph = (text, size = fontSize, style = 'normal', color = theme.bodyText, after = 2.4) => {
    setStyle(style, size, color)
    const lines = doc.splitTextToSize(text, CONTENT_W)
    const lh = lineHeight(size)
    lines.forEach(line => {
      ensureSpace(lh)
      doc.text(line, MARGIN, y)
      y += lh
    })
    y += after
  }

  const writeBullet = (text, size = fontSize) => {
    setStyle('normal', size, theme.bodyText)
    const indent = 4.4
    const lines = doc.splitTextToSize(text, CONTENT_W - indent)
    const lh = lineHeight(size)
    lines.forEach((line, i) => {
      ensureSpace(lh)
      if (i === 0) doc.text(theme.bulletChar, MARGIN, y)
      doc.text(line, MARGIN + indent, y)
      y += lh
    })
  }

  const sectionHeading = (text) => {
    const size = fontSize + 1.5
    ensureSpace(lineHeight(size) + 3)
    y += 2
    setStyle('bold', size, theme.accentText)
    doc.text(text.toUpperCase(), MARGIN, y)
    if (theme.headerRule) {
      doc.setDrawColor(theme.ruleColor[0], theme.ruleColor[1], theme.ruleColor[2])
      doc.setLineWidth(0.4)
      doc.line(MARGIN, y + 1.4, PAGE_W - MARGIN, y + 1.4)
    }
    y += lineHeight(size) * 0.85 + 1.8
  }

  // Header
  setStyle('bold', 19, theme.nameColor)
  doc.text(content.name, MARGIN, y)
  y += lineHeight(19) * 0.9

  if (content.headline) {
    setStyle('normal', 11.5, theme.subText)
    doc.text(content.headline, MARGIN, y)
    y += lineHeight(11.5) * 0.95
  }

  if (content.contact.length) {
    setStyle('normal', fontSize - 0.5, theme.subText)
    const contactLine = content.contact.join(theme.contactSep)
    const wrapped = doc.splitTextToSize(contactLine, CONTENT_W)
    wrapped.forEach(line => {
      ensureSpace(lineHeight(fontSize - 0.5))
      doc.text(line, MARGIN, y)
      y += lineHeight(fontSize - 0.5)
    })
  }

  y += 2
  if (theme.headerRule) {
    doc.setDrawColor(theme.ruleColor[0], theme.ruleColor[1], theme.ruleColor[2])
    doc.setLineWidth(0.7)
    doc.line(MARGIN, y, PAGE_W - MARGIN, y)
  } else {
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.3)
    doc.line(MARGIN, y, PAGE_W - MARGIN, y)
  }
  y += 4.5

  content.sections.forEach(section => {
    sectionHeading(section.heading)

    if (section.paragraphs) {
      section.paragraphs.forEach(p => writeParagraph(p))
    }

    if (section.entries) {
      section.entries.forEach((entry, idx) => {
        const titleSize = fontSize + 0.5
        setStyle('bold', titleSize, theme.bodyText)
        ensureSpace(lineHeight(titleSize))
        doc.text(entry.title, MARGIN, y)
        if (entry.meta) {
          setStyle('normal', fontSize - 0.5, theme.subText)
          const metaWidth = doc.getTextWidth(entry.meta)
          doc.text(entry.meta, PAGE_W - MARGIN - metaWidth, y)
        }
        y += lineHeight(titleSize) * 0.88

        if (entry.subtitle) {
          setStyle('normal', fontSize, theme.accentText)
          doc.text(entry.subtitle, MARGIN, y)
          y += lineHeight(fontSize) * 0.88
        }

        y += 0.8
        entry.bullets?.forEach(bullet => writeBullet(bullet))
        y += idx === section.entries.length - 1 ? 0 : 2.6
      })
    }

    y += 2.6
  })
}

// Renders + auto-shrinks font size until the resume fits in MAX_PAGES pages
// (falls back to the smallest size tried if it still doesn't fit).
function renderFittedResume(content, theme) {
  const candidateSizes = [10.5, 10, 9.5, 9, 8.5, 8]
  let doc = null

  for (let i = 0; i < candidateSizes.length; i += 1) {
    doc = new jsPDF({ unit: 'mm', format: 'a4' })
    drawResume(doc, content, candidateSizes[i], theme)
    if (doc.internal.getNumberOfPages() <= MAX_PAGES) {
      return doc
    }
  }
  // Best effort: return the smallest-font attempt even if it slightly overflows.
  return doc
}

export function generateResumePdf(resume, variant = 'simple') {
  const content = buildContent(resume)
  const theme = THEMES[variant] || THEMES.simple
  const doc = renderFittedResume(content, theme)
  const fileName = `${sanitizeFileName(resume.title || resume.profile?.fullName)}-${variant === 'ats' ? 'ats' : 'simple'}.pdf`
  doc.save(fileName)
  return fileName
}
