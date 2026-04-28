import { api } from './client'

export interface Exercise {
  id: string
  name: string
  nameVi: string
  muscleGroup: string | null
}

export interface DayExercise {
  id: string
  exerciseId: string
  orderIndex: number
  isFinisher: boolean
  finisherPair: string | null
  week12Reps: number | null
  week34Reps: number | null
  notes: string | null
  exercise: Exercise
}

export interface ProgramDay {
  id: string
  dayOfWeek: number
  label: string
  type: 'workout' | 'active_recovery' | 'rest'
  circuitRounds: number
  dayExercises: DayExercise[]
}

export interface ActiveProgram {
  id: string
  programId: string
  cycleNumber: number
  startDate: string
  status: string
  weekNumber: number
  todayDay: ProgramDay | null
  todaySession: { id: string; completedAt: string | null } | null
  totalWorkoutDays: number
  completedSessions: number
  program: { id: string; name: string; durationWeeks: number; days: ProgramDay[] }
}

export const programsApi = {
  list: () => api.get<{ id: string; name: string; durationWeeks: number; description: string }[]>('/programs'),
  getActive: () => api.get<ActiveProgram | null>('/user-programs/active'),
  start: (programId: string, startDate: string) =>
    api.post('/user-programs', { programId, startDate }),
}
