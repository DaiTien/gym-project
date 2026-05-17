import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { profileApi } from '../api/progress'
import { useToast } from './Toast'

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Ít vận động', factor: 1.2 },
  { value: 'light',     label: 'Nhẹ (1-3 lần/tuần)', factor: 1.375 },
  { value: 'moderate',  label: 'Vừa (3-5 lần/tuần)', factor: 1.55 },
  { value: 'active',    label: 'Nhiều (6-7 lần/tuần)', factor: 1.725 },
]

function calcTdee(weightKg: number, heightCm: number, age: number, activityLevel: string) {
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5
  const factor = ACTIVITY_LEVELS.find(a => a.value === activityLevel)?.factor ?? 1.55
  const tdee = Math.round(bmr * factor)
  const protein = Math.round(weightKg * 2.2) // 1g/lb
  return { bmr: Math.round(bmr), tdee, protein }
}

export default function TdeeCalculator() {
  const qc = useQueryClient()
  const { show: showToast, node: toastNode } = useToast()
  const [editing, setEditing] = useState(false)

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.get,
  })

  const [form, setForm] = useState({
    weightKg: '',
    heightCm: '',
    age: '',
    activityLevel: 'moderate',
  })

  const save = useMutation({
    mutationFn: () => profileApi.update({
      weightKg:      form.weightKg ? Number(form.weightKg) : undefined,
      heightCm:      form.heightCm ? Number(form.heightCm) : undefined,
      age:           form.age      ? Number(form.age)      : undefined,
      activityLevel: form.activityLevel,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] })
      setEditing(false)
      showToast('Đã lưu thông tin!')
    },
    onError: () => showToast('Lưu thất bại', 'error'),
  })

  const openEdit = () => {
    setForm({
      weightKg:      profile?.weightKg  ? String(profile.weightKg)  : '',
      heightCm:      profile?.heightCm  ? String(profile.heightCm)  : '',
      age:           profile?.age       ? String(profile.age)        : '',
      activityLevel: profile?.activityLevel ?? 'moderate',
    })
    setEditing(true)
  }

  // Tính kết quả nếu đủ dữ liệu
  const result = profile?.weightKg && profile?.heightCm && profile?.age && profile?.activityLevel
    ? calcTdee(profile.weightKg, profile.heightCm, profile.age, profile.activityLevel)
    : null

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700">
      {toastNode}

      {/* Header */}
      <div className="flex justify-between items-center px-4 pt-4 pb-3 border-b border-slate-700">
        <div>
          <p className="text-slate-400 text-xs uppercase tracking-widest">TDEE & Dinh Dưỡng</p>
        </div>
        <button
          onClick={openEdit}
          className="text-brand text-xs font-bold border border-brand/30 px-2 py-1 rounded-lg"
        >
          {result ? 'Cập nhật' : 'Nhập thông tin'}
        </button>
      </div>

      {/* Kết quả */}
      <div className="p-4">
        {result ? (
          <div className="grid grid-cols-3 gap-3">
            <ResultCard label="BMR" value={result.bmr} unit="kcal" sub="lúc nghỉ ngơi" />
            <ResultCard label="TDEE" value={result.tdee} unit="kcal" sub="mục tiêu/ngày" highlight />
            <ResultCard label="Protein" value={result.protein} unit="g" sub="tối thiểu/ngày" />
          </div>
        ) : (
          <p className="text-slate-500 text-sm text-center py-3">
            Nhập thông tin để tính TDEE và lượng protein cần nạp.
          </p>
        )}

        {/* Thông tin đã lưu */}
        {result && (
          <div className="mt-3 flex gap-3 text-xs text-slate-500 justify-center flex-wrap">
            <span>⚖️ {profile?.weightKg}kg</span>
            <span>📏 {profile?.heightCm}cm</span>
            <span>🎂 {profile?.age} tuổi</span>
            <span>🏃 {ACTIVITY_LEVELS.find(a => a.value === profile?.activityLevel)?.label}</span>
          </div>
        )}
      </div>

      {/* Form chỉnh sửa — bottom sheet */}
      {editing && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end items-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setEditing(false)} />
          <div className="relative bg-slate-900 rounded-t-3xl border-t border-slate-700 w-full max-w-md flex flex-col"
            style={{ maxHeight: '80svh' }}>

            <div className="flex-shrink-0 flex justify-between items-center px-5 pt-5 pb-4 border-b border-slate-800">
              <h3 className="font-black text-lg">Thông Tin Cơ Thể</h3>
              <button onClick={() => setEditing(false)} className="text-slate-400 text-xl w-8 h-8 flex items-center justify-center">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Cân nặng (kg)</label>
                  <input
                    type="number" step="0.1"
                    value={form.weightKg}
                    onChange={e => setForm({ ...form, weightKg: e.target.value })}
                    placeholder="52"
                    className="w-full bg-slate-700 text-white text-center rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Chiều cao (cm)</label>
                  <input
                    type="number"
                    value={form.heightCm}
                    onChange={e => setForm({ ...form, heightCm: e.target.value })}
                    placeholder="160"
                    className="w-full bg-slate-700 text-white text-center rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Tuổi</label>
                  <input
                    type="number"
                    value={form.age}
                    onChange={e => setForm({ ...form, age: e.target.value })}
                    placeholder="24"
                    className="w-full bg-slate-700 text-white text-center rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-2 block">Mức độ hoạt động</label>
                <div className="space-y-2">
                  {ACTIVITY_LEVELS.map(a => (
                    <button
                      key={a.value}
                      onClick={() => setForm({ ...form, activityLevel: a.value })}
                      className={`w-full flex justify-between items-center px-4 py-3 rounded-xl text-sm transition-colors
                        ${form.activityLevel === a.value
                          ? 'bg-brand text-white font-bold'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    >
                      <span>{a.label}</span>
                      <span className="opacity-70">×{a.factor}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview kết quả trong form */}
              {form.weightKg && form.heightCm && form.age && (
                <div className="bg-slate-800 rounded-2xl p-4 border border-brand/20">
                  <p className="text-xs text-brand font-bold mb-2 uppercase tracking-widest">Kết quả dự kiến</p>
                  {(() => {
                    const r = calcTdee(Number(form.weightKg), Number(form.heightCm), Number(form.age), form.activityLevel)
                    return (
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div><p className="text-lg font-black">{r.bmr}</p><p className="text-xs text-slate-400">BMR</p></div>
                        <div><p className="text-lg font-black text-brand">{r.tdee}</p><p className="text-xs text-slate-400">TDEE</p></div>
                        <div><p className="text-lg font-black">{r.protein}g</p><p className="text-xs text-slate-400">Protein</p></div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>

            <div className="flex-shrink-0 px-5 py-4 border-t border-slate-800">
              <button
                onClick={() => save.mutate()}
                disabled={save.isPending || !form.weightKg || !form.heightCm || !form.age}
                className="w-full bg-brand text-white font-black py-3.5 rounded-xl disabled:opacity-50"
              >
                {save.isPending ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ResultCard({ label, value, unit, sub, highlight }: {
  label: string; value: number; unit: string; sub: string; highlight?: boolean
}) {
  return (
    <div className={`rounded-xl p-3 text-center ${highlight ? 'bg-brand/10 border border-brand/30' : 'bg-slate-700/50'}`}>
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className={`text-xl font-black leading-tight ${highlight ? 'text-brand' : 'text-white'}`}>{value}</p>
      <p className="text-xs font-bold text-slate-300">{unit}</p>
      <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>
    </div>
  )
}
