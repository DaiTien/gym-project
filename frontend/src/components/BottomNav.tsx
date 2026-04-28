import { NavLink } from 'react-router-dom'

const links = [
  { to: '/',          label: 'Home',     icon: '🏠' },
  { to: '/progress',  label: 'Tiến độ',  icon: '📈' },
  { to: '/lifestyle', label: 'Lối sống', icon: '👟' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-slate-800/95 backdrop-blur border-t border-slate-700 flex bottom-nav z-50">
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center pt-3 pb-2 text-xs gap-0.5 transition-colors active:scale-95 ${
              isActive ? 'text-brand' : 'text-slate-400'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className={`text-xl transition-transform ${isActive ? 'scale-110' : ''}`}>{l.icon}</span>
              <span className={isActive ? 'font-bold' : ''}>{l.label}</span>
              {isActive && <span className="w-1 h-1 rounded-full bg-brand mt-0.5" />}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
