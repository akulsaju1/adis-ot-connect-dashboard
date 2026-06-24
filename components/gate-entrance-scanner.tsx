'use client'

import { useState, useEffect, useRef } from 'react'
import { scanNfcAtGate, getDismissalsByStatus } from '@/app/actions/dismissal'
import { Wifi, WifiOff, Radio, AlertCircle, CheckCircle2, ScanFace, Users, BadgeInfo } from 'lucide-react'

interface Dismissal {
  id: number
  studentId: string
  studentName: string
  class: string
  block: string
  status: string
  gateScanTime: Date | null
  parentName?: string
  event?: 'student_at_gate' | 'parent_arrived' | 'student_left'
}

interface SiblingGroup {
  parentName: string
  siblings: Dismissal[]
}

export function GateEntranceScanner() {
  const [recentScans, setRecentScans] = useState<Dismissal[]>([])
  const [siblingGroups, setSiblingGroups] = useState<SiblingGroup[]>([])
  const [nfcEnabled, setNfcEnabled] = useState(false)
  const [nfcStatus, setNfcStatus] = useState('Initializing NFC...')
  const [manualNfc, setManualNfc] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const readerRef = useRef<any>(null)
  const [lastScannedCode, setLastScannedCode] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Load recent scans and detect sibling groups
  useEffect(() => {
    async function loadScans() {
      try {
        const scans = await getDismissalsByStatus('at_gate')
        setRecentScans(scans as Dismissal[])
        
        // Detect sibling groups (students with same parent in last 30 seconds)
        const now = Date.now()
        const groups: Record<string, Dismissal[]> = {}
        
        (scans as Dismissal[]).forEach(scan => {
          if (scan.parentName) {
            const scanTime = new Date(scan.gateScanTime!).getTime()
            if (now - scanTime < 30000) { // Within last 30 seconds
              if (!groups[scan.parentName]) {
                groups[scan.parentName] = []
              }
              groups[scan.parentName].push(scan)
            }
          }
        })
        
        // Only show groups with 2+ siblings
        const filteredGroups = Object.entries(groups)
          .filter(([_, students]) => students.length > 1)
          .map(([parentName, siblings]) => ({ parentName, siblings }))
        
        setSiblingGroups(filteredGroups)
      } catch (error) {
        console.error('Failed to load scans:', error)
      }
    }
    loadScans()
    const interval = setInterval(loadScans, 5000) // Refresh every 5 seconds
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
            await handleNfcScan(nfcCode)
            setLastScannedCode(nfcCode)
            setTimeout(() => setLastScannedCode(''), 500)
          }
        }

        reader.onerror = (error: any) => {
          console.error('NFC error:', error)
          setNfcStatus(`NFC Error: ${error.message}`)
        }

        await reader.scan()
        setNfcEnabled(true)
        setNfcStatus('NFC Reader Active - Ready to scan')
      } catch (error: any) {
        console.error('NFC initialization failed:', error)
        setNfcStatus(`NFC not available: ${error.message}`)
      }
    }

    initNFC()
  }, [lastScannedCode])

  const handleNfcScan = async (nfcCode: string) => {
    try {
      const result = await scanNfcAtGate(nfcCode)
      if (result.event === 'parent_arrived') {
        setMessage(`✓ Parent arrived: ${result.studentName} (${result.class})`)
      } else if (result.event === 'student_left') {
        setMessage(`✓ Student left campus: ${result.studentName} (${result.class})`)
      } else {
        setMessage(`✓ Student at gate: ${result.studentName} (${result.class})`)
      }
      setMessageType('success')
      
      // Reload recent scans
      const scans = await getDismissalsByStatus('at_gate')
      setRecentScans(scans as Dismissal[])

      setTimeout(() => setMessage(''), 3000)
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
      setMessageType('error')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleManualInput = async () => {
    if (!manualNfc.trim()) return
    await handleNfcScan(manualNfc)
    setManualNfc('')
    inputRef.current?.focus()
  }

  return (
    <div className="flex-1 overflow-auto p-6 sm:p-8 space-y-6 lg:space-y-8">
      <div className="rounded-[2rem] border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Gate operations</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Gate Entrance Scanner</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              NFC-based student arrival scanning at the main gate.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-4 py-2 text-sm text-muted-foreground">
            <ScanFace className="h-4 w-4 text-primary" />
            Fast arrival intake
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
            <BadgeInfo className="h-4 w-4 text-primary" />
            {nfcEnabled ? 'Ready to scan' : 'Waiting for reader'}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[1.5rem] border border-border/60 bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Manual NFC Code Entry</h3>
              <p className="text-sm text-muted-foreground">Student tap: arrive. Next tap: parent arrived. Next tap: student left.</p>
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={manualNfc}
              onChange={(e) => setManualNfc(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleManualInput()}
              placeholder="Enter NFC code or scan here..."
              className="h-11 flex-1 rounded-xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
            <button
              onClick={handleManualInput}
              className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              Scan
            </button>
          </div>
        </div>

        {message && (
          <div className={`rounded-[1.5rem] border p-4 flex items-center gap-3 ${messageType === 'success' ? 'border-emerald-200 bg-emerald-50/70' : 'border-red-200 bg-red-50/70'}`}>
            {messageType === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertCircle className="h-5 w-5 text-red-600" />}
            <p className={`font-medium ${messageType === 'success' ? 'text-emerald-900' : 'text-red-900'}`}>{message}</p>
          </div>
        )}
      </div>

      {siblingGroups.length > 0 && (
        <div className="rounded-[1.5rem] border border-blue-200/70 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm">
          <h3 className="font-semibold text-blue-950">Sibling Groups Detected</h3>
          <div className="mt-4 space-y-3">
            {siblingGroups.map((group, idx) => (
              <div key={idx} className="rounded-2xl border border-blue-200 bg-white p-4">
                <p className="font-medium text-blue-950">{group.parentName}&apos;s children</p>
                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                  {group.siblings.map((sibling) => (
                    <div key={sibling.id} className="rounded-xl bg-blue-50 p-3 text-sm">
                      <p className="font-medium text-blue-950">{sibling.studentName}</p>
                      <p className="text-xs text-blue-700/80">{sibling.class} ({sibling.block})</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/60 p-6">
          <h3 className="text-xl font-semibold text-foreground">Students at Gate</h3>
          <p className="mt-1 text-sm text-muted-foreground">Recently scanned students awaiting ground operations.</p>
        </div>

        <div className="overflow-x-auto">
          {recentScans.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No students at gate yet</div>
          ) : (
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border/60">
                <tr className="text-left text-sm font-medium text-foreground">
                  <th className="px-6 py-3">Student Name</th>
                  <th className="px-6 py-3">Class</th>
                  <th className="px-6 py-3">Block</th>
                  <th className="px-6 py-3">Scan Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {recentScans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-3 font-medium">{scan.studentName}</td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">{scan.class}</td>
                    <td className="px-6 py-3 text-sm">
                      <span className="inline-flex rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        {scan.block}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">
                      {scan.gateScanTime
                        ? new Date(scan.gateScanTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
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
