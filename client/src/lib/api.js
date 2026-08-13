import axios from 'axios'

// In dev, VITE_API_URL is left empty and Vite's proxy (see vite.config.js)
// forwards /api and /auth to the local server. In production (e.g. the
// client deployed on Vercel and the server deployed elsewhere), set
// VITE_API_URL to the deployed server's base URL, e.g.
// https://careerlens-api.onrender.com
const baseURL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL,
  withCredentials: true,
})

export default api
