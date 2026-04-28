import { api } from './client'

export interface BodyWeight {
  id: string
  recordedDate: string
  weightKg: number
}

export interface ProgressOverview {
  streak: number
  latestWeight: BodyWeight | null
  userProgram: { id: string; weekNumber?: number } | null
}

export interface ExerciseHistory {
  date: string
  weekNumber: number
  maxWeight: number
  maxReps: number
}

export interface DailyLifestyle {
  id: string
  logDate: string
  steps: number | null
  sleepHours: number | null
  caloriesIn: number | null
  proteinG: number | null
  notes: string | null
}

export const progressApi = {
  overview: () => api.get<ProgressOverview>('/progress/overview'),
  weights: () => api.get<BodyWeight[]>('/progress/weights'),
  logWeight: (weightKg: number, date?: string) =>
    api.post<BodyWeight>('/progress/weights', { weightKg, date }),
  exerciseHistory: (exerciseId: string) =>
    api.get<ExerciseHistory[]>(`/progress/exercises/${exerciseId}`),
}

export const lifestyleApi = {
  today: () => api.get<DailyLifestyle | null>('/lifestyle'),
  history: () => api.get<DailyLifestyle[]>('/lifestyle/history'),
  log: (data: { steps?: number; sleepHours?: number; caloriesIn?: number; proteinG?: number; notes?: string }) =>
    api.post<DailyLifestyle>('/lifestyle', data),
}
