import { Images } from 'lucide-react'
import { useState } from 'react'
import { Lightbox, type GalleryItem } from '@/components/lightbox'
import { StorageImage } from '@/components/storage-image'
import { Skeleton } from '@/components/ui/skeleton'
import { useToggleLike } from '@/features/feed/api'
import type { FeedPost } from '@/lib/types'

type Props = {
  posts: FeedPost[]
  /** 'post': una casilla por publicación (icono si tiene varias fotos). 'photo': una por foto. */
  mode?: 'post' | 'photo'
  label: string
}

/** Cuadrícula de fotos estilo Instagram que abre el visor a pantalla completa. */
export function PhotoGrid({ posts, mode = 'photo', label }: Props) {
  const like = useToggleLike()
  const [index, setIndex] = useState<number | null>(null)

  const items: GalleryItem[] = posts.flatMap((post) =>
    (mode === 'post' ? (post.images ?? []).slice(0, 1) : (post.images ?? [])).map((path) => ({
      path,
      post,
    })),
  )
  // En el visor siempre se navega foto a foto.
  const viewerItems: GalleryItem[] = posts.flatMap((post) =>
    (post.images ?? []).map((path) => ({ path, post })),
  )
  // Mantiene el estado de "me gusta" actualizado en el visor.
  const live = (post: FeedPost) => posts.find((p) => p.id === post.id) ?? post

  function open(item: GalleryItem) {
    setIndex(viewerItems.findIndex((v) => v.path === item.path && v.post.id === item.post.id))
  }

  return (
    <>
      <ul className="grid grid-cols-3 gap-1" aria-label={label}>
        {items.map((item) => (
          <li key={item.post.id + item.path} className="relative">
            <button
              type="button"
              className="block w-full"
              onClick={() => open(item)}
              aria-label={`Ver foto de ${item.post.display_name}${item.post.mission_title ? ` · ${item.post.mission_title}` : ''}`}
            >
              <StorageImage path={item.path} alt="" className="aspect-square w-full" />
              {mode === 'post' && (item.post.images?.length ?? 0) > 1 && (
                <Images
                  className="absolute top-1.5 right-1.5 size-4 text-white drop-shadow"
                  aria-hidden
                />
              )}
            </button>
          </li>
        ))}
      </ul>
      <Lightbox
        items={viewerItems.map((v) => ({ ...v, post: live(v.post) }))}
        index={index}
        onIndexChange={setIndex}
        onLike={(post) => like.mutate(post)}
      />
    </>
  )
}

export function PhotoGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-1">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="aspect-square rounded-none" />
      ))}
    </div>
  )
}
