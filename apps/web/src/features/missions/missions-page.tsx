import { Target } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'

export function MissionsPage() {
  return (
    <>
      <PageHeader title="Misiones" />
      <EmptyState
        icon={Target}
        title="Pronto habrá misiones"
        description="Aquí aparecerán los retos disponibles para ganar puntos."
      />
    </>
  )
}
