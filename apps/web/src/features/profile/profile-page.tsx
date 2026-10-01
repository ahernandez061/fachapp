import {
  Ban,
  Camera,
  Flag,
  Gift,
  Grid3x3,
  Rows3,
  MoreHorizontal,
  Settings,
  Target,
  UserRoundX,
} from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { EmptyState } from '@/components/empty-state'
import { PhotoGrid, PhotoGridSkeleton } from '@/components/photo-grid'
import { ErrorState, PageLoader } from '@/components/states'
import { UserAvatar } from '@/components/user-avatar'
import { useRewards } from '@/features/rewards/api'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMyProfile } from '@/features/auth/session'
import { XIcon } from '@/features/auth/oauth-buttons'
import { useUserPosts } from '@/features/feed/api'
import { PostCard } from '@/features/feed/post-card'
import { useMyBlocks, useToggleBlock } from '@/features/social/api'
import { FollowButton } from '@/features/social/follow-button'
import { ReportDialog } from '@/features/social/report-dialog'
import { errorMessage } from '@/lib/errors'
import { formatDate, formatNumber } from '@/lib/i18n'
import { levelProgress, levelTitle } from '@/lib/levels'
import { provinciaName } from '@/lib/provincias'
import {
  useAllBadges,
  useCompletedMissions,
  useProfileByUsername,
  useProfileStats,
  useUserBadges,
} from './api'
import { BadgeIcon } from './badge-icon'

/** /perfil → redirige a mi perfil público. */
export function MyProfileRedirect() {
  const { data } = useMyProfile()
  if (!data) return <PageLoader />
  return <Navigate to={`/u/${data.username}`} replace />
}

function Stat({ value, label, to }: { value: number | undefined; label: string; to?: string }) {
  const content = (
    <>
      <span className="block text-lg font-bold">
        {value === undefined ? '–' : formatNumber(value)}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </>
  )
  return to ? (
    <Link to={to} className="rounded-md p-1 text-center hover:bg-muted">
      {content}
    </Link>
  ) : (
    <div className="p-1 text-center">{content}</div>
  )
}

