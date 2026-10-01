import { ChevronLeft, ChevronRight, Heart, MessageCircle, XIcon } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { useEffect } from 'react'
import { Link } from 'react-router'
import { RichText } from '@/components/rich-text'
import { StorageImage } from '@/components/storage-image'
import { UserAvatar } from '@/components/user-avatar'
import { Button } from '@/components/ui/button'
import { formatNumber, formatRelative } from '@/lib/i18n'
import type { FeedPost } from '@/lib/types'
import { cn } from '@/lib/utils'

/** Una foto de la galería: la imagen y el post al que pertenece. */
export type GalleryItem = { path: string; post: FeedPost }

type Props = {
  items: GalleryItem[]
  index: number | null
  onIndexChange: (i: number | null) => void
  onLike?: (post: FeedPost) => void
}

/** Visor de fotos a pantalla completa con navegación (flechas, teclado) y "me gusta". */
export function Lightbox({ items, index, onIndexChange, onLike }: Props) {
  const open = index !== null && !!items[index]
  const item = open ? items[index] : null
  const go = (d: number) =>
    index !== null && onIndexChange((index + d + items.length) % items.length)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onIndexChange(null)}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/95" />
        <DialogPrimitive.Content className="fixed inset-0 z-50 flex flex-col bg-black text-white outline-none">
          <DialogPrimitive.Title className="sr-only">
            {item ? `Foto de ${item.post.display_name}` : 'Foto'}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Usa las flechas para ver más fotos.
          </DialogPrimitive.Description>
          {item && (
            <>
              <header className="flex items-center gap-3 p-3 pt-[max(env(safe-area-inset-top),0.75rem)]">
                <UserAvatar
                  name={item.post.display_name}
                  username={item.post.username}
                  url={item.post.avatar_url}
                  className="size-8"
                />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="truncate font-semibold">{item.post.display_name}</p>
                  <p className="text-xs text-white/70">{formatRelative(item.post.created_at!)}</p>
                </div>
                <span className="text-sm text-white/70">
                  {index! + 1}/{items.length}
                </span>
                <DialogPrimitive.Close
                  className="rounded-full p-2 hover:bg-white/10"
                  aria-label="Cerrar"
                >
                  <XIcon className="size-6" />
                </DialogPrimitive.Close>
              </header>

              <div className="relative flex min-h-0 flex-1 items-center justify-center">
                <StorageImage
                  path={item.path}
                  alt={item.post.text || `Foto de ${item.post.display_name}`}
                  className="max-h-full w-full object-contain"
                />
                {items.length > 1 && (
                  <>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute left-2 rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white"
                      onClick={() => go(-1)}
                      aria-label="Foto anterior"
                    >
                      <ChevronLeft className="size-6" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute right-2 rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white"
                      onClick={() => go(1)}
                      aria-label="Foto siguiente"
                    >
                      <ChevronRight className="size-6" />
                    </Button>
                  </>
                )}
              </div>

              <footer className="grid gap-2 p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
                {item.post.text && (
                  <RichText
                    text={item.post.text}
                    className="line-clamp-3 text-sm [&_a]:text-orange-300"
                  />
                )}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10 hover:text-white"
                    onClick={() => onLike?.(item.post)}
                    aria-pressed={!!item.post.liked_by_me}
                    aria-label={item.post.liked_by_me ? 'Quitar me gusta' : 'Me gusta'}
                  >
                    <Heart className={cn(item.post.liked_by_me && 'fill-red-500 text-red-500')} />
                    {formatNumber(item.post.like_count ?? 0)}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10 hover:text-white"
                    asChild
                  >
                    <Link to={`/p/${item.post.id}`} onClick={() => onIndexChange(null)}>
                      <MessageCircle /> {formatNumber(item.post.comment_count ?? 0)} · Ver
                      publicación
                    </Link>
                  </Button>
                </div>
              </footer>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
