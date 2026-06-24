'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export default function AdminSetupPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleCreateAdmin = async () => {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await authClient.signUp.email({
        email: 'admin@adis.ae',
        password: 'Adis@2025',
        name: 'Admin Staff',
      })

      if (response.data) {
        setMessage('Admin account created successfully!')
        setMessage(
          'Redirecting to login... Use admin@adis.ae / Adis@2025'
        )
        setTimeout(() => {
          router.push('/sign-in')
        }, 2000)
      } else if (response.error) {
        setError(response.error.message || 'Failed to create admin account')
      }
    } catch (err) {
      setError('An error occurred: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md p-8 bg-card rounded-lg border border-border shadow-lg">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-primary">ADIS OT-Connect</h1>
          <p className="text-sm text-muted-foreground mt-1">Admin Account Setup</p>
        </div>

        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-semibold text-amber-900 mb-3">Setup Instructions</h3>
            <ol className="space-y-2 text-sm text-amber-800 list-decimal list-inside">
              <li>Click the button below to create the admin account</li>
              <li>Use these credentials to login:
                <div className="mt-1 ml-4 font-mono bg-white p-2 rounded border border-amber-300">
                  <div>Email: admin@adis.ae</div>
                  <div>Password: Adis@2025</div>
                </div>
              </li>
              <li>After first login, remove/password-protect this page</li>
            </ol>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
              {message}
            </div>
          )}

          <button
            onClick={handleCreateAdmin}
            disabled={loading}
            className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition"
          >
            {loading ? 'Creating Admin Account...' : '+ Create Admin Account'}
          </button>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-red-900 mb-1">Security Warning:</p>
            <p className="text-xs text-red-800">
              Delete or password-protect this page after creating the admin account. Anyone can access it.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
