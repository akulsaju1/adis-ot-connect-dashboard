'use server'

import { Pool } from 'pg'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const DEFAULT_ADMIN_USERNAME = 'admin'
const DEFAULT_ADMIN_EMAIL = 'admin@adis.ae'
const DEFAULT_ADMIN_PASSWORD = 'Adis@2025'

async function ensureAdminTableAndSeed() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      password TEXT NOT NULL,
      name TEXT,
      created_at TIMESTAMP DEFAULT now()
    )
  `)

  // Backfill email support for existing databases.
  await pool.query(`ALTER TABLE admin ADD COLUMN IF NOT EXISTS email TEXT UNIQUE`)

  const existing = await pool.query(
    'SELECT id FROM admin WHERE username = $1 OR email = $2 LIMIT 1',
    [DEFAULT_ADMIN_USERNAME, DEFAULT_ADMIN_EMAIL]
  )

  if (existing.rows.length === 0) {
    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10)
    await pool.query(
      `INSERT INTO admin (username, email, password, name)
       VALUES ($1, $2, $3, $4)` ,
      [DEFAULT_ADMIN_USERNAME, DEFAULT_ADMIN_EMAIL, hashedPassword, 'Admin Staff']
    )
  }
}

export async function loginAdmin(username: string, password: string) {
  try {
    if (!process.env.DATABASE_URL) {
      return { success: false, error: 'DATABASE_URL is not configured' }
    }

    await ensureAdminTableAndSeed()

    const result = await pool.query(
      'SELECT * FROM admin WHERE username = $1 OR email = $1 LIMIT 1',
      [username]
    )

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

    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('DATABASE_URL')) {
      return { success: false, error: 'Database connection is not configured' }
    }

    return { success: false, error: `An error occurred during login: ${message}` }
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
