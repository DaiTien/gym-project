import { PrismaClient, DayType } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // ─── EXERCISES ──────────────────────────────────────────────────────────────
  const exercises = await prisma.$transaction([
    // Upper 1 (T2)
    prisma.exercise.upsert({ where: { id: 'ex-bench-press' }, update: {}, create: { id: 'ex-bench-press', name: 'DB Bench Press', nameVi: 'Đẩy tạ đôi trên ghế phẳng', muscleGroup: 'Chest' } }),
    prisma.exercise.upsert({ where: { id: 'ex-lawnmower-row' }, update: {}, create: { id: 'ex-lawnmower-row', name: 'Lawnmower Row', nameVi: 'Kéo tạ 1 tay tư thế cắt cỏ', muscleGroup: 'Back' } }),
    prisma.exercise.upsert({ where: { id: 'ex-preacher-curl' }, update: {}, create: { id: 'ex-preacher-curl', name: 'Banded Resisted Preacher Curl', nameVi: 'Cuốn tạ tay với dây kháng lực', muscleGroup: 'Biceps' } }),
    prisma.exercise.upsert({ where: { id: 'ex-front-raise' }, update: {}, create: { id: 'ex-front-raise', name: 'Front Raise', nameVi: 'Nâng tạ trước mặt', muscleGroup: 'Shoulders' } }),
    // Upper 1 Finisher
    prisma.exercise.upsert({ where: { id: 'ex-deadlift-to-row' }, update: {}, create: { id: 'ex-deadlift-to-row', name: 'Deadlift to Row', nameVi: 'Deadlift kết hợp kéo tạ', muscleGroup: 'Full Body' } }),
    prisma.exercise.upsert({ where: { id: 'ex-mountain-climber' }, update: {}, create: { id: 'ex-mountain-climber', name: 'Mountain Climber', nameVi: 'Leo núi', muscleGroup: 'Core' } }),

    // Lower 1 (T3)
    prisma.exercise.upsert({ where: { id: 'ex-front-squat' }, update: {}, create: { id: 'ex-front-squat', name: 'DB Front Squat', nameVi: 'Squat với tạ đôi trước ngực', muscleGroup: 'Quads' } }),
    prisma.exercise.upsert({ where: { id: 'ex-lateral-lunge-t3' }, update: {}, create: { id: 'ex-lateral-lunge-t3', name: 'Lateral Lunge', nameVi: 'Chùng chân ngang', muscleGroup: 'Glutes' } }),
    prisma.exercise.upsert({ where: { id: 'ex-single-leg-rdl' }, update: {}, create: { id: 'ex-single-leg-rdl', name: 'Single-Leg RDL', nameVi: 'Deadlift 1 chân', muscleGroup: 'Hamstrings' } }),
    prisma.exercise.upsert({ where: { id: 'ex-hip-thrust-t3' }, update: {}, create: { id: 'ex-hip-thrust-t3', name: 'Banded Hip Thrust', nameVi: 'Đẩy hông với dây kháng lực', muscleGroup: 'Glutes' } }),
    // Lower 1 Finisher
    prisma.exercise.upsert({ where: { id: 'ex-split-squat-jump' }, update: {}, create: { id: 'ex-split-squat-jump', name: 'Split Squat Jump', nameVi: 'Nhảy squat tách chân', muscleGroup: 'Legs' } }),
    prisma.exercise.upsert({ where: { id: 'ex-skater-hop' }, update: {}, create: { id: 'ex-skater-hop', name: 'Skater Hop', nameVi: 'Nhảy trượt băng', muscleGroup: 'Legs' } }),

    // Upper 2 (T5)
    prisma.exercise.upsert({ where: { id: 'ex-3point-row' }, update: {}, create: { id: 'ex-3point-row', name: '3-Point DB Row', nameVi: 'Kéo tạ 1 tay trên ghế', muscleGroup: 'Back' } }),
    prisma.exercise.upsert({ where: { id: 'ex-floor-press' }, update: {}, create: { id: 'ex-floor-press', name: 'Close-Grip Floor Press', nameVi: 'Đẩy tạ hẹp tay trên sàn', muscleGroup: 'Triceps' } }),
    prisma.exercise.upsert({ where: { id: 'ex-tricep-kickback' }, update: {}, create: { id: 'ex-tricep-kickback', name: 'DB Triceps Kickback', nameVi: 'Đá cáp tay sau', muscleGroup: 'Triceps' } }),
    prisma.exercise.upsert({ where: { id: 'ex-lateral-raise' }, update: {}, create: { id: 'ex-lateral-raise', name: 'Lateral Raise', nameVi: 'Dạng tạ 2 bên', muscleGroup: 'Shoulders' } }),
    // Upper 2 Finisher
    prisma.exercise.upsert({ where: { id: 'ex-squat-curl-press' }, update: {}, create: { id: 'ex-squat-curl-press', name: 'Squat to Curl to Press', nameVi: 'Squat kết hợp curl và press', muscleGroup: 'Full Body' } }),
    prisma.exercise.upsert({ where: { id: 'ex-plank-jack' }, update: {}, create: { id: 'ex-plank-jack', name: 'Plank Jack', nameVi: 'Plank bật chân', muscleGroup: 'Core' } }),

    // Lower 2 (T6)
    prisma.exercise.upsert({ where: { id: 'ex-romanian-dl' }, update: {}, create: { id: 'ex-romanian-dl', name: 'DB Romanian Deadlift', nameVi: 'RDL với tạ đôi', muscleGroup: 'Hamstrings' } }),
    prisma.exercise.upsert({ where: { id: 'ex-lateral-lunge-t6' }, update: {}, create: { id: 'ex-lateral-lunge-t6', name: 'Lateral Lunge', nameVi: 'Chùng chân ngang', muscleGroup: 'Glutes' } }),
    prisma.exercise.upsert({ where: { id: 'ex-split-squat' }, update: {}, create: { id: 'ex-split-squat', name: 'Split Squat', nameVi: 'Squat tách chân', muscleGroup: 'Quads' } }),
    prisma.exercise.upsert({ where: { id: 'ex-glute-bridge' }, update: {}, create: { id: 'ex-glute-bridge', name: 'DB Glute Bridge', nameVi: 'Đẩy hông trên sàn', muscleGroup: 'Glutes' } }),
    // Lower 2 Finisher
    prisma.exercise.upsert({ where: { id: 'ex-bw-jump-squat' }, update: {}, create: { id: 'ex-bw-jump-squat', name: 'Bodyweight Jump Squat', nameVi: 'Nhảy squat không tạ', muscleGroup: 'Legs' } }),
    prisma.exercise.upsert({ where: { id: 'ex-burpee' }, update: {}, create: { id: 'ex-burpee', name: 'Burpee', nameVi: 'Burpee', muscleGroup: 'Full Body' } }),
  ])

  console.log(`✓ ${exercises.length} exercises seeded`)

  // ─── PROGRAM ────────────────────────────────────────────────────────────────
  const program = await prisma.program.upsert({
    where: { id: 'prog-dad-bod' },
    update: {},
    create: {
      id: 'prog-dad-bod',
      name: 'Dad Bod AB Shred',
      durationWeeks: 4,
      description: 'Chiến dịch 4 tuần đánh bay bụng bia. Kết hợp Circuit Training, Upper-Lower Split và Cardio Gây Sốc.',
    },
  })
  console.log(`✓ Program "${program.name}" seeded`)

  // ─── PROGRAM DAYS ───────────────────────────────────────────────────────────
  const days = [
    { id: 'day-mon', dayOfWeek: 1, label: 'Thân Trên 1 (Locked and Loaded)', type: DayType.workout, circuitRounds: 3 },
    { id: 'day-tue', dayOfWeek: 2, label: 'Thân Dưới 1 (Loaded Legwork)',    type: DayType.workout, circuitRounds: 3 },
    { id: 'day-wed', dayOfWeek: 3, label: 'Phục Hồi Chủ Động',              type: DayType.active_recovery, circuitRounds: 0 },
    { id: 'day-thu', dayOfWeek: 4, label: 'Thân Trên 2 (Feel the Pump)',    type: DayType.workout, circuitRounds: 3 },
    { id: 'day-fri', dayOfWeek: 5, label: 'Thân Dưới 2 (Lower Body Leveler)', type: DayType.workout, circuitRounds: 3 },
    { id: 'day-sat', dayOfWeek: 6, label: 'Phục Hồi Chủ Động',              type: DayType.active_recovery, circuitRounds: 0 },
    { id: 'day-sun', dayOfWeek: 7, label: 'Nghỉ Ngơi Hoàn Toàn',           type: DayType.rest, circuitRounds: 0 },
  ]

  for (const d of days) {
    await prisma.programDay.upsert({
      where: { id: d.id },
      update: {},
      create: { ...d, programId: program.id },
    })
  }
  console.log(`✓ ${days.length} program days seeded`)

  // ─── DAY EXERCISES ──────────────────────────────────────────────────────────
  const dayExercises = [
    // T2 - Upper 1: circuit (week1-2: 12 reps, week3-4: 15 reps. Row & Curl = reps mỗi bên)
    { id: 'de-mon-1', programDayId: 'day-mon', exerciseId: 'ex-bench-press',   orderIndex: 1, isFinisher: false, week12Reps: 12, week34Reps: 15 },
    { id: 'de-mon-2', programDayId: 'day-mon', exerciseId: 'ex-lawnmower-row', orderIndex: 2, isFinisher: false, week12Reps: 12, week34Reps: 15, notes: '12/15 reps mỗi bên' },
    { id: 'de-mon-3', programDayId: 'day-mon', exerciseId: 'ex-preacher-curl', orderIndex: 3, isFinisher: false, week12Reps: 12, week34Reps: 15, notes: '12/15 reps mỗi bên' },
    { id: 'de-mon-4', programDayId: 'day-mon', exerciseId: 'ex-front-raise',   orderIndex: 4, isFinisher: false, week12Reps: 12, week34Reps: 15 },
    // T2 Finisher (2 vòng, không nghỉ A→B)
    { id: 'de-mon-5a', programDayId: 'day-mon', exerciseId: 'ex-deadlift-to-row',  orderIndex: 5, isFinisher: true, finisherPair: 'A', week12Reps: 10, week34Reps: 15 },
    { id: 'de-mon-5b', programDayId: 'day-mon', exerciseId: 'ex-mountain-climber', orderIndex: 6, isFinisher: true, finisherPair: 'B', notes: 'Tuần 1-2: 20 giây, Tuần 3-4: 30 giây' },

    // T3 - Lower 1
    { id: 'de-tue-1', programDayId: 'day-tue', exerciseId: 'ex-front-squat',    orderIndex: 1, isFinisher: false, week12Reps: 10, week34Reps: 12 },
    { id: 'de-tue-2', programDayId: 'day-tue', exerciseId: 'ex-lateral-lunge-t3', orderIndex: 2, isFinisher: false, week12Reps: 8, week34Reps: 10, notes: 'reps mỗi bên' },
    { id: 'de-tue-3', programDayId: 'day-tue', exerciseId: 'ex-single-leg-rdl', orderIndex: 3, isFinisher: false, week12Reps: 8, week34Reps: 10, notes: 'reps mỗi bên' },
    { id: 'de-tue-4', programDayId: 'day-tue', exerciseId: 'ex-hip-thrust-t3',  orderIndex: 4, isFinisher: false, week12Reps: 10, week34Reps: 12 },
    { id: 'de-tue-5a', programDayId: 'day-tue', exerciseId: 'ex-split-squat-jump', orderIndex: 5, isFinisher: true, finisherPair: 'A', week12Reps: 10, week34Reps: 16 },
    { id: 'de-tue-5b', programDayId: 'day-tue', exerciseId: 'ex-skater-hop',    orderIndex: 6, isFinisher: true, finisherPair: 'B', notes: 'Tuần 1-2: 20 giây, Tuần 3-4: 30 giây' },

    // T5 - Upper 2
    { id: 'de-thu-1', programDayId: 'day-thu', exerciseId: 'ex-3point-row',    orderIndex: 1, isFinisher: false, week12Reps: 12, week34Reps: 15, notes: '12/15 reps mỗi bên' },
    { id: 'de-thu-2', programDayId: 'day-thu', exerciseId: 'ex-floor-press',   orderIndex: 2, isFinisher: false, week12Reps: 12, week34Reps: 15 },
    { id: 'de-thu-3', programDayId: 'day-thu', exerciseId: 'ex-tricep-kickback', orderIndex: 3, isFinisher: false, week12Reps: 12, week34Reps: 15 },
    { id: 'de-thu-4', programDayId: 'day-thu', exerciseId: 'ex-lateral-raise', orderIndex: 4, isFinisher: false, week12Reps: 12, week34Reps: 15 },
    { id: 'de-thu-5a', programDayId: 'day-thu', exerciseId: 'ex-squat-curl-press', orderIndex: 5, isFinisher: true, finisherPair: 'A', week12Reps: 10, week34Reps: 15 },
    { id: 'de-thu-5b', programDayId: 'day-thu', exerciseId: 'ex-plank-jack',   orderIndex: 6, isFinisher: true, finisherPair: 'B', notes: 'Tuần 1-2: 20 giây, Tuần 3-4: 30 giây' },

    // T6 - Lower 2
    { id: 'de-fri-1', programDayId: 'day-fri', exerciseId: 'ex-romanian-dl',    orderIndex: 1, isFinisher: false, week12Reps: 10, week34Reps: 12 },
    { id: 'de-fri-2', programDayId: 'day-fri', exerciseId: 'ex-lateral-lunge-t6', orderIndex: 2, isFinisher: false, week12Reps: 8, week34Reps: 10, notes: 'reps mỗi bên' },
    { id: 'de-fri-3', programDayId: 'day-fri', exerciseId: 'ex-split-squat',   orderIndex: 3, isFinisher: false, week12Reps: 8, week34Reps: 10, notes: 'reps mỗi bên' },
    { id: 'de-fri-4', programDayId: 'day-fri', exerciseId: 'ex-glute-bridge',  orderIndex: 4, isFinisher: false, week12Reps: 10, week34Reps: 12 },
    { id: 'de-fri-5a', programDayId: 'day-fri', exerciseId: 'ex-bw-jump-squat', orderIndex: 5, isFinisher: true, finisherPair: 'A', week12Reps: 10, week34Reps: 15 },
    { id: 'de-fri-5b', programDayId: 'day-fri', exerciseId: 'ex-burpee',        orderIndex: 6, isFinisher: true, finisherPair: 'B', notes: 'Tuần 1-2: 20 giây, Tuần 3-4: 30 giây' },
  ]

  for (const de of dayExercises) {
    await prisma.dayExercise.upsert({
      where: { id: de.id },
      update: {},
      create: de,
    })
  }
  console.log(`✓ ${dayExercises.length} day exercises seeded`)
  console.log('✅ Seed complete!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
