//server/routes/interview.js
const express = require('express')
const router = express.Router()
const { GoogleGenerativeAI } = require('@google/generative-ai')
const { isAuthenticated } = require('../middleware/auth')
const User = require('../models/User')
const Interview = require('../models/Interview')
require('dotenv').config()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const MODEL_NAME = 'gemini-3-flash-preview'

const ALLOWED_DIFFICULTIES = ['easy', 'medium', 'hard']
const MIN_QUESTIONS = 3
const MAX_QUESTIONS = 10

function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('AI response did not contain JSON')
  return JSON.parse(match[0])
}

function clampScore(score) {
  const n = Number(score)
  if (Number.isNaN(n)) return 5
  return Math.max(0, Math.min(10, Math.round(n)))
}

// Start a new interview session and get the first question.
router.post('/start', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    const role = (req.body.role || user.targetRole || 'Software Developer').trim().slice(0, 80)
    const difficulty = ALLOWED_DIFFICULTIES.includes(req.body.difficulty) ? req.body.difficulty : 'medium'
    const totalQuestions = Math.max(
      MIN_QUESTIONS,
      Math.min(MAX_QUESTIONS, Number(req.body.totalQuestions) || 5)
    )

    const model = genAI.getGenerativeModel({ model: MODEL_NAME })

    const prompt = `
You are an expert technical interviewer conducting a mock interview for Indian engineering students preparing for campus placements.

Role being interviewed for: ${role}
Difficulty: ${difficulty}
Candidate's known skills: ${(user.skills || []).join(', ') || 'Not specified'}

This is question 1 of ${totalQuestions}. Ask a warm, approachable opening question (icebreaker or fundamentals) suited to a fresher candidate applying for this role.
The candidate will answer out loud and their speech will be transcribed, so keep the question itself short, natural, and easy to say aloud when read by text-to-speech (avoid code snippets or anything requiring a whiteboard).

Return JSON only, no extra text:
{ "question": "..." }
`

    const result = await model.generateContent(prompt)
    const { question } = extractJson(result.response.text())

    const interview = await Interview.create({
      userId: user._id,
      role,
      difficulty,
      totalQuestions,
      questions: [{ question }]
    })

    res.json({
      interviewId: interview._id,
      question,
      questionNumber: 1,
      totalQuestions,
      role,
      difficulty
    })
  } catch (err) {
    console.error('Interview start error:', err)
    res.status(500).json({ message: 'Could not start the interview. Try again.' })
  }
})

