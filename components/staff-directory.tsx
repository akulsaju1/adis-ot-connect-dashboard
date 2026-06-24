'use client'

import { useState, useEffect } from 'react'
import { getStaffDirectory, addStaffMember } from '@/app/actions/dismissal'
import { Phone, Mail, User } from 'lucide-react'

interface StaffMember {
  id: number
  staffName: string
  role: string
  block: string | null
  phone: string | null
  email: string | null
  isActive: boolean
}

export function StaffDirectory() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string | null>(null)
  const [newStaff, setNewStaff] = useState({
    name: '',
    role: 'gate_staff',
    block: '',
    phone: '',
    email: '',
  })

  const ROLES = ['gate_staff', 'ground_ops', 'supervisor']

  // Filter staff based on search and role
  const filteredStaff = staff.filter(s => {
    const matchesSearch =
      s.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.phone && s.phone.includes(searchTerm))
    const matchesRole = !filterRole || s.role === filterRole
    return matchesSearch && matchesRole
  })

  useEffect(() => {
    loadStaff()
  }, [])

  async function loadStaff() {
    try {
      const data = await getStaffDirectory()
      setStaff((data || []) as StaffMember[])
    } catch (error) {
      console.error('Failed to load staff:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStaff.name || !newStaff.email) {
      alert('Please fill required fields')
      return
    }

    try {
      await addStaffMember(newStaff.name, newStaff.role, newStaff.block, newStaff.phone, newStaff.email)
      setNewStaff({ name: '', role: 'gate_staff', block: '', phone: '', email: '' })
      await loadStaff()
    } catch (error) {
      console.error('Failed to add staff:', error)
      alert('Failed to add staff member')
    }
  }

  const roleLabels: Record<string, string> = {
    gate_staff: '🚪 Gate Staff',
    ground_ops: '📍 Ground Operations',
    supervisor: '👨‍💼 Supervisor',
  }

  return (
    <div className="flex-1 overflow-auto p-8 space-y-8">
      <div>
        <h2 className="text-4xl font-bold text-primary mb-2">Staff Directory</h2>
        <p className="text-muted-foreground">Manage OT staff members and contact information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add New Staff Form */}
        <div className="bg-white rounded-lg border border-primary/10 shadow-sm p-6">
          <h3 className="text-xl font-bold text-primary mb-4">Add Staff Member</h3>
          <form onSubmit={handleAddStaff} className="space-y-4">
            <div>
              <label className="text-sm font-semibold block mb-2">Name *</label>
              <input
                type="text"
                value={newStaff.name}
                onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                className="w-full px-3 py-2 border border-primary/20 rounded-lg focus:outline-none focus:border-primary"
                placeholder="Full name"
              />
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">Role</label>
              <select
                value={newStaff.role}
                onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                className="w-full px-3 py-2 border border-primary/20 rounded-lg focus:outline-none focus:border-primary"
              >
                <option value="gate_staff">Gate Staff</option>
                <option value="ground_ops">Ground Operations</option>
                <option value="supervisor">Supervisor</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">Block</label>
              <select
                value={newStaff.block}
                onChange={(e) => setNewStaff({ ...newStaff, block: e.target.value })}
                className="w-full px-3 py-2 border border-primary/20 rounded-lg focus:outline-none focus:border-primary"
              >
                <option value="">All Blocks</option>
                <option value="KG">KG</option>
                <option value="Girls Block">Girls Block</option>
                <option value="Boys Block">Boys Block</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">Phone</label>
              <input
                type="tel"
                value={newStaff.phone}
                onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                className="w-full px-3 py-2 border border-primary/20 rounded-lg focus:outline-none focus:border-primary"
                placeholder="+971 50 123 4567"
              />
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">Email *</label>
              <input
                type="email"
                value={newStaff.email}
                onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                className="w-full px-3 py-2 border border-primary/20 rounded-lg focus:outline-none focus:border-primary"
                placeholder="email@adis.ae"
              />
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-semibold"
            >
              Add Staff Member
            </button>
          </form>
        </div>

        {/* Staff List */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-primary/10 shadow-sm">
          <div className="p-6 border-b border-primary/5">
            <h3 className="text-xl font-bold text-primary">Active Staff ({filteredStaff.length})</h3>
          </div>

          {/* Search and Filter */}
          <div className="p-4 border-b border-primary/5 space-y-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full px-4 py-2 border border-primary/20 rounded-lg focus:outline-none focus:border-primary"
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterRole(null)}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  filterRole === null
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Roles
              </button>
              {ROLES.map((role) => (
                <button
                  key={role}
                  onClick={() => setFilterRole(role)}
                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                    filterRole === role
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {roleLabels[role] || role}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-primary/5 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading staff...</div>
            ) : staff.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No staff members added yet</div>
            ) : filteredStaff.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No staff match your search</div>
            ) : (
              filteredStaff.map((member) => (
                <div key={member.id} className="p-6 hover:bg-primary/2 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-lg">{member.staffName}</p>
                      <p className="text-sm text-muted-foreground">{roleLabels[member.role] || member.role}</p>
                      {member.block && <p className="text-xs text-muted-foreground mt-1">{member.block}</p>}
                      <div className="flex flex-wrap gap-3 mt-3">
                        {member.phone && (
                          <a href={`tel:${member.phone}`} className="text-xs flex items-center gap-1 text-primary hover:underline">
                            <Phone className="w-3 h-3" />
                            {member.phone}
                          </a>
                        )}
                        {member.email && (
                          <a href={`mailto:${member.email}`} className="text-xs flex items-center gap-1 text-primary hover:underline">
                            <Mail className="w-3 h-3" />
                            {member.email}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
