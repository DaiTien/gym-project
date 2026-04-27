import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { api } from '../api/client'

export default function Login() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [form, setForm] = useState({ email: '', name: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register'
      const body = mode === 'login'
        ? { email: form.email, password: form.password }
        : form
      const res = await api.post<{ user: any; token: string }>(path, body)
      setAuth(res.user, res.token)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col justify-center flex-1 px-6 py-12">
      <h1 className="text-3xl font-black text-brand mb-1">GYM TRACKER</h1>
      <p className="text-slate-400 mb-8 text-sm">Dad Bod AB Shred — 4 tuần đánh bay bụng bia</p>

      <form onSubmit={submit} className="flex flex-col gap-4">
        {mode === 'register' && (
          <input
            className="input"
            placeholder="Tên của bạn"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        )}
        <input
          className="input"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          className="input"
          type="password"
          placeholder="Mật khẩu"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-brand text-white font-bold py-3 rounded-xl disabled:opacity-50"
        >
          {loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
        </button>
      </form>

      <button
        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        className="mt-4 text-slate-400 text-sm underline text-center"
      >
        {mode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
      </button>
    </div>
  )
}
