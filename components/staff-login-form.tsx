'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loginStaff, loginStaffViaCard } from '@/app/actions/staff-auth'
import { Wifi, WifiOff, ScanFace } from 'lucide-react'

export function StaffLoginForm() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'error' | 'success'>('error')
  const [isLoading, setIsLoading] = useState(false)
  const [nfcEnabled, setNfcEnabled] = useState(false)
  const nfcInputRef = useRef<HTMLInputElement>(null)

  // Initialize NFC Reader
  useEffect(() => {
    if (typeof window === 'undefined' || !('NDEFReader' in window)) {
      setNfcEnabled(false)
      return
    }

    setNfcEnabled(true)
  }, [])

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const result = await loginStaff(username, password)
      if (result.ok) {
        setMessage('Login successful!')
        setMessageType('success')
        setTimeout(() => router.push('/staff-portal'), 1500)
      } else {
        setMessage(result.error)
        setMessageType('error')
      }
    } catch (error: any) {
      setMessage('Login failed. Please try again.')
      setMessageType('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleNfcLogin = async () => {
    if (!nfcEnabled || !('NDEFReader' in window)) {
      setMessage('NFC is not supported on this device')
      setMessageType('error')
      return
    }

    setMessage('Tap your NFC card...')
    setMessageType('success')
    setIsLoading(true)

    try {
      const reader = new (window as any).NDEFReader()
      await reader.scan()

      reader.onreading = async (event: any) => {
        const decoder = new TextDecoder()
        for (const record of event.message.records) {
          if (record.recordType === 'text') {
            const nfcText = decoder.decode(record.data)
            
            // Attempt login with NFC data
            const result = await loginStaffViaCard(nfcText.trim())
            if (result.ok) {
              setMessage('Welcome!')
              setMessageType('success')
              setTimeout(() => router.push('/staff-portal'), 1000)
            } else {
              setMessage(result.error || 'Invalid NFC card')
              setMessageType('error')
            }
            reader.abort()
            setIsLoading(false)
            return
          }
        }
        setMessage('No valid data on card')
        setMessageType('error')
        reader.abort()
        setIsLoading(false)
      }

      reader.onerror = () => {
        setMessage('NFC scan cancelled')
        setMessageType('error')
        setIsLoading(false)
      }

      // Auto-cancel after 30 seconds
      setTimeout(() => {
        if (isLoading) {
          setMessage('NFC scan timeout')
          setMessageType('error')
          setIsLoading(false)
        }
      }, 30000)
    } catch (error: any) {
      setMessage('NFC scan failed')
      setMessageType('error')
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 rounded-lg border border-border bg-card p-6 shadow-sm">
      {/* Manual Login Form */}
      <form onSubmit={handleManualLogin} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-foreground">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground disabled:opacity-50"
            placeholder="Enter your username"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground disabled:opacity-50"
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-primary py-2.5 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      {/* NFC Status & Button */}
      {nfcEnabled && (
        <>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
            {nfcEnabled ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-700">NFC Ready</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">NFC Not Available</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={handleNfcLogin}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary bg-primary/5 py-2.5 font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
          >
            <ScanFace className="h-4 w-4" />
            {isLoading ? 'Waiting for card...' : 'Tap NFC Card'}
          </button>
        </>
      )}

      {/* Status Message */}
      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            messageType === 'error'
              ? 'border border-red-200 bg-red-50 text-red-700'
              : 'border border-green-200 bg-green-50 text-green-700'
          }`}
        >
          {message}
        </div>
      )}
    </div>
  )
}
