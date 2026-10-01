import { UserRound } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'

export function ProfilePage() {
  return (
    <>
      <PageHeader title="Perfil" />
      <EmptyState
        icon={UserRound}
        title="Inicia sesión"
        description="Crea tu cuenta para tener perfil, puntos e insignias."
      />
    </>
  )
}
