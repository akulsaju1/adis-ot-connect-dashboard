import { getSession } from '@/app/actions/auth'
import { redirect } from 'next/navigation'

export default async function Page() {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }
  
  redirect('/command-center')
}
