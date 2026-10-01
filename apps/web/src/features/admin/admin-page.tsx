import { Check, ClipboardCheck, Flag, Pencil, Plus, Target, Trash2, Users, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'
import { StorageImage } from '@/components/storage-image'
import { ErrorState, PageLoader } from '@/components/states'
import { UserAvatar } from '@/components/user-avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VerificationIcon } from '@/features/missions/mission-meta'
import { errorMessage } from '@/lib/errors'
import { formatDateTime, formatNumber, formatRelative } from '@/lib/i18n'
import { REPORT_REASONS, VERIFICATION_LABEL, type Mission } from '@/lib/types'
import {
  useAdminMissions,
  useDeleteMission,
  usePendingAttempts,
  useReports,
  useResolveReport,
  useReviewAttempt,
} from './api'
import { MissionFormDialog } from './mission-form-dialog'
import { UsersAdmin } from './users-admin'

function ReviewQueue() {
  const pending = usePendingAttempts()
  const review = useReviewAttempt()
  const [notes, setNotes] = useState<Record<string, string>>({})

  if (pending.isLoading) return <PageLoader />
  if (pending.error) return <ErrorState error={pending.error} onRetry={() => pending.refetch()} />
  if (!pending.data?.length)
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="No hay pruebas pendientes"
        description="¡Todo al día!"
      />
    )

  function act(id: string, approve: boolean) {
    review.mutate(
      { id, approve, note: notes[id] },
      {
        onSuccess: () => toast.success(approve ? 'Prueba aprobada' : 'Prueba rechazada'),
        onError: (e) => toast.error(errorMessage(e)),
      },
    )
  }

  return (
    <ul className="grid gap-4">
      {pending.data.map((a) => (
        <li key={a.id} className="overflow-hidden rounded-xl border bg-card">
          <div className="flex items-center gap-3 p-3">
            <UserAvatar
              name={a.user?.display_name}
              username={a.user?.username}
              url={a.user?.avatar_url}
            />
            <div className="min-w-0 flex-1">
              <Link to={`/u/${a.user?.username}`} className="font-semibold hover:underline">
                @{a.user?.username}
              </Link>
              <p className="truncate text-sm text-muted-foreground">
                {a.mission?.title} · +{a.mission?.points} pts
              </p>
            </div>
            <time className="text-xs text-muted-foreground" title={formatDateTime(a.created_at)}>
              {formatRelative(a.created_at)}
            </time>
          </div>
          {a.photo_url && (
            <StorageImage
              path={a.photo_url}
              alt={`Prueba de ${a.user?.username}`}
              className="aspect-square w-full"
            />
          )}
          {a.note && <p className="p-3 text-sm whitespace-pre-line">{a.note}</p>}
          <div className="grid gap-2 p-3">
            <Input
              placeholder="Motivo (opcional, se envía al usuario si rechazas)"
              aria-label="Motivo"
              value={notes[a.id] ?? ''}
              onChange={(e) => setNotes((n) => ({ ...n, [a.id]: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => act(a.id, false)}
                disabled={review.isPending}
              >
                <X /> Rechazar
              </Button>
              <Button onClick={() => act(a.id, true)} disabled={review.isPending}>
                <Check /> Aprobar
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

function MissionsAdmin() {
  const missions = useAdminMissions()
  const del = useDeleteMission()
  const [editing, setEditing] = useState<Mission | undefined>()
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState<Mission | null>(null)

  if (missions.isLoading) return <PageLoader />
  if (missions.error) return <ErrorState error={missions.error} />

  return (
    <div className="grid grid-cols-1 gap-3">
      <Button
        onClick={() => {
          setEditing(undefined)
          setOpen(true)
        }}
      >
        <Plus /> Nueva misión
      </Button>
      <ul className="divide-y rounded-xl border bg-card">
        {missions.data?.map((m) => (
          <li key={m.id} className="flex items-center gap-3 p-3">
            <VerificationIcon type={m.verification_type} className="size-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{m.title}</p>
              <p className="text-xs text-muted-foreground">
                {VERIFICATION_LABEL[m.verification_type]} · {formatNumber(m.points)} pts ·{' '}
                {m.category}
              </p>
            </div>
            {!m.active && <Badge variant="secondary">Inactiva</Badge>}
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Editar ${m.title}`}
              onClick={() => {
                setEditing(m)
                setOpen(true)
              }}
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Borrar ${m.title}`}
              onClick={() => setDeleting(m)}
            >
              <Trash2 />
            </Button>
          </li>
        ))}
      </ul>
      <MissionFormDialog open={open} onOpenChange={setOpen} mission={editing} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`¿Borrar “${deleting?.title}”?`}
        description="Se borrarán también los intentos y publicaciones asociados. Si solo quieres ocultarla, desactívala."
        confirmLabel="Borrar"
        destructive
        onConfirm={() =>
          del.mutate(deleting!.id, {
            onSuccess: () => {
              setDeleting(null)
              toast.success('Misión borrada')
            },
            onError: (e) => toast.error(errorMessage(e)),
          })
        }
      />
    </div>
  )
}

function ReportsAdmin() {
  const reports = useReports()
  const resolve = useResolveReport()
  if (reports.isLoading) return <PageLoader />
  if (reports.error) return <ErrorState error={reports.error} />
  if (!reports.data?.length) return <EmptyState icon={Flag} title="No hay reportes abiertos" />

  return (
    <ul className="grid gap-3">
      {reports.data.map((r) => (
        <li key={r.id} className="grid gap-2 rounded-xl border bg-card p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="destructive">
              {REPORT_REASONS[r.reason as keyof typeof REPORT_REASONS] ?? r.reason}
            </Badge>
            <Badge variant="outline">
              {r.target_type === 'post'
                ? 'Publicación'
                : r.target_type === 'comment'
                  ? 'Comentario'
                  : 'Usuario'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              por @{r.reporter?.username} · {formatRelative(r.created_at)}
            </span>
          </div>
          <p className="rounded-md bg-muted p-2 text-sm">
            {r.link ? (
              <Link to={r.link} className="hover:underline">
                {r.preview}
              </Link>
            ) : (
              r.preview
            )}
          </p>
          {r.details && <p className="text-sm text-muted-foreground">“{r.details}”</p>}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => resolve.mutate({ report: r, action: 'dismiss' })}
            >
              Descartar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={r.target_type === 'user'}
              title={r.target_type === 'user' ? 'Para usuarios, revisa su perfil' : undefined}
              onClick={() =>
                resolve.mutate(
                  { report: r, action: 'remove' },
                  {
                    onSuccess: () => toast.success('Contenido retirado'),
                    onError: (e) => toast.error(errorMessage(e)),
                  },
                )
              }
            >
              Retirar contenido
            </Button>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function AdminPage() {
  const pending = usePendingAttempts()
  const reports = useReports()
  return (
    <>
      <PageHeader title="Administración" />
      <Tabs defaultValue="review">
        {/* 4 pestañas: en móvil sin iconos y con scroll horizontal si no caben. */}
        <TabsList className="justify-start overflow-x-auto [&_svg]:hidden sm:[&_svg]:block">
          <TabsTrigger value="review">
            <ClipboardCheck /> Pruebas {pending.data?.length ? `(${pending.data.length})` : ''}
          </TabsTrigger>
          <TabsTrigger value="missions">
            <Target /> Misiones
          </TabsTrigger>
          <TabsTrigger value="reports">
            <Flag /> Reportes {reports.data?.length ? `(${reports.data.length})` : ''}
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users /> Usuarios
          </TabsTrigger>
        </TabsList>
        <TabsContent value="review">
          <ReviewQueue />
        </TabsContent>
        <TabsContent value="missions">
          <MissionsAdmin />
        </TabsContent>
        <TabsContent value="reports">
          <ReportsAdmin />
        </TabsContent>
        <TabsContent value="users">
          <UsersAdmin />
        </TabsContent>
      </Tabs>
    </>
  )
}
