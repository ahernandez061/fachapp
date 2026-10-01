import { Search, Shield, ShieldOff, UserX } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { EmptyState } from '@/components/empty-state'
import { ErrorState, PageLoader } from '@/components/states'
import { UserAvatar } from '@/components/user-avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUserId } from '@/features/auth/session'
import { errorMessage } from '@/lib/errors'
import { formatDate } from '@/lib/i18n'
import { provinciaName } from '@/lib/provincias'
import { useAdminUsers, useSetAdmin } from './api'

type Target = { id: string; username: string | null; makeAdmin: boolean }

export function UsersAdmin() {
  const me = useUserId()
  const [q, setQ] = useState('')
  const users = useAdminUsers(useDeferredValue(q))
  const setAdmin = useSetAdmin()
  const [target, setTarget] = useState<Target | null>(null)

  function confirm() {
    if (!target) return
    setAdmin.mutate(
      { id: target.id, isAdmin: target.makeAdmin },
      {
        onSuccess: () => {
          toast.success(
            target.makeAdmin
              ? `@${target.username} ahora es administrador`
              : `@${target.username} ya no es administrador`,
          )
          setTarget(null)
        },
        onError: (e) => toast.error(errorMessage(e)),
      },
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          className="pl-9"
          placeholder="Buscar por nombre o @usuario"
          aria-label="Buscar usuarios en administración"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {users.isLoading ? (
        <PageLoader />
      ) : users.error ? (
        <ErrorState error={users.error} onRetry={() => users.refetch()} />
      ) : !users.data?.length ? (
        <EmptyState icon={UserX} title="Sin resultados" />
      ) : (
        <ul className="divide-y rounded-xl border bg-card" aria-label="Usuarios">
          {users.data.map((u) => (
            <li key={u.id} className="flex items-center gap-3 p-3">
              <Link
                to={`/u/${u.username}`}
                className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden"
              >
                <UserAvatar name={u.display_name} username={u.username} url={u.avatar_url} />
                <div className="min-w-0">
                  <p className="flex min-w-0 items-center gap-1.5 font-medium">
                    <span className="truncate">
                      {u.display_name || u.username || 'Sin completar'}
                    </span>
                    {u.is_admin && (
                      <Badge>
                        <Shield aria-hidden /> Admin
                      </Badge>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {u.username ? `@${u.username}` : 'Perfil sin completar'}
                    {u.provincia && ` · ${provinciaName(u.provincia)}`} · desde{' '}
                    {formatDate(u.created_at)}
                  </p>
                </div>
              </Link>
              {u.id === me ? (
                <span className="text-xs text-muted-foreground">Tú</span>
              ) : u.is_admin ? (
                <Button
                  className="shrink-0"
                  size="sm"
                  variant="outline"
                  aria-label={`Quitar admin a ${u.username}`}
                  onClick={() => setTarget({ id: u.id, username: u.username, makeAdmin: false })}
                >
                  <ShieldOff /> Quitar
                </Button>
              ) : (
                <Button
                  className="shrink-0"
                  size="sm"
                  variant="outline"
                  disabled={!u.onboarded}
                  aria-label={`Hacer admin a ${u.username}`}
                  onClick={() => setTarget({ id: u.id, username: u.username, makeAdmin: true })}
                >
                  <Shield /> Hacer admin
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!target}
        onOpenChange={(o) => !o && setTarget(null)}
        title={
          target?.makeAdmin
            ? `¿Hacer administrador a @${target.username}?`
            : `¿Quitar permisos de administrador a @${target?.username}?`
        }
        description={
          target?.makeAdmin
            ? 'Podrá validar pruebas, editar misiones, gestionar reportes y cambiar permisos de otros usuarios.'
            : 'Dejará de ver el panel de administración.'
        }
        confirmLabel={target?.makeAdmin ? 'Hacer admin' : 'Quitar admin'}
        destructive={!target?.makeAdmin}
        pending={setAdmin.isPending}
        onConfirm={confirm}
      />
    </div>
  )
}
