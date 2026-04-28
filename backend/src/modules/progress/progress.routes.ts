import { FastifyInstance } from 'fastify'
import prisma from '../../lib/prisma'

export async function progressRoutes(app: FastifyInstance) {
  // GET /api/progress/weights
  app.get('/weights', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id: userId } = req.user as { id: string }
    const weights = await prisma.bodyWeight.findMany({
      where: { userId },
      orderBy: { recordedDate: 'asc' },
    })
    return reply.send(weights)
  })

  // POST /api/progress/weights
  app.post<{ Body: { weightKg: number; date?: string } }>(
    '/weights',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { id: userId } = req.user as { id: string }
      const date = req.body.date ?? new Date().toISOString().slice(0, 10)
      const record = await prisma.bodyWeight.upsert({
        where: { userId_recordedDate: { userId, recordedDate: new Date(date) } },
        update: { weightKg: req.body.weightKg },
        create: { userId, recordedDate: new Date(date), weightKg: req.body.weightKg },
      })
      return reply.code(201).send(record)
    }
  )

  // GET /api/progress/overview
  app.get('/overview', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id: userId } = req.user as { id: string }

    const userProgram = await prisma.userProgram.findFirst({
      where: { userId, status: 'active' },
    })

    const latestWeight = await prisma.bodyWeight.findFirst({
      where: { userId },
      orderBy: { recordedDate: 'desc' },
    })

    // Streak: đếm ngày có completed session liên tiếp tính từ hôm nay
    const sessions = await prisma.workoutSession.findMany({
      where: { userProgram: { userId }, completedAt: { not: null } },
      orderBy: { sessionDate: 'desc' },
      select: { sessionDate: true },
    })

    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const sessionDates = sessions.map((s) => {
      const d = new Date(s.sessionDate)
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    })
    const uniqueDates = [...new Set(sessionDates)].sort((a, b) => b - a)
    for (let i = 0; i < uniqueDates.length; i++) {
      const expected = today.getTime() - i * 86400000
      if (uniqueDates[i] === expected) streak++
      else break
    }

    return reply.send({ userProgram, latestWeight, streak })
  })

  // GET /api/progress/exercises/:exerciseId — lịch sử tạ/rep theo bài
  app.get<{ Params: { exerciseId: string } }>(
    '/exercises/:exerciseId',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { id: userId } = req.user as { id: string }
      const sets = await prisma.sessionSet.findMany({
        where: {
          exerciseId: req.params.exerciseId,
          session: { userProgram: { userId } },
        },
        include: { session: { select: { sessionDate: true, weekNumber: true } } },
        orderBy: { session: { sessionDate: 'asc' } },
      })
      // Group by session date, lấy set nặng nhất mỗi buổi
      const byDate = new Map<string, { date: string; weekNumber: number; maxWeight: number; maxReps: number }>()
      for (const s of sets) {
        const key = s.session.sessionDate.toISOString().slice(0, 10)
        const existing = byDate.get(key)
        if (!existing || (s.weightKg ?? 0) > existing.maxWeight) {
          byDate.set(key, {
            date: key,
            weekNumber: s.session.weekNumber,
            maxWeight: s.weightKg ?? 0,
            maxReps: s.repsDone ?? 0,
          })
        }
      }
      return reply.send([...byDate.values()])
    }
  )
}
