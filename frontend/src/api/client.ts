import axios from 'axios'

// In production (Vercel), VITE_API_URL is set to the Render backend URL.
// In local dev, the Vite proxy forwards /api → localhost:8000.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 300_000,
})

export default api
