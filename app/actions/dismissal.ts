'use server'
import {
  nextId,
  readLocalDb,
  sortByCreatedAtDesc,
  updateLocalDb,
} from '@/lib/local-db'

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
  dismissals: Array<{ studentId: string; createdAt: string }>,
  studentId: string
) {
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
  block: string
) {
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
      createdAt: new Date().toISOString(),
    }

    state.dismissals.push(created)
    return created
  })
  return serializeDismissal(result)
}

export async function scanNfcAtGate(nfcCode: string) {
  const tag = await getNfcTag(nfcCode)

  if (!tag) throw new Error('NFC tag not found')

  const result = await updateLocalDb(async (state) => {
    let dismissal = getLatestDismissalForStudent(state.dismissals, tag.studentId)
    const nowIso = new Date().toISOString()
    let event: 'student_at_gate' | 'parent_arrived' | 'student_left' = 'student_at_gate'

    if (!dismissal || dismissal.status === 'completed') {
      // Prevent accidental duplicate re-entry immediately after a leaving tap.
      if (dismissal?.finalDismissalTime) {
        const sinceCompleteMs = Date.now() - new Date(dismissal.finalDismissalTime).getTime()
        if (sinceCompleteMs < 10_000) {
          throw new Error('Student already marked as left. Please wait a few seconds before rescanning.')
        }
      }

      dismissal = {
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
        userId: await getUserId(),
        createdAt: nowIso,
      }
      state.dismissals.push(dismissal)
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

    return {
      dismissal,
      event,
    }
  })

  return {
    ...serializeDismissal(result.dismissal),
    event: result.event,
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
      role,
      block,
      phone,
      email,
      isActive: true,
      userId: await getUserId(),
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
