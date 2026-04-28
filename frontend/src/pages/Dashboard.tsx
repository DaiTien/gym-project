import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { programsApi } from '../api/programs'
import { sessionsApi } from '../api/sessions'

const DOW_LABEL = ['', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [starting, setStarting] = useState(false)

  const { data: active, isLoading } = useQuery({
    queryKey: ['active-program'],
    queryFn: programsApi.getActive,
  })

  const { data: programs } = useQuery({
    queryKey: ['programs'],
    queryFn: programsApi.list,
    enabled: !active,
  })

  const startProgram = useMutation({
    mutationFn: ({ programId, startDate }: { programId: string; startDate: string }) =>
      programsApi.start(programId, startDate),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['active-program'] }),
  })

  const startSession = async () => {
    if (!active?.todayDay || !active) return
    setStarting(true)
    try {
      const session = await sessionsApi.start(active.id, active.todayDay.id, active.weekNumber)
      navigate(`/session/${session.id}`)
    } finally {
      setStarting(false)
    }
  }

  const continueSession = () => {
    if (active?.todaySession) navigate(`/session/${active.todaySession.id}`)
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-slate-400">Đang tải...</div>
      </div>
    )
  }

  const progress = active
    ? Math.round((active.completedSessions / active.totalWorkoutDays) * 100)
    : 0

  return (
    <div className="flex-1 p-4 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pt-2">
        <div>
          <p className="text-slate-400 text-xs uppercase tracking-widest">Xin chào,</p>
          <h2 className="text-xl font-black">{user?.name} 👊</h2>
        </div>
        <button onClick={logout} className="text-slate-500 text-xs border border-slate-700 px-3 py-1 rounded-lg">
          Đăng xuất
        </button>
      </div>

      {active ? (
        <>
          {/* Program card */}
          <div className="bg-slate-800 rounded-2xl p-4 mb-4 border border-slate-700">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Chương trình</p>
                <h3 className="font-black text-brand">{active.program.name}</h3>
                <p className="text-sm text-slate-300 mt-0.5">
                  Tuần {active.weekNumber}/{active.program.durationWeeks} · Chu kỳ {active.cycleNumber}
                </p>
              </div>
              <span className="bg-brand/20 text-brand text-xs font-bold px-2 py-1 rounded-lg">
                ACTIVE
              </span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full mb-1">
              <div
                className="h-2 bg-brand rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">
              {active.completedSessions}/{active.totalWorkoutDays} buổi · {progress}% hoàn thành
            </p>
          </div>

          {/* Weekly schedule mini */}
          <div className="bg-slate-800 rounded-2xl p-4 mb-4 border border-slate-700">
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-3">Lịch tuần này</p>
            <div className="grid grid-cols-7 gap-1">
              {active.program.days.map((day) => {
                const isToday = day.dayOfWeek === (new Date().getDay() === 0 ? 7 : new Date().getDay())
                const isWorkout = day.type === 'workout'
                return (
                  <div
                    key={day.id}
                    className={`flex flex-col items-center py-2 rounded-xl text-xs font-bold
                      ${isToday ? 'bg-brand text-white' : isWorkout ? 'bg-slate-700 text-slate-300' : 'bg-slate-800/50 text-slate-600'}`}
                  >
                    <span>{DOW_LABEL[day.dayOfWeek]}</span>
                    <span className="mt-0.5">{isWorkout ? '💪' : day.type === 'active_recovery' ? '🚶' : '😴'}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Today's workout */}
          <div className={`rounded-2xl p-4 border ${active.todayDay?.type === 'workout' ? 'border-brand/40 bg-slate-800' : 'border-slate-700 bg-slate-800'}`}>
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Hôm nay</p>
            {!active.todayDay || active.todayDay.type === 'rest' ? (
              <div className="text-center py-4">
                <p className="text-3xl mb-2">😴</p>
                <p className="font-bold">Ngày nghỉ</p>
                <p className="text-slate-400 text-sm">Cơ thể cần thời gian phục hồi!</p>
              </div>
            ) : active.todayDay.type === 'active_recovery' ? (
              <div className="text-center py-4">
                <p className="text-3xl mb-2">🚶</p>
                <p className="font-bold">Phục hồi chủ động</p>
                <p className="text-slate-400 text-sm">Đi bộ nhẹ, yoga hoặc bơi lội.</p>
              </div>
            ) : (
              <>
                <h3 className="font-black text-lg mb-1">{active.todayDay.label}</h3>
                <p className="text-slate-400 text-sm mb-1">
                  {active.todayDay.circuitRounds} vòng · {active.todayDay.dayExercises.filter(e => !e.isFinisher).length} bài chính · Finisher
                </p>
                <p className="text-xs text-slate-500 mb-4">
                  Mục tiêu: {active.weekNumber <= 2 ? active.todayDay.dayExercises[0]?.week12Reps : active.todayDay.dayExercises[0]?.week34Reps} reps/bài
                </p>

                {active.todaySession?.completedAt ? (
                  <div className="flex items-center gap-2 bg-green-900/30 border border-green-700/40 rounded-xl px-4 py-3">
                    <span className="text-xl">✅</span>
                    <p className="font-bold text-green-400">Hoàn thành rồi! Ngon lắm!</p>
                  </div>
                ) : active.todaySession ? (
                  <button
                    onClick={continueSession}
                    className="w-full bg-brand text-white font-black py-4 rounded-xl text-lg"
                  >
                    Tiếp Tục Buổi Tập →
                  </button>
                ) : (
                  <button
                    onClick={startSession}
                    disabled={starting}
                    className="w-full bg-brand text-white font-black py-4 rounded-xl text-lg disabled:opacity-50"
                  >
                    {starting ? 'Đang tải...' : 'Bắt Đầu Buổi Tập 🔥'}
                  </button>
                )}
              </>
            )}
          </div>
        </>
      ) : (
        /* Chưa có chương trình — chọn & bắt đầu */
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
          <h3 className="font-black text-lg mb-1">Bắt đầu hành trình 🚀</h3>
          <p className="text-slate-400 text-sm mb-4">Chọn chương trình để bắt đầu theo dõi.</p>
          {programs?.map((p) => (
            <button
              key={p.id}
              onClick={() => startProgram.mutate({ programId: p.id, startDate: new Date().toISOString().slice(0, 10) })}
              disabled={startProgram.isPending}
              className="w-full text-left bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl p-4 mb-3 transition-colors disabled:opacity-50"
            >
              <p className="font-black text-brand">{p.name}</p>
              <p className="text-slate-400 text-sm">{p.durationWeeks} tuần · {p.description?.slice(0, 60)}...</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
