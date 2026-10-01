import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { UserAvatar } from '@/components/user-avatar'
import { provinciaName } from '@/lib/provincias'
import { FollowButton } from './follow-button'

type U = {
  id?: string | null
  user_id?: string | null
  username: string | null
  display_name: string | null
  avatar_url: string | null
  provincia?: string | null
}

export function UserRow({
  user,
  extra,
  action,
}: {
  user: U
  extra?: ReactNode
  action?: ReactNode
}) {
  const id = user.id ?? user.user_id
  return (
    <div className="flex items-center gap-3 py-2">
      <Link to={`/u/${user.username}`} className="flex min-w-0 flex-1 items-center gap-3">
        <UserAvatar name={user.display_name} username={user.username} url={user.avatar_url} />
        <div className="min-w-0">
          <p className="truncate font-medium">{user.display_name || user.username}</p>
          <p className="truncate text-xs text-muted-foreground">
            @{user.username}
            {user.provincia && ` · ${provinciaName(user.provincia)}`}
            {extra}
          </p>
        </div>
      </Link>
      {action ?? (id && <FollowButton userId={id} />)}
    </div>
  )
}
