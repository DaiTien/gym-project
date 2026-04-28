import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sessionsApi } from '../api/sessions'
import type { DayExercise } from '../api/programs'

export default function WorkoutSession() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [currentRound, setCurrentRound] = useState(1)
  const [currentExIdx, setCurrentExIdx] = useState(0)
  const [restTimer, setRestTimer] = useState<number | null>(null)
  const [showFinisher, setShowFinisher] = useState(false)
  const [done, setDone] = useState(false)

  const { data: session, isLoading, isError, error } = useQuery({
    queryKey: ['session', id],
    queryFn: () => sessionsApi.get(id!),
    enabled: !!id,
    retry: 1,
  })

  // Tự chuyển sang finisher khi xong circuit
  useEffect(() => {
    if (!session) return
    const mainExercises = session.programDay.dayExercises.filter((e) => !e.isFinisher)
    if (currentExIdx >= mainExercises.length && currentRound > session.programDay.circuitRounds) {
      setShowFinisher(true)
    }
  }, [currentExIdx, currentRound, session])

  // Rest timer countdown
  useEffect(() => {
    if (restTimer === null || restTimer <= 0) return
    const t = setTimeout(() => setRestTimer((v) => (v ?? 0) - 1), 1000)
    return () => clearTimeout(t)
  }, [restTimer])

  const logSet = useMutation({
    mutationFn: (data: { exerciseId: string; circuitRound: number; setIndex: number; repsDone?: number; weightKg?: number }) =>
      sessionsApi.logSet(id!, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['session', id] }),
  })

  const complete = useMutation({
    mutationFn: () => sessionsApi.complete(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active-program'] })
      setDone(true)
    },
  })

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center text-slate-400">Đang tải...</div>
  }

  if (isError || !session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
        <p className="text-4xl">⚠️</p>
        <p className="font-bold text-red-400">Không tải được buổi tập</p>
        <p className="text-slate-500 text-sm">{(error as Error)?.message ?? 'Session không tồn tại'}</p>
        <button onClick={() => navigate('/')} className="bg-slate-700 px-6 py-3 rounded-xl font-bold">
          Về trang chủ
        </button>
      </div>
    )
  }

  const mainExercises = session.programDay.dayExercises.filter((e) => !e.isFinisher)
  const finisherExercises = session.programDay.dayExercises.filter((e) => e.isFinisher)
  const totalRounds = session.programDay.circuitRounds
  const weekNum = session.weekNumber

  // Lấy sets đã log cho bài + vòng hiện tại
  const getSetsFor = (exerciseId: string, round: number) =>
    session.sets.filter((s) => s.exerciseId === exerciseId && s.circuitRound === round)

  if (done) {
    return <CompletionScreen onHome={() => navigate('/')} sessionSets={session.sets.length} />
  }

  if (showFinisher) {
    return (
      <FinisherScreen
        exercises={finisherExercises}
        weekNumber={weekNum}
        sessionId={id!}
        existingSets={session.sets}
        onComplete={() => complete.mutate()}
        completing={complete.isPending}
      />
    )
  }

  const currentEx = mainExercises[currentExIdx]
  const currentSets = currentEx ? getSetsFor(currentEx.exerciseId, currentRound) : []
  const targetReps = currentEx
    ? (weekNum <= 2 ? currentEx.week12Reps : currentEx.week34Reps) ?? 12
    : 12

  const goNext = () => {
    if (currentExIdx < mainExercises.length - 1) {
      setCurrentExIdx((i) => i + 1)
      setRestTimer(null)
    } else if (currentRound < totalRounds) {
      setCurrentRound((r) => r + 1)
      setCurrentExIdx(0)
      setRestTimer(null)
    } else {
      setShowFinisher(true)
    }
  }

  return (
    <div className="flex-1 flex flex-col pb-6">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-slate-400 text-xl">←</button>
        <div className="flex-1">
          <p className="font-black text-sm truncate">{session.programDay.label}</p>
          <p className="text-slate-400 text-xs">Tuần {weekNum} · Vòng {currentRound}/{totalRounds}</p>
        </div>
      </div>

      {/* Round dots */}
      <div className="flex justify-center gap-2 py-3">
        {Array.from({ length: totalRounds }).map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${i < currentRound ? 'bg-brand' : i === currentRound - 1 ? 'bg-brand' : 'bg-slate-700'}`}
          />
        ))}
      </div>

      {/* Exercise list (mini nav) */}
      <div className="flex gap-2 px-4 mb-4 overflow-x-auto pb-1">
        {mainExercises.map((ex, idx) => (
          <button
            key={ex.id}
            onClick={() => setCurrentExIdx(idx)}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-bold transition-colors ${idx === currentExIdx ? 'bg-brand text-white' : 'bg-slate-700 text-slate-400'}`}
          >
            {idx + 1}. {ex.exercise.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Current exercise */}
      <div className="flex-1 px-4">
        {currentEx && (
          <ExerciseLogger
            key={`${currentEx.id}-${currentRound}`}
            dayExercise={currentEx}
            targetReps={targetReps}
            existingSets={currentSets}
            onLogSet={(repsDone, weightKg) =>
              logSet.mutate({
                exerciseId: currentEx.exerciseId,
                circuitRound: currentRound,
                setIndex: currentSets.length + 1,
                repsDone,
                weightKg,
              })
            }
            isLogging={logSet.isPending}
          />
        )}

        {/* Rest timer */}
        <div className="mt-4">
          {restTimer !== null && restTimer > 0 ? (
            <div className="bg-slate-800 rounded-2xl p-4 text-center border border-brand/30">
              <p className="text-slate-400 text-xs mb-1">NGHỈ</p>
              <p className="text-4xl font-black text-brand">{restTimer}s</p>
              <button onClick={() => setRestTimer(null)} className="mt-2 text-slate-500 text-xs underline">
                Bỏ qua
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setRestTimer(60)}
                className="flex-1 bg-slate-700 text-slate-300 py-2 rounded-xl text-sm font-bold"
              >
                ⏱ Nghỉ 60s
              </button>
              <button
                onClick={() => setRestTimer(90)}
                className="flex-1 bg-slate-700 text-slate-300 py-2 rounded-xl text-sm font-bold"
              >
                ⏱ Nghỉ 90s
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Next button */}
      <div className="px-4 mt-4">
        <button
          onClick={goNext}
          className="w-full bg-brand text-white font-black py-4 rounded-xl text-base"
        >
          {currentExIdx < mainExercises.length - 1
            ? `Bài tiếp theo →`
            : currentRound < totalRounds
            ? `Vòng ${currentRound + 1} →`
            : 'Vào Finisher 🔥'}
        </button>
      </div>
    </div>
  )
}

