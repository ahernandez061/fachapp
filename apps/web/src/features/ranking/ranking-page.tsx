import { Trophy } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'

export function RankingPage() {
  return (
    <>
      <PageHeader title="Ranking" />
      <EmptyState
        icon={Trophy}
        title="Aún no hay clasificación"
        description="Completa misiones para aparecer en el ranking global, semanal y de tu provincia."
      />
    </>
  )
}
