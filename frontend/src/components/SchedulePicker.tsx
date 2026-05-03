import { useState } from 'react'
import type { SchedulableGroup, ScheduleInput } from '../api/programs'

const DOW_LABELS = ['', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const DOW_FULL   = ['', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật']

interface Props {
  // Nhóm workout để chọn (global + của user)
  groups: SchedulableGroup[]
  initialSchedule?: ScheduleInput
  onChange: (schedule: ScheduleInput) => void
}

export default function SchedulePicker({ groups, initialSchedule, onChange }: Props) {
  const [schedule, setSchedule] = useState<ScheduleInput>(() => {
    if (initialSchedule) return initialSchedule
    // Default: tất cả ngày để trống
    const s: ScheduleInput = {}
    for (let i = 1; i <= 7; i++) s[i] = null
    return s
  })

  const [selectedDow, setSelectedDow] = useState<number | null>(null)

  const assign = (dow: number, groupId: string | null) => {
    const next = { ...schedule }
    // Nếu group đã ở ngày khác → swap
    if (groupId) {
      const prev = Object.entries(next).find(([, v]) => v === groupId)?.[0]
      if (prev) next[Number(prev)] = null
    }
    next[dow] = groupId
    setSchedule(next)
    onChange(next)
    setSelectedDow(null)
  }

  const workoutCount = Object.values(schedule).filter(Boolean).length
  const myGroups = groups.filter((g) => g.userId !== null)
  const globalGroups = groups.filter((g) => g.userId === null)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-300">Chọn ngày → chọn nhóm tập</p>
        <span className="text-xs text-slate-500">{workoutCount} ngày đã có lịch</span>
      </div>

      {/* 7 ô ngày */}
      <div className="grid grid-cols-7 gap-1.5 mb-4">
        {[1,2,3,4,5,6,7].map((dow) => {
          const assignedId = schedule[dow]
          const assignedGroup = groups.find((g) => g.id === assignedId)
          const isSelected = selectedDow === dow

          return (
            <button
              key={dow}
              onClick={() => setSelectedDow(isSelected ? null : dow)}
              className={`flex flex-col items-center py-2 rounded-xl text-xs font-bold transition-all border
                ${isSelected
                  ? 'bg-brand border-brand text-white scale-105'
                  : assignedGroup
                  ? 'bg-slate-700 border-brand/40 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}
            >
              <span>{DOW_LABELS[dow]}</span>
              <span className="mt-1 text-base leading-none">
                {assignedGroup ? '💪' : '○'}
              </span>
              {assignedGroup && (
                <span className="mt-0.5 text-brand text-[9px] leading-tight text-center w-full truncate px-0.5">
                  {assignedGroup.label.split(' ')[0]}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Panel chọn nhóm cho ngày đang selected */}
      {selectedDow !== null && (
        <div className="bg-slate-800 border border-brand/30 rounded-2xl p-3">
          <p className="text-sm font-bold mb-2 text-slate-300">
            {DOW_FULL[selectedDow]} — chọn nhóm tập:
          </p>
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {/* Nghỉ */}
            <button
              onClick={() => assign(selectedDow, null)}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors
                ${!schedule[selectedDow]
                  ? 'bg-slate-600 text-white font-bold'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
            >
              😴 Nghỉ ngơi
            </button>

            {/* Nhóm của tôi */}
            {myGroups.length > 0 && (
              <>
                <p className="text-[10px] text-brand font-bold uppercase tracking-widest px-1 pt-1">
                  Nhóm của tôi
                </p>
                {myGroups.map((g) => <GroupOption key={g.id} group={g} schedule={schedule} selectedDow={selectedDow} onAssign={assign} />)}
              </>
            )}

            {/* Nhóm mặc định */}
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-1 pt-1">
              Nhóm mặc định
            </p>
            {globalGroups.map((g) => <GroupOption key={g.id} group={g} schedule={schedule} selectedDow={selectedDow} onAssign={assign} />)}
          </div>
        </div>
      )}
    </div>
  )
}

function GroupOption({ group, schedule, selectedDow, onAssign }: {
  group: SchedulableGroup
  schedule: ScheduleInput
  selectedDow: number
  onAssign: (dow: number, id: string) => void
}) {
  const isHere = schedule[selectedDow] === group.id
  const elsewhereDow = Object.entries(schedule).find(([d, v]) => v === group.id && Number(d) !== selectedDow)?.[0]

  return (
    <button
      onClick={() => onAssign(selectedDow, group.id)}
      className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors
        ${isHere ? 'bg-brand text-white font-bold' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
    >
      💪 {group.label}
      <span className="ml-1 text-xs opacity-60">{group.circuitRounds} vòng</span>
      {elsewhereDow && (
        <span className="ml-2 text-xs text-slate-400">(đang ở {['','T2','T3','T4','T5','T6','T7','CN'][Number(elsewhereDow)]})</span>
      )}
    </button>
  )
}
