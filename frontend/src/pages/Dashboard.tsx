import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { programsApi, workoutGroupsApi } from '../api/programs'
import type { ProgramDay, ScheduleInput, SchedulableGroup } from '../api/programs'
import { sessionsApi } from '../api/sessions'
import SchedulePicker from '../components/SchedulePicker'
import BottomSheet from '../components/BottomSheet'
import { useToast } from '../components/Toast'

const DOW_LABEL = ['', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { show: showToast, node: toastNode } = useToast()

  const [starting, setStarting] = useState(false)
  // Flow chọn chương trình: null | 'pick-schedule'
  const [setupStep, setSetupStep] = useState<'pick-program' | 'pick-schedule'>('pick-program')
  const [selectedProgram, setSelectedProgram] = useState<{ id: string; name: string; days: ProgramDay[] } | null>(null)
  const [pendingSchedule, setPendingSchedule] = useState<ScheduleInput>({})
  const [showScheduleEditor, setShowScheduleEditor] = useState(false)
  const [editSchedule, setEditSchedule] = useState<ScheduleInput>({})

  const { data: active, isLoading } = useQuery({
    queryKey: ['active-program'],
    queryFn: programsApi.getActive,
  })

  const { data: programs } = useQuery({
    queryKey: ['programs'],
    queryFn: programsApi.list,
    enabled: !active,
  })

  const { data: programDetail } = useQuery({
    queryKey: ['program-detail', selectedProgram?.id],
    queryFn: () => selectedProgram
      ? fetch(`/api/programs/${selectedProgram.id}`)
          .then(r => r.json())
          .then(p => p.days as ProgramDay[])
      : null,
    enabled: !!selectedProgram && setupStep === 'pick-schedule',
  })

  // Tất cả nhóm (global + của user) để dùng trong SchedulePicker
  const { data: allGroups = [] } = useQuery({
    queryKey: ['workout-groups'],
    queryFn: workoutGroupsApi.list,
    enabled: showScheduleEditor || setupStep === 'pick-schedule',
  })

  const startProgram = useMutation({
    mutationFn: ({ programId, schedule }: { programId: string; schedule: ScheduleInput }) =>
      programsApi.start(programId, new Date().toISOString().slice(0, 10), schedule),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active-program'] })
      setSetupStep('pick-program')
      setSelectedProgram(null)
    },
  })

  const updateSchedule = useMutation({
    mutationFn: (schedule: ScheduleInput) =>
      programsApi.updateSchedule(active!.id, schedule),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active-program'] })
      setShowScheduleEditor(false)
      showToast('Đã cập nhật lịch tập!')
    },
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

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center text-slate-400">Đang tải...</div>
  }

  const progress = active
    ? Math.round((active.completedSessions / active.totalWorkoutDays) * 100)
    : 0

  // Lịch user theo dow
  const scheduleMap = active
    ? Object.fromEntries(active.schedule.map((s) => [s.dayOfWeek, s.programDayId]))
    : {}

  return (
    <div className="flex-1 overflow-y-auto p-4 pb-6">
      {toastNode}

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
              <span className="bg-brand/20 text-brand text-xs font-bold px-2 py-1 rounded-lg">ACTIVE</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full mb-1">
              <div className="h-2 bg-brand rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-slate-500">
              {active.completedSessions}/{active.totalWorkoutDays} buổi · {progress}% hoàn thành
            </p>
          </div>

          {/* Weekly schedule — dựa vào schedule của user */}
          <div className="bg-slate-800 rounded-2xl p-4 mb-4 border border-slate-700">
            <div className="flex justify-between items-center mb-3">
              <p className="text-slate-400 text-xs uppercase tracking-widest">Lịch tuần này</p>
              <button
                onClick={() => {
                  setEditSchedule(Object.fromEntries(
                    active.schedule.map(s => [s.dayOfWeek, s.programDayId])
                  ))
                  setShowScheduleEditor(true)
                }}
                className="text-brand text-xs font-bold border border-brand/30 px-2 py-1 rounded-lg"
              >
                Đổi lịch
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {[1,2,3,4,5,6,7].map((dow) => {
                const isToday = dow === (new Date().getDay() === 0 ? 7 : new Date().getDay())
                const assignedDayId = scheduleMap[dow]
                const assignedDay = active.program.days.find(d => d.id === assignedDayId)
                const isWorkout = assignedDay?.type === 'workout'
                return (
                  <div
                    key={dow}
                    className={`flex flex-col items-center py-2 rounded-xl text-xs font-bold transition-colors
                      ${isToday ? 'bg-brand text-white' : isWorkout ? 'bg-slate-700 text-slate-300' : 'bg-slate-800/50 text-slate-600'}`}
                  >
                    <span>{DOW_LABEL[dow]}</span>
                    <span className="mt-0.5">
                      {isWorkout ? '💪' : assignedDay?.type === 'active_recovery' ? '🚶' : '😴'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Schedule editor — dùng Portal thoát khỏi mọi container */}
          {showScheduleEditor && (
            <BottomSheet
              title="Đổi Lịch Tập"
              onClose={() => setShowScheduleEditor(false)}
              onConfirm={() => updateSchedule.mutate(editSchedule)}
              confirmLabel="Lưu Lịch Mới"
              confirming={updateSchedule.isPending}
            >
              <SchedulePicker
                groups={allGroups}
                initialSchedule={editSchedule}
                onChange={setEditSchedule}
              />
            </BottomSheet>
          )}

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
                  Mục tiêu: {active.weekNumber <= 2
                    ? active.todayDay.dayExercises[0]?.week12Reps
                    : active.todayDay.dayExercises[0]?.week34Reps} reps/bài
                </p>
                {active.todaySession?.completedAt ? (
                  <div className="flex items-center gap-2 bg-green-900/30 border border-green-700/40 rounded-xl px-4 py-3">
                    <span className="text-xl">✅</span>
                    <p className="font-bold text-green-400">Hoàn thành rồi! Ngon lắm!</p>
                  </div>
                ) : active.todaySession ? (
                  <button onClick={() => navigate(`/session/${active.todaySession!.id}`)}
                    className="w-full bg-brand text-white font-black py-4 rounded-xl text-lg">
                    Tiếp Tục Buổi Tập →
                  </button>
                ) : (
                  <button onClick={startSession} disabled={starting}
                    className="w-full bg-brand text-white font-black py-4 rounded-xl text-lg disabled:opacity-50">
                    {starting ? 'Đang tải...' : 'Bắt Đầu Buổi Tập 🔥'}
                  </button>
                )}
              </>
            )}
          </div>
        </>
      ) : (
        /* ── Chưa có chương trình ── */
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
          {setupStep === 'pick-program' && (
            <>
              <h3 className="font-black text-lg mb-1">Bắt đầu hành trình 🚀</h3>
              <p className="text-slate-400 text-sm mb-4">Chọn chương trình để bắt đầu theo dõi.</p>
              {programs?.map((p) => (
                <button
                  key={p.id}
                  onClick={async () => {
                    const detail = await fetch(`/api/programs/${p.id}`).then(r => r.json())
                    setSelectedProgram({ id: p.id, name: p.name, days: detail.days })
                    setSetupStep('pick-schedule')
                  }}
                  className="w-full text-left bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl p-4 mb-3 transition-colors"
                >
                  <p className="font-black text-brand">{p.name}</p>
                  <p className="text-slate-400 text-sm">{p.durationWeeks} tuần · {p.description?.slice(0, 60)}...</p>
                </button>
              ))}
            </>
          )}

          {setupStep === 'pick-schedule' && selectedProgram && (
            <>
              <button onClick={() => setSetupStep('pick-program')}
                className="text-slate-400 text-sm mb-3 flex items-center gap-1">
                ← Quay lại
              </button>
              <h3 className="font-black text-lg mb-1">{selectedProgram.name}</h3>
              <p className="text-slate-400 text-sm mb-4">Chọn ngày tập phù hợp với lịch của bạn.</p>

              <SchedulePicker
                groups={allGroups}
                onChange={setPendingSchedule}
              />

              <button
                onClick={() => startProgram.mutate({ programId: selectedProgram.id, schedule: pendingSchedule })}
                disabled={startProgram.isPending}
                className="mt-5 w-full bg-brand text-white font-black py-4 rounded-xl text-lg disabled:opacity-50"
              >
                {startProgram.isPending ? 'Đang tạo...' : 'Bắt Đầu Chương Trình 🔥'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
