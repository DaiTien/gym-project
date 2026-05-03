import { config } from 'dotenv'
import path from 'path'
config({ path: path.join(__dirname, '..', '.env') })

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

async function main() {
  const days = await prisma.programDay.findMany({
    where: { userId: null },
    orderBy: { dayOfWeek: 'asc' },
    select: { id: true, label: true, type: true, dayOfWeek: true },
  })

  console.log('Current ProgramDays:')
  console.table(days)

  // Tìm các ngày cần xóa: rest + active_recovery duplicate
  // Giữ lại: 4 workout days + 1 active_recovery (T4)
  // Xóa: rest (CN), active_recovery duplicate (T7)

  const toDelete = days.filter(d =>
    d.type === 'rest' ||
    // Giữ lại active_recovery đầu tiên (T4), xóa các cái còn lại
    (d.type === 'active_recovery' &&
      days.filter(x => x.type === 'active_recovery').indexOf(d) > 0)
  )

  console.log('\nWill DELETE:')
  console.table(toDelete)

  if (toDelete.length === 0) {
    console.log('Nothing to delete.')
    return
  }

  for (const d of toDelete) {
    // Xóa schedules liên quan trước
    await prisma.userProgramSchedule.deleteMany({ where: { programDayId: d.id } })
    // Xóa dayExercises
    await prisma.dayExercise.deleteMany({ where: { programDayId: d.id } })
    // Xóa programDay
    await prisma.programDay.delete({ where: { id: d.id } })
    console.log(`✓ Deleted: ${d.label} (${d.type})`)
  }

  const remaining = await prisma.programDay.findMany({
    where: { userId: null },
    orderBy: { dayOfWeek: 'asc' },
    select: { id: true, label: true, type: true, dayOfWeek: true },
  })
  console.log('\nRemaining ProgramDays:')
  console.table(remaining)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
