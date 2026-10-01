import { ArrowLeft, Hash, LayoutGrid, List } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { EmptyState } from '@/components/empty-state'
import { PhotoGrid, PhotoGridSkeleton } from '@/components/photo-grid'
import { ErrorState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { PostCard } from '@/features/feed/post-card'
import { formatNumber } from '@/lib/i18n'
import { usePostsByTag } from './api'

export function TagPage() {
  const { tag = '' } = useParams()
  const navigate = useNavigate()
  const posts = usePostsByTag(tag)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const withPhotos = posts.data?.filter((p) => p.images?.length) ?? []

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Volver">
          <ArrowLeft />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold">#{tag}</h1>
          <p className="text-sm text-muted-foreground">
            {formatNumber(posts.data?.length ?? 0)} publicaciones
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
          aria-label={view === 'grid' ? 'Ver como lista' : 'Ver como cuadrícula'}
        >
          {view === 'grid' ? <List /> : <LayoutGrid />}
        </Button>
      </div>

      {posts.isLoading ? (
        <PhotoGridSkeleton />
      ) : posts.error ? (
        <ErrorState error={posts.error} onRetry={() => posts.refetch()} />
      ) : !posts.data?.length ? (
        <EmptyState
          icon={Hash}
          title={`Nadie ha usado #${tag} todavía`}
          description="Sé el primero: escríbelo en tu próxima publicación."
          action={
            <Button asChild>
              <Link to="/subir?mision=__libre__">Publicar</Link>
            </Button>
          }
        />
      ) : view === 'grid' && withPhotos.length ? (
        <PhotoGrid posts={withPhotos} mode="post" label={`Fotos con #${tag}`} />
      ) : (
        <div className="grid gap-4">
          {posts.data.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  )
}
