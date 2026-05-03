import { api } from './client'

export interface Exercise {
  id: string
  name: string
  nameVi: string
  muscleGroup: string | null
  imageUrl: string | null
  userId: string | null  // null = global template, có value = của user
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

export interface ScheduleEntry {
  dayOfWeek: number
  programDayId: string
}

export interface ActiveProgram {
  id: string
  programId: string
  cycleNumber: number
  startDate: string
  status: string
  weekNumber: number
  schedule: ScheduleEntry[]
  todayDay: ProgramDay | null
  todaySession: { id: string; completedAt: string | null } | null
  totalWorkoutDays: number
  completedSessions: number
  program: { id: string; name: string; durationWeeks: number; days: ProgramDay[] }
}

// schedule: { [dayOfWeek]: programDayId | null }
export type ScheduleInput = Record<number, string | null>

export const programsApi = {
  list: () => api.get<{ id: string; name: string; durationWeeks: number; description: string }[]>('/programs'),
  getActive: () => api.get<ActiveProgram | null>('/user-programs/active'),
  start: (programId: string, startDate: string, schedule: ScheduleInput) =>
    api.post('/user-programs', { programId, startDate, schedule }),
  updateSchedule: (userProgramId: string, schedule: ScheduleInput) =>
    api.patch(`/user-programs/${userProgramId}/schedule`, { schedule }),
}

// Alias để SchedulePicker dùng chung WorkoutGroup + ProgramDay
export type SchedulableGroup = Pick<WorkoutGroup, 'id' | 'label' | 'circuitRounds' | 'userId'>

export interface WorkoutGroup {
  id: string
  label: string
  type: 'workout' | 'active_recovery' | 'rest'
  circuitRounds: number
  userId: string | null  // null = global
  dayExercises: DayExercise[]
}

export const workoutGroupsApi = {
  list: () => api.get<WorkoutGroup[]>('/workout-groups'),
  create: (data: { label: string; circuitRounds?: number }) =>
    api.post<WorkoutGroup>('/workout-groups', data),
  update: (id: string, data: { label?: string; circuitRounds?: number }) =>
    api.patch<WorkoutGroup>(`/workout-groups/${id}`, data),
  remove: (id: string) => api.delete<void>(`/workout-groups/${id}`),
  addExercise: (groupId: string, data: {
    exerciseId: string; week12Reps?: number; week34Reps?: number
    notes?: string; isFinisher?: boolean; finisherPair?: string
  }) => api.post<DayExercise>(`/workout-groups/${groupId}/exercises`, data),
  removeExercise: (groupId: string, deId: string) =>
    api.delete<void>(`/workout-groups/${groupId}/exercises/${deId}`),
  reorder: (groupId: string, order: string[]) =>
    api.patch(`/workout-groups/${groupId}/exercises/reorder`, { order }),
}

export const exercisesApi = {
  list: () => api.get<Exercise[]>('/exercises'),
  create: (data: { name: string; nameVi: string; muscleGroup?: string }) =>
    api.post<Exercise>('/exercises', data),
  update: (id: string, data: { name?: string; nameVi?: string; muscleGroup?: string }) =>
    api.patch<Exercise>(`/exercises/${id}`, data),
  remove: (id: string) => api.delete<void>(`/exercises/${id}`),
  updateImage: (exerciseId: string, imageUrl: string) =>
    api.patch<Exercise>(`/exercises/${exerciseId}/image`, { imageUrl }),
  getUploadUrl: (exerciseId: string, fileName: string, contentType: string) =>
    api.post<{ uploadUrl: string; publicUrl: string }>('/exercises/upload-url', {
      exerciseId, fileName, contentType,
    }),
}
