'use server'

import { Pool } from 'pg'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function loginAdmin(username: string, password: string) {
  try {
    const result = await pool.query('SELECT * FROM admin WHERE username = $1', [username])

    if (result.rows.length === 0) {
      return { success: false, error: 'Invalid username or password' }
    }

    const admin = result.rows[0]
    const isPasswordValid = await bcrypt.compare(password, admin.password)

    if (!isPasswordValid) {
      return { success: false, error: 'Invalid username or password' }
    }

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set('admin_session', admin.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return { success: true }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'An error occurred during login' }
  }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('admin_session')
}

export async function getSession() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('admin_session')?.value

  if (!sessionId) {
    return null
  }

  try {
    const result = await pool.query('SELECT * FROM admin WHERE id = $1', [parseInt(sessionId)])
    return result.rows[0] || null
  } catch (error) {
    console.error('Session error:', error)
    return null
  }
}
