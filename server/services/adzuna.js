//server/services/adzuna.js
// Wraps Adzuna's free public Jobs API (https://developer.adzuna.com) for
// India ('in'). Requires ADZUNA_APP_ID / ADZUNA_APP_KEY - get a free key at
// https://developer.adzuna.com/signup, no billing/credit card required.
const BASE_URL = 'https://api.adzuna.com/v1/api/jobs/in'

function hasCredentials() {
  return Boolean(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY)
}

function creds() {
  return {
    app_id: process.env.ADZUNA_APP_ID,
    app_key: process.env.ADZUNA_APP_KEY,
  }
}

async function callAdzuna(path, params) {
  const url = new URL(`${BASE_URL}${path}`)
  const allParams = { ...creds(), 'content-type': 'application/json', ...params }
  Object.entries(allParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value)
  })

  const response = await fetch(url.toString())
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Adzuna request failed (${response.status}): ${body.slice(0, 200)}`)
  }
  return response.json()
}

// Total number of live job postings matching a keyword (+ optional city).
async function searchCount(what, where) {
  const data = await callAdzuna('/search/1', { what, where, results_per_page: 1 })
  if (typeof data.count === 'number') return data.count
  return Array.isArray(data.results) ? data.results.length : 0
}

// Top 5 hiring companies for a keyword (+ optional city).
async function topCompanies(what, where) {
  const data = await callAdzuna('/top_companies', { what, where })
  return Array.isArray(data.leaderboard) ? data.leaderboard : []
}

// Salary distribution buckets for a keyword (+ optional city). Returns the
// populated min/max range in rupees, derived from the histogram buckets.
async function salaryRange(what, where) {
  const data = await callAdzuna('/histogram', { what, location1: where })
  const histogram = data.histogram || {}
  const buckets = Object.entries(histogram)
    .map(([salary, vacancies]) => ({ salary: Number(salary), vacancies: Number(vacancies) }))
    .filter(bucket => bucket.vacancies > 0)
  if (!buckets.length) return null
  const salaries = buckets.map(b => b.salary).sort((a, b) => a - b)
  return { min: salaries[0], max: salaries[salaries.length - 1] }
}

module.exports = { hasCredentials, searchCount, topCompanies, salaryRange }
