'use client'

import { useState, useEffect, useRef } from 'react'
import { scanNfcAtGate, getDismissalsByStatus } from '@/app/actions/dismissal'
import { Wifi, WifiOff, Radio, AlertCircle, CheckCircle2 } from 'lucide-react'

interface Dismissal {
  id: number
  studentId: string
  studentName: string
  class: string
  block: string
  status: string
  gateScanTime: Date | null
  parentName?: string
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
      setMessage(`✓ Student at gate: ${result.studentName} (${result.class})`)
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
    <div className="flex-1 overflow-auto p-8 space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-4xl font-bold text-primary mb-2">Gate Entrance Scanner</h2>
        <p className="text-muted-foreground">NFC-based student arrival scanning at main gate</p>
      </div>

      {/* NFC Status */}
      <div className={`rounded-lg border-2 p-6 ${nfcEnabled ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {nfcEnabled ? <Wifi className="w-6 h-6 text-emerald-600 animate-pulse" /> : <WifiOff className="w-6 h-6 text-amber-600" />}
            <div>
              <p className="font-semibold text-lg">{nfcEnabled ? 'NFC Reader Active' : 'NFC Initializing'}</p>
              <p className="text-sm text-muted-foreground">{nfcStatus}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Entry Fallback */}
      <div className="bg-white rounded-lg border border-primary/10 shadow-sm p-6">
        <h3 className="font-semibold text-primary mb-4">Manual NFC Code Entry (Fallback)</h3>
        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={manualNfc}
            onChange={(e) => setManualNfc(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleManualInput()}
            placeholder="Enter NFC code or scan here..."
            className="flex-1 px-4 py-2 border border-primary/20 rounded-lg focus:outline-none focus:border-primary"
          />
          <button
            onClick={handleManualInput}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-semibold"
          >
            Scan
          </button>
        </div>
      </div>

      {/* Last Scan Message */}
      {message && (
        <div className={`rounded-lg border-2 p-4 flex items-center gap-3 ${messageType === 'success' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          {messageType === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
          <p className={`font-semibold ${messageType === 'success' ? 'text-emerald-900' : 'text-red-900'}`}>{message}</p>
        </div>
      )}

      {/* Sibling Groups Alert */}
      {siblingGroups.length > 0 && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-4">Sibling Groups Detected</h3>
          <div className="space-y-3">
            {siblingGroups.map((group, idx) => (
              <div key={idx} className="bg-white rounded p-4 border border-blue-200">
                <p className="font-semibold text-blue-900 mb-2">{group.parentName}'s Children:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {group.siblings.map((sibling) => (
                    <div key={sibling.id} className="text-sm bg-blue-50 p-2 rounded">
                      <p className="font-medium">{sibling.studentName}</p>
                      <p className="text-xs text-muted-foreground">{sibling.class} ({sibling.block})</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Scans */}
      <div className="bg-white rounded-lg border border-primary/10 shadow-sm">
        <div className="p-6 border-b border-primary/5">
          <h3 className="text-xl font-bold text-primary">Students at Gate</h3>
          <p className="text-sm text-muted-foreground mt-1">Recently scanned students awaiting ground operations</p>
        </div>

        <div className="overflow-x-auto">
          {recentScans.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No students at gate yet</div>
          ) : (
            <table className="w-full">
              <thead className="bg-primary/5 border-b border-primary/10">
                <tr className="text-left text-sm font-semibold text-primary">
                  <th className="px-6 py-3">Student Name</th>
                  <th className="px-6 py-3">Class</th>
                  <th className="px-6 py-3">Block</th>
                  <th className="px-6 py-3">Scan Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {recentScans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-primary/2 transition-colors">
                    <td className="px-6 py-3 font-medium">{scan.studentName}</td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">{scan.class}</td>
                    <td className="px-6 py-3 text-sm">
                      <span className="inline-flex px-2 py-1 rounded text-xs font-semibold bg-primary/10 text-primary">
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
