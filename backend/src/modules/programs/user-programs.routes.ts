import { FastifyInstance } from 'fastify'
import prisma from '../../lib/prisma'

export async function userProgramRoutes(app: FastifyInstance) {
  // POST /api/user-programs — bắt đầu chương trình
  app.post<{ Body: { programId: string; startDate: string } }>(
    '/',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { id: userId } = req.user as { id: string }
      const { programId, startDate } = req.body

      // Deactivate chu kỳ cũ nếu có
      await prisma.userProgram.updateMany({
        where: { userId, status: 'active' },
        data: { status: 'completed' },
      })

      // Đếm số chu kỳ đã qua
      const cycleCount = await prisma.userProgram.count({ where: { userId, programId } })

      const userProgram = await prisma.userProgram.create({
        data: {
          userId,
          programId,
          cycleNumber: cycleCount + 1,
          startDate: new Date(startDate),
          status: 'active',
        },
      })
      return reply.code(201).send(userProgram)
    }
  )

  // GET /api/user-programs/active — chu kỳ đang chạy + trạng thái hôm nay
  app.get(
    '/active',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { id: userId } = req.user as { id: string }

      const userProgram = await prisma.userProgram.findFirst({
        where: { userId, status: 'active' },
        include: {
          program: {
            include: {
              days: {
                orderBy: { dayOfWeek: 'asc' },
                include: {
                  dayExercises: {
                    orderBy: { orderIndex: 'asc' },
                    include: { exercise: true },
                  },
                },
              },
            },
          },
        },
      })

      if (!userProgram) return reply.send(null)

      // Tính tuần hiện tại (1..4)
      const start = new Date(userProgram.startDate)
      const now = new Date()
      const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      const weekNumber = Math.min(Math.floor(diffDays / 7) + 1, userProgram.program.durationWeeks)

      // Hôm nay là ngày mấy trong tuần (1=Mon..7=Sun)
      const todayDow = now.getDay() === 0 ? 7 : now.getDay()
      const todayDay = userProgram.program.days.find((d) => d.dayOfWeek === todayDow) ?? null

      // Session hôm nay đã có chưa
      const todayStr = now.toISOString().slice(0, 10)
      const todaySession = todayDay
        ? await prisma.workoutSession.findFirst({
            where: {
              userProgramId: userProgram.id,
              programDayId: todayDay.id,
              sessionDate: new Date(todayStr),
            },
          })
        : null

      // Tổng số buổi workout (không tính nghỉ)
      const totalWorkoutDays = userProgram.program.days.filter((d) => d.type === 'workout').length
      const completedSessions = await prisma.workoutSession.count({
        where: { userProgramId: userProgram.id, completedAt: { not: null } },
      })

      return reply.send({
        ...userProgram,
        weekNumber,
        todayDay,
        todaySession,
        totalWorkoutDays: totalWorkoutDays * userProgram.program.durationWeeks,
        completedSessions,
      })
    }
  )

  // PATCH /api/user-programs/:id/status
  app.patch<{ Params: { id: string }; Body: { status: string } }>(
    '/:id/status',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const updated = await prisma.userProgram.update({
        where: { id: req.params.id },
        data: { status: req.body.status as any },
      })
      return reply.send(updated)
    }
  )
}
