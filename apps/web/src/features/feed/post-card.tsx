import { Flag, Heart, MessageCircle, MoreHorizontal, Target, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Lightbox } from '@/components/lightbox'
import { PhotoCarousel } from '@/components/photo-carousel'
import { RichText } from '@/components/rich-text'
import { UserAvatar } from '@/components/user-avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useMyProfile } from '@/features/auth/session'
import { ReportDialog } from '@/features/social/report-dialog'
import { errorMessage } from '@/lib/errors'
import { formatDateTime, formatNumber, formatRelative } from '@/lib/i18n'
import { provinciaName } from '@/lib/provincias'
import type { FeedPost } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useDeletePost, useToggleLike } from './api'

export function PostCard({ post }: { post: FeedPost }) {
  const { data: me } = useMyProfile()
  const like = useToggleLike()
  const del = useDeletePost()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [viewer, setViewer] = useState<number | null>(null)
  const toggleLike = () => like.mutate(post, { onError: (e) => toast.error(errorMessage(e)) })
  const isMine = me?.id === post.user_id
  const canDelete = isMine || me?.is_admin

  return (
    <article
      className="overflow-hidden rounded-xl border bg-card shadow-sm"
      aria-label={`Publicación de ${post.display_name}`}
    >
      <header className="flex items-center gap-3 p-3">
        <Link
          to={`/u/${post.username}`}
          className="shrink-0"
          aria-label={`Perfil de ${post.display_name || post.username}`}
        >
          <UserAvatar name={post.display_name} username={post.username} url={post.avatar_url} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link to={`/u/${post.username}`} className="block truncate font-semibold hover:underline">
            {post.display_name || post.username}
          </Link>
          <p className="truncate text-xs text-muted-foreground">
            @{post.username}
            {post.provincia && ` · ${provinciaName(post.provincia)}`} ·{' '}
            <time dateTime={post.created_at!} title={formatDateTime(post.created_at!)}>
              {formatRelative(post.created_at!)}
            </time>
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Más opciones">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!isMine && (
              <DropdownMenuItem onSelect={() => setReporting(true)}>
                <Flag /> Reportar
              </DropdownMenuItem>
            )}
            {canDelete && (
              <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(true)}>
                <Trash2 /> Eliminar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {post.mission_title && (
        <Link
          to={`/misiones/${post.mission_id}`}
          className="mx-3 mb-2 flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-sm"
        >
          <Target className="size-4 text-primary" aria-hidden />
          <span className="flex-1 truncate">
            Completó <strong>{post.mission_title}</strong>
          </span>
          <span className="font-bold text-primary">+{formatNumber(post.mission_points ?? 0)}</span>
        </Link>
      )}

      {post.text && <RichText text={post.text} className="px-3 pb-3" />}

      {!!post.images?.length && (
        <PhotoCarousel
          images={post.images}
          alt={post.text || `Foto de ${post.display_name}`}
          // Doble toque = me gusta (nunca lo quita, como en Instagram)
          onDoubleTap={() => !post.liked_by_me && toggleLike()}
          onOpen={setViewer}
        />
      )}

      <footer className="flex items-center gap-1 p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLike}
          aria-pressed={!!post.liked_by_me}
          aria-label={post.liked_by_me ? 'Quitar me gusta' : 'Me gusta'}
        >
          <Heart className={cn(post.liked_by_me && 'fill-red-500 text-red-500')} />
          {formatNumber(post.like_count ?? 0)}
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/p/${post.id}`} aria-label={`Comentarios (${post.comment_count ?? 0})`}>
            <MessageCircle /> {formatNumber(post.comment_count ?? 0)}
          </Link>
        </Button>
      </footer>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="¿Eliminar la publicación?"
        description="No se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        pending={del.isPending}
        onConfirm={() =>
          del.mutate(post.id!, {
            onSuccess: () => {
              setConfirmDelete(false)
              toast.success('Publicación eliminada')
            },
            onError: (e) => toast.error(errorMessage(e)),
          })
        }
      />
      {!!post.images?.length && (
        <Lightbox
          items={post.images.map((path) => ({ path, post }))}
          index={viewer}
          onIndexChange={setViewer}
          onLike={toggleLike}
        />
      )}
      <ReportDialog
        open={reporting}
        onOpenChange={setReporting}
        target={{ type: 'post', id: post.id! }}
      />
    </article>
  )
}

export function PostCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="flex items-center gap-3 p-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="grid flex-1 gap-1.5">
          <Skeleton className="h-3.5 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="p-3">
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  )
}
