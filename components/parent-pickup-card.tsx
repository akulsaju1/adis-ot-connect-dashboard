'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { dismissMultipleChildren } from '@/app/actions/parent'
import { X } from 'lucide-react'

interface ChildWithPhoto {
  id: number
  parentId: number
  studentId: string
  studentName: string
  class: string
  block: string
  nfcCode: string
  photoId: number | null
  isActive: boolean
  createdAt: string
  status: string
  dismissalId: number | null
  photo: string | null
}

interface ParentPickupCardProps {
  parentId: number
  parentName: string
  phone: string | null
  children: ChildWithPhoto[]
  onDismiss: () => void
  onRefresh: () => void
}

export function ParentPickupCard({
  parentId,
  parentName,
  phone,
  children,
  onDismiss,
  onRefresh,
}: ParentPickupCardProps) {
  const [selectedChildren, setSelectedChildren] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSelectChild = (studentId: string) => {
    setSelectedChildren((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    )
  }

  const handleSelectAll = () => {
    if (selectedChildren.length === children.length) {
      setSelectedChildren([])
    } else {
      setSelectedChildren(children.map((c) => c.studentId))
    }
  }

  const handleDismissChildren = async () => {
    if (selectedChildren.length === 0) {
      alert('Please select at least one student')
      return
    }

    setIsProcessing(true)
    try {
      await dismissMultipleChildren(parentId, selectedChildren)
      setSelectedChildren([])
      onRefresh()
    } catch (error) {
      console.error('Failed to dismiss children:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to dismiss children'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-lg">
        {/* Header */}
        <div className="border-b border-border bg-gradient-to-r from-blue-50 to-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">{parentName}</h2>
              {phone && <p className="mt-1 text-sm text-muted-foreground">{phone}</p>}
            </div>
            <button
              onClick={onDismiss}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Children List */}
        <div className="max-h-96 overflow-y-auto">
          {children.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No children awaiting pickup
            </div>
          ) : (
            <div className="space-y-3 p-6">
              {/* Select All */}
              <div className="mb-4 flex items-center gap-3 rounded-lg bg-muted p-3">
                <Checkbox
                  id="select-all"
                  checked={selectedChildren.length === children.length && children.length > 0}
                  indeterminate={
                    selectedChildren.length > 0 && selectedChildren.length < children.length
                  }
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm font-semibold text-foreground">
                  Select All ({children.length})
                </label>
              </div>

              {/* Individual Children */}
              {children.map((child) => (
                <div
                  key={child.studentId}
                  className="flex items-start gap-4 rounded-lg border border-border/40 bg-background p-4 hover:bg-muted/40 transition"
                >
                  {/* Photo */}
                  <div className="h-20 w-20 flex-shrink-0 rounded-lg bg-muted overflow-hidden">
                    {child.photo ? (
                      <img
                        src={child.photo}
                        alt={child.studentName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-100 to-blue-50">
                        <span className="text-2xl font-bold text-blue-600">
                          {child.studentName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground">{child.studentName}</p>
                        <p className="text-sm text-muted-foreground">
                          {child.class} | {child.block}
                        </p>
                      </div>
                      <span
                        className={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${
                          child.status === 'waiting'
                            ? 'bg-yellow-100 text-yellow-800'
                            : child.status === 'at_gate'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {child.status}
                      </span>
                    </div>
                  </div>

                  {/* Checkbox */}
                  <div className="flex h-20 items-center">
                    <Checkbox
                      id={`child-${child.studentId}`}
                      checked={selectedChildren.includes(child.studentId)}
                      onCheckedChange={() => handleSelectChild(child.studentId)}
                      className="h-5 w-5"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-muted/30 p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              {selectedChildren.length} of {children.length} selected
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onDismiss}
                disabled={isProcessing}
              >
                Close
              </Button>
              <Button
                onClick={handleDismissChildren}
                disabled={selectedChildren.length === 0 || isProcessing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isProcessing ? 'Processing...' : 'Complete Pickup'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
