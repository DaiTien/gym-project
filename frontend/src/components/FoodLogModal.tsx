import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { nutritionApi } from '../api/progress'
import { useToast } from './Toast'

export default function FoodLogModal({ onClose, selectedDate }: { onClose: () => void, selectedDate: string }) {
  const { show: showToast } = useToast()
  const qc = useQueryClient()
  
  const [tab, setTab] = useState<'text' | 'image'>('text')
  const [text, setText] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [analyzedItems, setAnalyzedItems] = useState<any[]>([])
  
  const analyze = useMutation({
    mutationFn: () => nutritionApi.analyze({ 
      text: tab === 'text' ? text : undefined,
      imageBase64: tab === 'image' ? (imagePreview ?? undefined) : undefined 
    }),
    onSuccess: (data) => {
      setAnalyzedItems(data)
      showToast('Phân tích thành công')
    },
    onError: (err: any) => showToast(err.message || 'Lỗi phân tích', 'error')
  })

  const logFood = useMutation({
    mutationFn: (item: any) => nutritionApi.log({
      date: selectedDate,
      foodName: item.foodName,
      weightG: item.weightG,
      calories: item.calories,
      protein: item.protein,
      carb: item.carb,
      fat: item.fat
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lifestyle-today'] })
      showToast('Đã lưu món ăn!')
    },
    onError: (err: any) => showToast(err.message || 'Lưu thất bại', 'error')
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSaveAll = async () => {
    for (const item of analyzedItems) {
      await logFood.mutateAsync(item)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end items-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-slate-900 rounded-t-3xl border-t border-slate-700 w-full max-w-md flex flex-col"
        style={{ maxHeight: '90svh' }}>
        
        <div className="flex-shrink-0 flex justify-between items-center px-5 pt-5 pb-3 border-b border-slate-800">
          <h3 className="font-black text-lg">Phân Tích Bữa Ăn (AI)</h3>
          <button onClick={onClose} className="text-slate-400 text-xl w-8 h-8">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {analyzedItems.length === 0 ? (
            <>
              {/* Tabs */}
              <div className="flex bg-slate-800 rounded-xl p-1">
                <button 
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${tab === 'text' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
                  onClick={() => setTab('text')}
                >
                  📝 Nhập chữ
                </button>
                <button 
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${tab === 'image' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
                  onClick={() => setTab('image')}
                >
                  📸 Chụp ảnh
                </button>
              </div>

              {tab === 'text' && (
                <textarea
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-brand focus:outline-none resize-none"
                  rows={4}
                  placeholder="VD: 1 bát phở bò nhiều thịt, 1 ly cafe sữa đá..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                  autoFocus
                />
              )}

              {tab === 'image' && (
                <div className="space-y-3">
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    ref={fileInputRef}
                    className="hidden" 
                    onChange={handleImageChange} 
                  />
                  {!imagePreview ? (
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-slate-700 rounded-xl py-12 text-slate-400 hover:text-white hover:border-slate-500 transition-colors flex flex-col items-center justify-center gap-2"
                    >
                      <span className="text-3xl">📷</span>
                      <span>Chụp mâm cơm của bạn</span>
                    </button>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden">
                      <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-2 right-2 bg-black/60 text-white px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-md"
                      >
                        Chụp lại
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button 
                onClick={() => analyze.mutate()}
                disabled={analyze.isPending || (tab === 'text' && !text) || (tab === 'image' && !imagePreview)}
                className="w-full bg-brand text-white font-black py-3.5 rounded-xl disabled:opacity-50 mt-4"
              >
                {analyze.isPending ? 'Đang phân tích...' : '✨ Phân Tích Bằng AI'}
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-green-400 font-bold">✓ AI đã phân tích xong. Vui lòng kiểm tra lại:</p>
              {analyzedItems.map((item, idx) => (
                <div key={idx} className="bg-slate-800 rounded-xl p-3 border border-slate-700 space-y-3">
                  <input 
                    className="w-full bg-transparent font-bold text-white focus:outline-none border-b border-slate-700 pb-1"
                    value={item.foodName}
                    onChange={(e) => {
                      const newItems = [...analyzedItems]
                      newItems[idx].foodName = e.target.value
                      setAnalyzedItems(newItems)
                    }}
                  />
                  <div className="grid grid-cols-5 gap-2 text-center text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1">Gram</label>
                      <input type="number" className="w-full bg-slate-700 rounded p-1 text-center" value={item.weightG || 0} onChange={e => {
                        const newItems = [...analyzedItems]; newItems[idx].weightG = Number(e.target.value); setAnalyzedItems(newItems)
                      }}/>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Kcal</label>
                      <input type="number" className="w-full bg-slate-700 rounded p-1 text-center text-brand font-bold" value={item.calories || 0} onChange={e => {
                        const newItems = [...analyzedItems]; newItems[idx].calories = Number(e.target.value); setAnalyzedItems(newItems)
                      }}/>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Pro</label>
                      <input type="number" className="w-full bg-slate-700 rounded p-1 text-center" value={item.protein || 0} onChange={e => {
                        const newItems = [...analyzedItems]; newItems[idx].protein = Number(e.target.value); setAnalyzedItems(newItems)
                      }}/>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Carb</label>
                      <input type="number" className="w-full bg-slate-700 rounded p-1 text-center" value={item.carb || 0} onChange={e => {
                        const newItems = [...analyzedItems]; newItems[idx].carb = Number(e.target.value); setAnalyzedItems(newItems)
                      }}/>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Fat</label>
                      <input type="number" className="w-full bg-slate-700 rounded p-1 text-center" value={item.fat || 0} onChange={e => {
                        const newItems = [...analyzedItems]; newItems[idx].fat = Number(e.target.value); setAnalyzedItems(newItems)
                      }}/>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => setAnalyzedItems([])}
                  className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleSaveAll}
                  disabled={logFood.isPending}
                  className="flex-[2] py-3 bg-brand text-white font-black rounded-xl"
                >
                  {logFood.isPending ? 'Đang lưu...' : 'Lưu Vào Nhật Ký'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
