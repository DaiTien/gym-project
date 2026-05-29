import { api } from './client'

export interface UserProfile {
  id: string
  email: string
  name: string
  weightKg: number | null
  goalWeightKg: number | null
  heightCm: number | null
  age: number | null
  activityLevel: string | null
}

export const profileApi = {
  get: () => api.get<UserProfile>('/auth/me'),
  update: (data: Partial<Pick<UserProfile, 'weightKg' | 'goalWeightKg' | 'heightCm' | 'age' | 'activityLevel'>>) =>
    api.patch<UserProfile>('/auth/profile', data),
}

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

export interface FoodLog {
  id: string
  dailyLifestyleId: string
  foodName: string
  weightG: number | null
  calories: number
  protein: number
  carb: number
  fat: number
  createdAt: string
}

export interface DailyLifestyle {
  id: string
  logDate: string
  steps: number | null
  sleepHours: number | null
  caloriesIn: number | null
  proteinG: number | null
  carbG: number | null
  fatG: number | null
  notes: string | null
  foodLogs?: FoodLog[]
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

export const nutritionApi = {
  analyze: (data: { text?: string; imageBase64?: string }) =>
    api.post<any[]>('/nutrition/analyze', data),
  log: (data: { date: string; foodName: string; weightG?: number; calories: number; protein: number; carb: number; fat: number }) =>
    api.post<FoodLog>('/nutrition/log', data),
  update: (id: string, data: { foodName: string; weightG?: number; calories: number; protein: number; carb: number; fat: number }) =>
    api.patch<FoodLog>(`/nutrition/log/${id}`, data),
  remove: (id: string) =>
    api.delete<void>(`/nutrition/log/${id}`),
}
