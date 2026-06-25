'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ScanLine, MapPinned, Users, GraduationCap, LogOut, ChevronRight, Lock } from 'lucide-react'
import { logout } from '@/app/actions/auth'
import { logoutStaff } from '@/app/actions/staff-auth'

const adminNavigation = [
  { name: 'Command Center', href: '/command-center', icon: LayoutDashboard },
  { name: 'Gate Entrance', href: '/gate-entrance', icon: ScanLine },
  { name: 'Ground Operations', href: '/ground-ops', icon: MapPinned },
  { name: 'Student Registry', href: '/student-registry', icon: GraduationCap },
  { name: 'Staff Directory', href: '/staff-directory', icon: Users },
  { name: 'Staff Management', href: '/staff-management', icon: Lock },
]

const staffNavigation = [
  { name: 'Staff Portal', href: '/staff-portal', icon: ScanLine },
]

export function Sidebar({ userName, userType }: { userName?: string; userType?: 'admin' | 'staff' }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    if (userType === 'staff') {
      await logoutStaff()
      router.push('/staff-login')
    } else {
      await logout()
      router.push('/login')
    }
    router.refresh()
  }

  const navigation = userType === 'staff' ? staffNavigation : adminNavigation

  return (
    <aside className="w-72 shrink-0 bg-primary/95 text-white flex flex-col border-r border-primary/20 shadow-[0_24px_80px_rgba(15,23,42,0.24)] backdrop-blur">
      <div className="p-6 border-b border-white/10 bg-white/5">
        <div className="mb-4 flex justify-center">
          <img 
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo-1-zoFmQvusRlyZECyVQKBwJ9i9f9aPw7.webp" 
            alt="Abu Dhabi Indian School Logo" 
            className="h-16 w-16 object-contain"
          />
        </div>
        <div>
          <p className="text-center text-[10px] uppercase tracking-[0.35em] text-white/60">{userType === 'staff' ? 'Gate Staff' : 'Campus Operations'}</p>
          <h1 className="text-center text-lg font-semibold text-balance leading-tight">ADIS OT-Connect</h1>
        </div>
        <p className="mt-4 text-sm leading-6 text-white/70">
          {userType === 'staff' ? 'Manage student dispersals and pickups.' : 'Secure dismissal workflow, live tracking, and school-wide coordination.'}
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'bg-white/14 ring-1 ring-white/15 shadow-sm'
                  : 'hover:bg-white/8'
              }`}
            >
              <span className={`grid h-9 w-9 place-items-center rounded-xl transition ${isActive ? 'bg-white text-primary' : 'bg-white/10 text-white/85 group-hover:bg-white/15'}`}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex-1 text-sm font-medium">{item.name}</span>
              <ChevronRight className={`h-4 w-4 transition ${isActive ? 'opacity-100' : 'opacity-30 group-hover:opacity-70'}`} />
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-3 bg-black/10">
        {userName && (
          <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">Logged in as</p>
            <p className="mt-1 text-sm font-medium truncate text-white">{userName}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-white/10 bg-white/8 text-white transition hover:bg-white/12"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Sign out</span>
        </button>
      </div>
    </aside>
  )
}
