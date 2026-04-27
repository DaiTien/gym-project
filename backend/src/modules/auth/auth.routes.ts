import { FastifyInstance } from 'fastify'
import { registerUser, loginUser, getUserById } from './auth.service'

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'name', 'password'],
        properties: {
          email:    { type: 'string', format: 'email' },
          name:     { type: 'string', minLength: 1 },
          password: { type: 'string', minLength: 6 },
        },
      },
    },
  }, async (req, reply) => {
    const { email, name, password } = req.body as { email: string; name: string; password: string }
    try {
      const user = await registerUser(email, name, password)
      const token = app.jwt.sign({ id: user.id }, { expiresIn: '30d' })
      return reply.code(201).send({ user, token })
    } catch (err: any) {
      return reply.code(400).send({ error: err.message })
    }
  })

  app.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email:    { type: 'string' },
          password: { type: 'string' },
        },
      },
    },
  }, async (req, reply) => {
    const { email, password } = req.body as { email: string; password: string }
    try {
      const user = await loginUser(email, password)
      const token = app.jwt.sign({ id: user.id }, { expiresIn: '30d' })
      return reply.send({ user, token })
    } catch (err: any) {
      return reply.code(401).send({ error: err.message })
    }
  })

  app.get('/me', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = req.user as { id: string }
    const user = await getUserById(id)
    if (!user) return reply.code(404).send({ error: 'User not found' })
    return reply.send(user)
  })
}
