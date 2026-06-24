'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export interface Dismissal {
  id: number
  studentId: string
  studentName: string
  class: string
  block: string
  status: 'waiting' | 'at_gate' | 'in_queue' | 'parent_arrived' | 'completed'
  parentName: string
  pickupMethod: string
  nfcScanTime: Date | null
  gateScanTime: Date | null
  groundOpsTime: Date | null
  finalDismissalTime: Date | null
}

export interface Student {
  id: number
  name: string
  class: string
  block: string
  nfcTag?: string
  parentName?: string
}

export interface Staff {
  id: number
  name: string
  email: string
  role: 'gate_staff' | 'ground_ops' | 'supervisor'
  block: string
  phone?: string
}

export interface AppStats {
  total: number
  waiting: number
  at_gate: number
  in_queue: number
  parent_arrived: number
  completed: number
}

interface AppContextType {
  // Dismissals
  dismissals: Dismissal[]
  setDismissals: (dismissals: Dismissal[]) => void
  updateDismissal: (id: number, updates: Partial<Dismissal>) => void
  
  // Stats
  stats: AppStats | null
  setStats: (stats: AppStats) => void
  
  // Loading state
  loading: boolean
  setLoading: (loading: boolean) => void
  
  // Error handling
  error: string | null
  setError: (error: string | null) => void
  
  // NFC state
  nfcEnabled: boolean
  setNfcEnabled: (enabled: boolean) => void
  nfcStatus: string
  setNfcStatus: (status: string) => void
  
  // Last scanned code
  lastScannedCode: string
  setLastScannedCode: (code: string) => void
  
  // Refresh functions
  refreshDismissals: () => Promise<void>
  refreshStats: () => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [dismissals, setDismissals] = useState<Dismissal[]>([])
  const [stats, setStats] = useState<AppStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nfcEnabled, setNfcEnabled] = useState(false)
  const [nfcStatus, setNfcStatus] = useState('Initializing NFC...')
  const [lastScannedCode, setLastScannedCode] = useState('')

  const updateDismissal = useCallback((id: number, updates: Partial<Dismissal>) => {
    setDismissals((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
    )
  }, [])

  const refreshDismissals = useCallback(async () => {
    // To be implemented by components that have server action access
    setLoading(false)
  }, [])

  const refreshStats = useCallback(async () => {
    // To be implemented by components that have server action access
    setLoading(false)
  }, [])

  const value: AppContextType = {
    dismissals,
    setDismissals,
    updateDismissal,
    stats,
    setStats,
    loading,
    setLoading,
    error,
    setError,
    nfcEnabled,
    setNfcEnabled,
    nfcStatus,
    setNfcStatus,
    lastScannedCode,
    setLastScannedCode,
    refreshDismissals,
    refreshStats,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}
