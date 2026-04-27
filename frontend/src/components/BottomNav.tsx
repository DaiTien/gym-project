import { NavLink } from 'react-router-dom'

const links = [
  { to: '/',          label: 'Home',     icon: '🏠' },
  { to: '/progress',  label: 'Tiến độ',  icon: '📈' },
  { to: '/lifestyle', label: 'Lối sống', icon: '👟' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-slate-800 border-t border-slate-700 flex">
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-3 text-xs gap-1 transition-colors ${
              isActive ? 'text-brand' : 'text-slate-400'
            }`
          }
        >
          <span className="text-xl">{l.icon}</span>
          {l.label}
        </NavLink>
      ))}
    </nav>
  )
}
