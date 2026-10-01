import { Users } from 'lucide-react'
import { Link } from 'react-router'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'

export function FeedPage() {
  return (
    <>
      <PageHeader title="Feed" />
      <EmptyState
        icon={Users}
        title="Tu feed está vacío"
        description="Completa misiones y sigue a tus amigos para ver aquí lo que hacen."
        action={
          <Button asChild>
            <Link to="/misiones">Ver misiones</Link>
          </Button>
        }
      />
    </>
  )
}
