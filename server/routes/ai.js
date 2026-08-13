//server/routes/ai.js
const express = require('express')
const router = express.Router()
const { GoogleGenerativeAI } = require('@google/generative-ai')
const { isAuthenticated } = require('../middleware/auth')
const User = require('../models/User')
require('dotenv').config()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const systemContext = `
  You are an expert Resume Parser. 
  STRICT RULE 1: If the uploaded text does not contain typical resume sections (Skills, Education, or Work History), return exactly: {"error": "INVALID_FILE"}.
  STRICT RULE 2: Only recommend IT/Software engineering roles (e.g., Frontend, Backend, Data Science) regardless of the document content.
  Return the analysis in this JSON format:
  {
    "skills": [],
    "strengths": [],
    "recommendations": ["Software Developer", "Web Developer"...]
  }
`
router.post('/analyze', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    if (!user.resumeText) {
      return res.status(400).json({ message: 'Please upload your resume first' })
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

    const skillGapPrompt = `
You are an expert career advisor for Indian engineering students preparing for campus placements.

Student's Resume:
${user.resumeText}

Target Role: ${user.targetRole || 'Full Stack Developer'}
Current Skills: ${user.skills.join(', ') || 'Not specified'}

Analyze this resume and provide:
1. SKILL GAP ANALYSIS: List exactly 5 missing skills for the target role
2. STRENGTHS: List exactly 3 strong points from the resume
3. IMPROVEMENT AREAS: List exactly 3 specific improvements needed

Format your response as JSON exactly like this:
{
  "missingSkills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2", "improvement3"]
}
`

    const result = await model.generateContent(skillGapPrompt)
    const text = result.response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const analysis = JSON.parse(jsonMatch[0])

    const roadmapPrompt = `
You are an expert career coach for Indian engineering students.

Target Role: ${user.targetRole || 'Full Stack Developer'}
Missing Skills: ${analysis.missingSkills.join(', ')}

Create a 6-week learning roadmap. For each week, also suggest 2-3 FREE online resources.

Format as JSON exactly like this (no extra text):
{
  "roadmap": [
    {
      "week": 1,
      "title": "Week title here",
      "tasks": [
        "Task description 1",
        "Task description 2",
        "📚 Resources: freeCodeCamp.org, MDN Web Docs, YouTube: Traversy Media"
      ]
    }
  ]
}

Always include a resources line as the last task of each week mentioning free platforms like:
freeCodeCamp, MDN Docs, GeeksforGeeks, LeetCode, YouTube channels, Coursera (audit), NPTEL, etc.
`

    const roadmapResult = await model.generateContent(roadmapPrompt)
    const roadmapText = roadmapResult.response.text()
    const roadmapJson = roadmapText.match(/\{[\s\S]*\}/)
    const roadmapData = JSON.parse(roadmapJson[0])

    const jobPrompt = `
Based on this resume, suggest exactly 5 IT/Software job roles suitable for this student.
Only suggest technology and software industry roles.
Resume summary: ${user.resumeText.substring(0, 500)}
Current skills: ${user.skills.join(', ')}
Target role: ${user.targetRole || 'Software Developer'}

Return JSON exactly like this:
{
  "jobRoles": ["role1", "role2", "role3", "role4", "role5"]
}

Only suggest roles like: Software Developer, Full Stack Developer, Backend Developer,
Frontend Developer, Data Analyst, ML Engineer, DevOps Engineer, Android Developer,
Cloud Engineer, QA Engineer, etc. Never suggest non-IT roles.
`
    const jobResult = await model.generateContent(jobPrompt)
    const jobText = jobResult.response.text()
    const jobJson = jobText.match(/\{[\s\S]*\}/)
    const jobData = JSON.parse(jobJson[0])

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        skillGapReport: JSON.stringify(analysis),
        roadmap: roadmapData.roadmap,
        jobRecommendations: jobData.jobRoles
      },
      { new: true }
    )

    res.json({
      skillGapReport: analysis,
      roadmap: roadmapData.roadmap,
      jobRecommendations: jobData.jobRoles
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'AI analysis failed. Try again.' })
  }
})

module.exports = router