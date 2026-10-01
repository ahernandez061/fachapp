import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { FRAMES } from '@/lib/rewards'
import { useImageUrl } from '@/lib/use-image-url'
import { cn, initials } from '@/lib/utils'

type Props = {
  name?: string | null
  username?: string | null
  url?: string | null
  /** Código del marco canjeado en Premios (p. ej. "marco_oro"). */
  frame?: string | null
  className?: string
}

export function UserAvatar({ name, username, url, frame, className }: Props) {
  const { url: src } = useImageUrl(url)
  const avatar = (
    <Avatar className={cn(className, frame && FRAMES[frame] && 'size-full')}>
      {src && <AvatarImage src={src} alt="" />}
      <AvatarFallback>{initials(name || username)}</AvatarFallback>
    </Avatar>
  )
  if (!frame || !FRAMES[frame]) return avatar
  // El marco es un aro de color alrededor del avatar.
  return (
    <span
      className={cn('inline-block shrink-0 rounded-full p-[3px]', FRAMES[frame], className)}
      data-frame={frame}
    >
      <span className="block size-full rounded-full bg-background p-[2px]">{avatar}</span>
    </span>
  )
}
