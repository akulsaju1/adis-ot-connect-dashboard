'use server'

import {
  nextId,
  readLocalDb,
  updateLocalDb,
  type DispersalGroupId,
  type DispersalSession,
  type PickupLog,
} from '@/lib/local-db'
import { sendPickupEmail } from './email'

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

async function getUserId() {
  return 'admin-user-final'
}

export type { DispersalGroupId }

export type DispersalResult =
  | {
      ok: true
      message: string
      sessionId?: string
      pickupId?: string
    }
  | {
      ok: false
      error: string
    }

/**
 * Start a dispersal session for a group
 */
export async function startDispersalSession(
  groupId: DispersalGroupId
): Promise<DispersalResult> {
  try {
    const result = await updateLocalDb(async (state) => {
      // Check if there's already an active session for this group
      const activeSession = state.dispersalSessions.find(
        (s) => s.groupId === groupId && s.endedAt === null
      )

      if (activeSession) {
        return {
          ok: false,
          error: `Dispersal session already active for ${groupId}`,
        }
      }

      const session: DispersalSession = {
        id: generateId(),
        groupId,
        startedAt: new Date().toISOString(),
        endedAt: null,
        userId: await getUserId(),
        createdAt: new Date().toISOString(),
      }

      state.dispersalSessions.push(session)
      return { ok: true, sessionId: session.id }
    })

    return result as DispersalResult
  } catch (error: any) {
    console.log('[v0] startDispersalSession error:', error?.message)
    return {
      ok: false,
      error: 'Failed to start dispersal session. Please try again.',
    }
  }
}

/**
 * End a dispersal session for a group
 */
export async function endDispersalSession(sessionId: string): Promise<DispersalResult> {
  try {
    const result = await updateLocalDb(async (state) => {
      const session = state.dispersalSessions.find((s) => s.id === sessionId)

      if (!session) {
        return {
          ok: false,
          error: 'Session not found',
        }
      }

      if (session.endedAt) {
        return {
          ok: false,
          error: 'Session already ended',
        }
      }

      session.endedAt = new Date().toISOString()
      return { ok: true }
    })

    return result as DispersalResult
  } catch (error: any) {
    console.log('[v0] endDispersalSession error:', error?.message)
    return {
      ok: false,
      error: 'Failed to end dispersal session. Please try again.',
    }
  }
}

/**
 * Process a student pickup during dispersal
 * One tap only - rejects double taps
 */
export async function pickupStudentInSession(
  nfcCode: string,
  sessionId: string,
  groupId: DispersalGroupId
): Promise<DispersalResult> {
  try {
    const trimmed = (nfcCode || '').trim()
    if (!trimmed) {
      return { ok: false, error: 'No NFC code provided.' }
    }

    const result = await updateLocalDb(async (state) => {
      // Verify session exists and is active
      const session = state.dispersalSessions.find((s) => s.id === sessionId)
      if (!session || session.endedAt) {
        return { ok: false, error: 'Dispersal session is not active.' }
      }

      // Find the NFC tag
      const tag = state.nfcTags.find((t) => t.nfcCode === trimmed)
      if (!tag) {
        return { ok: false, error: `No student registered to this tag.` }
      }

      // Check if already picked up in this session (double-tap prevention)
      const alreadyPickedUp = state.pickupLogs.find(
        (log) =>
          log.sessionId === sessionId &&
          log.studentId === tag.studentId &&
          log.overriddenAt === null
      )

      if (alreadyPickedUp) {
        return {
          ok: false,
          error: `${tag.studentName} already picked up in this session.`,
        }
      }

      // Create pickup log
      const pickupLogId = generateId()
      const now = new Date().toISOString()
      const pickupLog: PickupLog = {
        id: pickupLogId,
        studentId: tag.studentId,
        studentName: tag.studentName,
        grNumber: tag.grNumber,
        class: tag.class,
        sessionId,
        groupId,
        parentEmail: tag.parentEmail,
        pickedUpAt: now,
        overriddenAt: null,
        createdAt: now,
      }

      state.pickupLogs.push(pickupLog)

      // Send email notification if email is available
      if (tag.parentEmail) {
        try {
          await sendPickupEmail(
            tag.parentEmail,
            tag.studentName,
            tag.grNumber || tag.studentId,
            tag.class
          )
        } catch (emailError) {
          console.log('[v0] Email send failed (non-fatal):', emailError)
          // Continue - email is optional
        }
      }

      return {
        ok: true,
        pickupId: pickupLogId,
        message: `${tag.studentName} (${tag.class}) picked up successfully.`,
      }
    })

    return result as DispersalResult
  } catch (error: any) {
    console.log('[v0] pickupStudentInSession error:', error?.message)
    return {
      ok: false,
      error: 'Pickup failed. Please try again.',
    }
  }
}

