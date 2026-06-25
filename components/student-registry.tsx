'use client'

import { useState, useEffect, useRef } from 'react'
import { getAllDismissals, registerNfcTag, regenerateNfcCode, bulkRegisterStudents } from '@/app/actions/dismissal'
import { parseCSV, generateCSV, downloadCSV } from '@/lib/csv-utils'
import { Upload, Download, FileText, Users, BadgeInfo, CheckCircle, X } from 'lucide-react'

interface Student {
  id: number
  studentName: string
  class: string
  block: string
}

export function StudentRegistry() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBlock, setFilterBlock] = useState<string | null>(null)
  const [newStudent, setNewStudent] = useState({
    name: '',
    class: '',
    block: 'Boys Block',
    nfcCode: '',
  })
  const [regenerateModal, setRegenerateModal] = useState<{ open: boolean; student: Student | null }>({
    open: false,
    student: null,
  })
  const [newNfcCode, setNewNfcCode] = useState('')
  const [importing, setImporting] = useState(false)
  const [notification, setNotification] = useState<{ show: boolean; message: string; studentName?: string }>({
    show: false,
    message: '',
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const BLOCKS = ['KG', 'Girls Block', 'Boys Block']

  async function refreshStudents() {
    const dismissals = await getAllDismissals()
    const uniqueStudents = dismissals.reduce((acc: any, d) => {
      if (!acc.find((s: any) => s.studentName === d.studentName)) {
        acc.push({
          id: d.id,
          studentName: d.studentName,
          class: d.class,
          block: d.block,
        })
      }
      return acc
    }, [])
    setStudents(uniqueStudents)
  }

  // Filter students based on search and block
  const filteredStudents = students.filter(s => {
    const matchesSearch =
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.class.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesBlock = !filterBlock || s.block === filterBlock
    return matchesSearch && matchesBlock
  })

  useEffect(() => {
    async function loadStudents() {
      try {
        const dismissals = await getAllDismissals()
        const uniqueStudents = dismissals.reduce((acc: any, d) => {
          if (!acc.find((s: any) => s.studentName === d.studentName)) {
            acc.push({
              id: d.id,
              studentName: d.studentName,
              class: d.class,
              block: d.block,
            })
          }
          return acc
        }, [])
        setStudents(uniqueStudents)
      } catch (error) {
        console.error('Failed to load students:', error)
      } finally {
        setLoading(false)
      }
    }
    loadStudents()
  }, [])

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStudent.name || !newStudent.class || !newStudent.nfcCode) {
      alert('Please fill all fields')
      return
    }

    try {
      const studentId = `STU-${Date.now()}`
      await registerNfcTag(newStudent.nfcCode, studentId, newStudent.name, newStudent.class, newStudent.block)
      
      const studentNameToShow = newStudent.name
      setNewStudent({ name: '', class: '', block: 'Boys Block', nfcCode: '' })
      
      // Show success notification
      setNotification({
        show: true,
        message: 'Student Imported',
        studentName: studentNameToShow,
      })
      
      // Auto-hide notification after 4 seconds
      setTimeout(() => {
        setNotification({ show: false, message: '' })
      }, 4000)
      
      // Reload students
      const dismissals = await getAllDismissals()
      const uniqueStudents = dismissals.reduce((acc: any, d) => {
        if (!acc.find((s: any) => s.studentName === d.studentName)) {
          acc.push({
            id: d.id,
            studentName: d.studentName,
            class: d.class,
            block: d.block,
          })
        }
        return acc
      }, [])
      setStudents(uniqueStudents)
    } catch (error) {
      console.error('Failed to register student:', error)
      alert('Failed to register student')
    }
  }

  const handleRegenerateNfc = async () => {
    if (!regenerateModal.student || !newNfcCode) {
      alert('Please enter a new NFC code')
      return
    }

    try {
      await regenerateNfcCode(regenerateModal.student.studentName, newNfcCode)
      setRegenerateModal({ open: false, student: null })
      setNewNfcCode('')
      
      // Reload students
      const dismissals = await getAllDismissals()
      const uniqueStudents = dismissals.reduce((acc: any, d) => {
        if (!acc.find((s: any) => s.studentName === d.studentName)) {
          acc.push({
            id: d.id,
            studentName: d.studentName,
            class: d.class,
            block: d.block,
          })
        }
        return acc
      }, [])
      setStudents(uniqueStudents)
      alert('NFC code regenerated successfully!')
    } catch (error) {
      console.error('Failed to regenerate NFC code:', error)
      alert('Failed to regenerate NFC code')
    }
  }

  const handleExportCSV = () => {
    const headers = ['Student Name', 'Class', 'Block']
    const rows = filteredStudents.map((s) => [s.studentName, s.class, s.block])
    const csv = generateCSV(headers, rows)
    const date = new Date().toISOString().split('T')[0]
    downloadCSV(`students-${date}.csv`, csv)
  }

  const handleDownloadTemplate = () => {
    const csv = generateCSV(
      ['name', 'class', 'block', 'nfccode'],
      [
        ['John Doe', 'Grade 5A', 'Boys Block', 'NFC-001'],
        ['Jane Smith', 'Grade 4B', 'Girls Block', 'NFC-002'],
      ]
    )
    downloadCSV('student-import-template.csv', csv)
  }

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const text = await file.text()
      const rows = parseCSV(text)

      if (rows.length === 0) {
        alert('No data found in CSV file')
        return
      }

      const studentsToImport = rows.map((r) => ({
        name: r['name'] || r['student name'] || r['studentname'] || '',
        class: r['class'] || '',
        block: r['block'] || 'Boys Block',
        nfcCode: r['nfccode'] || r['nfc code'] || r['nfc_code'] || '',
      }))

      const result = await bulkRegisterStudents(studentsToImport)
      await refreshStudents()

      // Show import notification
      setNotification({
        show: true,
        message: `${result.imported} student(s) imported. ${result.skipped} skipped.`,
      })
      
      // Auto-hide notification after 4 seconds
      setTimeout(() => {
        setNotification({ show: false, message: '' })
      }, 4000)

      if (result.errors.length > 0) {
        const errorMessage = `Some errors occurred:\n${result.errors.slice(0, 5).join('\n')}`
        alert(errorMessage)
      }
    } catch (error) {
      console.error('Failed to import CSV:', error)
      alert('Failed to import CSV file. Please check the format.')
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex-1 overflow-auto p-6 sm:p-8 space-y-6 lg:space-y-8">
      {/* Success Notification */}
      {notification.show && (
        <div className="fixed inset-x-4 top-4 z-50 flex items-start gap-3 rounded-xl border border-green-500/30 bg-green-50 p-4 shadow-lg sm:inset-x-auto sm:right-4 sm:max-w-sm dark:bg-green-950/30 dark:border-green-500/50">
          <CheckCircle className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
          <div className="flex-1">
            <p className="font-semibold text-green-900 dark:text-green-100">{notification.message}</p>
            {notification.studentName && (
              <p className="mt-1 text-sm text-green-800 dark:text-green-200">{notification.studentName}</p>
            )}
          </div>
          <button
            onClick={() => setNotification({ show: false, message: '' })}
            className="shrink-0 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="rounded-[2rem] border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Registry</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Student Registry</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Register NFC tags and manage the student database.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-4 py-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4 text-primary" />
            {students.length} registered students
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-[1.75rem] border border-border/60 bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">Register New Student</h3>
              <p className="text-sm text-muted-foreground">Add NFC credentials and class details.</p>
            </div>
          </div>

          <form onSubmit={handleAddStudent} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Student Name</label>
              <input
                type="text"
                value={newStudent.name}
                onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="Full name"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Class</label>
              <input
                type="text"
                value={newStudent.class}
                onChange={(e) => setNewStudent({ ...newStudent, class: e.target.value })}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="e.g., Grade 5A"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Block</label>
              <select
                value={newStudent.block}
                onChange={(e) => setNewStudent({ ...newStudent, block: e.target.value })}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              >
                <option>KG</option>
                <option>Girls Block</option>
                <option>Boys Block</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">NFC Code</label>
              <input
                type="text"
                value={newStudent.nfcCode}
                onChange={(e) => setNewStudent({ ...newStudent, nfcCode: e.target.value })}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="Scan or enter NFC ID"
              />
            </div>

            <button
              type="submit"
              className="h-11 w-full rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              Register Student
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 overflow-hidden rounded-[1.75rem] border border-border/60 bg-card shadow-sm">
          <div className="flex flex-col gap-4 border-b border-border/60 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-foreground">Registered Students ({filteredStudents.length})</h3>
                <p className="mt-1 text-sm text-muted-foreground">Search, filter, export, and rewrite NFC codes.</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                <BadgeInfo className="h-4 w-4 text-primary" />
                Updated from dismissal records
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                {importing ? 'Importing...' : 'Import CSV'}
              </button>
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted/60"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
              <button
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted/60"
              >
                <FileText className="h-4 w-4" />
                Template
              </button>
            </div>
          </div>

          <div className="border-b border-border/60 p-4 space-y-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or class..."
              className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterBlock(null)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  filterBlock === null
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                All Blocks
              </button>
              {BLOCKS.map((block) => (
                <button
                  key={block}
                  onClick={() => setFilterBlock(block)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    filterBlock === block
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {block}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading students...</div>
            ) : students.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No registered students yet</div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No students match your search</div>
            ) : (
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border/60">
                  <tr className="text-left text-sm font-medium text-foreground">
                    <th className="px-6 py-3">Student Name</th>
                    <th className="px-6 py-3">Class</th>
                    <th className="px-6 py-3">Block</th>
                    <th className="px-6 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-6 py-3 font-medium text-foreground">{student.studentName}</td>
                      <td className="px-6 py-3 text-sm text-muted-foreground">{student.class}</td>
                      <td className="px-6 py-3">
                        <span className="inline-flex rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                          {student.block}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <button
                          onClick={() => setRegenerateModal({ open: true, student })}
                          className="rounded-xl bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-200"
                        >
                          Rewrite NFC
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {regenerateModal.open && regenerateModal.student && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-4 rounded-[1.5rem] border border-border/60 bg-card p-6 shadow-xl">
            <h3 className="text-2xl font-semibold text-foreground">Rewrite NFC Code</h3>
            <p className="text-sm text-muted-foreground">
              Regenerate NFC code for <span className="font-semibold text-foreground">{regenerateModal.student.studentName}</span>
            </p>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">New NFC Code</label>
              <input
                type="text"
                value={newNfcCode}
                onChange={(e) => setNewNfcCode(e.target.value)}
                placeholder="Scan or enter new NFC ID"
                className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                autoFocus
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setRegenerateModal({ open: false, student: null })
                  setNewNfcCode('')
                }}
                className="flex-1 rounded-xl border border-border/70 bg-background px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted/60"
              >
                Cancel
              </button>
              <button
                onClick={handleRegenerateNfc}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Rewrite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
