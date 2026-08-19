//server/models/MarketSnapshot.js
const mongoose = require('mongoose')

const marketSnapshotSchema = new mongoose.Schema({
  capturedAt: { type: Date, default: Date.now, index: true },
  city: { type: String, default: 'Bangalore' },
  skillCounts: [{
    skill: String,
    count: Number,
  }],
  topCompanies: [{
    name: String,
    count: Number,
    averageSalary: Number,
  }],
  salaryRanges: [{
    label: String,
    min: Number,
    max: Number,
  }],
  cityRoleDemand: [{
    city: String,
    totalJobs: Number,
    roles: [{
      role: String,
      count: Number,
      percent: Number,
    }],
  }],
})

module.exports = mongoose.model('MarketSnapshot', marketSnapshotSchema)
