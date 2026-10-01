import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronRight,
  Download,
  Gift,
  FileText,
  LogOut,
  Moon,
  Shield,
  Sun,
  Trash2,
  UserCog,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { PageHeader } from '@/components/page-header'
import { Spinner } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { XIcon } from '@/features/auth/oauth-buttons'
import { signOut, useMyProfile, useSession } from '@/features/auth/session'
import { useMyBlocks, useToggleBlock } from '@/features/social/api'
import { useDisconnectX } from '@/features/x/api'
import { errorMessage } from '@/lib/errors'
import { deleteAllUserFiles } from '@/lib/images'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { useThemeStore, type Theme } from '@/stores/theme'

function Row({
  to,
  icon: Icon,
  children,
}: {
  to: string
  icon: typeof Shield
  children: React.ReactNode
}) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-md px-1 py-2.5 hover:bg-muted">
      <Icon className="size-5 text-muted-foreground" aria-hidden />
      <span className="flex-1 text-sm">{children}</span>
      <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
    </Link>
  )
}

export function SettingsPage() {
  const session = useSession()
  const { data: me } = useMyProfile()
  const [params, setParams] = useSearchParams()
  const qc = useQueryClient()
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const disconnect = useDisconnectX()
  const blocks = useMyBlocks()
  const unblock = useToggleBlock()
  const [confirmX, setConfirmX] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteText, setDeleteText] = useState('')

  // Resultado de volver de X (?x=ok|error|denied)
  useEffect(() => {
    const x = params.get('x')
    if (!x) return
    if (x === 'ok') toast.success('Cuenta de X conectada')
    else if (x === 'denied') toast.info('Has cancelado la conexión con X')
    else toast.error('No se pudo conectar con X. Inténtalo de nuevo.')
    qc.invalidateQueries({ queryKey: ['profile'] })
    setParams({}, { replace: true })
  }, [params, setParams, qc])

  const exportData = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('export_my_data')
      if (error) throw error
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `fachapp-mis-datos-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(a.href)
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const deleteAccount = useMutation({
    mutationFn: async () => {
      if (me?.x_connected) await supabase.functions.invoke('x-disconnect', { body: {} })
      await deleteAllUserFiles(me!.id)
      const { error } = await supabase.rpc('delete_my_account')
      if (error) throw error
      await supabase.auth.signOut({ scope: 'local' })
    },
    onSuccess: () => toast.success('Tu cuenta y tus datos se han eliminado. ¡Hasta pronto!'),
    onError: (e) => toast.error(errorMessage(e)),
  })

  const changePassword = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.resetPasswordForEmail(session!.user.email!, {
        redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
      })
      if (error) throw error
    },
    onSuccess: () => toast.success('Te hemos enviado un email para cambiar la contraseña'),
    onError: (e) => toast.error(errorMessage(e)),
  })

  const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Claro', icon: Sun },
    { value: 'dark', label: 'Oscuro', icon: Moon },
    { value: 'system', label: 'Sistema', icon: UserCog },
  ]

  return (
    <div className="grid gap-4">
      <PageHeader title="Ajustes" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cuenta</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-1">
          <p className="pb-2 text-sm text-muted-foreground">
            {session?.user.email} · @{me?.username}
          </p>
          <Row to="/editar-perfil" icon={UserCog}>
            Editar perfil
          </Row>
          <Row to="/premios" icon={Gift}>
            Premios: colores, marcos y títulos
          </Row>
          {session?.user.email && (
            <button
              onClick={() => changePassword.mutate()}
              className="flex items-center gap-3 rounded-md px-1 py-2.5 text-left text-sm hover:bg-muted"
            >
              <Shield className="size-5 text-muted-foreground" aria-hidden /> Cambiar contraseña
            </button>
          )}
          {me?.is_admin && (
            <Row to="/admin" icon={Users}>
              Panel de administración
            </Row>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <XIcon /> Cuenta de X
          </CardTitle>
        </CardHeader>
        <CardContent>
          {me?.x_connected ? (
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm">
                Conectada como <strong>@{me.x_username}</strong>
              </p>
              <Button variant="outline" size="sm" onClick={() => setConfirmX(true)}>
                Desconectar
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">No conectada</p>
              <Button size="sm" asChild>
                <Link to="/conectar-x">Conectar</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Apariencia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tema">
            {themes.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                role="radio"
                aria-checked={theme === value}
                onClick={() => setTheme(value)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-lg border p-3 text-sm',
                  theme === value && 'border-primary bg-accent',
                )}
              >
                <Icon className="size-5" aria-hidden /> {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Privacidad y seguridad</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-1">
          <div className="pb-2">
            <p className="text-sm font-medium">Usuarios bloqueados</p>
            {blocks.data?.length ? (
              <ul className="mt-1 grid gap-1">
                {blocks.data.map((b) => (
                  <li key={b.blocked_id} className="flex items-center justify-between text-sm">
                    @{b.user?.username}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => unblock.mutate({ userId: b.blocked_id, blocked: true })}
                    >
                      Desbloquear
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No has bloqueado a nadie.</p>
            )}
          </div>
          <button
            onClick={() => exportData.mutate()}
            disabled={exportData.isPending}
            className="flex items-center gap-3 rounded-md px-1 py-2.5 text-left text-sm hover:bg-muted"
          >
            {exportData.isPending ? (
              <Spinner />
            ) : (
              <Download className="size-5 text-muted-foreground" aria-hidden />
            )}
            Descargar mis datos (JSON)
          </button>
          <Row to="/legal/privacidad" icon={Shield}>
            Política de privacidad
          </Row>
          <Row to="/legal/terminos" icon={FileText}>
            Términos de uso
          </Row>
          <Row to="/legal/normas" icon={Users}>
            Normas de la comunidad
          </Row>
        </CardContent>
      </Card>

      <div className="grid gap-2">
        <Button variant="outline" onClick={() => signOut()}>
          <LogOut /> Cerrar sesión
        </Button>
        <Button variant="ghost" className="text-destructive" onClick={() => setConfirmDelete(true)}>
          <Trash2 /> Eliminar mi cuenta
        </Button>
      </div>

      <ConfirmDialog
        open={confirmX}
        onOpenChange={setConfirmX}
        title="¿Desconectar X?"
        description="Revocaremos el acceso y borraremos los tokens y datos de X guardados. No podrás verificar misiones de X hasta volver a conectarla."
        confirmLabel="Desconectar"
        destructive
        pending={disconnect.isPending}
        onConfirm={() =>
          disconnect.mutate(undefined, {
            onSuccess: () => {
              setConfirmX(false)
              toast.success('Cuenta de X desconectada')
            },
            onError: (e) => toast.error(errorMessage(e)),
          })
        }
      />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="¿Eliminar tu cuenta?"
        description="Se borrarán para siempre tu perfil, publicaciones, fotos, comentarios, puntos e insignias. No se puede deshacer."
        confirmLabel="Eliminar definitivamente"
        destructive
        pending={deleteAccount.isPending || deleteText !== 'ELIMINAR'}
        onConfirm={() => deleteAccount.mutate()}
      >
        <label className="grid gap-1.5 text-sm">
          Escribe ELIMINAR para confirmar
          <Input
            value={deleteText}
            onChange={(e) => setDeleteText(e.target.value)}
            autoComplete="off"
          />
        </label>
      </ConfirmDialog>
    </div>
  )
}
