//server/routes/chat.js
const express = require('express')
const router = express.Router()
const { GoogleGenerativeAI } = require('@google/generative-ai')
const { isAuthenticated } = require('../middleware/auth')
const Chat = require('../models/Chat')
const User = require('../models/User')
require('dotenv').config()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

router.get('/history', isAuthenticated, async (req, res) => {
  try {
    let chat = await Chat.findOne({ userId: req.user._id })
    if (!chat) {
      chat = await Chat.create({ userId: req.user._id, messages: [] })
    }
    res.json(chat.messages)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { message } = req.body
    const user = await User.findById(req.user._id)

    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

    const systemContext = `
You are CareerLens AI, a friendly and expert career mentor for Indian engineering students.
Student name: ${user.name}
Target role: ${user.targetRole || 'Software Developer'}
Current skills: ${user.skills.join(', ') || 'Not specified'}
  STRICT FORMATTING RULES:
  - Always use Markdown.
  - Use ## for Headers.
  - Use bullet points for lists.
  - Use **bold** for key technical terms like React, Node.js, or DSA.
  - If providing a roadmap, break it down by 'Week 1', 'Week 2', etc.
  - For EVERY week in roadmap, add a line: "📚 Free Resources: [list 2-3 free resources like freeCodeCamp, GeeksforGeeks, YouTube channels, NPTEL, LeetCode]"
Keep responses concise, helpful, and encouraging. Focus on placement preparation.
`

    const result = await model.generateContent(systemContext + '\n\nStudent asks: ' + message)
    const aiResponse = result.response.text()
    const responseText = aiResponse // the text from Gemini

// Try to detect and extract a roadmap from the response
const weekMatches = responseText.match(/week\s*(\d+)[:\s\-–]+([^\n]{5,80})/gi)

if (weekMatches && weekMatches.length >= 3) {
  // Extract tasks by finding bullet points after each week heading
  const lines = responseText.split('\n')
  const roadmap = []
  let currentWeek = null

  lines.forEach(line => {
    const weekMatch = line.match(/week\s*(\d+)[:\s\-–]+(.+)/i)
    if (weekMatch) {
      if (currentWeek) roadmap.push(currentWeek)
      currentWeek = {
        week: roadmap.length + 1,
        title: weekMatch[2].replace(/\*\*/g, '').trim(),
        tasks: [],
        completed: false
      }
    } else if (currentWeek && (line.trim().startsWith('*') || line.trim().startsWith('-') || line.trim().startsWith('•'))) {
      const task = line.replace(/^[\*\-•]\s*/, '').replace(/\*\*/g, '').trim()
      if (task.length > 5) currentWeek.tasks.push(task)
    }
  })
  if (currentWeek) roadmap.push(currentWeek)

  if (roadmap.length >= 3) {
    const freshUser = await User.findById(req.user._id)
    if (!freshUser.roadmap || freshUser.roadmap.length === 0) {
      await User.findByIdAndUpdate(req.user._id, { roadmap: roadmap.slice(0, 8) })
    }
  }
}

    let chat = await Chat.findOne({ userId: req.user._id })
    if (!chat) {
      chat = await Chat.create({ userId: req.user._id, messages: [] })
    }

    chat.messages.push({ role: 'user', content: message })
    chat.messages.push({ role: 'assistant', content: aiResponse })

    // Keep only last 50 messages
    if (chat.messages.length > 50) {
      chat.messages = chat.messages.slice(-50)
    }

    await chat.save()

    res.json({ response: aiResponse })
  } catch (err) {
    console.error('AI Chat error:', err)
    res.status(500).json({ message: 'Chat failed. Try again.' })
  }
})

router.delete('/clear', isAuthenticated, async (req, res) => {
  try {
    await Chat.findOneAndUpdate(
      { userId: req.user._id },
      { messages: [] }
    )
    res.json({ message: 'Chat cleared' })
  } catch (err) {
    console.error('Chat clear error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router