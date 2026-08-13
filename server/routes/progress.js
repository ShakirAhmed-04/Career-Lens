//server/routes/progress.js
const express = require('express')
const router = express.Router()
const { isAuthenticated } = require('../middleware/auth')
const User = require('../models/User')

router.put('/roadmap/:weekIndex', isAuthenticated, async (req, res) => {
  try {
    const { weekIndex } = req.params
    const { completed } = req.body

    const user = await User.findById(req.user._id)
    user.roadmap[weekIndex].completed = completed
    await user.save()

    const completedCount = user.roadmap.filter(w => w.completed).length
    const percentage = Math.round((completedCount / user.roadmap.length) * 100)

    res.json({ roadmap: user.roadmap, percentage })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router