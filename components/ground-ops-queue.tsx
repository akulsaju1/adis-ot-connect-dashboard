'use client'

import { useState, useEffect } from 'react'
import { getDismissalsByStatus, updateDismissalStatus } from '@/app/actions/dismissal'
import { CheckCircle2, Clock, Users } from 'lucide-react'

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
}

export function GroundOpsQueue() {
  const [queue, setQueue] = useState<Dismissal[]>([])
  const [completed, setCompleted] = useState<Dismissal[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null)

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

  return (
    <div className="flex-1 overflow-auto p-8 space-y-8">
      <div>
        <h2 className="text-4xl font-bold text-primary mb-2">Ground Operations</h2>
        <p className="text-muted-foreground">Manage student dismissal queue by holding area and verify parent arrivals</p>
      </div>

      {/* Block Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedBlock(null)}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
            selectedBlock === null
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Blocks ({queue.length})
        </button>
        {BLOCKS.map((block) => (
          <button
            key={block}
            onClick={() => setSelectedBlock(block)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
              selectedBlock === block
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {block} ({queueByBlock[block].length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Queue Card */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-primary/10 shadow-sm">
          <div className="p-6 border-b border-primary/5 bg-gradient-to-r from-sky-50 to-blue-50">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-primary" />
              <div>
                <h3 className="text-xl font-bold text-primary">Current Queue</h3>
                <p className="text-sm text-muted-foreground mt-1">{queue.length} students waiting</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-primary/5 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading queue...</div>
            ) : queue.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Queue is empty</div>
            ) : (
              queue.map((item) => (
                <div key={item.id} className="p-4 hover:bg-primary/2 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-lg">{item.studentName}</p>
                      <p className="text-sm text-muted-foreground">{item.class} | {item.block}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${item.pickupMethod === 'walk' ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'}`}>
                      {item.pickupMethod.charAt(0).toUpperCase() + item.pickupMethod.slice(1)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleParentArrived(item.id)}
                      className="flex-1 px-3 py-2 bg-amber-100 text-amber-900 hover:bg-amber-200 rounded font-medium text-sm transition"
                    >
                      Parent Arrived
                    </button>
                    <button
                      onClick={() => handleDismissed(item.id)}
                      className="flex-1 px-3 py-2 bg-emerald-100 text-emerald-900 hover:bg-emerald-200 rounded font-medium text-sm transition"
                    >
                      Dismissed
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Completed Card */}
        <div className="bg-white rounded-lg border border-primary/10 shadow-sm">
          <div className="p-6 border-b border-primary/5 bg-gradient-to-r from-emerald-50 to-green-50">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <div>
                <h3 className="text-lg font-bold text-emerald-900">Completed Today</h3>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{completed.length}</p>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
            {completed.slice(0, 10).map((item) => (
              <div key={item.id} className="text-sm pb-2 border-b border-primary/5 last:border-b-0">
                <p className="font-semibold">{item.studentName}</p>
                <p className="text-xs text-muted-foreground">{item.class}</p>
              </div>
            ))}
            {completed.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No dismissals yet</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
