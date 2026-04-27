import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyCors from '@fastify/cors'
import { authRoutes } from './modules/auth/auth.routes'

const app = Fastify({ logger: true })

// ─── PLUGINS ─────────────────────────────────────────────────────────────────
app.register(fastifyCors, { origin: true })

app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
})

// Decorator để protect routes
app.decorate('authenticate', async function (req: any, reply: any) {
  try {
    await req.jwtVerify()
  } catch {
    reply.code(401).send({ error: 'Unauthorized' })
  }
})

// ─── ROUTES ──────────────────────────────────────────────────────────────────
app.register(authRoutes, { prefix: '/api/auth' })

app.get('/health', async () => ({ status: 'ok' }))

// ─── START ───────────────────────────────────────────────────────────────────
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3001
    await app.listen({ port, host: '0.0.0.0' })
    console.log(`Server running on http://localhost:${port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
