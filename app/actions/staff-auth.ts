'use server'

import { cookies } from 'next/headers'
import { readLocalDb, updateLocalDb, type LocalStaffMember } from '@/lib/local-db'

// Simple password hashing (in production, use bcrypt)
// For now, using a basic implementation
const hashPassword = (password: string): string => {
  // Simple hash implementation - in production use bcrypt
  return Buffer.from(password).toString('base64')
}

const verifyPassword = (password: string, hash: string): boolean => {
  return hashPassword(password) === hash
}

const generateRandomPassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export type StaffSession = {
  id: number
  username: string | null
  staffName: string
  role: string
  isStaff: true
}

export type StaffAuthResult =
  | { ok: true; session: StaffSession }
  | { ok: false; error: string }

// Login staff with username and password
export async function loginStaff(
  username: string,
  password: string
): Promise<StaffAuthResult> {
  if (!username?.trim() || !password?.trim()) {
    return { ok: false, error: 'Username and password are required' }
  }

  try {
    const state = await readLocalDb()
    const staff = state.staffDirectory.find(
      (s) => s.username?.toLowerCase() === username.toLowerCase() && s.isActive
    )

    if (!staff || !staff.passwordHash) {
      return { ok: false, error: 'Invalid username or password' }
    }

    if (!verifyPassword(password, staff.passwordHash)) {
      return { ok: false, error: 'Invalid username or password' }
    }

    // Update last login
    await updateLocalDb(async (state) => {
      const staffMember = state.staffDirectory.find((s) => s.id === staff.id)
      if (staffMember) {
        staffMember.lastLogin = new Date().toISOString()
      }
      return state
    })

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set('staff_session', JSON.stringify({
      id: staff.id,
      username: staff.username,
      staffName: staff.staffName,
      role: staff.role,
      isStaff: true,
    }), {
      httpOnly: true,
      maxAge: 86400 * 7, // 7 days
      sameSite: 'lax',
    })

    const session: StaffSession = {
      id: staff.id,
      username: staff.username,
      staffName: staff.staffName,
      role: staff.role,
      isStaff: true,
    }

    return { ok: true, session }
  } catch (error: any) {
    console.log('[v0] loginStaff error:', error?.message || error)
    return { ok: false, error: 'Login failed. Please try again.' }
  }
}

// Login staff via NFC card (decodes "username.password" from NFC)
export async function loginStaffViaCard(
  nfcCode: string
): Promise<StaffAuthResult> {
  if (!nfcCode?.includes('.')) {
    return { ok: false, error: 'Invalid NFC card format' }
  }

  const parts = nfcCode.split('.')
  if (parts.length !== 2) {
    return { ok: false, error: 'Invalid NFC card format' }
  }

  const [username, password] = parts
  return loginStaff(username, password)
}

// Get current staff session
export async function getStaffSession(): Promise<StaffSession | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('staff_session')

    if (!sessionCookie?.value) {
      return null
    }

    const session = JSON.parse(sessionCookie.value) as StaffSession
    return session
  } catch {
    return null
  }
}

// Logout staff
export async function logoutStaff(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('staff_session')
}

// Create new staff member (admin only)
export async function createStaffMember(
  staffName: string,
  role: string,
  email?: string,
  phone?: string,
  block?: string
): Promise<{ ok: true; staff: LocalStaffMember; displayPassword: string } | { ok: false; error: string }> {
  if (!staffName?.trim() || !role?.trim()) {
    return { ok: false, error: 'Staff name and role are required' }
  }

  try {
    const generatedPassword = generateRandomPassword()
    const username = `staff_${Date.now()}`

    const result = await updateLocalDb(async (state) => {
      // Check if username already exists
      if (state.staffDirectory.some((s) => s.username === username)) {
        throw new Error('Username already exists')
      }

      const newStaff: LocalStaffMember = {
        id: Math.max(0, ...state.staffDirectory.map((s) => s.id)) + 1,
        staffName,
        username,
        passwordHash: hashPassword(generatedPassword),
        role,
        block: block || null,
        phone: phone || null,
        email: email || null,
        nfcLoginFormat: `${username}.${generatedPassword}`,
        isActive: true,
        userId: 'admin',
        lastLogin: null,
        createdAt: new Date().toISOString(),
      }

      state.staffDirectory.push(newStaff)
      return newStaff
    })

    return {
      ok: true,
      staff: result,
      displayPassword: generatedPassword,
    }
  } catch (error: any) {
    console.log('[v0] createStaffMember error:', error?.message || error)
    return { ok: false, error: 'Failed to create staff member' }
  }
}

// Get all active staff members (admin only)
export async function getAllStaffMembers(): Promise<LocalStaffMember[]> {
  try {
    const state = await readLocalDb()
    return state.staffDirectory.filter((s) => s.isActive)
  } catch {
    return []
  }
}

// Update staff password
export async function updateStaffPassword(
  staffId: number,
  newPassword: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!newPassword?.trim() || newPassword.length < 6) {
    return { ok: false, error: 'Password must be at least 6 characters' }
  }

  try {
    await updateLocalDb(async (state) => {
      const staff = state.staffDirectory.find((s) => s.id === staffId)
      if (!staff) {
        throw new Error('Staff member not found')
      }

      staff.passwordHash = hashPassword(newPassword)
      return state
    })

    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: 'Failed to update password' }
  }
}

// Deactivate staff member (admin only)
export async function deactivateStaffMember(
  staffId: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await updateLocalDb(async (state) => {
      const staff = state.staffDirectory.find((s) => s.id === staffId)
      if (!staff) {
        throw new Error('Staff member not found')
      }

      staff.isActive = false
      return state
    })

    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: 'Failed to deactivate staff member' }
  }
}
