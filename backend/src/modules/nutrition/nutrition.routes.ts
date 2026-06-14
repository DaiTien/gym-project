import { FastifyInstance } from 'fastify'
import prisma from '../../lib/prisma'

export async function nutritionRoutes(app: FastifyInstance) {
  // POST /api/nutrition/analyze
  app.post<{ Body: { text?: string; imageBase64?: string } }>(
    '/analyze',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { text, imageBase64 } = req.body
      if (!process.env.GEMINI_API_KEY) {
        return reply.code(500).send({ error: 'Backend chưa cấu hình GEMINI_API_KEY' })
      }

      const promptText = `Phân tích món ăn trong hình ảnh hoặc văn bản sau. 
Hãy ước lượng và trả về kết quả dưới dạng một mảng JSON các món ăn. 
Mỗi món ăn có định dạng chính xác như sau:
{
  "foodName": "Tên món ăn (tiếng Việt)",
  "weightG": 100,
  "calories": 250,
  "protein": 20.5,
  "carb": 10.2,
  "fat": 5.0
}
KHÔNG BAO GỒM markdown hay \`\`\`json. Chỉ trả về mảng JSON hợp lệ. Ví dụ: [{"foodName": "Cơm trắng", "weightG": 200, "calories": 260, "protein": 5, "carb": 56, "fat": 0.5}]
${text ? `\nGhi chú thêm từ người dùng: ${text}` : ''}`

      const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`

      try {
        const parts: any[] = [{ text: promptText }]

        if (imageBase64) {
          const base64Content = imageBase64.replace(/^data:image\/\w+;base64,/, '')
          const mimeTypeMatch = imageBase64.match(/^data:(image\/\w+);base64,/)
          const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg'

          parts.push({
            inline_data: { mime_type: mimeType, data: base64Content }
          })
        } else if (!text) {
          return reply.code(400).send({ error: 'Cần cung cấp text hoặc imageBase64' })
        }

        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 1024 }
          })
        })

        const result: any = await response.json()

        if (result.error) {
          console.error("Gemini API Error Object:", result.error)
          throw new Error(result.error.message || "Lỗi API Gemini")
        }

        const responseText = result.candidates[0].content.parts[0].text
        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim()
        
        let parsed
        try {
          parsed = JSON.parse(cleanedText)
        } catch (e) {
          return reply.code(500).send({ error: 'AI trả về định dạng không hợp lệ', raw: cleanedText })
        }
        
        // Đảm bảo trả về mảng
        if (!Array.isArray(parsed)) {
          parsed = [parsed]
        }
        return reply.send(parsed)
      } catch (err: any) {
        app.log.error(err)
        return reply.code(500).send({ error: 'Lỗi phân tích AI', details: err.message })
      }
    }
  )

  // Hàm helper để update tổng DailyLifestyle
  async function updateDailyMacros(dailyLifestyleId: string) {
    const agg = await prisma.foodLog.aggregate({
      where: { dailyLifestyleId },
      _sum: { calories: true, protein: true, carb: true, fat: true }
    })
    await prisma.dailyLifestyle.update({
      where: { id: dailyLifestyleId },
      data: {
        caloriesIn: Math.round(agg._sum.calories ?? 0),
        proteinG: Math.round(agg._sum.protein ?? 0),
        carbG: Math.round(agg._sum.carb ?? 0),
        fatG: Math.round(agg._sum.fat ?? 0),
      },
    })
  }

  // POST /api/nutrition/log
  app.post<{ Body: { date: string; foodName: string; weightG?: number; calories: number; protein: number; carb: number; fat: number } }>(
    '/log',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { id: userId } = req.user as { id: string }
      const { date, foodName, weightG, calories, protein, carb, fat } = req.body

      const dailyLog = await prisma.dailyLifestyle.upsert({
        where: { userId_logDate: { userId, logDate: new Date(date) } },
        update: {},
        create: { userId, logDate: new Date(date) },
      })

      const foodLog = await prisma.foodLog.create({
        data: {
          dailyLifestyleId: dailyLog.id,
          foodName,
          weightG,
          calories,
          protein,
          carb,
          fat,
        },
      })

      await updateDailyMacros(dailyLog.id)
      return reply.code(201).send(foodLog)
    }
  )

  // PATCH /api/nutrition/log/:id
  app.patch<{ Params: { id: string }; Body: { foodName: string; weightG?: number; calories: number; protein: number; carb: number; fat: number } }>(
    '/log/:id',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { id: userId } = req.user as { id: string }
      const log = await prisma.foodLog.findUnique({ where: { id: req.params.id }, include: { dailyLifestyle: true } })
      if (!log) return reply.code(404).send({ error: 'Not found' })
      if (log.dailyLifestyle.userId !== userId) return reply.code(403).send({ error: 'Không có quyền' })

      const updated = await prisma.foodLog.update({
        where: { id: req.params.id },
        data: req.body,
      })

      await updateDailyMacros(log.dailyLifestyleId)
      return reply.send(updated)
    }
  )

  // DELETE /api/nutrition/log/:id
  app.delete<{ Params: { id: string } }>(
    '/log/:id',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { id: userId } = req.user as { id: string }
      const log = await prisma.foodLog.findUnique({ where: { id: req.params.id }, include: { dailyLifestyle: true } })
      if (!log) return reply.code(404).send({ error: 'Not found' })
      if (log.dailyLifestyle.userId !== userId) return reply.code(403).send({ error: 'Không có quyền' })

      await prisma.foodLog.delete({ where: { id: req.params.id } })
      await updateDailyMacros(log.dailyLifestyleId)
      return reply.code(204).send()
    }
  )
}
