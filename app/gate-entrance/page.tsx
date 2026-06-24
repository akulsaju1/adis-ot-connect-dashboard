import { getSession } from '@/app/actions/auth'
import { redirect } from 'next/navigation'
import { LayoutWrapper } from '@/components/layout-wrapper'
import { GateEntranceScanner } from '@/components/gate-entrance-scanner'

export default async function Page() {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  return (
    <LayoutWrapper userName={session.name || 'Admin'}>
      <GateEntranceScanner />
    </LayoutWrapper>
  )
}
