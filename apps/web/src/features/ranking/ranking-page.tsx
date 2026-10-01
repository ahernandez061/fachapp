import { useQuery } from '@tanstack/react-query'
import { Medal, Trophy } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'
import { ErrorState } from '@/components/states'
import { UserAvatar } from '@/components/user-avatar'
import { NativeSelect } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMyProfile } from '@/features/auth/session'
import { formatNumber } from '@/lib/i18n'
import { PROVINCIAS, provinciaName } from '@/lib/provincias'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type Scope = 'global' | 'weekly' | 'friends' | 'provincia'
const SCOPES: Record<Scope, string> = {
  global: 'Global',
  weekly: 'Semanal',
  friends: 'Amigos',
  provincia: 'Provincia',
}

function useLeaderboard(scope: Scope, provincia: string | null) {
  return useQuery({
    queryKey: ['leaderboard', scope, provincia],
    enabled: scope !== 'provincia' || !!provincia,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_leaderboard', {
        p_scope: scope,
        p_provincia: provincia as string,
        p_limit: 100,
      })
      if (error) throw error
      return data
    },
  })
}

const PODIUM = ['text-amber-500', 'text-zinc-400', 'text-orange-700']

export function RankingPage() {
  const { data: me } = useMyProfile()
  const [params, setParams] = useSearchParams()
  const scope = (
    Object.keys(SCOPES).includes(params.get('tab') ?? '') ? params.get('tab') : 'global'
  ) as Scope
  const [provincia, setProvincia] = useState<string | null>(null)
  const prov = provincia ?? me?.provincia ?? null
  const board = useLeaderboard(scope, prov)
  const mine = board.data?.find((r) => r.user_id === me?.id)

  return (
    <>
      <PageHeader title="Ranking" />
      <Tabs
        value={scope}
        onValueChange={(v) => setParams(v === 'global' ? {} : { tab: v }, { replace: true })}
      >
        <TabsList>
          {Object.entries(SCOPES).map(([k, v]) => (
            <TabsTrigger key={k} value={k}>
              {v}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={scope}>
          {scope === 'provincia' && (
            <div className="mt-3">
              <NativeSelect
                aria-label="Provincia"
                value={prov ?? ''}
                onChange={(e) => setProvincia(e.target.value)}
              >
                {PROVINCIAS.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
          )}
          {scope === 'weekly' && (
            <p className="mt-2 text-xs text-muted-foreground">
              Puntos desde el lunes a las 00:00 (hora peninsular).
            </p>
          )}

          <div className="mt-4">
            {board.isLoading ? (
              <div className="grid gap-2">
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            ) : board.error ? (
              <ErrorState error={board.error} onRetry={() => board.refetch()} />
            ) : !board.data?.length || board.data.every((r) => r.points === 0) ? (
              <EmptyState
                icon={Trophy}
                title="Aún no hay clasificación"
                description={
                  scope === 'friends'
                    ? 'Sigue a tus amigos para competir con ellos.'
                    : 'Completa misiones para aparecer aquí.'
                }
              />
            ) : (
              <ol className="grid gap-1.5" aria-label={`Ranking ${SCOPES[scope].toLowerCase()}`}>
                {board.data.map((r) => (
                  <li key={r.user_id}>
                    <Link
                      to={`/u/${r.username}`}
                      className={cn(
                        'flex items-center gap-3 rounded-lg border bg-card p-2.5 transition-colors hover:bg-muted',
                        r.user_id === me?.id && 'border-primary bg-accent',
                      )}
                    >
                      <span className="grid w-8 place-items-center font-bold tabular-nums">
                        {r.rank <= 3 ? (
                          <Medal
                            className={cn('size-6', PODIUM[r.rank - 1])}
                            aria-label={`Puesto ${r.rank}`}
                          />
                        ) : (
                          r.rank
                        )}
                      </span>
                      <UserAvatar
                        name={r.display_name}
                        username={r.username}
                        url={r.avatar_url}
                        className="size-9"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {r.display_name || r.username}{' '}
                          {r.user_id === me?.id && (
                            <span className="text-xs text-primary">(tú)</span>
                          )}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          Nivel {r.level} · {r.missions_completed}{' '}
                          {r.missions_completed === 1 ? 'misión' : 'misiones'}
                          {r.provincia && ` · ${provinciaName(r.provincia)}`}
                        </p>
                      </div>
                      <span className="font-bold text-primary tabular-nums">
                        {formatNumber(r.points)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {mine && (
            <div className="sticky bottom-20 mt-3 rounded-lg border border-primary bg-background/95 p-3 text-sm shadow-lg backdrop-blur">
              Tu posición: <strong>#{mine.rank}</strong> con{' '}
              <strong>{formatNumber(mine.points)} pts</strong>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  )
}
