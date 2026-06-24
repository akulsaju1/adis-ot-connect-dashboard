import { getSession } from '@/app/actions/auth'
import { redirect } from 'next/navigation'
import { LayoutWrapper } from '@/components/layout-wrapper'
import { StudentRegistry } from '@/components/student-registry'

export default async function Page() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <LayoutWrapper userName={session.name || 'Admin'} userType="admin">
      <StudentRegistry />
    </LayoutWrapper>
  )
}
