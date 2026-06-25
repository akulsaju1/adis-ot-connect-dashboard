'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  registerNewParent,
  fetchAllParents,
  getParentChildren,
  linkStudentToParent,
  uploadStudentPhotoAction,
} from '@/app/actions/parent'
import { getAllDismissals } from '@/app/actions/dismissal'
import { Users, Plus, X, Upload } from 'lucide-react'

interface Parent {
  id: number
  nfcCode: string
  parentName: string
  phone: string | null
  email: string | null
  createdAt: string
}

interface Dismissal {
  id: number
  studentId: string
  studentName: string
  class: string
  block: string
}

export function ParentManagement() {
  const [parents, setParents] = useState<Parent[]>([])
  const [dismissals, setDismissals] = useState<Dismissal[]>([])
  const [loading, setLoading] = useState(true)
  const [showRegisterForm, setShowRegisterForm] = useState(false)
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null)
  const [parentChildren, setParentChildren] = useState<any[]>([])
  const [showLinkForm, setShowLinkForm] = useState(false)

  // Register parent form
  const [registerForm, setRegisterForm] = useState({
    nfcCode: '',
    parentName: '',
    phone: '',
    email: '',
  })

  // Link student form
  const [linkForm, setLinkForm] = useState({
    studentId: '',
    nfcCode: '',
  })

  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [p, d] = await Promise.all([
        fetchAllParents(),
        getAllDismissals(),
      ])
      setParents(p || [])
      setDismissals(d || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterParent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!registerForm.nfcCode || !registerForm.parentName) {
      alert('Please fill in NFC Code and Parent Name')
      return
    }

    setIsProcessing(true)
    try {
      await registerNewParent(
        registerForm.nfcCode,
        registerForm.parentName,
        registerForm.phone || undefined,
        registerForm.email || undefined
      )
      setRegisterForm({ nfcCode: '', parentName: '', phone: '', email: '' })
      setShowRegisterForm(false)
      await loadData()
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to register parent'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSelectParent = async (parentId: number) => {
    setSelectedParentId(parentId)
    try {
      const children = await getParentChildren(parentId)
      setParentChildren(children || [])
    } catch (error) {
      console.error('Failed to load children:', error)
    }
  }

  const handleLinkStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedParentId || !linkForm.studentId) {
      alert('Please select a student')
      return
    }

    setIsProcessing(true)
    try {
      const student = dismissals.find((d) => d.studentId === linkForm.studentId)
      if (!student) {
        throw new Error('Student not found')
      }

      await linkStudentToParent(
        selectedParentId,
        student.studentId,
        student.studentName,
        student.class,
        student.block,
        student.studentId
      )

      setLinkForm({ studentId: '', nfcCode: '' })
      setShowLinkForm(false)
      await handleSelectParent(selectedParentId)
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to link student'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, studentId: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const photoData = event.target?.result as string
        await uploadStudentPhotoAction(studentId, photoData)
        await handleSelectParent(selectedParentId!)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to upload photo'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="rounded-[2rem] border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Management</p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground sm:text-4xl">Parent & Child Management</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Register parents, link their children, and manage group pickups with photos.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowRegisterForm(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Register Parent
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Parents List */}
        <div className="lg:col-span-1 rounded-[1.75rem] border border-border/60 bg-card shadow-sm overflow-hidden">
          <div className="border-b border-border/60 bg-gradient-to-r from-blue-50 to-white p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Registered Parents</h3>
                <p className="text-sm text-muted-foreground">{parents.length} total</p>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-border/60">
            {parents.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">No parents registered</div>
            ) : (
              parents.map((parent) => (
                <button
                  key={parent.id}
                  onClick={() => handleSelectParent(parent.id)}
                  className={`w-full text-left p-4 transition hover:bg-muted/40 ${
                    selectedParentId === parent.id ? 'bg-primary/10 border-l-4 border-primary' : ''
                  }`}
                >
                  <p className="font-semibold text-foreground">{parent.parentName}</p>
                  <p className="text-xs text-muted-foreground mt-1">{parent.nfcCode}</p>
                  {parent.phone && (
                    <p className="text-xs text-muted-foreground">{parent.phone}</p>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Selected Parent Details */}
        <div className="lg:col-span-2 rounded-[1.75rem] border border-border/60 bg-card shadow-sm overflow-hidden">
          {selectedParentId ? (
            <>
              <div className="border-b border-border/60 bg-gradient-to-r from-emerald-50 to-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">
                      {parents.find((p) => p.id === selectedParentId)?.parentName}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {parentChildren.length} children linked
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowLinkForm(true)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Link Child
                  </Button>
                </div>
              </div>

              {/* Children List */}
              <div className="p-6 space-y-4">
                {parentChildren.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No children linked yet</p>
                    <p className="text-sm mt-2">Click "Link Child" to add students</p>
                  </div>
                ) : (
                  parentChildren.map((child) => (
                    <div key={child.studentId} className="flex gap-4 p-4 rounded-lg border border-border/40 hover:bg-muted/20 transition">
                      {/* Photo */}
                      <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-muted overflow-hidden relative group">
                        {child.photo ? (
                          <img
                            src={child.photo}
                            alt={child.studentName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-100 to-blue-50">
                            <span className="text-lg font-bold text-blue-600">
                              {child.studentName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition cursor-pointer">
                          <Upload className="h-4 w-4 text-white" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handlePhotoUpload(e, child.studentId)}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground">{child.studentName}</p>
                        <p className="text-sm text-muted-foreground">
                          {child.class} | {child.block}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {child.status || 'Linked'}
                        </p>
                      </div>

                      {/* Remove */}
                      <button
                        className="text-muted-foreground hover:text-destructive transition"
                        onClick={async () => {
                          // TODO: Add unlink functionality
                          alert('Coming soon: unlink student')
                        }}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              <p>Select a parent to view and manage their children</p>
            </div>
          )}
        </div>
      </div>

      {/* Register Parent Modal */}
      {showRegisterForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-lg">
            <div className="border-b border-border bg-gradient-to-r from-blue-50 to-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Register New Parent</h2>
                <button
                  onClick={() => setShowRegisterForm(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleRegisterParent} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">NFC Code *</label>
                <Input
                  type="text"
                  placeholder="Enter parent NFC code"
                  value={registerForm.nfcCode}
                  onChange={(e) =>
                    setRegisterForm({ ...registerForm, nfcCode: e.target.value })
                  }
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Parent Name *</label>
                <Input
                  type="text"
                  placeholder="Enter parent name"
                  value={registerForm.parentName}
                  onChange={(e) =>
                    setRegisterForm({ ...registerForm, parentName: e.target.value })
                  }
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Phone</label>
                <Input
                  type="tel"
                  placeholder="Enter phone number"
                  value={registerForm.phone}
                  onChange={(e) =>
                    setRegisterForm({ ...registerForm, phone: e.target.value })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input
                  type="email"
                  placeholder="Enter email"
                  value={registerForm.email}
                  onChange={(e) =>
                    setRegisterForm({ ...registerForm, email: e.target.value })
                  }
                  className="mt-1"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRegisterForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? 'Registering...' : 'Register'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Student Modal */}
      {showLinkForm && selectedParentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-lg">
            <div className="border-b border-border bg-gradient-to-r from-blue-50 to-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Link Child to Parent</h2>
                <button
                  onClick={() => setShowLinkForm(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleLinkStudent} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Select Student *</label>
                <select
                  value={linkForm.studentId}
                  onChange={(e) =>
                    setLinkForm({ ...linkForm, studentId: e.target.value })
                  }
                  required
                  className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                >
                  <option value="">Choose a student...</option>
                  {dismissals.map((dismissal) => (
                    <option key={dismissal.studentId} value={dismissal.studentId}>
                      {dismissal.studentName} ({dismissal.class})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowLinkForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? 'Linking...' : 'Link Student'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
