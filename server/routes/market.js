//server/routes/market.js
const express = require('express')
const router = express.Router()
const { isAuthenticated } = require('../middleware/auth')
const MarketSnapshot = require('../models/MarketSnapshot')
const adzuna = require('../services/adzuna')

const PRIMARY_CITY = 'Bangalore'
const SNAPSHOT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // refresh weekly

const TRACKED_SKILLS = [
  'React', 'Python', 'Java', 'PHP', 'Node.js',
  'LangChain', 'FastAPI', 'Kubernetes', 'AngularJS', 'jQuery', 'Cordova',
]

const SALARY_GROUPS = [
  { label: 'React + Node.js', query: 'react node.js' },
  { label: 'Python + ML', query: 'python machine learning' },
  { label: 'Java + Spring', query: 'java spring' },
]

const CITY_ROLES = [
  { city: 'Bangalore', roles: ['Frontend Developer', 'Backend Developer'] },
  { city: 'Hyderabad', roles: ['Java Developer', 'Software Testing'] },
]

function rupeesToLpaLabel(rupees) {
  if (!rupees && rupees !== 0) return null
  return Math.round((rupees / 100000) * 10) / 10
}

// Builds one fresh snapshot by calling the Adzuna API. Kept sequential
// (not Promise.all) to stay comfortably inside Adzuna's free-tier rate limits.
async function buildSnapshot() {
  const skillCounts = []
  for (const skill of TRACKED_SKILLS) {
    try {
      const count = await adzuna.searchCount(skill, PRIMARY_CITY)
      skillCounts.push({ skill, count })
    } catch (err) {
      console.error(`Adzuna skill count failed for "${skill}":`, err.message)
    }
  }

  let topCompaniesRaw = []
  try {
    topCompaniesRaw = await adzuna.topCompanies('software developer', PRIMARY_CITY)
  } catch (err) {
    console.error('Adzuna top companies failed:', err.message)
  }
  const topCompanies = topCompaniesRaw.map(entry => ({
    name: entry.canonical_name,
    count: entry.count,
    averageSalary: entry.average_salary || null,
  }))

  const salaryRanges = []
  for (const group of SALARY_GROUPS) {
    try {
      const range = await adzuna.salaryRange(group.query, PRIMARY_CITY)
      if (range) salaryRanges.push({ label: group.label, min: range.min, max: range.max })
    } catch (err) {
      console.error(`Adzuna salary histogram failed for "${group.label}":`, err.message)
    }
  }

  const cityRoleDemand = []
  for (const entry of CITY_ROLES) {
    try {
      const totalJobs = await adzuna.searchCount('developer', entry.city)
      const roles = []
      for (const role of entry.roles) {
        const count = await adzuna.searchCount(role, entry.city)
        const percent = totalJobs > 0 ? Math.round((count / totalJobs) * 1000) / 10 : 0
        roles.push({ role, count, percent })
      }
      cityRoleDemand.push({ city: entry.city, totalJobs, roles })
    } catch (err) {
      console.error(`Adzuna city role demand failed for "${entry.city}":`, err.message)
    }
  }

  return MarketSnapshot.create({
    city: PRIMARY_CITY,
    skillCounts,
    topCompanies,
    salaryRanges,
    cityRoleDemand,
  })
}

function trendFor(currentCount, previousCount) {
  if (previousCount === undefined || previousCount === null || previousCount === 0) return 'new'
  const change = (currentCount - previousCount) / previousCount
  if (change > 0.05) return 'up'
  if (change < -0.05) return 'down'
  return 'flat'
}

router.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    if (!adzuna.hasCredentials()) {
      return res.status(503).json({
        message: 'Market Analytics is not configured yet. Add ADZUNA_APP_ID and ADZUNA_APP_KEY (free, no billing required, from developer.adzuna.com/signup) to the server environment variables.',
      })
    }

    const forceRefresh = req.query.refresh === 'true'
    let [latest] = await MarketSnapshot.find().sort({ capturedAt: -1 }).limit(1)
    const isStale = !latest || (Date.now() - new Date(latest.capturedAt).getTime()) > SNAPSHOT_MAX_AGE_MS

    let previous = null
    if (isStale || forceRefresh) {
      previous = latest || null
      latest = await buildSnapshot()
    } else {
      const [older] = await MarketSnapshot.find({ capturedAt: { $lt: latest.capturedAt } })
        .sort({ capturedAt: -1 })
        .limit(1)
      previous = older || null
    }

    const previousSkillMap = new Map((previous?.skillCounts || []).map(s => [s.skill, s.count]))

    const skillTrends = latest.skillCounts
      .map(entry => ({
        skill: entry.skill,
        count: entry.count,
        trend: trendFor(entry.count, previousSkillMap.get(entry.skill)),
      }))
      .sort((a, b) => b.count - a.count)

    const movers = latest.skillCounts
      .map(entry => {
        const prevCount = previousSkillMap.get(entry.skill)
        if (!prevCount) return null
        return { skill: entry.skill, changePercent: Math.round(((entry.count - prevCount) / prevCount) * 1000) / 10 }
      })
      .filter(Boolean)

    const rising = movers.filter(m => m.changePercent > 0).sort((a, b) => b.changePercent - a.changePercent).slice(0, 5).map(m => m.skill)
    const falling = movers.filter(m => m.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent).slice(0, 5).map(m => m.skill)

    const salaryRangesLpa = latest.salaryRanges.map(range => ({
      label: range.label,
      minLpa: rupeesToLpaLabel(range.min),
      maxLpa: rupeesToLpaLabel(range.max),
    }))

    res.json({
      city: latest.city,
      lastUpdated: latest.capturedAt,
      source: 'Adzuna Jobs API (live India job postings)',
      skillTrends,
      topCompanies: latest.topCompanies,
      salaryRanges: salaryRangesLpa,
      cityRoleDemand: latest.cityRoleDemand,
      trendingSkills: { rising, falling },
    })
  } catch (err) {
    console.error('Market dashboard error:', err)
    res.status(500).json({ message: 'Could not load market analytics right now. Try again shortly.' })
  }
})

module.exports = router
