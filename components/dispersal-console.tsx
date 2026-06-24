'use client'

import { useState, useEffect, useRef } from 'react'
import {
  startDispersalSession,
  endDispersalSession,
  pickupStudentInSession,
  undoPickup,
  getPickupLogsForSession,
  getActiveSessionForGroup,
  type DispersalGroupId,
} from '@/app/actions/dispersal'
import { Play, Square, Trash2, AlertCircle, CheckCircle2, Radio, Wifi, WifiOff } from 'lucide-react'

interface PickupLogUI {
  id: string
  studentName: string
  grNumber: string | null
  class: string
  pickedUpAt: string
}

interface SessionState {
  groupId: DispersalGroupId
  sessionId: string | null
  isActive: boolean
  pickups: PickupLogUI[]
  loading: boolean
}

const GROUPS: DispersalGroupId[] = ['KG', 'G1-12', 'B1-12']

export function DispersalConsole() {
  const [sessions, setSessions] = useState<Record<DispersalGroupId, SessionState>>({
    KG: { groupId: 'KG', sessionId: null, isActive: false, pickups: [], loading: true },
    'G1-12': { groupId: 'G1-12', sessionId: null, isActive: false, pickups: [], loading: true },
    'B1-12': { groupId: 'B1-12', sessionId: null, isActive: false, pickups: [], loading: true },
  })

  const [nfcEnabled, setNfcEnabled] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const [manualNfc, setManualNfc] = useState('')
  const readerRef = useRef<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedGroup, setSelectedGroup] = useState<DispersalGroupId | null>(null)

  // Fix nfcStatus to properly reflect enabled/disabled state
  const nfcStatusDisplay = nfcEnabled ? 'NFC Ready' : 'NFC Not Available'

  // Load active sessions on mount
  useEffect(() => {
    async function loadSessions() {
      for (const groupId of GROUPS) {
        const result = await getActiveSessionForGroup(groupId)
        if (result.ok && result.session) {
          setSessions((prev) => ({
            ...prev,
            [groupId]: {
              ...prev[groupId],
              sessionId: result.session!.id,
              isActive: true,
              loading: false,
            },
          }))

          // Load pickups for this session
          const pickupsResult = await getPickupLogsForSession(result.session.id)
          if (pickupsResult.ok) {
            setSessions((prev) => ({
              ...prev,
              [groupId]: {
                ...prev[groupId],
                pickups: pickupsResult.logs.map((log: any) => ({
                  id: log.id,
                  studentName: log.studentName,
                  grNumber: log.grNumber,
                  class: log.class,
                  pickedUpAt: log.pickedUpAt,
                })),
              },
            }))
          }
        } else {
          setSessions((prev) => ({
            ...prev,
            [groupId]: { ...prev[groupId], loading: false },
          }))
        }
      }
    }
    loadSessions()
  }, [])

  // Initialize NFC Reader
  useEffect(() => {
    async function initNfc() {
      if (typeof window === 'undefined' || !('NDEFReader' in window)) {
        setNfcEnabled(false)
        return
      }

      try {
        const reader = new (window as any).NDEFReader()
        readerRef.current = reader
        setNfcEnabled(true)

        reader.addEventListener('reading', ({ message }: any) => {
          if (message?.records?.length > 0) {
            const textRecord = message.records.find((r: any) => r.recordType === 'text')
            if (textRecord) {
              const decoder = new TextDecoder()
              const code = decoder.decode(textRecord.data)
              handleNfcScan(code)
            }
          }
        })

        reader.addEventListener('error', () => {
          // Error during scan - not critical
        })
      } catch {
        // NFC reader unavailable
      }
    }

    initNfc()
  }, [])

  const handleStartDispersalSession = async (groupId: DispersalGroupId) => {
    try {
      const result = await startDispersalSession(groupId)
      if (result.ok && result.sessionId) {
        setSessions((prev) => ({
          ...prev,
          [groupId]: {
            ...prev[groupId],
            sessionId: result.sessionId!,
            isActive: true,
            pickups: [],
          },
        }))
        setMessage(`Dispersal started for ${groupId}`)
        setMessageType('success')
        setSelectedGroup(groupId)
      } else if (!result.ok) {
        setMessage(result.error || 'Failed to start dispersal')
        setMessageType('error')
      }
      setTimeout(() => setMessage(''), 3000)
    } catch (error: any) {
      setMessage('Error starting dispersal')
      setMessageType('error')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleEndDispersalSession = async (groupId: DispersalGroupId) => {
    const sessionId = sessions[groupId].sessionId
    if (!sessionId) return

    try {
      const result = await endDispersalSession(sessionId)
      if (result.ok) {
        setSessions((prev) => ({
          ...prev,
          [groupId]: {
            ...prev[groupId],
            sessionId: null,
            isActive: false,
          },
        }))
        setMessage(`Dispersal ended for ${groupId}`)
        setMessageType('success')
        setSelectedGroup(null)
      } else if (!result.ok) {
        setMessage(result.error || 'Failed to end dispersal')
        setMessageType('error')
      }
      setTimeout(() => setMessage(''), 3000)
    } catch (error: any) {
      setMessage('Error ending dispersal')
      setMessageType('error')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleNfcScan = async (nfcCode: string) => {
    if (!selectedGroup) {
      setMessage('Please select a group first')
      setMessageType('error')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    const sessionId = sessions[selectedGroup].sessionId
    if (!sessionId) {
      setMessage('No active dispersal session')
      setMessageType('error')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    try {
      const result = await pickupStudentInSession(nfcCode, sessionId, selectedGroup)
      if (result.ok && result.pickupId) {
        // Refresh pickups
        const pickupsResult = await getPickupLogsForSession(sessionId)
        if (pickupsResult.ok) {
          setSessions((prev) => ({
            ...prev,
            [selectedGroup]: {
              ...prev[selectedGroup],
              pickups: pickupsResult.logs.map((log: any) => ({
                id: log.id,
                studentName: log.studentName,
                grNumber: log.grNumber,
                class: log.class,
                pickedUpAt: log.pickedUpAt,
              })),
            },
          }))
        }
        setMessage(result.message || 'Student picked up')
        setMessageType('success')
      } else if (!result.ok) {
        setMessage(result.error || 'Pickup failed')
        setMessageType('error')
      }
      setManualNfc('')
      if (inputRef.current) inputRef.current.focus()
      setTimeout(() => setMessage(''), 3000)
    } catch (error: any) {
      setMessage('Pickup error. Please try again.')
      setMessageType('error')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleUndoPickup = async (groupId: DispersalGroupId, pickupId: string) => {
    const sessionId = sessions[groupId].sessionId
    if (!sessionId) return

    try {
      const result = await undoPickup(pickupId, sessionId)
      if (result.ok) {
        // Refresh pickups
        const pickupsResult = await getPickupLogsForSession(sessionId)
        if (pickupsResult.ok) {
          setSessions((prev) => ({
            ...prev,
            [groupId]: {
              ...prev[groupId],
              pickups: pickupsResult.logs.map((log: any) => ({
                id: log.id,
                studentName: log.studentName,
                grNumber: log.grNumber,
                class: log.class,
                pickedUpAt: log.pickedUpAt,
              })),
            },
          }))
        }
        setMessage('Pickup removed')
        setMessageType('success')
      } else if (!result.ok) {
        setMessage(result.error || 'Failed to remove pickup')
        setMessageType('error')
      }
      setTimeout(() => setMessage(''), 3000)
    } catch (error: any) {
      setMessage('Error removing pickup')
      setMessageType('error')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const nfcStatus = nfcEnabled ? 'NFC Ready' : 'NFC Not Available'

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dispersal Console</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage student pickups by grade group</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
            {nfcEnabled ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-700">{nfcStatusDisplay}</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{nfcStatusDisplay}</span>
              </>
            )}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 flex items-center gap-3 rounded-lg border px-4 py-3 ${
              messageType === 'success'
                ? 'border-green-200 bg-green-50 text-green-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {messageType === 'success' ? (
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
            )}
            <p className="text-sm font-medium">{message}</p>
          </div>
        )}

        {/* Group Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {GROUPS.map((groupId) => {
            const session = sessions[groupId]
            const isSelected = selectedGroup === groupId
            const isActive = session.isActive

            return (
              <div
                key={groupId}
                className={`rounded-lg border-2 p-4 transition ${
                  isActive ? 'border-primary bg-primary/5' : 'border-border bg-background'
                } ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
              >
                {/* Group Header */}
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">{groupId}</h2>
                  {isActive && (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      Active
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mb-4 flex gap-2">
                  {!isActive ? (
                    <button
                      onClick={() => handleStartDispersalSession(groupId)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
                    >
                      <Play className="h-4 w-4" />
                      Start
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEndDispersalSession(groupId)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 transition"
                    >
                      <Square className="h-4 w-4" />
                      End
                    </button>
                  )}
                  {isActive && (
                    <button
                      onClick={() => setSelectedGroup(isSelected ? null : groupId)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-foreground hover:border-primary'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Select'}
                    </button>
                  )}
                </div>

                {/* Pickup List */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Pickups ({session.pickups.length})
                  </p>
                  {session.pickups.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">No pickups yet</p>
                  ) : (
                    <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg bg-muted/50 p-2">
                      {session.pickups.map((pickup) => (
                        <div
                          key={pickup.id}
                          className="flex items-center justify-between gap-2 rounded border border-border bg-background p-2 text-sm"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate text-foreground">{pickup.studentName}</p>
                            <p className="text-xs text-muted-foreground">
                              {pickup.grNumber || 'N/A'} • {pickup.class}
                            </p>
                          </div>
                          <button
                            onClick={() => handleUndoPickup(groupId, pickup.id)}
                            className="flex-shrink-0 rounded p-1 hover:bg-red-100 text-red-600 transition"
                            title="Remove pickup (Admin override)"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* NFC Input */}
        {selectedGroup && sessions[selectedGroup].isActive && (
          <div className="mt-6 rounded-lg border border-border bg-background p-4">
            <label className="block text-sm font-semibold text-foreground mb-2">Manual NFC Code Entry</label>
            <input
              ref={inputRef}
              type="text"
              value={manualNfc}
              onChange={(e) => setManualNfc(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && manualNfc.trim()) {
                  handleNfcScan(manualNfc)
                }
              }}
              placeholder="Enter NFC code and press Enter"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
          </div>
        )}
      </div>
    </div>
  )
}
