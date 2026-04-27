import { useAuthStore } from '../store/authStore'

// Placeholder — sẽ connect API ở Phase 1
export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  return (
    <div className="flex-1 p-4 pb-20">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-slate-400 text-sm">Xin chào,</p>
          <h2 className="text-xl font-bold">{user?.name}</h2>
        </div>
        <button onClick={logout} className="text-slate-400 text-xs underline">Đăng xuất</button>
      </div>

      <div className="bg-slate-800 rounded-2xl p-4 mb-4 border border-slate-700">
        <p className="text-slate-400 text-xs mb-1">CHƯƠNG TRÌNH HIỆN TẠI</p>
        <h3 className="font-black text-lg text-brand">Dad Bod AB Shred</h3>
        <p className="text-sm text-slate-300 mt-1">Tuần 1 · Ngày 1</p>
        <div className="mt-3 h-2 bg-slate-700 rounded-full">
          <div className="h-2 bg-brand rounded-full" style={{ width: '0%' }} />
        </div>
        <p className="text-xs text-slate-500 mt-1">0% hoàn thành</p>
      </div>

      <div className="bg-slate-800 rounded-2xl p-4 border border-orange-500/30">
        <p className="text-slate-400 text-xs mb-2">HÔM NAY</p>
        <p className="font-bold text-lg">Bắt đầu chương trình</p>
        <p className="text-slate-400 text-sm mt-1">Thiết lập chương trình để bắt đầu tập luyện</p>
        <button className="mt-4 w-full bg-brand text-white font-bold py-3 rounded-xl">
          Bắt Đầu →
        </button>
      </div>
    </div>
  )
}
