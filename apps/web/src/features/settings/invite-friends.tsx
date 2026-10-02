import { Mail, Share2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GoogleIcon } from '@/features/auth/oauth-buttons'
import { useMyProfile } from '@/features/auth/session'
import { gmailComposeUrl, inviteMessage, mailtoUrl, share } from '@/lib/social-links'

/** Invitar amigos: por Gmail, por cualquier app de correo o con la hoja de compartir. */
export function InviteFriends() {
  const { data: me } = useMyProfile()
  const msg = inviteMessage(me?.display_name || me?.username)

  async function onShare() {
    const r = await share({ title: msg.subject, text: msg.body.split('\n\n')[0], url: msg.url })
    if (r === 'copied') toast.success('Enlace de invitación copiado')
    if (r === 'unsupported') toast.error('No se pudo compartir. Copia el enlace a mano: ' + msg.url)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserPlus className="size-4" /> Invitar amigos
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        <p className="text-sm text-muted-foreground">
          Cuantos más seáis, antes se validan los retos (hacen falta 5 votos).
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Button variant="outline" asChild>
            <a
              href={gmailComposeUrl({ subject: msg.subject, body: msg.body })}
              target="_blank"
              rel="noopener noreferrer"
            >
              <GoogleIcon /> Invitar por Gmail
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href={mailtoUrl({ subject: msg.subject, body: msg.body })}>
              <Mail /> Otro correo
            </a>
          </Button>
          <Button variant="outline" onClick={onShare}>
            <Share2 /> Compartir enlace
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
