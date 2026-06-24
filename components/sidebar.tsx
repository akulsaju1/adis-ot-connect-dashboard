'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { logout } from '@/app/actions/auth'

const navigation = [
  { name: 'Command Center', href: '/command-center', icon: '📊' },
  { name: 'Gate Entrance', href: '/gate-entrance', icon: '🚪' },
  { name: 'Ground Operations', href: '/ground-ops', icon: '📍' },
  { name: 'Student Registry', href: '/student-registry', icon: '📋' },
  { name: 'Staff Directory', href: '/staff-directory', icon: '👥' },
]

export function Sidebar({ userName }: { userName?: string }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 bg-primary text-white flex flex-col border-r border-primary/20 shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <h1 className="text-2xl font-bold text-balance">ADIS</h1>
        <p className="text-sm text-white/70 mt-1">OT-Connect</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-white/15 border-l-4 border-accent'
                  : 'hover:bg-white/5 border-l-4 border-transparent'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-white/10 space-y-3">
        {userName && (
          <div className="px-4 py-2 bg-white/10 rounded-lg">
            <p className="text-xs text-white/70">Logged in as</p>
            <p className="text-sm font-semibold truncate">{userName}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-destructive/20 hover:bg-destructive/30 text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
