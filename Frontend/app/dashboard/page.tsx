'use client'

import { AppLayout } from '@/components/layouts/AppLayout'
import { ProjectHomeView } from '@/components/dashboard/ProjectHomeView'

export default function DashboardPage() {
  return (
    <AppLayout headerTitle="Home">
      <ProjectHomeView />
    </AppLayout>
  )
}
