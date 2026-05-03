import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { workoutGroupsApi, exercisesApi } from '../api/programs'
import type { WorkoutGroup } from '../api/programs'
import ExerciseImage from '../components/ExerciseImage'
import { useToast } from '../components/Toast'

export default function Exercises() {
  const { show: showToast, node: toastNode } = useToast()
  const [view, setView] = useState<'groups' | 'detail'>('groups')
  const [activeGroup, setActiveGroup] = useState<WorkoutGroup | null>(null)
  const [showGroupForm, setShowGroupForm] = useState(false)
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [editingGroup, setEditingGroup] = useState<WorkoutGroup | null>(null)
  const [groupForm, setGroupForm] = useState({ label: '', circuitRounds: 3 })
  const [exSearch, setExSearch] = useState('')
  const qc = useQueryClient()

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['workout-groups'],
    queryFn: workoutGroupsApi.list,
  })

  const { data: allExercises = [] } = useQuery({
    queryKey: ['exercises'],
    queryFn: exercisesApi.list,
    enabled: showAddExercise,
  })

  const createGroup = useMutation({
    mutationFn: () => workoutGroupsApi.create(groupForm),
    onSuccess: (g) => {
      qc.invalidateQueries({ queryKey: ['workout-groups'] })
      resetGroupForm()
      showToast('Đã tạo nhóm!')
      setActiveGroup(g)
      setView('detail')
    },
    onError: () => showToast('Tạo thất bại', 'error'),
  })

  const updateGroup = useMutation({
    mutationFn: () => workoutGroupsApi.update(editingGroup!.id, groupForm),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['workout-groups'] })
      setActiveGroup(updated)
      resetGroupForm()
      showToast('Đã cập nhật!')
    },
    onError: () => showToast('Cập nhật thất bại', 'error'),
  })

  const deleteGroup = useMutation({
    mutationFn: (id: string) => workoutGroupsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workout-groups'] })
      setView('groups')
      setActiveGroup(null)
      showToast('Đã xóa nhóm')
    },
    onError: () => showToast('Xóa thất bại', 'error'),
  })

  const addExercise = useMutation({
    mutationFn: (exerciseId: string) =>
      workoutGroupsApi.addExercise(activeGroup!.id, { exerciseId, week12Reps: 12, week34Reps: 15 }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workout-groups'] })
      // Cập nhật activeGroup từ cache mới
      showToast('Đã thêm bài tập!')
      setShowAddExercise(false)
      setExSearch('')
    },
    onError: () => showToast('Thêm thất bại', 'error'),
  })

  const removeExercise = useMutation({
    mutationFn: (deId: string) => workoutGroupsApi.removeExercise(activeGroup!.id, deId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workout-groups'] })
      showToast('Đã xóa bài tập')
    },
  })

  const resetGroupForm = () => {
    setGroupForm({ label: '', circuitRounds: 3 })
    setEditingGroup(null)
    setShowGroupForm(false)
  }

  // Sync activeGroup với data mới nhất từ cache
  const currentGroup = activeGroup
    ? groups.find((g) => g.id === activeGroup.id) ?? activeGroup
    : null

  // Nhóm "của tôi" = có userId (không phải global template)
  const isMyGroup = !!currentGroup?.userId

  const globalGroups = groups.filter((g) => !g.userId)
  const myGroups = groups.filter((g) => !!g.userId)

  // Filter bài tập chưa có trong nhóm
  const availableExercises = allExercises.filter((ex) => {
    const alreadyIn = currentGroup?.dayExercises.some((de) => de.exerciseId === ex.id)
    const matchSearch = ex.name.toLowerCase().includes(exSearch.toLowerCase()) ||
      ex.nameVi.toLowerCase().includes(exSearch.toLowerCase())
    return !alreadyIn && matchSearch
  })

  // ── View: Danh sách nhóm ──────────────────────────────────────────────────
  if (view === 'groups') {
    return (
      <div className="flex-1 overflow-y-auto p-4 pb-6">
        {toastNode}
        <div className="flex justify-between items-center pt-2 mb-5">
          <h2 className="text-xl font-black">Bài Tập</h2>
          <button
            onClick={() => { resetGroupForm(); setShowGroupForm(true) }}
            className="bg-brand text-white text-sm font-bold px-3 py-1.5 rounded-xl"
          >
            + Nhóm mới
          </button>
        </div>

        {isLoading ? (
          <div className="text-slate-400 text-center py-8">Đang tải...</div>
        ) : (
          <>
            {/* Nhóm của tôi */}
            {myGroups.length > 0 && (
              <section className="mb-5">
                <p className="text-xs text-brand font-bold uppercase tracking-widest mb-2">
                  Nhóm của tôi
                </p>
                <div className="space-y-2">
                  {myGroups.map((g) => (
                    <GroupCard
                      key={g.id}
                      group={g}
                      isOwner={!!g.userId}
                      onClick={() => { setActiveGroup(g); setView('detail') }}
                      onEdit={() => {
                        setEditingGroup(g)
                        setGroupForm({ label: g.label, circuitRounds: g.circuitRounds })
                        setShowGroupForm(true)
                      }}
                      onDelete={() => {
                        if (confirm(`Xóa nhóm "${g.label}"?`)) deleteGroup.mutate(g.id)
                      }}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Nhóm mặc định */}
            <section>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">
                Nhóm mặc định
              </p>
              <div className="space-y-2">
                {globalGroups.map((g) => (
                  <GroupCard
                    key={g.id}
                    group={g}
                    isOwner={false}
                    onClick={() => { setActiveGroup(g); setView('detail') }}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        {/* Form tạo/sửa nhóm */}
        {showGroupForm && (
          <GroupFormSheet
            editing={editingGroup}
            form={groupForm}
            onChange={setGroupForm}
            onClose={resetGroupForm}
            onSubmit={() => editingGroup ? updateGroup.mutate() : createGroup.mutate()}
            loading={createGroup.isPending || updateGroup.isPending}
          />
        )}
      </div>
    )
  }

  // ── View: Chi tiết nhóm ───────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col pb-24">
      {toastNode}

      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center gap-3">
        <button onClick={() => setView('groups')} className="text-slate-400 text-xl">←</button>
        <div className="flex-1 min-w-0">
          <p className="font-black truncate">{currentGroup?.label}</p>
          <p className="text-slate-400 text-xs">
            {currentGroup?.circuitRounds} vòng · {currentGroup?.dayExercises.length} bài tập
            {currentGroup?.userId && <span className="ml-2 text-brand">• Nhóm của tôi</span>}
          </p>
        </div>
        {isMyGroup && (
          <button
            onClick={() => {
              if (currentGroup) {
                setEditingGroup(currentGroup)
                setGroupForm({ label: currentGroup.label, circuitRounds: currentGroup.circuitRounds })
                setShowGroupForm(true)
              }
            }}
            className="text-slate-400 text-sm border border-slate-600 px-2 py-1 rounded-lg"
          >
            Sửa
          </button>
        )}
      </div>

      {/* Danh sách bài tập trong nhóm */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {currentGroup?.dayExercises.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <p className="text-3xl mb-2">🏋️</p>
            <p>Chưa có bài tập nào</p>
            {isMyGroup && (
              <p className="text-sm mt-1">Bấm "+ Thêm bài tập" để bắt đầu</p>
            )}
          </div>
        )}
        {currentGroup?.dayExercises.map((de) => (
          <div key={de.id} className="bg-slate-800 rounded-2xl p-3 border border-slate-700 flex items-center gap-3">
            <ExerciseImage
              exerciseId={de.exerciseId}
              imageUrl={de.exercise.imageUrl}
              name={de.exercise.name}
              size="sm"
              editable
            />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{de.exercise.name}</p>
              <p className="text-slate-400 text-xs truncate">{de.exercise.nameVi}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                T1-2: {de.week12Reps ?? '—'} reps · T3-4: {de.week34Reps ?? '—'} reps
                {de.isFinisher && <span className="ml-2 text-brand">Finisher {de.finisherPair}</span>}
              </p>
            </div>
            {isMyGroup && (
              <button
                onClick={() => removeExercise.mutate(de.id)}
                className="w-8 h-8 flex items-center justify-center bg-slate-700 rounded-xl text-red-400 hover:bg-red-900/30 flex-shrink-0"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Nút thêm bài tập (chỉ nhóm của mình) */}
      {isMyGroup && (
        <div className="px-4 py-3 border-t border-slate-800">
          <button
            onClick={() => setShowAddExercise(true)}
            className="w-full bg-brand text-white font-black py-3 rounded-xl"
          >
            + Thêm Bài Tập
          </button>
        </div>
      )}

      {/* Sheet chọn bài tập để thêm vào nhóm */}
      {showAddExercise && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end items-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => { setShowAddExercise(false); setExSearch('') }} />
          <div className="relative bg-slate-900 rounded-t-3xl border-t border-slate-700 w-full max-w-md flex flex-col"
            style={{ maxHeight: '80svh' }}>
            <div className="flex-shrink-0 flex justify-between items-center px-5 pt-5 pb-3 border-b border-slate-800">
              <h3 className="font-black">Chọn bài tập</h3>
              <button onClick={() => { setShowAddExercise(false); setExSearch('') }}
                className="text-slate-400 text-xl w-8 h-8 flex items-center justify-center">✕</button>
            </div>
            <div className="flex-shrink-0 px-5 pt-3">
              <input
                placeholder="Tìm bài tập..."
                value={exSearch}
                onChange={(e) => setExSearch(e.target.value)}
                autoFocus
                className="w-full bg-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
              {availableExercises.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-8">
                  {exSearch ? 'Không tìm thấy' : 'Tất cả bài tập đã có trong nhóm'}
                </p>
              )}
              {availableExercises.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => addExercise.mutate(ex.id)}
                  disabled={addExercise.isPending}
                  className="w-full flex items-center gap-3 bg-slate-800 hover:bg-slate-700 rounded-2xl p-3 border border-slate-700 transition-colors text-left disabled:opacity-50"
                >
                  <ExerciseImage exerciseId={ex.id} imageUrl={ex.imageUrl} name={ex.name} size="sm" editable={false} />
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{ex.name}</p>
                    <p className="text-slate-400 text-xs truncate">{ex.nameVi}</p>
                    {ex.muscleGroup && (
                      <span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                        {ex.muscleGroup}
                      </span>
                    )}
                  </div>
                  <span className="ml-auto text-brand text-lg flex-shrink-0">+</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Form sửa nhóm */}
      {showGroupForm && editingGroup && (
        <GroupFormSheet
          editing={editingGroup}
          form={groupForm}
          onChange={setGroupForm}
          onClose={resetGroupForm}
          onSubmit={() => updateGroup.mutate()}
          loading={updateGroup.isPending}
        />
      )}
    </div>
  )
}

// ─── GroupCard ────────────────────────────────────────────────────────────────

function GroupCard({ group, isOwner, onClick, onEdit, onDelete }: {
  group: WorkoutGroup
  isOwner: boolean
  onClick: () => void
  onEdit?: () => void
  onDelete?: () => void
}) {
  // Lấy tối đa 4 thumbnail đầu tiên
  const thumbs = group.dayExercises.slice(0, 4)

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
      <button onClick={onClick} className="w-full text-left p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="font-black">{group.label}</p>
            <p className="text-slate-400 text-xs mt-0.5">
              {group.circuitRounds} vòng · {group.dayExercises.length} bài tập
            </p>
          </div>
          <span className="text-slate-400 text-lg">›</span>
        </div>
        {/* Thumbnails */}
        {thumbs.length > 0 && (
          <div className="flex gap-2">
            {thumbs.map((de) => (
              <div key={de.id}
                className="w-12 h-12 rounded-xl bg-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0">
                {de.exercise.imageUrl
                  ? <img src={de.exercise.imageUrl} alt={de.exercise.name} className="w-full h-full object-cover" loading="lazy" />
                  : <span className="text-xl">💪</span>
                }
              </div>
            ))}
            {group.dayExercises.length > 4 && (
              <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center text-slate-400 text-xs font-bold flex-shrink-0">
                +{group.dayExercises.length - 4}
              </div>
            )}
          </div>
        )}
      </button>

      {isOwner && (
        <div className="flex border-t border-slate-700">
          <button onClick={onEdit}
            className="flex-1 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            ✏️ Sửa nhóm
          </button>
          <div className="w-px bg-slate-700" />
          <button onClick={onDelete}
            className="flex-1 py-2 text-xs text-red-400 hover:bg-red-900/20 transition-colors">
            🗑️ Xóa
          </button>
        </div>
      )}
    </div>
  )
}

// ─── GroupFormSheet ───────────────────────────────────────────────────────────

function GroupFormSheet({ editing, form, onChange, onClose, onSubmit, loading }: {
  editing: WorkoutGroup | null
  form: { label: string; circuitRounds: number }
  onChange: (f: { label: string; circuitRounds: number }) => void
  onClose: () => void
  onSubmit: () => void
  loading: boolean
}) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end items-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-slate-900 rounded-t-3xl border-t border-slate-700 w-full max-w-md flex flex-col"
        style={{ maxHeight: '80svh' }}>

        <div className="flex-shrink-0 flex justify-between items-center px-5 pt-5 pb-4 border-b border-slate-800">
          <h3 className="font-black text-lg">{editing ? 'Sửa nhóm' : 'Tạo nhóm mới'}</h3>
          <button onClick={onClose} className="text-slate-400 text-xl w-8 h-8 flex items-center justify-center">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Tên nhóm *</label>
            <input
              value={form.label}
              onChange={(e) => onChange({ ...form, label: e.target.value })}
              placeholder="VD: Ngực & Vai, Chân & Mông..."
              autoFocus
              className="w-full bg-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Số vòng Circuit</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onChange({ ...form, circuitRounds: n })}
                  className={`flex-1 py-2.5 rounded-xl font-black text-sm transition-colors
                    ${form.circuitRounds === n ? 'bg-brand text-white' : 'bg-slate-700 text-slate-400'}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 px-5 py-4 border-t border-slate-800">
          <button
            onClick={onSubmit}
            disabled={loading || !form.label}
            className="w-full bg-brand text-white font-black py-3.5 rounded-xl disabled:opacity-50"
          >
            {loading ? 'Đang lưu...' : editing ? 'Cập Nhật Nhóm' : 'Tạo Nhóm'}
          </button>
        </div>
      </div>
    </div>
  )
}