// ─── ExerciseLogger ───────────────────────────────────────────────────────────

function ExerciseLogger({
  dayExercise,
  targetReps,
  existingSets,
  onLogSet,
  isLogging,
}: {
  dayExercise: DayExercise
  targetReps: number
  existingSets: { repsDone: number | null; weightKg: number | null }[]
  onLogSet: (reps: number, weight: number) => void
  isLogging: boolean
}) {
  const lastWeight = existingSets.at(-1)?.weightKg ?? null
  const [reps, setReps] = useState(String(targetReps))
  const [weight, setWeight] = useState(String(lastWeight ?? ''))

  return (
    <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
      <h3 className="font-black text-lg">{dayExercise.exercise.name}</h3>
      <p className="text-slate-400 text-sm mb-1">{dayExercise.exercise.nameVi}</p>
      {dayExercise.notes && (
        <p className="text-xs text-brand mb-3">📌 {dayExercise.notes}</p>
      )}

      <p className="text-xs text-slate-500 mb-3">Mục tiêu: {targetReps} reps</p>

      {/* Set history */}
      {existingSets.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-slate-500 mb-1">Đã log:</p>
          <div className="flex flex-wrap gap-2">
            {existingSets.map((s, i) => (
              <span key={i} className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded-lg">
                Set {i + 1}: {s.repsDone} reps {s.weightKg ? `× ${s.weightKg}kg` : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Log new set */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1">
          <label className="text-xs text-slate-500 mb-1 block">Reps</label>
          <input
            type="number"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            className="w-full bg-slate-700 rounded-xl px-3 py-2 text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-slate-500 mb-1 block">Tạ (kg)</label>
          <input
            type="number"
            step="0.5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="0"
            className="w-full bg-slate-700 rounded-xl px-3 py-2 text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
      </div>

      <button
        onClick={() => {
          onLogSet(Number(reps), Number(weight))
          setReps(String(targetReps))
        }}
        disabled={isLogging || !reps}
        className="w-full bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-bold py-2.5 rounded-xl disabled:opacity-50 transition-colors"
      >
        {isLogging ? '...' : '+ Log Set'}
      </button>
    </div>
  )
}

// ─── FinisherScreen ───────────────────────────────────────────────────────────

function FinisherScreen({
  exercises,
  weekNumber,
  sessionId,
  existingSets,
  onComplete,
  completing,
}: {
  exercises: DayExercise[]
  weekNumber: number
  sessionId: string
  existingSets: { exerciseId: string; circuitRound: number }[]
  onComplete: () => void
  completing: boolean
}) {
  const qc = useQueryClient()
  const [finisherRound, setFinisherRound] = useState(1)
  const totalFinisherRounds = 2

  const logFinisher = useMutation({
    mutationFn: (data: { exerciseId: string; circuitRound: number; setIndex: number; durationSec?: number; repsDone?: number }) =>
      sessionsApi.logSet(sessionId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['session', sessionId] }),
  })

  const pairA = exercises.find((e) => e.finisherPair === 'A')
  const pairB = exercises.find((e) => e.finisherPair === 'B')
  const targetSec = weekNumber <= 2 ? 20 : 30
  const targetReps = weekNumber <= 2 ? pairA?.week12Reps : pairA?.week34Reps

  const doneA = (round: number) => existingSets.some((s) => s.exerciseId === pairA?.exerciseId && s.circuitRound === 100 + round)
  const doneB = (round: number) => existingSets.some((s) => s.exerciseId === pairB?.exerciseId && s.circuitRound === 100 + round)

  return (
    <div className="flex-1 flex flex-col p-4 pb-6">
      <div className="bg-slate-800 border-b border-slate-700 -mx-4 -mt-4 px-4 py-3 mb-4 flex items-center gap-2">
        <span className="text-brand text-xl">🔥</span>
        <div>
          <p className="font-black">Superset Finisher</p>
          <p className="text-slate-400 text-xs">Vòng {finisherRound}/{totalFinisherRounds} · Không nghỉ giữa A→B</p>
        </div>
      </div>

      <div className="bg-orange-950/30 border border-brand/30 rounded-2xl p-4 mb-4">
        <p className="text-xs text-brand font-bold mb-1">RULES</p>
        <p className="text-slate-300 text-sm">
          Thực hiện bài A xong chuyển ngay sang B, không nghỉ. Làm {totalFinisherRounds} vòng.
        </p>
      </div>

      {/* Pair A */}
      {pairA && (
        <div className={`rounded-2xl p-4 mb-3 border transition-all ${doneA(finisherRound) ? 'bg-green-900/20 border-green-700/30' : 'bg-slate-800 border-slate-700'}`}>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-brand font-black text-xs">5A</span>
              <h3 className="font-bold">{pairA.exercise.name}</h3>
              <p className="text-slate-400 text-sm">{pairA.exercise.nameVi}</p>
              <p className="text-xs text-slate-500 mt-1">Mục tiêu: {targetReps} reps</p>
            </div>
            {doneA(finisherRound) && <span className="text-green-400 text-2xl">✓</span>}
          </div>
          {!doneA(finisherRound) && (
            <button
              onClick={() => logFinisher.mutate({ exerciseId: pairA.exerciseId, circuitRound: 100 + finisherRound, setIndex: 1, repsDone: targetReps ?? 10 })}
              disabled={logFinisher.isPending}
              className="mt-3 w-full bg-brand/20 border border-brand/40 text-brand font-bold py-2 rounded-xl disabled:opacity-50"
            >
              Xong 5A ✓
            </button>
          )}
        </div>
      )}

      {/* Pair B */}
      {pairB && (
        <div className={`rounded-2xl p-4 mb-4 border transition-all ${doneB(finisherRound) ? 'bg-green-900/20 border-green-700/30' : 'bg-slate-800 border-slate-700'}`}>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-brand font-black text-xs">5B</span>
              <h3 className="font-bold">{pairB.exercise.name}</h3>
              <p className="text-slate-400 text-sm">{pairB.exercise.nameVi}</p>
              <p className="text-xs text-slate-500 mt-1">Mục tiêu: {targetSec} giây</p>
            </div>
            {doneB(finisherRound) && <span className="text-green-400 text-2xl">✓</span>}
          </div>
          {!doneB(finisherRound) && (
            <button
              onClick={() => logFinisher.mutate({ exerciseId: pairB.exerciseId, circuitRound: 100 + finisherRound, setIndex: 1, durationSec: targetSec })}
              disabled={logFinisher.isPending}
              className="mt-3 w-full bg-brand/20 border border-brand/40 text-brand font-bold py-2 rounded-xl disabled:opacity-50"
            >
              Xong 5B ✓
            </button>
          )}
        </div>
      )}

      {doneA(finisherRound) && doneB(finisherRound) && finisherRound < totalFinisherRounds && (
        <button
          onClick={() => setFinisherRound((r) => r + 1)}
          className="w-full bg-slate-700 text-white font-bold py-3 rounded-xl mb-3"
        >
          Vòng {finisherRound + 1} →
        </button>
      )}

      {doneA(finisherRound) && doneB(finisherRound) && finisherRound === totalFinisherRounds && (
        <button
          onClick={onComplete}
          disabled={completing}
          className="w-full bg-green-600 text-white font-black py-4 rounded-xl text-lg disabled:opacity-50"
        >
          {completing ? '...' : '🏆 Hoàn Thành Buổi Tập!'}
        </button>
      )}
    </div>
  )
}

// ─── CompletionScreen ─────────────────────────────────────────────────────────

function CompletionScreen({ onHome, sessionSets }: { onHome: () => void; sessionSets: number }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="text-7xl mb-4">🏆</div>
      <h2 className="text-2xl font-black mb-2">Xuất Sắc!</h2>
      <p className="text-slate-400 mb-2">Buổi tập hoàn thành.</p>
      <p className="text-slate-500 text-sm mb-8">{sessionSets} sets đã được ghi nhận.</p>
      <button
        onClick={onHome}
        className="bg-brand text-white font-black px-8 py-4 rounded-xl text-lg"
      >
        Về Trang Chủ
      </button>
    </div>
  )
}
