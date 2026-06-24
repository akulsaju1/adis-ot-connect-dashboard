import { getStaffSession } from '@/app/actions/staff-auth'
import { redirect } from 'next/navigation'
import { StaffLoginForm } from '@/components/staff-login-form'

export default async function Page() {
  const session = await getStaffSession()
  
  if (session) {
    redirect('/staff-portal')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground">Gate Staff Portal</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with your credentials or tap your NFC card
          </p>
        </div>
        
        <StaffLoginForm />

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Admin? <a href="/login" className="text-primary hover:underline">Sign in here</a>
          </p>
        </div>
      </div>
    </div>
  )
}
