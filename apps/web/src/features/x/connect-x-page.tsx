import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, EyeOff, ShieldCheck, X as XMark } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { Spinner } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { XIcon } from '@/features/auth/oauth-buttons'
import { useMyProfile } from '@/features/auth/session'
import { env } from '@/lib/env'
import { errorMessage } from '@/lib/errors'
import { useConnectX } from './api'

export function ConnectXPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: me } = useMyProfile()
  const connect = useConnectX()
  const [accepted, setAccepted] = useState(false)
  const missionId = params.get('mision')
  const returnTo = missionId ? `/misiones/${missionId}` : '/ajustes'

  async function onConnect() {
    try {
      const { url, mock } = await connect.mutateAsync(returnTo)
      if (mock) {
        await qc.invalidateQueries({ queryKey: ['profile'] })
        toast.success('Cuenta de X conectada (modo prueba)')
        navigate(returnTo)
      } else {
        window.location.href = url
      }
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  if (me?.x_connected) {
    return (
      <div className="grid gap-4 py-10 text-center">
        <p>
          Ya tienes conectada la cuenta <strong>@{me.x_username}</strong>.
        </p>
        <Button asChild>
          <Link to={returnTo}>Continuar</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <Button variant="ghost" size="sm" className="w-fit" onClick={() => navigate(-1)}>
        <ArrowLeft /> Volver
      </Button>
      <div className="grid justify-items-center gap-2 text-center">
        <div className="grid size-16 place-items-center rounded-full bg-foreground text-background">
          <XIcon className="size-7" />
        </div>
        <h1 className="text-2xl font-bold">Conectar tu cuenta de X</h1>
        <p className="text-sm text-muted-foreground">
          Para verificar automáticamente las misiones de redes sociales.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-5 text-emerald-600" /> Qué leeremos
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          {[
            'Tu nombre de usuario y número de seguidores.',
            'Tus posts recientes (texto, fecha y hashtags) solo cuando pulses “Verificar”.',
          ].map((t) => (
            <p key={t} className="flex gap-2">
              <Check className="size-4 shrink-0 text-emerald-600" aria-hidden /> {t}
            </p>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <EyeOff className="size-5 text-primary" /> Qué NO haremos nunca
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          {[
            'Publicar, dar like, seguir ni escribir mensajes en tu nombre.',
            'Leer tus mensajes directos.',
            'Compartir tus datos de X con terceros.',
          ].map((t) => (
            <p key={t} className="flex gap-2">
              <XMark className="size-4 shrink-0 text-destructive" aria-hidden /> {t}
            </p>
          ))}
          <p className="pt-1 text-muted-foreground">
            Permisos solicitados: <code>tweet.read</code>, <code>users.read</code>,{' '}
            <code>offline.access</code>. Los tokens se guardan cifrados y solo los usa el servidor.
            Puedes desconectar X cuando quieras desde Ajustes y borraremos esos datos.
          </p>
        </CardContent>
      </Card>

      <label className="flex items-start gap-3 rounded-lg border p-3 text-sm">
        <input
          type="checkbox"
          className="mt-0.5 size-4 accent-primary"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
        />
        <span>
          Doy mi consentimiento para que FachApp lea estos datos de mi cuenta de X con la finalidad
          de verificar misiones (art. 6.1.a RGPD). Más info en la{' '}
          <Link to="/legal/privacidad" className="underline">
            política de privacidad
          </Link>
          .
        </span>
      </label>
      <Button size="lg" disabled={!accepted || connect.isPending} onClick={onConnect}>
        {connect.isPending ? <Spinner /> : <XIcon />} Conectar con X
      </Button>
      {env.xMock && (
        <p className="text-center text-xs text-muted-foreground">
          Modo de prueba activo: se usarán datos de X simulados.
        </p>
      )}
    </div>
  )
}
