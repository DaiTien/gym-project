import { api } from './client'
import type { ProgramDay } from './programs'

export interface SessionSet {
  id: string
  exerciseId: string
  circuitRound: number
  setIndex: number
  repsDone: number | null
  weightKg: number | null
  durationSec: number | null
}

export interface WorkoutSession {
  id: string
  userProgramId: string
  programDayId: string
  weekNumber: number
  sessionDate: string
  completedAt: string | null
  sets: SessionSet[]
  programDay: ProgramDay
}

export const sessionsApi = {
  start: (userProgramId: string, programDayId: string, weekNumber: number) =>
    api.post<WorkoutSession>('/sessions', { userProgramId, programDayId, weekNumber }),

  get: (id: string) => api.get<WorkoutSession>(`/sessions/${id}`),

  complete: (id: string) => api.patch<WorkoutSession>(`/sessions/${id}/complete`, {}),

  logSet: (
    sessionId: string,
    data: { exerciseId: string; circuitRound: number; setIndex: number; repsDone?: number; weightKg?: number; durationSec?: number }
  ) => api.post<SessionSet>(`/sessions/${sessionId}/sets`, data),

  updateSet: (
    sessionId: string,
    setId: string,
    data: { repsDone?: number; weightKg?: number }
  ) => api.patch<SessionSet>(`/sessions/${sessionId}/sets/${setId}`, data),
}
