import 'dotenv/config'
import './lib/env'   // fail fast nếu thiếu env
import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyCors from '@fastify/cors'
import { authRoutes } from './modules/auth/auth.routes'
import { programRoutes } from './modules/programs/programs.routes'
import { userProgramRoutes } from './modules/programs/user-programs.routes'
import { exerciseRoutes } from './modules/programs/exercises.routes'
import { workoutGroupRoutes } from './modules/programs/workout-groups.routes'
import { sessionRoutes } from './modules/sessions/sessions.routes'
import { progressRoutes } from './modules/progress/progress.routes'
import { lifestyleRoutes } from './modules/lifestyle/lifestyle.routes'

const app = Fastify({ logger: { level: 'warn' } })

// ─── PLUGINS ─────────────────────────────────────────────────────────────────
const isProd = process.env.NODE_ENV === 'production'
app.register(fastifyCors, {
  origin: isProd
    ? (origin, cb) => {
        const allowed = [
          /\.vercel\.app$/,
          /localhost/,
          ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
        ]
        const ok = !origin || allowed.some((p) =>
          typeof p === 'string' ? p === origin : p.test(origin)
        )
        cb(null, ok)
      }
    : true,
  credentials: true,
})

app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET!,
})

app.decorate('authenticate', async function (req: any, reply: any) {
  try {
    await req.jwtVerify()
  } catch {
    reply.code(401).send({ error: 'Unauthorized' })
  }
})

// ─── ROUTES ──────────────────────────────────────────────────────────────────
app.register(authRoutes,        { prefix: '/api/auth' })
app.register(programRoutes,     { prefix: '/api/programs' })
app.register(userProgramRoutes, { prefix: '/api/user-programs' })
app.register(exerciseRoutes,    { prefix: '/api/exercises' })
app.register(workoutGroupRoutes, { prefix: '/api/workout-groups' })
app.register(sessionRoutes,     { prefix: '/api/sessions' })
app.register(progressRoutes,    { prefix: '/api/progress' })
app.register(lifestyleRoutes,   { prefix: '/api/lifestyle' })

app.get('/health', async () => ({ status: 'ok' }))

// ─── START ───────────────────────────────────────────────────────────────────
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3001
    await app.listen({ port, host: '0.0.0.0' })
    console.log(`✓ Server running on http://localhost:${port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