// Submit a transcribed answer for the current question. Returns evaluation
// feedback plus either the next question or, if this was the last one, the
// final report.
router.post('/:id/answer', isAuthenticated, async (req, res) => {
  try {
    const { answer } = req.body
    if (!answer || !answer.trim()) {
      return res.status(400).json({ message: 'No answer text received.' })
    }

    const interview = await Interview.findOne({ _id: req.params.id, userId: req.user._id })
    if (!interview) return res.status(404).json({ message: 'Interview session not found.' })
    if (interview.status === 'completed') {
      return res.status(400).json({ message: 'This interview is already complete.' })
    }

    const questionIndex = interview.questions.length - 1
    const currentQuestion = interview.questions[questionIndex]
    const questionNumber = questionIndex + 1
    const isLastQuestion = questionNumber >= interview.totalQuestions

    const model = genAI.getGenerativeModel({ model: MODEL_NAME })

    const priorQuestions = interview.questions.map(q => q.question).join('\n- ')

    const evalPrompt = `
You are an expert technical interviewer evaluating a candidate's spoken answer in a mock interview.
The answer was captured via speech-to-text, so minor grammar, filler words ("um", "like"), or transcription glitches are normal and should NOT be penalized - judge the substance of the answer.

Role: ${interview.role}
Difficulty: ${interview.difficulty}
Question ${questionNumber} of ${interview.totalQuestions}: "${currentQuestion.question}"
Candidate's answer: "${answer.trim()}"

Evaluate the answer${isLastQuestion ? '' : ', then also write the NEXT interview question'}.
${isLastQuestion
  ? ''
  : `The next question should naturally continue the interview (mix of behavioral, fundamentals, and role-specific topics), fit the "${interview.difficulty}" difficulty, be answerable out loud in under a minute, and must NOT repeat or closely resemble any of these already-asked questions:\n- ${priorQuestions}`}

Return JSON only, no extra text:
{
  "score": <integer 0-10>,
  "feedback": "<2-3 sentence spoken-style feedback, encouraging but honest>",
  "strengths": ["...", "..."],
  "improvements": ["...", "..."]${isLastQuestion ? '' : ',\n  "nextQuestion": "..."'}
}
`

    const evalResult = await model.generateContent(evalPrompt)
    const evaluation = extractJson(evalResult.response.text())

    currentQuestion.answer = answer.trim()
    currentQuestion.score = clampScore(evaluation.score)
    currentQuestion.feedback = evaluation.feedback || ''
    currentQuestion.strengths = Array.isArray(evaluation.strengths) ? evaluation.strengths.slice(0, 5) : []
    currentQuestion.improvements = Array.isArray(evaluation.improvements) ? evaluation.improvements.slice(0, 5) : []
    currentQuestion.answeredAt = new Date()

    if (isLastQuestion) {
      const transcript = interview.questions
        .map((q, i) => `Q${i + 1}: ${q.question}\nAnswer: ${q.answer}\nScore: ${q.score}/10`)
        .join('\n\n')

      const reportPrompt = `
The mock interview for the role of ${interview.role} (${interview.difficulty} difficulty) is now complete. Here is the full transcript with per-question scores:

${transcript}

Write a final performance report as JSON only, no extra text:
{
  "overallScore": <integer 0-10, weighted overall impression - not just a plain average>,
  "summary": "<3-4 sentence overall assessment of how the candidate performed>",
  "strengths": ["...", "...", "..."],
  "improvements": ["...", "...", "..."],
  "recommendation": "<one encouraging paragraph on the candidate's readiness for real interviews and what to focus on next>"
}
`
      const reportResult = await model.generateContent(reportPrompt)
      const report = extractJson(reportResult.response.text())

      interview.status = 'completed'
      interview.report = {
        overallScore: clampScore(report.overallScore),
        summary: report.summary || '',
        strengths: Array.isArray(report.strengths) ? report.strengths.slice(0, 6) : [],
        improvements: Array.isArray(report.improvements) ? report.improvements.slice(0, 6) : [],
        recommendation: report.recommendation || ''
      }
      await interview.save()

      return res.json({
        isComplete: true,
        feedback: currentQuestion.feedback,
        score: currentQuestion.score,
        strengths: currentQuestion.strengths,
        improvements: currentQuestion.improvements,
        report: interview.report,
        interview
      })
    }

    interview.questions.push({ question: evaluation.nextQuestion })
    await interview.save()

    res.json({
      isComplete: false,
      feedback: currentQuestion.feedback,
      score: currentQuestion.score,
      strengths: currentQuestion.strengths,
      improvements: currentQuestion.improvements,
      nextQuestion: evaluation.nextQuestion,
      questionNumber: questionNumber + 1,
      totalQuestions: interview.totalQuestions
    })
  } catch (err) {
    console.error('Interview answer error:', err)
    res.status(500).json({ message: 'Could not evaluate that answer. Try again.' })
  }
})

// List past interview sessions (most recent first), summary only.
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const interviews = await Interview.find({ userId: req.user._id })
      .select('role difficulty totalQuestions status report.overallScore createdAt')
      .sort({ createdAt: -1 })
      .limit(25)
    res.json(interviews)
  } catch (err) {
    console.error('Interview list error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// Fetch one full session (to view a report or resume).
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, userId: req.user._id })
    if (!interview) return res.status(404).json({ message: 'Interview session not found.' })
    res.json(interview)
  } catch (err) {
    console.error('Interview fetch error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    await Interview.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
    res.json({ message: 'Interview deleted' })
  } catch (err) {
    console.error('Interview delete error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
