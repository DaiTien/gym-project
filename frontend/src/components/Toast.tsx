import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error'
  onDone: () => void
}

export function Toast({ message, type = 'success', onDone }: ToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(onDone, 300) }, 2500)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
      <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-sm font-bold max-w-xs
        ${type === 'success' ? 'bg-green-800 text-green-100 border border-green-600' : 'bg-red-900 text-red-100 border border-red-700'}`}>
        <span>{type === 'success' ? '✓' : '✕'}</span>
        {message}
      </div>
    </div>
  )
}

// Hook tiện lợi
export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const show = (message: string, type: 'success' | 'error' = 'success') => setToast({ message, type })
  const node = toast ? <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} /> : null
  return { show, node }
}
