import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { lifestyleApi, nutritionApi } from '../api/progress'
import { useToast } from '../components/Toast'
import TdeeCalculator from '../components/TdeeCalculator'
import FoodLogModal from '../components/FoodLogModal'

const STEP_GOAL = 7000
const PROTEIN_GOAL = 120

export default function Lifestyle() {
  const qc = useQueryClient()
  const { show: showToast, node: toastNode } = useToast()

  const { data: today, isLoading } = useQuery({
    queryKey: ['lifestyle-today'],
    queryFn: lifestyleApi.today,
  })

  const { data: history } = useQuery({
    queryKey: ['lifestyle-history'],
    queryFn: lifestyleApi.history,
  })

  const [isModalOpen, setIsModalOpen] = useState(false)

  const removeLog = useMutation({
    mutationFn: (id: string) => nutritionApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lifestyle-today'] })
      qc.invalidateQueries({ queryKey: ['lifestyle-history'] })
      showToast('Đã xóa món ăn!')
    },
    onError: () => showToast('Xóa thất bại', 'error')
  })

  const [form, setForm] = useState({
    steps: '',
    sleepHours: '',
    caloriesIn: '',
    proteinG: '',
    notes: '',
  })

  // Điền dữ liệu hiện tại vào form khi load xong
  useEffect(() => {
    if (today) {
      setForm({
        steps: today.steps != null ? String(today.steps) : '',
        sleepHours: today.sleepHours != null ? String(today.sleepHours) : '',
        caloriesIn: today.caloriesIn != null ? String(today.caloriesIn) : '',
        proteinG: today.proteinG != null ? String(today.proteinG) : '',
        notes: today.notes ?? '',
      })
    }
  }, [today])

  const save = useMutation({
    mutationFn: () =>
      lifestyleApi.log({
        steps: form.steps ? Number(form.steps) : undefined,
        sleepHours: form.sleepHours ? Number(form.sleepHours) : undefined,
        caloriesIn: form.caloriesIn ? Number(form.caloriesIn) : undefined,
        proteinG: form.proteinG ? Number(form.proteinG) : undefined,
        notes: form.notes || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lifestyle-today'] })
      qc.invalidateQueries({ queryKey: ['lifestyle-history'] })
      showToast('Đã lưu nhật ký hôm nay!')
    },
    onError: () => showToast('Lưu thất bại', 'error'),
  })

  const todayLabel = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', day: '2-digit', month: '2-digit',
  })

  return (
    <div className="flex-1 overflow-y-auto p-4 pb-6 space-y-4">
      {toastNode}
      <div className="flex justify-between items-center pt-2">
        <h2 className="text-xl font-black">Lối Sống</h2>
        <p className="text-slate-400 text-xs capitalize">{todayLabel}</p>
      </div>

      {/* TDEE Calculator */}
      <TdeeCalculator />

      {/* Progress rings hôm nay */}
      <div className="grid grid-cols-4 gap-2">
        <RingCard label="Kcal" value={today?.caloriesIn ?? 0} goal={2000} unit="" color="#f97316" icon="🔥" />
        <RingCard label="Pro" value={today?.proteinG ?? 0} goal={120} unit="g" color="#22d3ee" icon="🥩" />
        <RingCard label="Carb" value={today?.carbG ?? 0} goal={250} unit="g" color="#a3e635" icon="🍚" />
        <RingCard label="Fat" value={today?.fatG ?? 0} goal={60} unit="g" color="#fbbf24" icon="🥑" />
      </div>

      <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <p className="text-slate-400 text-xs uppercase tracking-widest">Thực Đơn Hôm Nay</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-brand text-white text-xs font-bold px-3 py-1.5 rounded-lg"
          >
            + AI Phân Tích
          </button>
        </div>

        {(!today?.foodLogs || today.foodLogs.length === 0) ? (
          <p className="text-center text-slate-500 text-sm py-4">Chưa có món ăn nào hôm nay</p>
        ) : (
          <div className="space-y-3">
            {today.foodLogs.map(log => (
              <div key={log.id} className="flex flex-col gap-1 pb-3 border-b border-slate-700/50 last:border-0 last:pb-0">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-white text-sm">{log.foodName} <span className="text-slate-400 text-xs font-normal">({log.weightG || 0}g)</span></span>
                  <button onClick={() => removeLog.mutate(log.id)} className="text-slate-500 hover:text-red-400 text-xs">🗑️ Xóa</button>
                </div>
                <div className="flex gap-3 text-xs text-slate-300">
                  <span className="text-brand font-bold">{log.calories} kcal</span>
                  <span>🥩 {log.protein}g</span>
                  <span>🍚 {log.carb}g</span>
                  <span>🥑 {log.fat}g</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <FoodLogModal 
          onClose={() => setIsModalOpen(false)} 
          selectedDate={new Date().toISOString().slice(0, 10)} 
        />
      )}

      {/* Quy tắc 23 giờ reminder */}
      <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
        <p className="text-xs text-brand font-bold mb-2">QUY TẮC 23 GIỜ NGOÀI PHÒNG TẬP</p>
        <div className="space-y-1.5 text-sm text-slate-400">
          <p>👟 Mục tiêu <span className="text-white font-bold">7.000 bước/ngày</span></p>
          <p>🌙 Ngủ đúng giờ để tối ưu hormone phục hồi</p>
          <p>🥩 Nạp <span className="text-white font-bold">1g protein/lb</span> để giữ cơ</p>
          <p>📉 Thâm hụt calo <span className="text-white font-bold">350–500 kcal/ngày</span></p>
        </div>
      </div>

      {/* Lịch sử 7 ngày */}
      {(history?.length ?? 0) > 0 && (
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-3">7 Ngày Gần Nhất</p>
          <div className="space-y-2">
            {history!.slice(0, 7).map((log) => (
              <div key={log.id} className="flex items-center justify-between py-1.5 border-b border-slate-700/40 last:border-0">
                <span className="text-slate-400 text-sm w-20">
                  {new Date(log.logDate).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                </span>
                <div className="flex gap-3 text-xs">
                  {log.steps != null && (
                    <span className={log.steps >= STEP_GOAL ? 'text-green-400' : 'text-slate-400'}>
                      👟 {(log.steps / 1000).toFixed(1)}k
                    </span>
                  )}
                  {log.sleepHours != null && (
                    <span className={log.sleepHours >= 7 ? 'text-green-400' : 'text-yellow-400'}>
                      🌙 {log.sleepHours}h
                    </span>
                  )}
                  {log.caloriesIn != null && (
                    <span className="text-slate-300">🍽 {log.caloriesIn}kcal</span>
                  )}
                  {log.proteinG != null && (
                    <span className={log.proteinG >= PROTEIN_GOAL ? 'text-green-400' : 'text-slate-400'}>
                      🥩 {log.proteinG}g
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Components ───────────────────────────────────────────────────────────────

function LogRow({
  icon, label, placeholder, unit, value, onChange, type = 'text', step,
}: {
  icon: string; label: string; placeholder: string; unit: string
  value: string; onChange: (v: string) => void; type?: string; step?: string
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xl w-7">{icon}</span>
      <label className="text-sm text-slate-300 w-24 flex-shrink-0">{label}</label>
      <div className="flex-1 flex items-center gap-2">
        <input
          type={type}
          step={step}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-slate-700 text-white placeholder-slate-500 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <span className="text-slate-500 text-xs w-8">{unit}</span>
      </div>
    </div>
  )
}

function RingCard({
  label, value, goal, unit, color, icon,
}: {
  label: string; value: number; goal: number; unit: string; color: string; icon: string
}) {
  const pct = Math.min(value / goal, 1)
  const r = 28
  const circumference = 2 * Math.PI * r
  const strokeDashoffset = circumference * (1 - pct)

  return (
    <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 flex flex-col items-center gap-2">
      <p className="text-slate-400 text-xs">{label}</p>
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={r} fill="none" stroke="#334155" strokeWidth="6" />
          <circle
            cx="32" cy="32" r={r} fill="none"
            stroke={color} strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xl">{icon}</span>
      </div>
      <div className="text-center">
        <p className="font-black text-sm">{value.toLocaleString()}</p>
        <p className="text-slate-500 text-xs">/ {goal.toLocaleString()} {unit}</p>
      </div>
    </div>
  )
}
