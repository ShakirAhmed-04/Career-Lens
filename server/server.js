const dns=require('node:dns');
dns.setDefaultResultOrder('ipv4first');
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
const session = require('express-session')
// connect-mongo v6 ships dual ESM/CJS bundles; depending on the exact
// version resolved, `require('connect-mongo')` can return the class
// directly OR an interop wrapper of the shape { default: MongoStore }.
// Handle both so this doesn't break on a patch bump.
const connectMongo = require('connect-mongo')
const MongoStore = connectMongo.create ? connectMongo : connectMongo.default
const passport = require('passport')
const rateLimit = require('express-rate-limit')
const path = require('path')
require('dotenv').config()

require('./config/passport')

const app = express()

// Trust the first proxy hop (Render/Railway/etc.) so secure cookies and
// req.secure are detected correctly in production.
app.set('trust proxy', 1)

// Security
app.use(helmet())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
})
app.use(limiter)

// CORS
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.CLIENT_URL
  ].filter(Boolean),
  credentials: true
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    // Client (Vercel) and server (Render/Railway/etc.) live on different
    // domains in production, so the session cookie must be sent cross-site.
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}))

// Passport
app.use(passport.initialize())
app.use(passport.session())

// Connect MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err))

// Routes
app.use('/auth', require('./routes/auth'))
app.use('/api/user', require('./routes/user'))
app.use('/api/resume', require('./routes/resume'))
app.use('/api/ai', require('./routes/ai'))
app.use('/api/chat', require('./routes/chat'))
app.use('/api/progress', require('./routes/progress'))
app.use('/api/interview', require('./routes/interview'))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
