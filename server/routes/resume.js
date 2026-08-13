const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const pdfParse = require('pdf-parse')
const { isAuthenticated } = require('../middleware/auth')
const User = require('../models/User')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/'
    if (!fs.existsSync(dir)) fs.mkdirSync(dir)
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true)
    else cb(new Error('Only PDF files allowed'))
  }
})

// Check if uploaded file is actually a resume
function isResume(text) {
  const resumeKeywords = [
    'experience', 'education', 'skills', 'projects',
    'objective', 'summary', 'internship', 'certification',
    'achievement', 'qualification', 'degree', 'university',
    'college', 'gpa', 'cgpa', 'b.tech', 'b.e', 'engineer'
  ]
  const lowerText = text.toLowerCase()
  const matchCount = resumeKeywords.filter(k => lowerText.includes(k)).length
  return matchCount >= 3
}

router.post('/upload', isAuthenticated, upload.single('resume'), async (req, res) => {
  try {
    const dataBuffer = fs.readFileSync(req.file.path)
    const pdfData = await pdfParse(dataBuffer)
    const resumeText = pdfData.text

    // Validate it's actually a resume
    if (!isResume(resumeText)) {
      fs.unlinkSync(req.file.path)
      return res.status(400).json({
        message: 'This does not appear to be a resume. Please upload your actual resume PDF.'
      })
    }

    await User.findByIdAndUpdate(req.user._id, {
      resumePath: req.file.path,
      resumeText: resumeText,
      skillGapReport: null,
      roadmap: [],
      jobRecommendations: []
    })

    res.json({ message: 'Resume uploaded successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Error uploading resume' })
  }
})

// Remove resume
router.delete('/remove', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    if (user.resumePath && fs.existsSync(user.resumePath)) {
      fs.unlinkSync(user.resumePath)
    }

    await User.findByIdAndUpdate(req.user._id, {
      resumePath: null,
      resumeText: null,
      skillGapReport: null,
      roadmap: [],
      jobRecommendations: []
    })

    res.json({ message: 'Resume removed successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Error removing resume' })
  }
})

module.exports = router