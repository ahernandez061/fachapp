import { ArrowLeft, Users } from 'lucide-react'
import { useNavigate, useParams } from 'react-router'
import { EmptyState } from '@/components/empty-state'
import { ErrorState, PageLoader } from '@/components/states'
import { Button } from '@/components/ui/button'
import { useFollowList } from '@/features/social/api'
import { UserRow } from '@/features/social/user-row'
import { useProfileByUsername } from './api'

export function FollowListPage({ kind }: { kind: 'followers' | 'following' }) {
  const { username } = useParams()
  const navigate = useNavigate()
  const profile = useProfileByUsername(username)
  const list = useFollowList(profile.data?.id, kind)
  const title = kind === 'followers' ? 'Seguidores' : 'Siguiendo'

  if (profile.isLoading || list.isLoading) return <PageLoader />
  if (list.error) return <ErrorState error={list.error} />

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Volver">
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-bold">
          {title} <span className="text-base font-normal text-muted-foreground">@{username}</span>
        </h1>
      </div>
      {list.data?.length === 0 ? (
        <EmptyState
          icon={Users}
          title={kind === 'followers' ? 'Aún no tiene seguidores' : 'Aún no sigue a nadie'}
        />
      ) : (
        <ul className="divide-y">
          {list.data?.map((u) => (
            <li key={u.id}>
              <UserRow user={u} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
