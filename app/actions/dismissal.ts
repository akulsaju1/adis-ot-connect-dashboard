'use server'
import {
  nextId,
  readLocalDb,
  sortByCreatedAtDesc,
  updateLocalDb,
  getParentByNfcCode,
  getChildrenAwaitingPickup,
  type LocalDismissal,
} from '@/lib/local-db'
import { getStaffSession } from './staff-auth'

async function getUserId() {
  // Local single-admin store keeps the app scoped to one operator.
  return 'admin-user-final'
}

function toIso(value?: Date | string | null) {
  if (!value) return null
  return value instanceof Date ? value.toISOString() : value
}

function serializeDismissal<T extends { [key: string]: any }>(record: T) {
  return {
    ...record,
    nfcScanTime: record.nfcScanTime ?? null,
    gateScanTime: record.gateScanTime ?? null,
    groundOpsTime: record.groundOpsTime ?? null,
    finalDismissalTime: record.finalDismissalTime ?? null,
  }
}

function getLatestDismissalForStudent(
  dismissals: LocalDismissal[],
  studentId: string
): LocalDismissal | null {
  const matches = dismissals
    .filter((item) => item.studentId === studentId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return matches[0] || null
}

// NFC operations
export async function registerNfcTag(
  nfcCode: string,
  studentId: string,
  studentName: string,
  class_: string,
  block: string,
  parentEmail?: string | null,
  grNumber?: string | null
) {
  // Gate staff cannot register NFC tags (edit student data)
  const staffSession = await getStaffSession()
  if (staffSession) {
    throw new Error('Gate staff cannot register NFC tags. This is an admin-only function.')
  }

  const result = await updateLocalDb(async (state) => {
    const existing = state.nfcTags.find((tag) => tag.nfcCode === nfcCode)
    if (existing) {
      throw new Error('NFC code already exists')
    }

    const created = {
      id: nextId(state.nfcTags),
      nfcCode,
      studentId,
      studentName,
      class: class_,
      block,
      parentEmail: parentEmail || null,
      grNumber: grNumber || null,
      createdAt: new Date().toISOString(),
    }

    state.nfcTags.push(created)
    return created
  })
  return result
}

export async function getNfcTag(nfcCode: string) {
  const state = await readLocalDb()
  return state.nfcTags.find((tag) => tag.nfcCode === nfcCode) || null
}

export async function bulkRegisterStudents(
  students: Array<{ name: string; class: string; block: string; nfcCode: string }>
) {
  // Gate staff cannot bulk register students (edit student data)
  const staffSession = await getStaffSession()
  if (staffSession) {
    throw new Error('Gate staff cannot register students. This is an admin-only function.')
  }
  const userId = await getUserId()
  let imported = 0
  let skipped = 0
  const errors: string[] = []

  await updateLocalDb(async (state) => {
    for (const s of students) {
      if (!s.name || !s.nfcCode) {
        skipped++
        continue
      }

      try {
        const existing = state.nfcTags.find((tag) => tag.nfcCode === s.nfcCode)
        if (existing) {
          skipped++
          continue
        }

        const studentId = `STU-${Date.now()}-${Math.floor(Math.random() * 1000)}`
        state.nfcTags.push({
          id: nextId(state.nfcTags),
          nfcCode: s.nfcCode,
          studentId,
          studentName: s.name,
          class: s.class || '',
          block: s.block || 'Boys Block',
          parentEmail: (s as any).parentEmail || null,
          grNumber: (s as any).grNumber || null,
          createdAt: new Date().toISOString(),
        })

        state.dismissals.push({
          id: nextId(state.dismissals),
          studentId,
          studentName: s.name,
          class: s.class || '',
          block: s.block || 'Boys Block',
          parentName: '',
          parentPhone: '',
          pickupMethod: 'walk',
          nfcScanTime: new Date().toISOString(),
          gateScanTime: null,
          groundOpsTime: null,
          finalDismissalTime: null,
          status: 'waiting',
          notes: null,
          userId,
          dispersalSessionId: null,
          dispersalGroupId: null,
          pickedUpAt: null,
          createdAt: new Date().toISOString(),
        })
        imported++
      } catch (err) {
        errors.push(`${s.name}: ${err instanceof Error ? err.message : 'failed'}`)
        skipped++
      }
    }
  })
  return { imported, skipped, errors }
}

export async function regenerateNfcCode(studentName: string, newNfcCode: string) {
  const updated = await updateLocalDb(async (state) => {
    const existingTag = state.nfcTags.find((tag) => tag.studentName === studentName)

    if (!existingTag) {
      throw new Error('Student not found in NFC database')
    }

    if (state.nfcTags.some((tag) => tag.nfcCode === newNfcCode && tag.id !== existingTag.id)) {
      throw new Error('NFC code already exists')
    }

    existingTag.nfcCode = newNfcCode
    return existingTag
  })
  return updated
}

// Dismissal operations
export async function createDismissal(
  studentId: string,
  studentName: string,
  class_: string,
  block: string,
  parentName: string,
  parentPhone: string,
  pickupMethod: string
) {
  // Gate staff cannot create dismissals (edit student data)
  const staffSession = await getStaffSession()
  if (staffSession) {
    throw new Error('Gate staff cannot create dismissals. This is an admin-only function.')
  }

  const userId = await getUserId()

  const result = await updateLocalDb(async (state) => {
    const created = {
      id: nextId(state.dismissals),
      studentId,
      studentName,
      class: class_,
      block,
      parentName,
      parentPhone,
      pickupMethod,
      nfcScanTime: new Date().toISOString(),
      gateScanTime: null,
      groundOpsTime: null,
      finalDismissalTime: null,
      status: 'waiting',
      notes: null,
      userId,
      dispersalSessionId: null,
      dispersalGroupId: null,
      pickedUpAt: null,
      createdAt: new Date().toISOString(),
    }

    state.dismissals.push(created)
    return created
  })
  return serializeDismissal(result)
}

export type ScanMode = 'auto' | 'dispersal' | 'end_dispersal'

export type ScanResult =
  | {
      ok: true
      event: 'student_at_gate' | 'parent_arrived' | 'student_left'
      studentName: string
      class: string
      block: string
      status: string
    }
  | { ok: false; error: string }

export async function scanNfcAtGate(
  nfcCode: string,
  mode: ScanMode = 'auto'
): Promise<ScanResult> {
  try {
    const trimmed = (nfcCode || '').trim()
    if (!trimmed) {
      return { ok: false, error: 'No NFC code was provided.' }
    }

    // Check if this is a parent NFC code first
    const parent = await getParentByNfcCode(trimmed)
    if (parent) {
      // Parent scanned - show multi-child pickup screen
      return {
        ok: true,
        event: 'parent_arrived' as const,
        studentName: parent.parentName,
        class: 'Parent',
        block: 'Multi-Child Pickup',
        status: 'parent_scanned',
      }
    }

    const tag = await getNfcTag(trimmed)

    if (!tag) {
      return { ok: false, error: `No student is registered to this tag (${trimmed}).` }
    }

    const result = await updateLocalDb(async (state) => {
      let dismissal = getLatestDismissalForStudent(state.dismissals, tag.studentId)
      const nowIso = new Date().toISOString()
      let event: 'student_at_gate' | 'parent_arrived' | 'student_left' = 'student_at_gate'

      const createFreshDismissal = () => {
        const created = {
          id: nextId(state.dismissals),
          studentId: tag.studentId,
          studentName: tag.studentName,
          class: tag.class || '',
          block: tag.block || '',
          parentName: '',
          parentPhone: '',
          pickupMethod: 'walk',
          nfcScanTime: nowIso,
          gateScanTime: null,
          groundOpsTime: null,
          finalDismissalTime: null,
          status: 'waiting',
          notes: null,
          userId: 'admin-user-final',
          dispersalSessionId: null,
          dispersalGroupId: null,
          pickedUpAt: null,
          createdAt: nowIso,
        }
        state.dismissals.push(created)
        return created
      }

      // Manual override: force the start of dispersal (student at gate).
      if (mode === 'dispersal') {
        if (!dismissal || dismissal.status === 'completed') {
          dismissal = createFreshDismissal()
        }
        dismissal.gateScanTime = nowIso
        dismissal.status = 'at_gate'
        event = 'student_at_gate'
        return { dismissal, event }
      }

      // Manual override: force end of dispersal (student left campus).
      if (mode === 'end_dispersal') {
        if (!dismissal) {
          dismissal = createFreshDismissal()
        }
        dismissal.finalDismissalTime = nowIso
        dismissal.status = 'completed'
        event = 'student_left'
        return { dismissal, event }
      }

      // Auto mode: cycle waiting -> at_gate -> parent_arrived -> completed.
      if (!dismissal || dismissal.status === 'completed') {
        if (dismissal?.finalDismissalTime) {
          const sinceCompleteMs = Date.now() - new Date(dismissal.finalDismissalTime).getTime()
          if (sinceCompleteMs < 10_000) {
            return { error: 'Student already marked as left. Please wait a few seconds before rescanning.' as const }
          }
        }
        dismissal = createFreshDismissal()
      }

      if (dismissal.status === 'waiting') {
        dismissal.gateScanTime = nowIso
        dismissal.status = 'at_gate'
        event = 'student_at_gate'
      } else if (dismissal.status === 'at_gate' || dismissal.status === 'in_queue') {
        dismissal.groundOpsTime = nowIso
        dismissal.status = 'parent_arrived'
        event = 'parent_arrived'
      } else if (dismissal.status === 'parent_arrived') {
        dismissal.finalDismissalTime = nowIso
        dismissal.status = 'completed'
        event = 'student_left'
      }

      return { dismissal, event }
    })

    if ('error' in result && result.error) {
      return { ok: false, error: result.error }
    }

    const dismissal = (result as { dismissal: any; event: any }).dismissal
    return {
      ok: true,
      event: (result as { event: any }).event,
      studentName: dismissal.studentName,
      class: dismissal.class,
      block: dismissal.block,
      status: dismissal.status,
    }
  } catch (error: any) {
    console.log('[v0] scanNfcAtGate failed:', error?.message || error)
    return {
      ok: false,
      error: 'Could not save the scan. Please try again.',
    }
  }
}

export async function updateDismissalStatus(
  dismissalId: number,
  newStatus: string,
  updates?: Record<string, any>
) {
  const updated = await updateLocalDb(async (state) => {
    const dismissal = state.dismissals.find((item) => item.id === dismissalId)

    if (!dismissal) {
      throw new Error('Dismissal not found')
    }

    dismissal.status = newStatus

    if (newStatus === 'parent_arrived') {
      dismissal.groundOpsTime = new Date().toISOString()
    } else if (newStatus === 'completed') {
      dismissal.finalDismissalTime = new Date().toISOString()
    }

    if (updates) {
      for (const [key, value] of Object.entries(updates)) {
        ;(dismissal as Record<string, any>)[key] = toIso(value)
      }
    }

    return dismissal
  })
  return serializeDismissal(updated)
}

export async function getDismissalsByStatus(status: string) {
  const state = await readLocalDb()
  return sortByCreatedAtDesc(
    state.dismissals.filter((dismissal) => dismissal.status === status)
  ).map(serializeDismissal)
}

export async function getAllDismissals() {
  const state = await readLocalDb()
  return sortByCreatedAtDesc(state.dismissals).map(serializeDismissal)
}

export async function getDismissalStats() {
  const allDismissals = await getAllDismissals()

  return {
    total: allDismissals.length,
    waiting: allDismissals.filter((d) => d.status === 'waiting').length,
    at_gate: allDismissals.filter((d) => d.status === 'at_gate').length,
    in_queue: allDismissals.filter((d) => d.status === 'in_queue').length,
    parent_arrived: allDismissals.filter((d) => d.status === 'parent_arrived').length,
    completed: allDismissals.filter((d) => d.status === 'completed').length,
  }
}

// Staff operations
export async function addStaffMember(
  staffName: string,
  role: string,
  block: string,
  phone: string,
  email: string
) {
  const result = await updateLocalDb(async (state) => {
    const created = {
      id: nextId(state.staffDirectory),
      staffName,
      username: null,
      passwordHash: null,
      role,
      block,
      phone,
      email,
      nfcLoginFormat: null,
      isActive: true,
      userId: await getUserId(),
      lastLogin: null,
      createdAt: new Date().toISOString(),
    }

    state.staffDirectory.push(created)
    return created
  })
  return result
}

export async function getStaffDirectory() {
  const state = await readLocalDb()
  return sortByCreatedAtDesc(
    state.staffDirectory.filter((member) => member.isActive)
  )
}
