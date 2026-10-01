import { Flame, Hash, Search, UserX, Users } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'
import { PhotoGrid, PhotoGridSkeleton } from '@/components/photo-grid'
import { ErrorState, Spinner } from '@/components/states'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSearchUsers, useSuggestions } from '@/features/social/api'
import { UserRow } from '@/features/social/user-row'
import { formatNumber } from '@/lib/i18n'
import { useTrendingHashtags, useTrendingPosts } from './api'

function Trending() {
  const posts = useTrendingPosts()
  const tags = useTrendingHashtags()

  return (
    <div className="grid grid-cols-1 gap-5">
      <section aria-labelledby="tags-title">
        <h2 id="tags-title" className="mb-2 flex items-center gap-1.5 font-semibold">
          <Hash className="size-4 text-primary" aria-hidden /> Hashtags del momento
        </h2>
        {tags.isLoading ? (
          <Spinner />
        ) : tags.data?.length ? (
          <ul className="flex flex-wrap gap-2">
            {tags.data.map((t) => (
              <li key={t.tag}>
                <Link
                  to={`/explorar/tag/${encodeURIComponent(t.tag)}`}
                  className="inline-flex items-center gap-1 rounded-full border bg-card px-3 py-1.5 text-sm font-medium hover:bg-accent"
                >
                  #{t.tag}
                  <span className="text-xs text-muted-foreground">{formatNumber(t.uses)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aún no hay hashtags. ¡Estrena uno en tu próximo post!
          </p>
        )}
      </section>

      <section aria-labelledby="hot-title">
        <h2 id="hot-title" className="mb-2 flex items-center gap-1.5 font-semibold">
          <Flame className="size-4 text-primary" aria-hidden /> Fotos que lo petan esta semana
        </h2>
        {posts.isLoading ? (
          <PhotoGridSkeleton />
        ) : posts.error ? (
          <ErrorState error={posts.error} onRetry={() => posts.refetch()} />
        ) : posts.data?.length ? (
          <PhotoGrid posts={posts.data} mode="post" label="Fotos en tendencia" />
        ) : (
          <EmptyState
            icon={Flame}
            title="Nada en tendencia todavía"
            description="Sube fotos y dales me gusta."
          />
        )}
      </section>
    </div>
  )
}

function People() {
  const [q, setQ] = useState('')
  const term = useDeferredValue(q)
  const results = useSearchUsers(term)
  const suggestions = useSuggestions()
  const searching = term.trim().length >= 2

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
          placeholder="Busca por nombre o @usuario"
          aria-label="Buscar usuarios"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {searching ? (
        results.isLoading ? (
          <Spinner />
        ) : results.data?.length === 0 ? (
          <EmptyState
            icon={UserX}
            title="Sin resultados"
            description={`No encontramos a nadie con “${term}”.`}
          />
        ) : (
          <ul className="divide-y">
            {results.data?.map((u) => (
              <li key={u.id}>
                <UserRow user={u} />
              </li>
            ))}
          </ul>
        )
      ) : (
        <section aria-labelledby="sugg">
          <h2 id="sugg" className="mb-1 text-sm font-semibold text-muted-foreground">
            Gente destacada
          </h2>
          {suggestions.isLoading ? (
            <Spinner />
          ) : (
            <ul className="divide-y">
              {suggestions.data?.map((u) => (
                <li key={u.user_id}>
                  <UserRow user={u} extra={` · ${formatNumber(u.points)} pts`} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}

export function ExplorePage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'gente' ? 'gente' : 'tendencias'
  return (
    <>
      <PageHeader title="Explorar" />
      <Tabs
        value={tab}
        onValueChange={(v) => setParams(v === 'gente' ? { tab: v } : {}, { replace: true })}
      >
        <TabsList>
          <TabsTrigger value="tendencias">
            <Flame /> Tendencias
          </TabsTrigger>
          <TabsTrigger value="gente">
            <Users /> Gente
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tendencias">
          <Trending />
        </TabsContent>
        <TabsContent value="gente">
          <People />
        </TabsContent>
      </Tabs>
    </>
  )
}
