import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts'
import { progressApi } from '../api/progress'
import { programsApi } from '../api/programs'
import { useToast } from '../components/Toast'

export default function Progress() {
  const qc = useQueryClient()
  const { show: showToast, node: toastNode } = useToast()
  const [weightInput, setWeightInput] = useState('')
  const [selectedExId, setSelectedExId] = useState<string | null>(null)

  const { data: overview } = useQuery({ queryKey: ['progress-overview'], queryFn: progressApi.overview })
  const { data: weights } = useQuery({ queryKey: ['weights'], queryFn: progressApi.weights })
  const { data: active } = useQuery({ queryKey: ['active-program'], queryFn: programsApi.getActive })
  const { data: exHistory } = useQuery({
    queryKey: ['ex-history', selectedExId],
    queryFn: () => progressApi.exerciseHistory(selectedExId!),
    enabled: !!selectedExId,
  })

  const logWeight = useMutation({
    mutationFn: (kg: number) => progressApi.logWeight(kg),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['weights'] })
      qc.invalidateQueries({ queryKey: ['progress-overview'] })
      setWeightInput('')
      showToast('Đã lưu cân nặng!')
    },
    onError: () => showToast('Lưu thất bại', 'error'),
  })

  const weightChartData = (weights ?? []).map((w) => ({
    date: new Date(w.recordedDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    kg: w.weightKg,
  }))

  // Lấy tất cả bài tập workout (không finisher) để chọn xem biểu đồ
  const workoutExercises = active?.program.days
    .flatMap((d) => d.dayExercises.filter((e) => !e.isFinisher))
    .reduce<{ id: string; name: string; nameVi: string }[]>((acc, e) => {
      if (!acc.find((x) => x.id === e.exerciseId)) {
        acc.push({ id: e.exerciseId, name: e.exercise.name, nameVi: e.exercise.nameVi })
      }
      return acc
    }, []) ?? []

  const exChartData = (exHistory ?? []).map((h) => ({
    date: new Date(h.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    kg: h.maxWeight,
    reps: h.maxReps,
    week: `T${h.weekNumber}`,
  }))

  return (
    <div className="flex-1 p-4 pb-24 space-y-5">
      {toastNode}
      <h2 className="text-xl font-black pt-2">Tiến Độ</h2>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Streak" value={`${overview?.streak ?? 0}🔥`} sub="ngày liên tiếp" />
        <StatCard label="Cân nặng" value={overview?.latestWeight ? `${overview.latestWeight.weightKg}kg` : '—'} sub="lần cuối" />
        <StatCard label="Buổi tập" value={String(weights?.length ?? 0)} sub="lần ghi nhận" />
      </div>

      {/* Ghi cân nặng */}
      <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
        <p className="text-slate-400 text-xs uppercase tracking-widest mb-3">Ghi Cân Nặng Hôm Nay</p>
        <div className="flex gap-2">
          <input
            type="number"
            step="0.1"
            placeholder="Nhập kg..."
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            className="flex-1 bg-slate-700 text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <button
            onClick={() => weightInput && logWeight.mutate(Number(weightInput))}
            disabled={!weightInput || logWeight.isPending}
            className="bg-brand text-white font-bold px-4 py-2 rounded-xl disabled:opacity-50"
          >
            {logWeight.isPending ? '...' : 'Lưu'}
          </button>
        </div>
      </div>

      {/* Biểu đồ cân nặng */}
      {weightChartData.length > 0 ? (
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-4">Cân Nặng Theo Ngày</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weightChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                width={35}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                labelStyle={{ color: '#94a3b8' }}
                formatter={(v) => [`${v} kg`, 'Cân nặng']}
              />
              <Line
                type="monotone"
                dataKey="kg"
                stroke="#f97316"
                strokeWidth={2}
                dot={{ fill: '#f97316', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyCard text="Chưa có dữ liệu cân nặng. Ghi cân nặng đầu tiên ở trên!" />
      )}

      {/* Biểu đồ tiến độ tạ theo bài */}
      {workoutExercises.length > 0 && (
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-3">Tiến Độ Tạ Theo Bài</p>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            {workoutExercises.map((ex) => (
              <button
                key={ex.id}
                onClick={() => setSelectedExId(ex.id)}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-bold transition-colors ${
                  selectedExId === ex.id ? 'bg-brand text-white' : 'bg-slate-700 text-slate-400'
                }`}
              >
                {ex.name.split(' ')[0]}
              </button>
            ))}
          </div>

          {!selectedExId && (
            <p className="text-slate-500 text-sm text-center py-4">Chọn bài tập để xem biểu đồ</p>
          )}

          {selectedExId && exChartData.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-4">Chưa có dữ liệu cho bài này.</p>
          )}

          {selectedExId && exChartData.length > 0 && (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={exChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} width={35} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(v, name) => [name === 'kg' ? `${v} kg` : `${v} reps`, name === 'kg' ? 'Tạ nặng nhất' : 'Reps']}
                />
                <Bar dataKey="kg" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Lịch sử buổi tập */}
      {(weights?.length ?? 0) > 1 && (
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-3">Lịch Sử Cân Nặng</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {[...(weights ?? [])].reverse().map((w) => (
              <div key={w.id} className="flex justify-between items-center text-sm py-1.5 border-b border-slate-700/50 last:border-0">
                <span className="text-slate-400">
                  {new Date(w.recordedDate).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                </span>
                <span className="font-bold text-white">{w.weightKg} kg</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-slate-800 rounded-2xl p-3 border border-slate-700 text-center">
      <p className="text-slate-500 text-xs mb-1">{label}</p>
      <p className="font-black text-lg text-white leading-tight">{value}</p>
      <p className="text-slate-500 text-xs">{sub}</p>
    </div>
  )
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-dashed border-slate-700 text-center">
      <p className="text-slate-500 text-sm">{text}</p>
    </div>
  )
}
