import { FastifyInstance } from 'fastify'
import prisma from '../../lib/prisma'

// schedule: { [dayOfWeek: number]: programDayId | null }
// VD: { 1: "day-mon", 2: "day-tue", 3: null, 4: "day-thu", 5: "day-fri", 6: null, 7: null }
type ScheduleInput = Record<string, string | null>

export async function userProgramRoutes(app: FastifyInstance) {
  // POST /api/user-programs — bắt đầu chương trình + lịch tập user chọn
  app.post<{ Body: { programId: string; startDate: string; schedule?: ScheduleInput } }>(
    '/',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { id: userId } = req.user as { id: string }
      const { programId, startDate, schedule } = req.body

      await prisma.userProgram.updateMany({
        where: { userId, status: 'active' },
        data: { status: 'completed' },
      })

      const cycleCount = await prisma.userProgram.count({ where: { userId, programId } })

      // Nếu không truyền schedule thì dùng default từ ProgramDay.dayOfWeek
      let resolvedSchedule = schedule
      if (!resolvedSchedule) {
        const days = await prisma.programDay.findMany({ where: { programId } })
        resolvedSchedule = {}
        for (const d of days) {
          resolvedSchedule[String(d.dayOfWeek)] = d.id
        }
      }

      const userProgram = await prisma.userProgram.create({
        data: {
          userId,
          programId,
          cycleNumber: cycleCount + 1,
          startDate: new Date(startDate),
          status: 'active',
          schedule: {
            create: Object.entries(resolvedSchedule)
              .filter(([, dayId]) => dayId !== null)
              .map(([dow, dayId]) => ({
                dayOfWeek: Number(dow),
                programDayId: dayId!,
              })),
          },
        },
      })
      return reply.code(201).send(userProgram)
    }
  )

  // PATCH /api/user-programs/:id/schedule — đổi lịch tập
  app.patch<{ Params: { id: string }; Body: { schedule: ScheduleInput } }>(
    '/:id/schedule',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { id } = req.params
      const { schedule } = req.body

      // Xoá schedule cũ, tạo lại
      await prisma.userProgramSchedule.deleteMany({ where: { userProgramId: id } })
      await prisma.userProgramSchedule.createMany({
        data: Object.entries(schedule)
          .filter(([, dayId]) => dayId !== null)
          .map(([dow, dayId]) => ({
            userProgramId: id,
            dayOfWeek: Number(dow),
            programDayId: dayId!,
          })),
      })

      const updated = await prisma.userProgramSchedule.findMany({
        where: { userProgramId: id },
        include: { programDay: true },
      })
      return reply.send(updated)
    }
  )

  // GET /api/user-programs/active
  app.get(
    '/active',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { id: userId } = req.user as { id: string }

      const userProgram = await prisma.userProgram.findFirst({
        where: { userId, status: 'active' },
        include: {
          schedule: true,
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

      const start = new Date(userProgram.startDate)
      const now = new Date()
      const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      const weekNumber = Math.min(Math.floor(diffDays / 7) + 1, userProgram.program.durationWeeks)

      // Tìm buổi tập hôm nay dựa vào schedule của user
      const todayDow = now.getDay() === 0 ? 7 : now.getDay()
      const todayScheduleEntry = userProgram.schedule.find((s) => s.dayOfWeek === todayDow)
      const todayDay = todayScheduleEntry
        ? userProgram.program.days.find((d) => d.id === todayScheduleEntry.programDayId) ?? null
        : null

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