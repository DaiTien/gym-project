import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  title: string
  onClose: () => void
  onConfirm: () => void
  confirmLabel?: string
  confirming?: boolean
  children: React.ReactNode
}

export default function BottomSheet({ title, onClose, onConfirm, confirmLabel = 'Lưu', confirming, children }: Props) {
  // Khoá scroll body khi modal mở
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col justify-end items-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Sheet — đồng bộ max-w-md với layout chính */}
      <div className="relative flex flex-col bg-slate-900 rounded-t-3xl border-t border-slate-700 w-full max-w-md"
        style={{ maxHeight: '80svh' }}>

        {/* Header — cố định */}
        <div className="flex-shrink-0 flex justify-between items-center px-5 pt-5 pb-4 border-b border-slate-800">
          <h3 className="font-black text-lg">{title}</h3>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white text-xl">
            ✕
          </button>
        </div>

        {/* Nội dung — scroll */}
        <div className="flex-1 overflow-y-auto px-5 py-4 overscroll-contain">
          {children}
        </div>

        {/* Footer nút Lưu — cố định, luôn hiện */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-slate-800 bg-slate-900">
          <button
            onClick={onConfirm}
            disabled={confirming}
            className="w-full bg-brand text-white font-black py-3.5 rounded-xl disabled:opacity-50 active:scale-95 transition-transform"
          >
            {confirming ? 'Đang lưu...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
