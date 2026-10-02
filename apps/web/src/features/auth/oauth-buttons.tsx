import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { errorMessage } from '@/lib/errors'
import { supabase } from '@/lib/supabase'
import { OAUTH_PROVIDERS, oauthOptions, openOAuthUrl, type OAuthProvider } from './oauth'

export function GoogleIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 6.6 2.3 2.3 6.6 2.3 12s4.3 9.7 9.7 9.7c5.6 0 9.3-3.9 9.3-9.5 0-.6-.1-1.1-.2-1.6H12z"
      />
    </svg>
  )
}

export function XIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-6.4L6.4 22H3.3l7.3-8.3L2.8 2h6.4l4.4 5.9L18.9 2zm-1.1 18h1.7L8.3 3.9H6.5L17.8 20z" />
    </svg>
  )
}

export function AppleIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.6-1-2.6-3.9zM14 5.5c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.6 2.8-1.4z" />
    </svg>
  )
}

/** Icono de cada proveedor de login. */
export function ProviderIcon({
  provider,
  className,
}: {
  provider: OAuthProvider
  className?: string
}) {
  if (provider === 'google') return <GoogleIcon className={className} />
  if (provider === 'apple') return <AppleIcon className={className} />
  return <XIcon className={className} />
}

export function OAuthButtons() {
  async function signIn(provider: OAuthProvider) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: oauthOptions(provider),
    })
    if (error) return toast.error(errorMessage(error))
    await openOAuthUrl(data.url)
  }

  return (
    <div className="grid gap-2">
      {OAUTH_PROVIDERS.map(({ id, label }) => {
        return (
          <Button key={id} variant="outline" onClick={() => signIn(id)}>
            <ProviderIcon provider={id} /> Continuar con {label}
          </Button>
        )
      })}
    </div>
  )
}

export function Divider({ label = 'o' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground uppercase">
      <span className="h-px flex-1 bg-border" />
      {label}
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}

export function InstagramIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}
