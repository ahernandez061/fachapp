import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { useUserId } from '@/features/auth/session'
import { supabase } from '@/lib/supabase'
import type { Notification } from '@/lib/types'
import { notificationText } from './text'

export const notifKeys = {
  list: (uid: string | null) => ['notifications', uid] as const,
}

export function useNotifications() {
  const uid = useUserId()
  return useQuery({
    queryKey: notifKeys.list(uid),
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', uid!)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data
    },
  })
}

export function useUnreadCount() {
  const { data } = useNotifications()
  return data?.filter((n) => !n.read).length ?? 0
}

export function useMarkAllRead() {
  const uid = useUserId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', uid!)
        .eq('read', false)
      if (error) throw error
    },
    onMutate: () =>
      qc.setQueryData<Notification[]>(notifKeys.list(uid), (old) =>
        old?.map((n) => ({ ...n, read: true })),
      ),
  })
}

/** Suscripción Realtime: nuevas notificaciones al instante (con toast). */
export function useNotificationsRealtime() {
  const uid = useUserId()
  const qc = useQueryClient()
  useEffect(() => {
    if (!uid) return
    const channel = supabase
      .channel(`notifications:${uid}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
        (payload) => {
          const n = payload.new as Notification
          qc.setQueryData<Notification[]>(notifKeys.list(uid), (old) => [n, ...(old ?? [])])
          toast(notificationText(n).title)
          if (n.type.startsWith('mission_') || n.type === 'badge') {
            qc.invalidateQueries({ queryKey: ['attempts'] })
            qc.invalidateQueries({ queryKey: ['profile'] })
          }
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [uid, qc])
}
