//server/models/User.js
const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  photo: String,
  skills: [String],
  targetRole: String,
  resumePath: String,
  resumeText: String,
  skillGapReport: String,
  roadmap: [{
    week: Number,
    title: String,
    tasks: [String],
    completed: { type: Boolean, default: false }
  }],
  jobRecommendations: [String],
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true })

module.exports = mongoose.model('User', userSchema)