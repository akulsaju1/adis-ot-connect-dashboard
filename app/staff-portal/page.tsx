import { getStaffSession } from '@/app/actions/staff-auth'
import { redirect } from 'next/navigation'
import { LayoutWrapper } from '@/components/layout-wrapper'
import { DispersalConsole } from '@/components/dispersal-console'

export default async function Page() {
  const session = await getStaffSession()
  
  if (!session) {
    redirect('/staff-login')
  }

  return (
    <LayoutWrapper userName={session.staffName || 'Staff'} userType="staff">
      <div className="h-full overflow-auto p-8">
        <h1 className="mb-2 text-3xl font-bold text-foreground">Welcome, {session.staffName}</h1>
        <p className="mb-8 text-muted-foreground">Manage student dispersals and pickups across all groups</p>
        <DispersalConsole />
      </div>
    </LayoutWrapper>
  )
}
