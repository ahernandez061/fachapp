import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUserId } from '@/features/auth/session'
import { supabase } from '@/lib/supabase'
import type { MissionInsert, Report } from '@/lib/types'

export function usePendingAttempts() {
  return useQuery({
    queryKey: ['admin', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mission_attempts')
        .select(
          '*, user:profiles!mission_attempts_user_id_fkey(username, display_name, avatar_url), mission:missions(title, points, verification_type)',
        )
        .eq('status', 'pending')
        .order('created_at')
      if (error) throw error
      return data
    },
  })
}

export function useReviewAttempt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: { id: string; approve: boolean; note?: string }) => {
      const { error } = await supabase.rpc('review_attempt', {
        p_attempt_id: v.id,
        p_approve: v.approve,
        p_note: v.note ?? '',
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] })
      qc.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

export function useAdminMissions() {
  return useQuery({
    queryKey: ['admin', 'missions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useSaveMission() {
  const qc = useQueryClient()
  const uid = useUserId()
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: string
      values: Omit<MissionInsert, 'id' | 'created_by'>
    }) => {
      const { error } = id
        ? await supabase.from('missions').update(values).eq('id', id)
        : await supabase.from('missions').insert({ ...values, created_by: uid })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'missions'] })
      qc.invalidateQueries({ queryKey: ['missions'] })
    },
  })
}

export function useDeleteMission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('missions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'missions'] })
      qc.invalidateQueries({ queryKey: ['missions'] })
    },
  })
}

export function useReports() {
  return useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*, reporter:profiles!reports_reporter_id_fkey(username)')
        .eq('status', 'open')
        .order('created_at')
      if (error) throw error
      // Carga una vista previa del contenido reportado.
      return Promise.all(
        data.map(async (r) => {
          let preview: string
          let link: string
          if (r.target_type === 'post') {
            const { data: p } = await supabase
              .from('post_feed')
              .select('text, username')
              .eq('id', r.target_id)
              .maybeSingle()
            preview = p ? `@${p.username}: ${p.text || '(foto)'}` : '(borrado)'
            link = `/p/${r.target_id}`
          } else if (r.target_type === 'comment') {
            const { data: c } = await supabase
              .from('comments')
              .select('text, post_id')
              .eq('id', r.target_id)
              .maybeSingle()
            preview = c?.text ?? '(borrado)'
            link = c ? `/p/${c.post_id}` : ''
          } else {
            const { data: u } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', r.target_id)
              .maybeSingle()
            preview = u ? `@${u.username}` : '(borrado)'
            link = u ? `/u/${u.username}` : ''
          }
          return { ...r, preview, link }
        }),
      )
    },
  })
}

export function useResolveReport() {
  const qc = useQueryClient()
  const uid = useUserId()
  return useMutation({
    mutationFn: async ({ report, action }: { report: Report; action: 'remove' | 'dismiss' }) => {
      if (action === 'remove') {
        if (report.target_type === 'post') {
          const { error } = await supabase
            .from('posts')
            .update({ hidden: true })
            .eq('id', report.target_id)
          if (error) throw error
        } else if (report.target_type === 'comment') {
          const { error } = await supabase.from('comments').delete().eq('id', report.target_id)
          if (error) throw error
        }
      }
      const { error } = await supabase
        .from('reports')
        .update({ status: action === 'remove' ? 'resolved' : 'dismissed', resolved_by: uid })
        .eq('target_id', report.target_id)
        .eq('status', 'open')
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] })
      qc.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

// ---------------------------------------------------------------------------
// Usuarios: búsqueda y permisos de administrador
// ---------------------------------------------------------------------------
export function useAdminUsers(q: string) {
  const term = q.trim().replace(/[%_,()]/g, '')
  return useQuery({
    queryKey: ['admin', 'users', term],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select(
          'id, username, display_name, avatar_url, provincia, is_admin, onboarded, created_at',
        )
        .order('is_admin', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50)
      if (term) query = query.or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export function useSetAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, isAdmin }: { id: string; isAdmin: boolean }) => {
      const { error } = await supabase.from('profiles').update({ is_admin: isAdmin }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}