/**
 * Admin: Override/undo a pickup tap
 */
export async function undoPickup(pickupLogId: string, sessionId: string): Promise<DispersalResult> {
  try {
    const result = await updateLocalDb(async (state) => {
      const pickupLog = state.pickupLogs.find((log) => log.id === pickupLogId)

      if (!pickupLog) {
        return { ok: false, error: 'Pickup log not found.' }
      }

      if (pickupLog.sessionId !== sessionId) {
        return { ok: false, error: 'Pickup does not belong to this session.' }
      }

      if (pickupLog.overriddenAt) {
        return { ok: false, error: 'Pickup already overridden.' }
      }

      // Mark as overridden instead of deleting (immutable logs)
      pickupLog.overriddenAt = new Date().toISOString()

      return {
        ok: true,
        message: `Pickup for ${pickupLog.studentName} has been removed.`,
      }
    })

    return result as DispersalResult
  } catch (error: any) {
    console.log('[v0] undoPickup error:', error?.message)
    return {
      ok: false,
      error: 'Failed to remove pickup. Please try again.',
    }
  }
}

/**
 * Get all pickup logs for a dispersal session
 */
export async function getPickupLogsForSession(sessionId: string) {
  try {
    const state = await readLocalDb()
    const logs = state.pickupLogs
      .filter((log) => log.sessionId === sessionId && log.overriddenAt === null)
      .sort((a, b) => new Date(b.pickedUpAt).getTime() - new Date(a.pickedUpAt).getTime())

    return { ok: true as const, logs }
  } catch (error: any) {
    console.log('[v0] getPickupLogsForSession error:', error?.message)
    return { ok: false as const, error: 'Failed to fetch pickup logs.' }
  }
}

/**
 * Get active dispersal session for a group
 */
export async function getActiveSessionForGroup(groupId: DispersalGroupId) {
  try {
    const state = await readLocalDb()
    const session = state.dispersalSessions.find((s) => s.groupId === groupId && s.endedAt === null)
    return { ok: true as const, session: session || null }
  } catch (error: any) {
    console.log('[v0] getActiveSessionForGroup error:', error?.message)
    return { ok: false as const, error: 'Failed to fetch session.' }
  }
}

/**
 * Get all dispersal sessions (for admin logs)
 */
export async function getAllDispersalSessions() {
  try {
    const state = await readLocalDb()
    const sessions = state.dispersalSessions.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    return { ok: true as const, sessions }
  } catch (error: any) {
    console.log('[v0] getAllDispersalSessions error:', error?.message)
    return { ok: false as const, error: 'Failed to fetch sessions.' }
  }
}

/**
 * Get all pickup logs for a group within a date range
 */
export async function getPickupLogsByGroup(
  groupId: DispersalGroupId,
  startDate?: string,
  endDate?: string
) {
  try {
    const state = await readLocalDb()
    let logs = state.pickupLogs.filter((log) => log.groupId === groupId)

    if (startDate) {
      const start = new Date(startDate).getTime()
      logs = logs.filter((log) => new Date(log.pickedUpAt).getTime() >= start)
    }

    if (endDate) {
      const end = new Date(endDate).getTime()
      logs = logs.filter((log) => new Date(log.pickedUpAt).getTime() <= end)
    }

    logs.sort((a, b) => new Date(b.pickedUpAt).getTime() - new Date(a.pickedUpAt).getTime())
    return { ok: true as const, logs }
  } catch (error: any) {
    console.log('[v0] getPickupLogsByGroup error:', error?.message)
    return { ok: false as const, error: 'Failed to fetch logs.' }
  }
}
