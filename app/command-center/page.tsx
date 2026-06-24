import { getSession } from '@/app/actions/auth'
import { redirect } from 'next/navigation'
import { LayoutWrapper } from '@/components/layout-wrapper'
import { CommandCenterDashboard } from '@/components/command-center-dashboard'

export default async function Page() {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  return (
    <LayoutWrapper userName={session.name || 'Admin'}>
      <CommandCenterDashboard />
    </LayoutWrapper>
  )
}
