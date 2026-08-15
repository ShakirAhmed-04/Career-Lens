//server/models/Interview.js
const mongoose = require('mongoose')

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: String,
  score: Number, // 0-10
  feedback: String,
  strengths: [String],
  improvements: [String],
  answeredAt: Date
}, { _id: false })

const interviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  totalQuestions: { type: Number, default: 5 },
  status: { type: String, enum: ['in_progress', 'completed', 'abandoned'], default: 'in_progress' },
  questions: [questionSchema],
  report: {
    overallScore: Number,
    summary: String,
    strengths: [String],
    improvements: [String],
    recommendation: String
  }
}, { timestamps: true })

module.exports = mongoose.model('Interview', interviewSchema)
