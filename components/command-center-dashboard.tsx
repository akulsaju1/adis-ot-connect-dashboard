'use client'

import { useState, useEffect, useRef } from 'react'
import { getAllDismissals, getDismissalStats, scanNfcAtGate } from '@/app/actions/dismissal'
import { generateCSV, downloadCSV } from '@/lib/csv-utils'
import { AlertCircle, Wifi, WifiOff, Radio, CheckCircle2, Clock, Users, TrendingUp, Download, Activity, ScanFace } from 'lucide-react'

interface Dismissal {
  id: number
  studentId: string
  studentName: string
  class: string
  block: string
  status: string
  parentName: string
  pickupMethod: string
  nfcScanTime: Date | null
  gateScanTime: Date | null
  groundOpsTime: Date | null
  finalDismissalTime: Date | null
  event?: 'student_at_gate' | 'parent_arrived' | 'student_left'
}

interface Stats {
  total: number
  waiting: number
  at_gate: number
  in_queue: number
  parent_arrived: number
  completed: number
}

export function CommandCenterDashboard() {
  const [dismissals, setDismissals] = useState<Dismissal[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [nfcEnabled, setNfcEnabled] = useState(false)
  const [nfcStatus, setNfcStatus] = useState('Initializing NFC...')
  const readerRef = useRef<any>(null)
  const [lastScannedCode, setLastScannedCode] = useState('')

  // Load data with real-time polling
  useEffect(() => {
    async function loadData() {
      try {
        const [allDismissals, currentStats] = await Promise.all([
          getAllDismissals(),
          getDismissalStats(),
        ])
        setDismissals(allDismissals as Dismissal[])
        setStats(currentStats)
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    // Load immediately
    loadData()
    
    // Poll every 5 seconds for real-time updates
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [])

  // Initialize NFC Reader
  useEffect(() => {
    async function initNFC() {
      if (!('NDEFReader' in window)) {
        setNfcStatus('NFC not supported on this device')
        return
      }

      try {
        const reader = new (window as any).NDEFReader()
        readerRef.current = reader

        reader.onreading = async (event: any) => {
          const message = event.message
          let nfcCode = ''

          for (const record of message.records) {
            if (record.recordType === 'text') {
              const textDecoder = new TextDecoder()
              nfcCode = textDecoder.decode(record.data)
              break
            }
          }

          if (nfcCode && nfcCode !== lastScannedCode) {
            setLastScannedCode(nfcCode)
            setNfcStatus(`Scanned: ${nfcCode}`)

            try {
              const result = await scanNfcAtGate(nfcCode)
              if (!result.ok) {
                setNfcStatus(`Error: ${result.error}`)
                setTimeout(() => setLastScannedCode(''), 500)
                return
              }
              if (result.event === 'parent_arrived') {
                setNfcStatus(`✓ Parent arrived: ${result.studentName}`)
              } else if (result.event === 'student_left') {
                setNfcStatus(`✓ Student left: ${result.studentName}`)
              } else {
                setNfcStatus(`✓ Student at gate: ${result.studentName}`)
              }
              
              // Reload data
              const [allDismissals, currentStats] = await Promise.all([
                getAllDismissals(),
                getDismissalStats(),
              ])
              setDismissals(allDismissals as Dismissal[])
              setStats(currentStats)

              setTimeout(() => setLastScannedCode(''), 500)
            } catch (error: any) {
              setNfcStatus('Error: scan failed, please try again.')
            }
          }
        }

        reader.onerror = (error: any) => {
          console.error('NFC error:', error)
          setNfcStatus(`NFC Error: ${error.message}`)
        }

        await reader.scan()
        setNfcEnabled(true)
        setNfcStatus('NFC Reader Active - Scanning...')
      } catch (error: any) {
        console.error('NFC initialization failed:', error)
        setNfcStatus(`NFC not available: ${error.message}`)
      }
    }

    initNFC()
  }, [lastScannedCode])

  const handleExportDismissals = () => {
    const headers = [
      'Student Name',
      'Class',
      'Block',
      'Parent',
      'Pickup Method',
      'Status',
      'Gate Scan Time',
      'Ground Ops Time',
      'Final Dismissal Time',
    ]
    const rows = dismissals.map((d) => [
      d.studentName,
      d.class,
      d.block,
      d.parentName || '',
      d.pickupMethod,
      d.status.replace('_', ' '),
      d.gateScanTime ? new Date(d.gateScanTime).toLocaleString('en-US') : '',
      d.groundOpsTime ? new Date(d.groundOpsTime).toLocaleString('en-US') : '',
      d.finalDismissalTime ? new Date(d.finalDismissalTime).toLocaleString('en-US') : '',
    ])
    const csv = generateCSV(headers, rows)
    const date = new Date().toISOString().split('T')[0]
    downloadCSV(`dismissals-${date}.csv`, csv)
  }

  const statusColors: Record<string, string> = {
    waiting: 'bg-amber-100 text-amber-900 border-amber-300',
    at_gate: 'bg-sky-100 text-sky-900 border-sky-300',
    in_queue: 'bg-blue-100 text-blue-900 border-blue-300',
    parent_arrived: 'bg-purple-100 text-purple-900 border-purple-300',
    completed: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  }

  const statusIcons: Record<string, any> = {
    waiting: <Clock className="w-4 h-4" />,
    at_gate: <Radio className="w-4 h-4" />,
    in_queue: <Users className="w-4 h-4" />,
    parent_arrived: <TrendingUp className="w-4 h-4" />,
    completed: <CheckCircle2 className="w-4 h-4" />,
  }

  return (
    <div className="flex-1 overflow-auto p-6 sm:p-8 space-y-6 lg:space-y-8">
      <div className="rounded-[2rem] border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              <Activity className="h-3.5 w-3.5" /> Live operations
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Command Center</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Real-time student dismissal monitoring and NFC gate tracking.
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/80 px-4 py-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Operational status</p>
            <p className="mt-1">Updated every 5 seconds</p>
          </div>
        </div>
      </div>

      <div className={`rounded-[1.5rem] border p-6 shadow-sm ${nfcEnabled ? 'border-emerald-200 bg-emerald-50/70' : 'border-amber-200 bg-amber-50/70'}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className={`grid h-12 w-12 place-items-center rounded-2xl ${nfcEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {nfcEnabled ? <Wifi className="h-5 w-5 animate-pulse" /> : <WifiOff className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">{nfcEnabled ? 'NFC Reader Active' : 'NFC Initializing'}</p>
              <p className="text-sm text-muted-foreground">{nfcStatus}</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            <ScanFace className="h-4 w-4 text-primary" />
            Ready for scans
          </div>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Total</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-amber-200/70 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-amber-900">Waiting</p>
            <p className="mt-2 text-3xl font-semibold text-amber-600">{stats.waiting}</p>
          </div>
          <div className="rounded-2xl border border-sky-200/70 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-sky-900">At Gate</p>
            <p className="mt-2 text-3xl font-semibold text-sky-600">{stats.at_gate}</p>
          </div>
          <div className="rounded-2xl border border-blue-200/70 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-blue-900">In Queue</p>
            <p className="mt-2 text-3xl font-semibold text-blue-600">{stats.in_queue}</p>
          </div>
          <div className="rounded-2xl border border-purple-200/70 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-purple-900">Parent Arrived</p>
            <p className="mt-2 text-3xl font-semibold text-purple-600">{stats.parent_arrived}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200/70 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-emerald-900">Completed</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-600">{stats.completed}</p>
          </div>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-emerald-200/70 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
            <p className="text-sm font-medium text-emerald-900">Completion Rate</p>
            <p className="mt-2 text-4xl font-semibold text-emerald-600">
              {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
            </p>
            <p className="text-xs text-emerald-700 mt-2">{stats.completed} of {stats.total} completed</p>
          </div>
          <div className="rounded-[1.5rem] border border-sky-200/70 bg-gradient-to-br from-sky-50 to-white p-6 shadow-sm">
            <p className="text-sm font-medium text-sky-900">Average Processing Time</p>
            <p className="mt-2 text-4xl font-semibold text-sky-600">
              {dismissals.length > 0
                ? Math.round(
                    dismissals
                      .filter(d => d.finalDismissalTime && d.nfcScanTime)
                      .reduce((acc, d) => {
                        const time = new Date(d.finalDismissalTime!).getTime() - new Date(d.nfcScanTime!).getTime()
                        return acc + time
                      }, 0) / Math.max(dismissals.filter(d => d.finalDismissalTime && d.nfcScanTime).length, 1) / 1000 / 60
                  )
                : 0}
              m
            </p>
            <p className="text-xs text-sky-700 mt-2">from scan to dismissal</p>
          </div>
            <div className="rounded-[1.5rem] border border-amber-200/70 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm">
            <p className="text-sm font-medium text-amber-900">Pending Actions</p>
              <p className="mt-2 text-4xl font-semibold text-amber-600">
              {stats.waiting + stats.at_gate + stats.in_queue}
            </p>
            <p className="text-xs text-amber-700 mt-2">students waiting or in queue</p>
          </div>
        </div>
      )}

        <div className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-border/60 p-6">
          <div>
              <h3 className="text-xl font-semibold text-foreground">Live Dismissal Log</h3>
              <p className="mt-1 text-sm text-muted-foreground">Recent scanning and dismissal events</p>
          </div>
          <button
            onClick={handleExportDismissals}
            disabled={dismissals.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading dismissal data...</div>
          ) : dismissals.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No dismissals yet</div>
          ) : (
            <table className="w-full">
                <thead className="bg-muted/50 border-b border-border/60">
                  <tr className="text-left text-sm font-medium text-foreground">
                  <th className="px-6 py-3">Student Name</th>
                  <th className="px-6 py-3">Class</th>
                  <th className="px-6 py-3">Block</th>
                  <th className="px-6 py-3">Parent</th>
                  <th className="px-6 py-3">Pickup Method</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Gate Scan Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {dismissals.slice(0, 20).map((dismissal) => (
                  <tr key={dismissal.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-3 font-medium">{dismissal.studentName}</td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">{dismissal.class}</td>
                    <td className="px-6 py-3 text-sm">
                      <span className="inline-flex px-2 py-1 rounded text-xs font-semibold bg-primary/10 text-primary">
                        {dismissal.block}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">{dismissal.parentName || '—'}</td>
                    <td className="px-6 py-3 text-sm text-muted-foreground capitalize">{dismissal.pickupMethod}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[dismissal.status] || 'bg-gray-100'}`}>
                        {statusIcons[dismissal.status]}
                        {dismissal.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">
                      {dismissal.gateScanTime
                        ? new Date(dismissal.gateScanTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
