'use server'

import { db } from '@/lib/db'
import { dismissals, nfcTags, staffDirectory } from '@/lib/db/schema'
import { eq, and, desc, inArray } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  // Simple login uses admin user ID from database
  // In a real app, this would be stored in session/JWT
  return 'admin-user-final'
}

// NFC operations
export async function registerNfcTag(
  nfcCode: string,
  studentId: string,
  studentName: string,
  class_: string,
  block: string
) {
  const userId = await getUserId()
  
  const result = await db
    .insert(nfcTags)
    .values({
      nfcCode,
      studentId,
      studentName,
      class: class_,
      block,
    })
    .returning()
  
  revalidatePath('/command-center')
  return result[0]
}

export async function getNfcTag(nfcCode: string) {
  const tag = await db.query.nfcTags.findFirst({
    where: eq(nfcTags.nfcCode, nfcCode),
  })
  return tag || null
}

export async function bulkRegisterStudents(
  students: Array<{ name: string; class: string; block: string; nfcCode: string }>
) {
  const userId = await getUserId()
  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (const s of students) {
    if (!s.name || !s.nfcCode) {
      skipped++
      continue
    }
    try {
      // Skip if NFC code already exists
      const existing = await db.query.nfcTags.findFirst({
        where: eq(nfcTags.nfcCode, s.nfcCode),
      })
      if (existing) {
        skipped++
        continue
      }

      const studentId = `STU-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      await db.insert(nfcTags).values({
        nfcCode: s.nfcCode,
        studentId,
        studentName: s.name,
        class: s.class || '',
        block: s.block || 'Boys Block',
      })

      // Also create a dismissal record so students show in registry
      await db.insert(dismissals).values({
        studentId,
        studentName: s.name,
        class: s.class || '',
        block: s.block || 'Boys Block',
        parentName: '',
        parentPhone: '',
        pickupMethod: 'walk',
        userId,
        status: 'waiting',
      })
      imported++
    } catch (err) {
      errors.push(`${s.name}: ${err instanceof Error ? err.message : 'failed'}`)
      skipped++
    }
  }

  revalidatePath('/student-registry')
  revalidatePath('/command-center')
  return { imported, skipped, errors }
}

export async function regenerateNfcCode(studentName: string, newNfcCode: string) {
  // Find existing NFC tag for this student
  const existingTag = await db.query.nfcTags.findFirst({
    where: eq(nfcTags.studentName, studentName),
  })
  
  if (!existingTag) {
    throw new Error('Student not found in NFC database')
  }
  
  // Update with new NFC code
  const updated = await db
    .update(nfcTags)
    .set({ nfcCode: newNfcCode })
    .where(eq(nfcTags.id, existingTag.id))
    .returning()
  
  revalidatePath('/student-registry')
  revalidatePath('/gate-entrance')
  return updated[0]
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
  
  const result = await db
    .insert(dismissals)
    .values({
      studentId,
      studentName,
      class: class_,
      block,
      parentName,
      parentPhone,
      pickupMethod,
      userId,
      status: 'waiting',
    })
    .returning()
  
  revalidatePath('/command-center')
  revalidatePath('/ground-ops')
  return result[0]
}

export async function scanNfcAtGate(nfcCode: string) {
  const userId = await getUserId()
  const tag = await getNfcTag(nfcCode)
  
  if (!tag) throw new Error('NFC tag not found')
  
  // Check if dismissal exists, if not create it
  let dismissal = await db.query.dismissals.findFirst({
    where: and(
      eq(dismissals.studentId, tag.studentId),
      eq(dismissals.status, 'waiting')
    ),
  })
  
  if (!dismissal) {
    const created = await createDismissal(
      tag.studentId,
      tag.studentName,
      tag.class || '',
      tag.block || '',
      '',
      '',
      'walk'
    )
    dismissal = created
  }
  
  // Update status to at_gate
  const updated = await db
    .update(dismissals)
    .set({
      gateScanTime: new Date(),
      status: 'at_gate',
    })
    .where(eq(dismissals.id, dismissal.id))
    .returning()
  
  revalidatePath('/gate-entrance')
  revalidatePath('/command-center')
  return updated[0]
}

export async function updateDismissalStatus(
  dismissalId: number,
  newStatus: string,
  updates?: Record<string, any>
) {
  const userId = await getUserId()
  
  const updateData: any = { status: newStatus }
  
  if (newStatus === 'parent_arrived') {
    updateData.groundOpsTime = new Date()
  } else if (newStatus === 'completed') {
    updateData.finalDismissalTime = new Date()
  }
  
  if (updates) {
    Object.assign(updateData, updates)
  }
  
  const updated = await db
    .update(dismissals)
    .set(updateData)
    .where(eq(dismissals.id, dismissalId))
    .returning()
  
  revalidatePath('/command-center')
  revalidatePath('/ground-ops')
  return updated[0]
}

export async function getDismissalsByStatus(status: string) {
  const userId = await getUserId()
  
  return db.query.dismissals.findMany({
    where: and(
      eq(dismissals.status, status),
      eq(dismissals.userId, userId)
    ),
    orderBy: [desc(dismissals.createdAt)],
  })
}

export async function getAllDismissals() {
  const userId = await getUserId()
  
  return db.query.dismissals.findMany({
    where: eq(dismissals.userId, userId),
    orderBy: [desc(dismissals.createdAt)],
  })
}

export async function getDismissalStats() {
  const userId = await getUserId()
  
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
  const userId = await getUserId()
  
  const result = await db
    .insert(staffDirectory)
    .values({
      staffName,
      role,
      block,
      phone,
      email,
      userId,
    })
    .returning()
  
  revalidatePath('/staff-directory')
  return result[0]
}

export async function getStaffDirectory() {
  const userId = await getUserId()
  
  return db.query.staffDirectory.findMany({
    where: and(
      eq(staffDirectory.userId, userId),
      eq(staffDirectory.isActive, true)
    ),
  })
}
