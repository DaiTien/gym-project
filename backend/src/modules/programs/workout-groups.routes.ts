import { FastifyInstance } from 'fastify'
import prisma from '../../lib/prisma'

// Workout Groups = ProgramDay với userId (nhóm tập của riêng user)
// Global ProgramDay (userId=null) chỉ đọc, không sửa/xóa qua đây

export async function workoutGroupRoutes(app: FastifyInstance) {

  // GET /api/workout-groups — global + của user, kèm danh sách bài tập
  app.get('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id: userId } = req.user as { id: string }

    const groups = await prisma.programDay.findMany({
      where: { OR: [{ userId: null }, { userId }] },
      orderBy: [{ userId: 'asc' }, { label: 'asc' }],
      include: {
        dayExercises: {
          orderBy: { orderIndex: 'asc' },
          include: { exercise: true },
        },
      },
    })
    return reply.send(groups)
  })

  // POST /api/workout-groups — tạo nhóm mới cho user
  app.post<{ Body: { label: string; circuitRounds?: number; programId?: string } }>(
    '/',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { id: userId } = req.user as { id: string }
      const { label, circuitRounds = 3 } = req.body

      // Dùng programId mặc định (Dad Bod) để nhóm user có thể dùng trong lịch
      const defaultProgram = await prisma.program.findFirst()
      if (!defaultProgram) return reply.code(500).send({ error: 'No program found' })

      const group = await prisma.programDay.create({
        data: {
          programId: defaultProgram.id,
          label,
          type: 'workout',
          circuitRounds,
          dayOfWeek: 1, // placeholder, sẽ được gán khi chọn lịch
          userId,
        },
        include: {
          dayExercises: { include: { exercise: true } },
        },
      })
      return reply.code(201).send(group)
    }
  )

  // PATCH /api/workout-groups/:id — sửa nhóm (chỉ owner)
  app.patch<{ Params: { id: string }; Body: { label?: string; circuitRounds?: number } }>(
    '/:id',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { id: userId } = req.user as { id: string }
      const group = await prisma.programDay.findUnique({ where: { id: req.params.id } })
      if (!group) return reply.code(404).send({ error: 'Not found' })
      if (group.userId !== userId) return reply.code(403).send({ error: 'Không có quyền' })
      const updated = await prisma.programDay.update({
        where: { id: req.params.id },
        data: req.body,
        include: { dayExercises: { include: { exercise: true } } },
      })
      return reply.send(updated)
    }
  )

  // DELETE /api/workout-groups/:id — xóa nhóm (chỉ owner)
  app.delete<{ Params: { id: string } }>(
    '/:id',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { id: userId } = req.user as { id: string }
      const group = await prisma.programDay.findUnique({ where: { id: req.params.id } })
      if (!group) return reply.code(404).send({ error: 'Not found' })
      if (group.userId !== userId) return reply.code(403).send({ error: 'Không có quyền' })
      // Xóa dayExercises trước
      await prisma.dayExercise.deleteMany({ where: { programDayId: req.params.id } })
      await prisma.programDay.delete({ where: { id: req.params.id } })
      return reply.code(204).send()
    }
  )

  // POST /api/workout-groups/:id/exercises — thêm bài tập vào nhóm
  app.post<{
    Params: { id: string }
    Body: { exerciseId: string; week12Reps?: number; week34Reps?: number; notes?: string; isFinisher?: boolean; finisherPair?: string }
  }>(
    '/:id/exercises',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { id: userId } = req.user as { id: string }
      const group = await prisma.programDay.findUnique({ where: { id: req.params.id } })
      if (!group) return reply.code(404).send({ error: 'Not found' })
      if (group.userId !== userId) return reply.code(403).send({ error: 'Không có quyền' })

      const count = await prisma.dayExercise.count({ where: { programDayId: req.params.id } })
      const { exerciseId, week12Reps, week34Reps, notes, isFinisher = false, finisherPair } = req.body

      const de = await prisma.dayExercise.create({
        data: {
          programDayId: req.params.id,
          exerciseId,
          orderIndex: count + 1,
          week12Reps,
          week34Reps,
          notes,
          isFinisher,
          finisherPair,
        },
        include: { exercise: true },
      })
      return reply.code(201).send(de)
    }
  )

  // DELETE /api/workout-groups/:id/exercises/:deId — xóa bài khỏi nhóm
  app.delete<{ Params: { id: string; deId: string } }>(
    '/:id/exercises/:deId',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { id: userId } = req.user as { id: string }
      const group = await prisma.programDay.findUnique({ where: { id: req.params.id } })
      if (!group) return reply.code(404).send({ error: 'Not found' })
      if (group.userId !== userId) return reply.code(403).send({ error: 'Không có quyền' })
      await prisma.dayExercise.delete({ where: { id: req.params.deId } })
      return reply.code(204).send()
    }
  )

  // PATCH /api/workout-groups/:id/exercises/reorder — đổi thứ tự
  app.patch<{ Params: { id: string }; Body: { order: string[] } }>(
    '/:id/exercises/reorder',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { id: userId } = req.user as { id: string }
      const group = await prisma.programDay.findUnique({ where: { id: req.params.id } })
      if (!group) return reply.code(404).send({ error: 'Not found' })
      if (group.userId !== userId) return reply.code(403).send({ error: 'Không có quyền' })

      await Promise.all(
        req.body.order.map((deId, idx) =>
          prisma.dayExercise.update({ where: { id: deId }, data: { orderIndex: idx + 1 } })
        )
      )
      return reply.send({ ok: true })
    }
  )
}
