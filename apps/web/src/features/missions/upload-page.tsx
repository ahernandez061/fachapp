import { Camera } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'

export function UploadPage() {
  return (
    <>
      <PageHeader title="Subir prueba" />
      <EmptyState
        icon={Camera}
        title="Sube tu prueba"
        description="Elige una misión y sube una foto para completarla."
      />
    </>
  )
}
