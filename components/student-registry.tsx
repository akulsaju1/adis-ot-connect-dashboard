'use client'

import { useState, useEffect, useRef } from 'react'
import { getAllDismissals, registerNfcTag, regenerateNfcCode, bulkRegisterStudents } from '@/app/actions/dismissal'
import { parseCSV, generateCSV, downloadCSV } from '@/lib/csv-utils'

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
      
      setNewStudent({ name: '', class: '', block: 'Boys Block', nfcCode: '' })
      
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

      let message = `Imported ${result.imported} student(s). Skipped ${result.skipped}.`
      if (result.errors.length > 0) {
        message += `\n\nErrors:\n${result.errors.slice(0, 5).join('\n')}`
      }
      alert(message)
    } catch (error) {
      console.error('Failed to import CSV:', error)
      alert('Failed to import CSV file. Please check the format.')
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex-1 overflow-auto p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold text-primary mb-2">Student Registry</h2>
          <p className="text-muted-foreground">Register NFC tags and manage student database</p>
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
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-semibold text-sm disabled:opacity-50 transition"
          >
            {importing ? 'Importing...' : 'Import CSV'}
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 border border-primary/30 text-primary rounded-lg hover:bg-primary/5 font-semibold text-sm transition"
          >
            Export CSV
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 font-semibold text-sm transition"
          >
            Template
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add New Student Form */}
        <div className="bg-white rounded-lg border border-primary/10 shadow-sm p-6">
          <h3 className="text-xl font-bold text-primary mb-4">Register New Student</h3>
          <form onSubmit={handleAddStudent} className="space-y-4">
            <div>
              <label className="text-sm font-semibold block mb-2">Student Name</label>
              <input
                type="text"
                value={newStudent.name}
                onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                className="w-full px-3 py-2 border border-primary/20 rounded-lg focus:outline-none focus:border-primary"
                placeholder="Full name"
              />
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">Class</label>
              <input
                type="text"
                value={newStudent.class}
                onChange={(e) => setNewStudent({ ...newStudent, class: e.target.value })}
                className="w-full px-3 py-2 border border-primary/20 rounded-lg focus:outline-none focus:border-primary"
                placeholder="e.g., Grade 5A"
              />
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">Block</label>
              <select
                value={newStudent.block}
                onChange={(e) => setNewStudent({ ...newStudent, block: e.target.value })}
                className="w-full px-3 py-2 border border-primary/20 rounded-lg focus:outline-none focus:border-primary"
              >
                <option>KG</option>
                <option>Girls Block</option>
                <option>Boys Block</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">NFC Code</label>
              <input
                type="text"
                value={newStudent.nfcCode}
                onChange={(e) => setNewStudent({ ...newStudent, nfcCode: e.target.value })}
                className="w-full px-3 py-2 border border-primary/20 rounded-lg focus:outline-none focus:border-primary"
                placeholder="Scan or enter NFC ID"
              />
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-semibold"
            >
              Register Student
            </button>
          </form>
        </div>

        {/* Students List */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-primary/10 shadow-sm">
          <div className="p-6 border-b border-primary/5">
            <h3 className="text-xl font-bold text-primary">Registered Students ({filteredStudents.length})</h3>
          </div>

          {/* Search and Filter */}
          <div className="p-4 border-b border-primary/5 space-y-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or class..."
              className="w-full px-4 py-2 border border-primary/20 rounded-lg focus:outline-none focus:border-primary"
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterBlock(null)}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  filterBlock === null
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Blocks
              </button>
              {BLOCKS.map((block) => (
                <button
                  key={block}
                  onClick={() => setFilterBlock(block)}
                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                    filterBlock === block
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                <thead className="bg-primary/5 border-b border-primary/10">
                  <tr className="text-left text-sm font-semibold text-primary">
                    <th className="px-6 py-3">Student Name</th>
                    <th className="px-6 py-3">Class</th>
                    <th className="px-6 py-3">Block</th>
                    <th className="px-6 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-primary/2 transition-colors">
                      <td className="px-6 py-3 font-medium">{student.studentName}</td>
                      <td className="px-6 py-3 text-sm text-muted-foreground">{student.class}</td>
                      <td className="px-6 py-3">
                        <span className="inline-flex px-2 py-1 rounded text-xs font-semibold bg-primary/10 text-primary">
                          {student.block}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <button
                          onClick={() => setRegenerateModal({ open: true, student })}
                          className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
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

      {/* Regenerate NFC Modal */}
      {regenerateModal.open && regenerateModal.student && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 space-y-4">
            <h3 className="text-2xl font-bold text-primary">Rewrite NFC Code</h3>
            <p className="text-sm text-muted-foreground">
              Regenerate NFC code for <span className="font-semibold">{regenerateModal.student.studentName}</span>
            </p>

            <div>
              <label className="text-sm font-semibold block mb-2">New NFC Code</label>
              <input
                type="text"
                value={newNfcCode}
                onChange={(e) => setNewNfcCode(e.target.value)}
                placeholder="Scan or enter new NFC ID"
                className="w-full px-4 py-2 border border-primary/20 rounded-lg focus:outline-none focus:border-primary"
                autoFocus
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setRegenerateModal({ open: false, student: null })
                  setNewNfcCode('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRegenerateNfc}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
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
