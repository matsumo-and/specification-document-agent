import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import 'dotenv/config'
import agentRoutes from './routes/agent.js'

const app = new Hono()

// Middleware
app.use('*', cors())
app.use('*', logger())

// Health check endpoint
app.get('/', (c) => {
  return c.json({ 
    status: 'ok',
    service: 'specification-document-agent',
    version: '1.0.0'
  })
})

// API routes
app.route('/api/agent', agentRoutes)

// Error handling
app.onError((err, c) => {
  console.error(`${err}`)
  return c.json({ error: err.message }, 500)
})

// Start server
const port = process.env.PORT || 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port: Number(port),
})
