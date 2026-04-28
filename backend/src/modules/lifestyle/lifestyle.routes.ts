import { FastifyInstance } from 'fastify'
import prisma from '../../lib/prisma'

export async function lifestyleRoutes(app: FastifyInstance) {
  // GET /api/lifestyle?date=YYYY-MM-DD
  app.get<{ Querystring: { date?: string } }>(
    '/',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { id: userId } = req.user as { id: string }
      const date = req.query.date ?? new Date().toISOString().slice(0, 10)
      const log = await prisma.dailyLifestyle.findUnique({
        where: { userId_logDate: { userId, logDate: new Date(date) } },
      })
      return reply.send(log ?? null)
    }
  )

  // GET /api/lifestyle/history — 30 ngày gần nhất
  app.get(
    '/history',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { id: userId } = req.user as { id: string }
      const logs = await prisma.dailyLifestyle.findMany({
        where: { userId },
        orderBy: { logDate: 'desc' },
        take: 30,
      })
      return reply.send(logs)
    }
  )

  // POST /api/lifestyle — upsert log hôm nay
  app.post<{
    Body: { date?: string; steps?: number; sleepHours?: number; caloriesIn?: number; proteinG?: number; notes?: string }
  }>(
    '/',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { id: userId } = req.user as { id: string }
      const { date, ...data } = req.body
      const logDate = date ?? new Date().toISOString().slice(0, 10)
      const log = await prisma.dailyLifestyle.upsert({
        where: { userId_logDate: { userId, logDate: new Date(logDate) } },
        update: data,
        create: { userId, logDate: new Date(logDate), ...data },
      })
      return reply.code(201).send(log)
    }
  )
}
