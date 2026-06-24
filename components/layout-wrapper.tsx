'use client'

import { ReactNode } from 'react'
import { Sidebar } from './sidebar'

interface LayoutWrapperProps {
  children: ReactNode
  userName?: string
}

export function LayoutWrapper({ children, userName }: LayoutWrapperProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar userName={userName} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
