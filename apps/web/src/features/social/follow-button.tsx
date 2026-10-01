import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useUserId } from '@/features/auth/session'
import { errorMessage } from '@/lib/errors'
import { useMyFollowing, useToggleFollow } from './api'

export function FollowButton({ userId, size = 'sm' }: { userId: string; size?: 'sm' | 'default' }) {
  const me = useUserId()
  const { data: following } = useMyFollowing()
  const toggle = useToggleFollow()
  if (!me || me === userId) return null
  const isFollowing = following?.has(userId) ?? false

  return (
    <Button
      size={size}
      variant={isFollowing ? 'outline' : 'default'}
      aria-pressed={isFollowing}
      disabled={toggle.isPending}
      onClick={() =>
        toggle.mutate(
          { userId, following: isFollowing },
          { onError: (e) => toast.error(errorMessage(e)) },
        )
      }
    >
      {isFollowing ? 'Siguiendo' : 'Seguir'}
    </Button>
  )
}
