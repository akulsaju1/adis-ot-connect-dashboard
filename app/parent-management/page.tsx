import { ParentManagement } from '@/components/parent-management'

export const metadata = {
  title: 'Parent Management | ADIS OT Connect',
  description: 'Manage parents and link children for group pickups',
}

export default function ParentManagementPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <ParentManagement />
    </div>
  )
}
