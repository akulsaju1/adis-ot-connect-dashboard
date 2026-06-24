'use client'

import { ReactNode } from 'react'
import { Sidebar } from './sidebar'

interface LayoutWrapperProps {
  children: ReactNode
  userName?: string
  userType?: 'admin' | 'staff'
}

export function LayoutWrapper({ children, userName, userType }: LayoutWrapperProps) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar userName={userName} userType={userType} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden rounded-tl-3xl border-l border-border/60 bg-background/80 shadow-[0_0_0_1px_rgba(255,255,255,0.35)_inset] backdrop-blur supports-[backdrop-filter]:bg-background/70">
          {children}
        </div>
      </main>
    </div>
  )
}
