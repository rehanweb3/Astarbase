'use client'

import { AppLayout } from '@/components/layouts/AppLayout'
import { BackupsPageView } from '@/components/backups/BackupsPageView'

export default function BackupsPage() {
  return (
    <AppLayout headerTitle="Backups">
      <BackupsPageView />
    </AppLayout>
  )
}
