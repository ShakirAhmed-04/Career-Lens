//server/routes/auth.js
const express = require('express')
const passport = require('passport')
const router = express.Router()
require('dotenv').config()

const getClientUrl = (req) => {
  if (req.session?.clientUrl) return req.session.clientUrl

  const origin = req.headers.origin
  if (origin && /^http:\/\/localhost:\d+$/.test(origin)) return origin

  const referer = req.headers.referer
  if (referer) {
    try {
      const parsed = new URL(referer)
      return `${parsed.protocol}//${parsed.host}`
    } catch {
      // fall through to env default
    }
  }

  return process.env.CLIENT_URL || 'http://localhost:5174'
}

router.get('/google', (req, res, next) => {
  req.session.clientUrl = getClientUrl(req)
  next()
}, passport.authenticate('google', {
  scope: ['profile', 'email'],
  prompt: 'select_account'
}))

router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', (err, user) => {
    const clientUrl = getClientUrl(req)

    if (err || !user) {
      return res.redirect(`${clientUrl}/`)
    }

    req.logIn(user, (loginErr) => {
      if (loginErr) {
        return res.redirect(`${clientUrl}/`)
      }

      return res.redirect(`${clientUrl}/dashboard`)
    })
  })(req, res, next)
})

router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user })
  } else {
    res.status(401).json({ user: null })
  }
})

router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: 'Logout failed' })
    res.json({ message: 'Logged out successfully' })
  })
})

module.exports = router