'use client'

import { useState, useEffect } from 'react'
import { getDismissalsByStatus, updateDismissalStatus } from '@/app/actions/dismissal'
import { getParentInfo, dismissMultipleChildren } from '@/app/actions/parent'
import { CheckCircle2, Clock, Users, Filter, ClipboardList, X } from 'lucide-react'

interface Dismissal {
  id: number
  studentId: string
  studentName: string
  class: string
  block: string
  parentName: string
  pickupMethod: string
  status: string
  groundOpsTime: Date | null
  nfcCode?: string
}

interface ParentData {
  parent: { id: number; parentName: string; phone: string | null; nfcCode: string }
  children: Array<{ id: number; studentId: string; studentName: string; class: string; block: string; status: string }>
}

export function GroundOpsQueue() {
  const [queue, setQueue] = useState<Dismissal[]>([])
  const [completed, setCompleted] = useState<Dismissal[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null)
  const [selectedParentModal, setSelectedParentModal] = useState<ParentData | null>(null)
  const [selectedChildren, setSelectedChildren] = useState<Set<string>>(new Set())

  const BLOCKS = ['KG', 'Girls Block', 'Boys Block']

  useEffect(() => {
    async function loadData() {
      try {
        const [q, c] = await Promise.all([
          getDismissalsByStatus('at_gate'),
          getDismissalsByStatus('completed'),
        ])
        setQueue((q as Dismissal[]) || [])
        setCompleted((c as Dismissal[]) || [])
      } catch (error) {
        console.error('Failed to load:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [])

  // Get queue filtered by selected block or all if none selected
  const filteredQueue = selectedBlock
    ? queue.filter(d => d.block === selectedBlock)
    : queue

  // Organize queue by block
  const queueByBlock = BLOCKS.reduce((acc, block) => {
    acc[block] = queue.filter(d => d.block === block)
    return acc
  }, {} as Record<string, Dismissal[]>)

  const handleParentArrived = async (id: number) => {
    try {
      await updateDismissalStatus(id, 'parent_arrived', {
        groundOpsTime: new Date(),
      })
      const updated = queue.filter(d => d.id !== id)
      setQueue(updated)
      
      // Reload to get fresh data
      const [q, c] = await Promise.all([
        getDismissalsByStatus('at_gate'),
        getDismissalsByStatus('completed'),
      ])
      setQueue((q as Dismissal[]) || [])
      setCompleted((c as Dismissal[]) || [])
    } catch (error) {
      console.error('Failed to update:', error)
    }
  }

  const handleDismissed = async (id: number) => {
    try {
      await updateDismissalStatus(id, 'completed', {
        finalDismissalTime: new Date(),
      })
      const updated = queue.filter(d => d.id !== id)
      setQueue(updated)

      const [q, c] = await Promise.all([
        getDismissalsByStatus('at_gate'),
        getDismissalsByStatus('completed'),
      ])
      setQueue((q as Dismissal[]) || [])
      setCompleted((c as Dismissal[]) || [])
    } catch (error) {
      console.error('Failed to update:', error)
    }
  }

  const handleParentCardOpen = async (nfcCode: string) => {
    try {
      const parentInfo = await getParentInfo(nfcCode)
      if (parentInfo) {
        setSelectedParentModal(parentInfo)
        setSelectedChildren(new Set())
      }
    } catch (error) {
      console.error('Failed to get parent info:', error)
      alert('Failed to load parent information')
    }
  }

  const handleToggleChild = (studentId: string) => {
    setSelectedChildren(prev => {
      const updated = new Set(prev)
      if (updated.has(studentId)) {
        updated.delete(studentId)
      } else {
        updated.add(studentId)
      }
      return updated
    })
  }

  const handleCompleteDismissal = async () => {
    if (!selectedParentModal || selectedChildren.size === 0) {
      alert('Select at least one child')
      return
    }

    try {
      await dismissMultipleChildren(
        selectedParentModal.parent.id,
        Array.from(selectedChildren)
      )
      setSelectedParentModal(null)
      setSelectedChildren(new Set())
      
      // Reload queue
      const [q, c] = await Promise.all([
        getDismissalsByStatus('at_gate'),
        getDismissalsByStatus('completed'),
      ])
      setQueue((q as Dismissal[]) || [])
      setCompleted((c as Dismissal[]) || [])
    } catch (error) {
      console.error('Failed to dismiss:', error)
      alert('Failed to complete dismissal')
    }
  }

  const handleRefreshQueue = async () => {
    const [q, c] = await Promise.all([
      getDismissalsByStatus('at_gate'),
      getDismissalsByStatus('completed'),
    ])
    setQueue((q as Dismissal[]) || [])
    setCompleted((c as Dismissal[]) || [])
  }

  return (
    <div className="flex-1 overflow-auto p-6 sm:p-8 space-y-6 lg:space-y-8">
      <div className="rounded-[2rem] border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Ground control</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Ground Operations</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Manage the dismissal queue by holding area and verify parent arrivals.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-4 py-2 text-sm text-muted-foreground">
            <ClipboardList className="h-4 w-4 text-primary" />
            Queue management
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-[1.5rem] border border-border/60 bg-card p-3 shadow-sm">
        <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          Filter by block
        </div>
        <button
          onClick={() => setSelectedBlock(null)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            selectedBlock === null
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          All Blocks ({queue.length})
        </button>
        {BLOCKS.map((block) => (
          <button
            key={block}
            onClick={() => setSelectedBlock(block)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              selectedBlock === block
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {block} ({queueByBlock[block].length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 overflow-hidden rounded-[1.75rem] border border-border/60 bg-card shadow-sm">
          <div className="border-b border-border/60 bg-gradient-to-r from-sky-50 to-white p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">Current Queue</h3>
                <p className="mt-1 text-sm text-muted-foreground">{queue.length} students waiting</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-border/60 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading queue...</div>
            ) : queue.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Queue is empty</div>
            ) : (
              queue.map((item) => (
                <div key={item.id} className="p-5 hover:bg-muted/40 transition-colors">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <p className="text-lg font-semibold text-foreground">{item.studentName}</p>
                      <p className="text-sm text-muted-foreground">{item.class} | {item.block}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${item.pickupMethod === 'walk' ? 'bg-emerald-100 text-emerald-900' : item.pickupMethod === 'parent' ? 'bg-blue-100 text-blue-900' : 'bg-amber-100 text-amber-900'}`}>
                      {item.pickupMethod === 'parent' ? 'Parent Pickup' : item.pickupMethod.charAt(0).toUpperCase() + item.pickupMethod.slice(1)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {item.pickupMethod === 'parent' ? (
                      <button
                        onClick={() => handleParentCardOpen(item.nfcCode || item.studentName)}
                        className="flex-1 rounded-xl bg-blue-100 px-3 py-2.5 text-sm font-medium text-blue-900 transition hover:bg-blue-200"
                      >
                        Show Children
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleParentArrived(item.id)}
                          className="flex-1 rounded-xl bg-amber-100 px-3 py-2.5 text-sm font-medium text-amber-900 transition hover:bg-amber-200"
                        >
                          Parent Arrived
                        </button>
                        <button
                          onClick={() => handleDismissed(item.id)}
                          className="flex-1 rounded-xl bg-emerald-100 px-3 py-2.5 text-sm font-medium text-emerald-900 transition hover:bg-emerald-200"
                        >
                          Dismissed
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card shadow-sm">
          <div className="border-b border-border/60 bg-gradient-to-r from-emerald-50 to-white p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Completed Today</h3>
                <p className="mt-1 text-2xl font-semibold text-emerald-600">{completed.length}</p>
              </div>
            </div>
          </div>

          <div className="max-h-80 space-y-2 overflow-y-auto p-4">
            {completed.slice(0, 10).map((item) => (
              <div key={item.id} className="border-b border-border/60 pb-3 last:border-b-0 last:pb-0">
                <p className="text-sm font-medium text-foreground">{item.studentName}</p>
                <p className="text-xs text-muted-foreground">{item.class}</p>
              </div>
            ))}
            {completed.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No dismissals yet</p>}
          </div>
        </div>
      </div>

      {/* Parent Pickup Modal */}
      {selectedParentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            {/* Header */}
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold text-foreground">{selectedParentModal.parent.parentName}</h3>
                {selectedParentModal.parent.phone && (
                  <p className="mt-1 text-sm text-muted-foreground">{selectedParentModal.parent.phone}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedParentModal(null)}
                className="text-muted-foreground transition hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Children List */}
            <div className="mb-6 space-y-3 max-h-64 overflow-y-auto">
              <p className="text-sm font-semibold text-foreground">Select children to pick up:</p>
              {selectedParentModal.children.map((child) => (
                <label key={child.studentId} className="flex items-center gap-3 cursor-pointer rounded-lg border border-border p-3 hover:bg-muted/50 transition">
                  <input
                    type="checkbox"
                    checked={selectedChildren.has(child.studentId)}
                    onChange={() => handleToggleChild(child.studentId)}
                    className="size-4 rounded border-border"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{child.studentName}</p>
                    <p className="text-xs text-muted-foreground">{child.class} | {child.block}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${child.status === 'waiting' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'}`}>
                    {child.status}
                  </span>
                </label>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedParentModal(null)}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteDismissal}
                disabled={selectedChildren.size === 0}
                className="flex-1 rounded-lg bg-emerald-100 px-4 py-2.5 text-sm font-medium text-emerald-900 transition hover:bg-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Dismiss {selectedChildren.size > 0 ? `(${selectedChildren.size})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
