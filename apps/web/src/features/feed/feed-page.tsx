import { Compass, Users } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router'
import { EmptyState } from '@/components/empty-state'
import { ErrorState, Spinner } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFeed, type FeedMode } from './api'
import { FeaturedMission } from './featured-mission'
import { PostCard, PostCardSkeleton } from './post-card'

function FeedList({ mode }: { mode: FeedMode }) {
  const feed = useFeed(mode)
  const sentinel = useRef<HTMLDivElement>(null)
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = feed

  // Scroll infinito
  useEffect(() => {
    const el = sentinel.current
    if (!el || !hasNextPage) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !isFetchingNextPage) fetchNextPage()
    })
    io.observe(el)
    return () => io.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  if (feed.isLoading) {
    return (
      <div className="grid gap-4">
        <PostCardSkeleton />
        <PostCardSkeleton />
      </div>
    )
  }
  if (feed.error) return <ErrorState error={feed.error} onRetry={() => feed.refetch()} />

  const posts = feed.data?.pages.flat() ?? []
  if (posts.length === 0) {
    return mode === 'following' ? (
      <EmptyState
        icon={Users}
        title="Aún no sigues a nadie"
        description="Busca a tus amigos o descubre gente nueva para llenar tu feed."
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/explorar?tab=gente">Buscar gente</Link>
            </Button>
            <Button asChild>
              <Link to="/?tab=discover">Descubrir</Link>
            </Button>
          </div>
        }
      />
    ) : (
      <EmptyState
        icon={Compass}
        title="No hay publicaciones todavía"
        description="¡Sé el primero en completar una misión!"
      />
    )
  }

  return (
    <div className="grid gap-4">
      {posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
      <div ref={sentinel} className="grid place-items-center py-4 text-sm text-muted-foreground">
        {isFetchingNextPage ? <Spinner /> : !hasNextPage && 'Has llegado al final 🎉'}
      </div>
    </div>
  )
}

export function FeedPage() {
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as FeedMode) === 'discover' ? 'discover' : 'following'

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => setParams(v === 'discover' ? { tab: v } : {}, { replace: true })}
    >
      <h1 className="sr-only">Feed</h1>
      <TabsList>
        <TabsTrigger value="following">Siguiendo</TabsTrigger>
        <TabsTrigger value="discover">Descubrir</TabsTrigger>
      </TabsList>
      <FeaturedMission />
      <TabsContent value={tab}>
        <FeedList key={tab} mode={tab} />
      </TabsContent>
    </Tabs>
  )
}
