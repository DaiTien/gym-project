import { FastifyInstance } from 'fastify'
import prisma from '../../lib/prisma'

export async function programRoutes(app: FastifyInstance) {
  // GET /api/programs — danh sách chương trình
  app.get('/', async (_req, reply) => {
    const programs = await prisma.program.findMany({
      select: { id: true, name: true, durationWeeks: true, description: true },
    })
    return reply.send(programs)
  })

  // GET /api/programs/:id — chi tiết + lịch + bài tập
  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const program = await prisma.program.findUnique({
      where: { id: req.params.id },
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
    })
    if (!program) return reply.code(404).send({ error: 'Program not found' })
    return reply.send(program)
  })
}
