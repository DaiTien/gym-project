import { FastifyInstance } from 'fastify'
import prisma from '../../lib/prisma'

export async function exerciseRoutes(app: FastifyInstance) {
  // GET /api/exercises — global + của user hiện tại
  app.get('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id: userId } = req.user as { id: string }
    const exercises = await prisma.exercise.findMany({
      where: { OR: [{ userId: null }, { userId }] },
      orderBy: [{ userId: 'asc' }, { name: 'asc' }], // global trước, của user sau
    })
    return reply.send(exercises)
  })

  // POST /api/exercises — tạo bài tập mới cho user
  app.post<{ Body: { name: string; nameVi: string; muscleGroup?: string } }>(
    '/',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { id: userId } = req.user as { id: string }
      const { name, nameVi, muscleGroup } = req.body
      const exercise = await prisma.exercise.create({
        data: { name, nameVi, muscleGroup, userId },
      })
      return reply.code(201).send(exercise)
    }
  )

  // PATCH /api/exercises/:id — sửa (chỉ được sửa bài của mình)
  app.patch<{
    Params: { id: string }
    Body: { name?: string; nameVi?: string; muscleGroup?: string }
  }>(
    '/:id',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { id: userId } = req.user as { id: string }
      const ex = await prisma.exercise.findUnique({ where: { id: req.params.id } })
      if (!ex) return reply.code(404).send({ error: 'Not found' })
      if (ex.userId !== userId) return reply.code(403).send({ error: 'Không có quyền chỉnh sửa bài tập này' })
      const updated = await prisma.exercise.update({
        where: { id: req.params.id },
        data: req.body,
      })
      return reply.send(updated)
    }
  )

  // DELETE /api/exercises/:id — xóa (chỉ được xóa bài của mình)
  app.delete<{ Params: { id: string } }>(
    '/:id',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { id: userId } = req.user as { id: string }
      const ex = await prisma.exercise.findUnique({ where: { id: req.params.id } })
      if (!ex) return reply.code(404).send({ error: 'Not found' })
      if (ex.userId !== userId) return reply.code(403).send({ error: 'Không có quyền xóa bài tập này' })
      await prisma.exercise.delete({ where: { id: req.params.id } })
      return reply.code(204).send()
    }
  )

  // PATCH /api/exercises/:id/image — cập nhật ảnh (global hoặc của user)
  app.patch<{ Params: { id: string }; Body: { imageUrl: string } }>(
    '/:id/image',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { id: userId } = req.user as { id: string }
      const ex = await prisma.exercise.findUnique({ where: { id: req.params.id } })
      if (!ex) return reply.code(404).send({ error: 'Not found' })
      // Global exercise: ai cũng được đổi ảnh (shared)
      // User exercise: chỉ owner
      if (ex.userId && ex.userId !== userId) {
        return reply.code(403).send({ error: 'Không có quyền' })
      }
      const updated = await prisma.exercise.update({
        where: { id: req.params.id },
        data: { imageUrl: req.body.imageUrl },
      })
      return reply.send(updated)
    }
  )

  // POST /api/exercises/upload-url — signed URL upload ảnh Supabase Storage
  app.post<{ Body: { exerciseId: string; fileName: string; contentType: string } }>(
    '/upload-url',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { exerciseId, fileName, contentType } = req.body
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
      const path = `exercises/${exerciseId}/${fileName}`
      const { data, error } = await supabase.storage
        .from('exercise-images')
        .createSignedUploadUrl(path)
      if (error) return reply.code(500).send({ error: error.message })
      const { data: { publicUrl } } = supabase.storage
        .from('exercise-images')
        .getPublicUrl(path)
      return reply.send({ uploadUrl: data.signedUrl, publicUrl })
    }
  )
}