export function ProfilePage() {
  const { username } = useParams()
  const { data: me } = useMyProfile()
  const profile = useProfileByUsername(username)
  const id = profile.data?.id
  const stats = useProfileStats(id)
  const badges = useAllBadges()
  const earned = useUserBadges(id)
  const posts = useUserPosts(id)
  const completed = useCompletedMissions(id)
  const blocks = useMyBlocks()
  const rewards = useRewards()
  const toggleBlock = useToggleBlock()
  const [reporting, setReporting] = useState(false)
  const [confirmBlock, setConfirmBlock] = useState(false)

  if (profile.isLoading) return <PageLoader />
  if (profile.error) return <ErrorState error={profile.error} onRetry={() => profile.refetch()} />
  if (!profile.data) return <EmptyState icon={UserRoundX} title="Este usuario no existe" />

  const p = profile.data
  const titleName = rewards.data?.find((r) => r.code === p.equipped_title)?.name
  const isMe = me?.id === p.id
  const isBlocked = blocks.data?.some((b) => b.blocked_id === p.id) ?? false
  const progress = levelProgress(stats.data?.total_points ?? 0)
  const photos = (posts.data ?? []).filter((post) => post.images?.length)
  const photoCount = photos.reduce((n, post) => n + (post.images?.length ?? 0), 0)

  return (
    <div className="grid gap-5">
      <section className="grid gap-4">
        <div className="flex items-center gap-4">
          <UserAvatar
            name={p.display_name}
            username={p.username}
            url={p.avatar_url}
            frame={p.equipped_frame}
            className="size-20 text-2xl"
          />
          <div className="grid flex-1 grid-cols-3">
            <Stat value={stats.data?.total_points} label="Puntos" />
            <Stat
              value={stats.data?.followers}
              label="Seguidores"
              to={`/u/${p.username}/seguidores`}
            />
            <Stat
              value={stats.data?.following}
              label="Siguiendo"
              to={`/u/${p.username}/siguiendo`}
            />
          </div>
        </div>
        <div>
          <h1 className="text-xl font-bold">{p.display_name || p.username}</h1>
          {titleName && (
            <p className="mb-0.5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              🏅 {titleName}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            @{p.username}
            {p.provincia && ` · ${provinciaName(p.provincia)}`}
            {p.x_username && (
              <span className="ml-1 inline-flex items-center gap-1">
                · <XIcon className="size-3" /> @{p.x_username}
              </span>
            )}
          </p>
          {p.bio && <p className="mt-2 whitespace-pre-line">{p.bio}</p>}
          <p className="mt-1 text-xs text-muted-foreground">
            En FachApp desde {formatDate(p.created_at)}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-3">
          <div className="mb-1.5 flex items-baseline justify-between text-sm">
            <span className="font-semibold">
              Nivel {progress.level} · {levelTitle(progress.level)}
            </span>
            <span className="text-xs text-muted-foreground">
              {stats.data?.global_rank ? `#${stats.data.global_rank} global · ` : ''}
              {formatNumber(progress.remaining)} pts para subir
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label="Progreso de nivel"
            aria-valuenow={progress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>

        <div className="flex gap-2">
          {isMe ? (
            <>
              <Button variant="outline" className="flex-1" asChild>
                <Link to="/editar-perfil">Editar perfil</Link>
              </Button>
              <Button className="flex-1" asChild>
                <Link to="/premios">
                  <Gift /> Premios
                </Link>
              </Button>
              <Button variant="outline" size="icon" asChild>
                <Link to="/ajustes" aria-label="Ajustes">
                  <Settings />
                </Link>
              </Button>
            </>
          ) : (
            <>
              {!isBlocked && (
                <div className="flex-1 [&>button]:w-full">
                  <FollowButton userId={p.id} size="default" />
                </div>
              )}
              {isBlocked && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => toggleBlock.mutate({ userId: p.id, blocked: true })}
                >
                  Desbloquear
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Más opciones">
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setReporting(true)}>
                    <Flag /> Reportar
                  </DropdownMenuItem>
                  {!isBlocked && (
                    <DropdownMenuItem variant="destructive" onSelect={() => setConfirmBlock(true)}>
                      <Ban /> Bloquear
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </section>

      <section aria-labelledby="badges-title">
        <h2 id="badges-title" className="mb-2 font-semibold">
          Insignias ({earned.data?.size ?? 0}/{badges.data?.length ?? 0})
        </h2>
        <ul className="grid grid-cols-4 gap-2">
          {badges.data?.map((b) => {
            const at = earned.data?.get(b.code)
            return (
              <li
                key={b.code}
                className="grid justify-items-center gap-1 text-center"
                title={b.description}
              >
                <BadgeIcon icon={b.icon} locked={!at} />
                <span className="text-xs leading-tight font-medium">{b.name}</span>
                <span className="sr-only">
                  {at ? `Conseguida el ${formatDate(at)}` : `Bloqueada: ${b.description}`}
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      <Tabs defaultValue="photos">
        <TabsList>
          <TabsTrigger value="photos">
            <Grid3x3 /> Galería ({photoCount})
          </TabsTrigger>
          <TabsTrigger value="posts">
            <Rows3 /> Posts
          </TabsTrigger>
          <TabsTrigger value="missions">
            <Target /> Misiones ({completed.data?.length ?? 0})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="photos">
          {posts.isLoading ? (
            <PhotoGridSkeleton count={6} />
          ) : photos.length === 0 ? (
            <EmptyState
              icon={Camera}
              title="Sin fotos todavía"
              description={
                isMe ? 'Tu galería se llena con las fotos de tus retos y publicaciones.' : undefined
              }
              action={
                isMe && (
                  <Button asChild>
                    <Link to="/subir?mision=__libre__">Subir mi primera foto</Link>
                  </Button>
                )
              }
            />
          ) : (
            <PhotoGrid posts={photos} label={`Galería de ${p.display_name || p.username}`} />
          )}
        </TabsContent>
        <TabsContent value="posts">
          {posts.data?.length ? (
            <div className="grid grid-cols-1 gap-4">
              {posts.data.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <EmptyState icon={Rows3} title="Ninguna publicación todavía" />
          )}
        </TabsContent>
        <TabsContent value="missions">
          {completed.data?.length === 0 ? (
            <EmptyState icon={Target} title="Ninguna misión completada" />
          ) : (
            <ul className="divide-y">
              {completed.data?.map((a) => (
                <li key={a.id}>
                  <Link
                    to={`/misiones/${a.mission?.id}`}
                    className="flex items-center justify-between gap-2 py-3"
                  >
                    <span>
                      <span className="block font-medium">{a.mission?.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {a.verified_at && formatDate(a.verified_at)}
                      </span>
                    </span>
                    <span className="font-bold text-primary">
                      +{formatNumber(a.mission?.points ?? 0)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      <ReportDialog
        open={reporting}
        onOpenChange={setReporting}
        target={{ type: 'user', id: p.id }}
      />
      <ConfirmDialog
        open={confirmBlock}
        onOpenChange={setConfirmBlock}
        title={`¿Bloquear a @${p.username}?`}
        description="No verás sus publicaciones ni comentarios, y dejaréis de seguiros. No se le notificará."
        confirmLabel="Bloquear"
        destructive
        onConfirm={() =>
          toggleBlock.mutate(
            { userId: p.id, blocked: false },
            {
              onSuccess: () => {
                setConfirmBlock(false)
                toast.success('Usuario bloqueado')
              },
              onError: (e) => toast.error(errorMessage(e)),
            },
          )
        }
      />
    </div>
  )
}
