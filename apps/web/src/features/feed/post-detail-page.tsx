import { ArrowLeft, MessageCircle, Send, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { EmptyState } from '@/components/empty-state'
import { RichText } from '@/components/rich-text'
import { ErrorState, PageLoader, Spinner } from '@/components/states'
import { UserAvatar } from '@/components/user-avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMyProfile } from '@/features/auth/session'
import { errorMessage } from '@/lib/errors'
import { formatDateTime, formatRelative } from '@/lib/i18n'
import { containsOffensive, OFFENSIVE_MESSAGE } from '@/lib/offensive'
import { useAddComment, useComments, useDeleteComment, usePost } from './api'
import { PostCard } from './post-card'

export function PostDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const post = usePost(id)
  const comments = useComments(id)
  const add = useAddComment(id ?? '')
  const del = useDeleteComment(id ?? '')
  const { data: me } = useMyProfile()
  const [text, setText] = useState('')

  if (post.isLoading) return <PageLoader />
  if (post.error) return <ErrorState error={post.error} onRetry={() => post.refetch()} />
  if (!post.data)
    return (
      <EmptyState
        icon={MessageCircle}
        title="Publicación no disponible"
        description="Puede que se haya borrado."
      />
    )

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    if (containsOffensive(text)) return toast.error(OFFENSIVE_MESSAGE)
    try {
      await add.mutateAsync(text)
      setText('')
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <div className="grid gap-4">
      <Button variant="ghost" size="sm" className="w-fit" onClick={() => navigate(-1)}>
        <ArrowLeft /> Volver
      </Button>
      <PostCard post={post.data} />

      <section aria-labelledby="comments-title" className="grid gap-3">
        <h2 id="comments-title" className="font-semibold">
          Comentarios
        </h2>
        <form onSubmit={onSubmit} className="flex gap-2">
          <Input
            placeholder="Escribe un comentario…"
            aria-label="Escribe un comentario"
            maxLength={300}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Button
            type="submit"
            size="icon"
            disabled={add.isPending || !text.trim()}
            aria-label="Enviar comentario"
          >
            {add.isPending ? <Spinner /> : <Send />}
          </Button>
        </form>
        {comments.isLoading ? (
          <Spinner />
        ) : comments.data?.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sé el primero en comentar.</p>
        ) : (
          <ul className="grid gap-3">
            {comments.data?.map((c) => (
              <li key={c.id} className="flex gap-3">
                <Link
                  to={`/u/${c.author?.username}`}
                  aria-label={`Perfil de ${c.author?.display_name || c.author?.username}`}
                >
                  <UserAvatar
                    name={c.author?.display_name}
                    username={c.author?.username}
                    url={c.author?.avatar_url}
                    className="size-8"
                  />
                </Link>
                <div className="min-w-0 flex-1 rounded-lg bg-muted px-3 py-2">
                  <p className="text-sm">
                    <Link to={`/u/${c.author?.username}`} className="font-semibold hover:underline">
                      {c.author?.display_name || c.author?.username}
                    </Link>{' '}
                    <time
                      className="text-xs text-muted-foreground"
                      dateTime={c.created_at}
                      title={formatDateTime(c.created_at)}
                    >
                      {formatRelative(c.created_at)}
                    </time>
                  </p>
                  <RichText text={c.text} className="text-sm" />
                </div>
                {(c.user_id === me?.id || post.data?.user_id === me?.id || me?.is_admin) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label="Borrar comentario"
                    onClick={() =>
                      del.mutate(c.id, { onError: (e) => toast.error(errorMessage(e)) })
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
