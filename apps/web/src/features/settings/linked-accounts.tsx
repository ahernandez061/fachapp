import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UserIdentity } from '@supabase/supabase-js'
import { Link2, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { Spinner } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  OAUTH_PROVIDERS,
  oauthOptions,
  openOAuthUrl,
  type OAuthProvider,
} from '@/features/auth/oauth'
import { ProviderIcon } from '@/features/auth/oauth-buttons'
import { errorMessage } from '@/lib/errors'
import { supabase } from '@/lib/supabase'

function useIdentities() {
  return useQuery({
    queryKey: ['identities'],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUserIdentities()
      if (error) throw error
      return data.identities
    },
  })
}

const identityLabel = (i: UserIdentity) =>
  (i.identity_data?.email as string | undefined) ??
  (i.identity_data?.user_name as string | undefined) ??
  (i.identity_data?.preferred_username as string | undefined) ??
  'vinculada'

/**
 * Vincula Google (Gmail), Apple y X a la misma cuenta para poder entrar con cualquiera.
 * Requiere "manual linking" activado en Supabase Auth.
 */
export function LinkedAccounts() {
  const qc = useQueryClient()
  const identities = useIdentities()

  const link = useMutation({
    mutationFn: async (provider: OAuthProvider) => {
      const { data, error } = await supabase.auth.linkIdentity({
        provider,
        options: oauthOptions(provider),
      })
      if (error) throw error
      await openOAuthUrl(data.url)
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const unlink = useMutation({
    mutationFn: async (identity: UserIdentity) => {
      const { error } = await supabase.auth.unlinkIdentity(identity)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Cuenta desvinculada')
      qc.invalidateQueries({ queryKey: ['identities'] })
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const list = identities.data ?? []
  const byProvider = (p: string) => list.find((i) => i.provider === p)
  const emailIdentity = byProvider('email')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="size-4" /> Cuentas vinculadas
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        <p className="text-sm text-muted-foreground">
          Entra en FachApp con cualquiera de estas cuentas. Solo usamos tu nombre y tu email.
        </p>
        {identities.isLoading ? (
          <Spinner />
        ) : (
          <ul className="divide-y rounded-lg border" aria-label="Cuentas vinculadas">
            {emailIdentity && (
              <li className="flex items-center gap-3 p-3 text-sm">
                <Mail className="size-4" aria-hidden />
                <span className="flex-1">
                  Email{' '}
                  <span className="text-muted-foreground">· {identityLabel(emailIdentity)}</span>
                </span>
              </li>
            )}
            {OAUTH_PROVIDERS.map(({ id, label }) => {
              const identity = byProvider(id === 'x' ? 'twitter' : id) ?? byProvider(id)
              return (
                <li key={id} className="flex items-center gap-3 p-3 text-sm" aria-label={label}>
                  <ProviderIcon provider={id} />
                  <span className="min-w-0 flex-1 truncate">
                    {label === 'Google' ? 'Google (Gmail)' : label}
                    {identity && (
                      <span className="text-muted-foreground"> · {identityLabel(identity)}</span>
                    )}
                  </span>
                  {identity ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={list.length < 2 || unlink.isPending}
                      title={list.length < 2 ? 'Es tu único método de acceso' : undefined}
                      onClick={() => unlink.mutate(identity)}
                    >
                      Desvincular
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={link.isPending}
                      onClick={() => link.mutate(id)}
                    >
                      Vincular
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
