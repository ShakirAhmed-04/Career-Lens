//server/routes/user.js
const express = require('express')
const router = express.Router()
const { isAuthenticated } = require('../middleware/auth')
const User = require('../models/User')

router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

router.put('/skills', isAuthenticated, async (req, res) => {
  try {
    const { skills } = req.body
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { skills },
      { new: true }
    )
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

router.put('/target-role', isAuthenticated, async (req, res) => {
  try {
    const { targetRole } = req.body
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { targetRole },
      { new: true }
    )
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router