'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginAdmin } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await loginAdmin(username, password)
      if (result.success) {
        router.push('/command-center')
        router.refresh()
      } else {
        setError(result.error || 'Login failed')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),_transparent_24%),linear-gradient(135deg,_#0f172a_0%,_#1e3a8a_52%,_#2563eb_100%)] px-4 flex items-center justify-center">
      <div className="w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white/95 shadow-[0_30px_100px_rgba(15,23,42,0.35)] ring-1 ring-white/15 grid lg:grid-cols-[0.95fr_1.05fr]">
        <section className="hidden lg:flex flex-col justify-between bg-slate-950 p-10 text-white">
          <div>
            <div className="mb-8 flex justify-center">
              <img 
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo-1-zoFmQvusRlyZECyVQKBwJ9i9f9aPw7.webp" 
                alt="Abu Dhabi Indian School Logo" 
                className="h-40 w-40 object-contain"
              />
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.28em] text-white/70">
              ADIS AL WATHBA
            </div>
            <h1 className="mt-6 text-4xl font-semibold leading-tight text-balance">OT-Connect</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
              Professional dismissal management for a faster, clearer, and safer campus workflow.
            </p>
          </div>
        </section>

        <section className="p-6 sm:p-8 lg:p-10">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Administration</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Login</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Sign in to access the command center and dismissal tools.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-foreground">
                Username or Email
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin or admin@adis.ae"
                className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                required
              />
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-xl text-sm font-medium shadow-sm"
            >
              {loading ? 'Logging in...' : 'Login'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </section>
        </div>
    </main>
  )
}
