import {
  Award,
  Bell,
  CheckCircle2,
  Heart,
  MessageCircle,
  UserPlus,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { useEffect } from 'react'
import { Link } from 'react-router'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'
import { ErrorState, PageLoader } from '@/components/states'
import { Button } from '@/components/ui/button'
import { formatDateTime, formatRelative } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { useMarkAllRead, useNotifications } from './api'
import { notificationText } from './text'

const ICONS: Record<string, LucideIcon> = {
  follow: UserPlus,
  like: Heart,
  comment: MessageCircle,
  mission_verified: CheckCircle2,
  mission_rejected: XCircle,
  badge: Award,
}

export function NotificationsPage() {
  const list = useNotifications()
  const markRead = useMarkAllRead()
  const unread = list.data?.some((n) => !n.read)

  // Al salir de la pantalla, marca todas como leídas.
  useEffect(() => () => void (unread && markRead.mutate()), [unread]) // eslint-disable-line react-hooks/exhaustive-deps

  if (list.isLoading) return <PageLoader />
  if (list.error) return <ErrorState error={list.error} onRetry={() => list.refetch()} />

  return (
    <>
      <PageHeader title="Notificaciones">
        {unread && (
          <Button variant="ghost" size="sm" onClick={() => markRead.mutate()}>
            Marcar leídas
          </Button>
        )}
      </PageHeader>
      {list.data?.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Nada nuevo por aquí"
          description="Te avisaremos de likes, comentarios, seguidores y misiones."
        />
      ) : (
        <ul className="grid gap-1">
          {list.data?.map((n) => {
            const { title, href } = notificationText(n)
            const Icon = ICONS[n.type] ?? Bell
            return (
              <li key={n.id}>
                <Link
                  to={href}
                  className={cn(
                    'flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted',
                    !n.read && 'bg-accent/60',
                  )}
                >
                  <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{title}</p>
                    <time
                      className="text-xs text-muted-foreground"
                      dateTime={n.created_at}
                      title={formatDateTime(n.created_at)}
                    >
                      {formatRelative(n.created_at)}
                    </time>
                  </div>
                  {!n.read && (
                    <span className="mt-1.5 size-2 rounded-full bg-primary" aria-label="No leída" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
