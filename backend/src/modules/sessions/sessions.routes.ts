import { FastifyInstance } from 'fastify'
import prisma from '../../lib/prisma'

export async function sessionRoutes(app: FastifyInstance) {
  // POST /api/sessions — bắt đầu buổi tập
  app.post<{ Body: { userProgramId: string; programDayId: string; weekNumber: number } }>(
    '/',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { userProgramId, programDayId, weekNumber } = req.body
      const today = new Date().toISOString().slice(0, 10)

      // Nếu đã có session hôm nay thì trả về luôn
      const existing = await prisma.workoutSession.findFirst({
        where: { userProgramId, programDayId, sessionDate: new Date(today) },
        include: {
          sets: { orderBy: [{ circuitRound: 'asc' }, { setIndex: 'asc' }] },
          programDay: {
            include: {
              dayExercises: {
                orderBy: { orderIndex: 'asc' },
                include: { exercise: true },
              },
            },
          },
        },
      })
      if (existing) return reply.send(existing)

      const session = await prisma.workoutSession.create({
        data: {
          userProgramId,
          programDayId,
          weekNumber,
          sessionDate: new Date(today),
        },
        include: {
          sets: true,
          programDay: {
            include: {
              dayExercises: {
                orderBy: { orderIndex: 'asc' },
                include: { exercise: true },
              },
            },
          },
        },
      })
      return reply.code(201).send(session)
    }
  )

  // GET /api/sessions/:id
  app.get<{ Params: { id: string } }>(
    '/:id',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const session = await prisma.workoutSession.findUnique({
        where: { id: req.params.id },
        include: {
          sets: { orderBy: [{ circuitRound: 'asc' }, { setIndex: 'asc' }] },
          programDay: {
            include: {
              dayExercises: {
                orderBy: { orderIndex: 'asc' },
                include: { exercise: true },
              },
            },
          },
        },
      })
      if (!session) return reply.code(404).send({ error: 'Session not found' })
      return reply.send(session)
    }
  )

  // PATCH /api/sessions/:id/complete
  app.patch<{ Params: { id: string } }>(
    '/:id/complete',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const session = await prisma.workoutSession.update({
        where: { id: req.params.id },
        data: { completedAt: new Date() },
      })
      return reply.send(session)
    }
  )

  // POST /api/sessions/:id/sets — log 1 set
  app.post<{
    Params: { id: string }
    Body: { exerciseId: string; circuitRound: number; setIndex: number; repsDone?: number; weightKg?: number; durationSec?: number }
  }>(
    '/:id/sets',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { exerciseId, circuitRound, setIndex, repsDone, weightKg, durationSec } = req.body
      const set = await prisma.sessionSet.create({
        data: {
          sessionId: req.params.id,
          exerciseId,
          circuitRound,
          setIndex,
          repsDone,
          weightKg,
          durationSec,
        },
      })
      return reply.code(201).send(set)
    }
  )

  // PATCH /api/sessions/:id/sets/:setId — cập nhật set
  app.patch<{
    Params: { id: string; setId: string }
    Body: { repsDone?: number; weightKg?: number; durationSec?: number }
  }>(
    '/:id/sets/:setId',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const set = await prisma.sessionSet.update({
        where: { id: req.params.setId },
        data: req.body,
      })
      return reply.send(set)
    }
  )

  // DELETE /api/sessions/:id/sets/:setId
  app.delete<{ Params: { id: string; setId: string } }>(
    '/:id/sets/:setId',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      await prisma.sessionSet.delete({ where: { id: req.params.setId } })
      return reply.code(204).send()
    }
  )
}
