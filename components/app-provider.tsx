'use client'

import { AppProvider } from '@/lib/context/app-context'
import { ReactNode } from 'react'

export function AppProviderWrapper({ children }: { children: ReactNode }) {
  return <AppProvider>{children}</AppProvider>
}
