'use client'

import { useState, useEffect } from 'react'
import { getAllStaffMembers, createStaffMember, deactivateStaffMember } from '@/app/actions/staff-auth'
import { Copy, Trash2, Plus } from 'lucide-react'
import type { LocalStaffMember } from '@/lib/local-db'

export function StaffManagementDashboard() {
  const [staff, setStaff] = useState<LocalStaffMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'error' | 'success'>('error')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newStaffName, setNewStaffName] = useState('')
  const [newStaffRole, setNewStaffRole] = useState('gate_staff')
  const [newStaffEmail, setNewStaffEmail] = useState('')
  const [newStaffPhone, setNewStaffPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  // Load staff on mount
  useEffect(() => {
    loadStaff()
  }, [])

  const loadStaff = async () => {
    setIsLoading(true)
    try {
      const staffList = await getAllStaffMembers()
      setStaff(staffList)
    } catch (error: any) {
      setMessage('Failed to load staff')
      setMessageType('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStaffName.trim()) {
      setMessage('Staff name is required')
      setMessageType('error')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createStaffMember(
        newStaffName,
        newStaffRole,
        newStaffEmail || undefined,
        newStaffPhone || undefined
      )

      if (result.ok) {
        setStaff((prev) => [...prev, result.staff])
        setMessage(
          `Staff created! NFC Login: ${result.staff.nfcLoginFormat}`
        )
        setMessageType('success')
        
        // Reset form
        setNewStaffName('')
        setNewStaffRole('gate_staff')
        setNewStaffEmail('')
        setNewStaffPhone('')
        setShowAddForm(false)

        setTimeout(() => setMessage(''), 4000)
      } else {
        setMessage(result.error)
        setMessageType('error')
      }
    } catch (error: any) {
      setMessage('Failed to create staff')
      setMessageType('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeactivate = async (staffId: number, staffName: string) => {
    if (!confirm(`Deactivate ${staffName}?`)) return

    try {
      const result = await deactivateStaffMember(staffId)
      if (result.ok) {
        setStaff((prev) => prev.filter((s) => s.id !== staffId))
        setMessage(`${staffName} deactivated`)
        setMessageType('success')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage(result.error)
        setMessageType('error')
      }
    } catch (error: any) {
      setMessage('Failed to deactivate staff')
      setMessageType('error')
    }
  }

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Staff Management</h1>
          <p className="text-sm text-muted-foreground">Manage gate staff accounts and NFC logins</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Staff
        </button>
      </div>

      {message && (
        <div
          className={`rounded-lg px-4 py-3 ${
            messageType === 'error'
              ? 'border border-red-200 bg-red-50 text-red-700'
              : 'border border-green-200 bg-green-50 text-green-700'
          }`}
        >
          {message}
        </div>
      )}

      {/* Add Staff Form */}
      {showAddForm && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Create New Staff</h2>
          <form onSubmit={handleAddStaff} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground">Name *</label>
                <input
                  type="text"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  disabled={isSubmitting}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground disabled:opacity-50"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Role *</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value)}
                  disabled={isSubmitting}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground disabled:opacity-50"
                >
                  <option value="gate_staff">Gate Staff</option>
                  <option value="ground_ops">Ground Operations</option>
                  <option value="supervisor">Supervisor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Email</label>
                <input
                  type="email"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground disabled:opacity-50"
                  placeholder="Email (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Phone</label>
                <input
                  type="tel"
                  value={newStaffPhone}
                  onChange={(e) => setNewStaffPhone(e.target.value)}
                  disabled={isSubmitting}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground disabled:opacity-50"
                  placeholder="Phone (optional)"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Staff'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                disabled={isSubmitting}
                className="rounded-lg border border-border px-4 py-2 font-medium hover:bg-accent disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff Table */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading staff...</div>
      ) : staff.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">No staff members yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full">
            <thead className="border-b border-border bg-accent">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Role</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">NFC Login</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Last Login</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id} className="border-t border-border hover:bg-accent/50">
                  <td className="px-4 py-3 text-sm text-foreground">{s.staffName}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      {s.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-accent px-2 py-1 text-xs font-mono text-foreground">
                        {s.nfcLoginFormat}
                      </code>
                      <button
                        onClick={() =>
                          s.nfcLoginFormat && copyToClipboard(s.nfcLoginFormat, s.id)
                        }
                        className="rounded hover:bg-accent p-1"
                        title="Copy NFC login"
                      >
                        <Copy
                          className={`h-4 w-4 transition ${
                            copiedId === s.id ? 'text-green-500' : 'text-muted-foreground'
                          }`}
                        />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{s.email || '-'}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {s.lastLogin ? new Date(s.lastLogin).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDeactivate(s.id, s.staffName)}
                      className="rounded hover:bg-red-50 p-1 text-red-500 hover:text-red-700"
                      title="Deactivate staff"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
