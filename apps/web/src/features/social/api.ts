import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUserId } from '@/features/auth/session'
import { supabase } from '@/lib/supabase'
import type { ReportReason, ReportTarget } from '@/lib/types'

export const socialKeys = {
  following: (uid: string | null) => ['follows', 'mine', uid] as const,
  blocks: (uid: string | null) => ['blocks', uid] as const,
  list: (userId: string, kind: 'followers' | 'following') => ['follows', kind, userId] as const,
  search: (q: string) => ['search', q] as const,
}

/** IDs de la gente que sigo (para pintar botones "Siguiendo"). */
export function useMyFollowing() {
  const uid = useUserId()
  return useQuery({
    queryKey: socialKeys.following(uid),
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', uid!)
      if (error) throw error
      return new Set(data.map((f) => f.following_id))
    },
  })
}

export function useToggleFollow() {
  const uid = useUserId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, following }: { userId: string; following: boolean }) => {
      const { error } = following
        ? await supabase.from('follows').delete().eq('follower_id', uid!).eq('following_id', userId)
        : await supabase.from('follows').insert({ follower_id: uid!, following_id: userId })
      if (error) throw error
    },
    onMutate: ({ userId, following }) => {
      qc.setQueryData<Set<string>>(socialKeys.following(uid), (old) => {
        const next = new Set(old)
        if (following) next.delete(userId)
        else next.add(userId)
        return next
      })
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['follows'] })
      qc.invalidateQueries({ queryKey: ['profile'] })
      qc.invalidateQueries({ queryKey: ['feed', 'following'] })
    },
  })
}

export function useFollowList(userId: string | undefined, kind: 'followers' | 'following') {
  return useQuery({
    queryKey: socialKeys.list(userId ?? '', kind),
    enabled: !!userId,
    queryFn: async () => {
      const q =
        kind === 'followers'
          ? supabase
              .from('follows')
              .select(
                'created_at, user:profiles!follows_follower_id_fkey(id, username, display_name, avatar_url, provincia)',
              )
              .eq('following_id', userId!)
          : supabase
              .from('follows')
              .select(
                'created_at, user:profiles!follows_following_id_fkey(id, username, display_name, avatar_url, provincia)',
              )
              .eq('follower_id', userId!)
      const { data, error } = await q.order('created_at', { ascending: false })
      if (error) throw error
      return data.map((r) => r.user).filter((u): u is NonNullable<typeof u> => !!u)
    },
  })
}

export function useSearchUsers(q: string) {
  const term = q.trim().replace(/[%_,()]/g, '')
  return useQuery({
    queryKey: socialKeys.search(term),
    enabled: term.length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, provincia')
        .eq('onboarded', true)
        .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
        .limit(20)
      if (error) throw error
      return data
    },
  })
}

/** Sugerencias: gente activa a la que aún no sigo. */
export function useSuggestions() {
  const uid = useUserId()
  return useQuery({
    queryKey: ['suggestions', uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_leaderboard', {
        p_scope: 'global',
        p_limit: 20,
      })
      if (error) throw error
      return data.filter((r) => r.user_id !== uid)
    },
  })
}

export function useMyBlocks() {
  const uid = useUserId()
  return useQuery({
    queryKey: socialKeys.blocks(uid),
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blocks')
        .select(
          'blocked_id, user:profiles!blocks_blocked_id_fkey(username, display_name, avatar_url)',
        )
        .eq('blocker_id', uid!)
      if (error) throw error
      return data
    },
  })
}

export function useToggleBlock() {
  const uid = useUserId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, blocked }: { userId: string; blocked: boolean }) => {
      const { error } = blocked
        ? await supabase.from('blocks').delete().eq('blocker_id', uid!).eq('blocked_id', userId)
        : await supabase.from('blocks').insert({ blocker_id: uid!, blocked_id: userId })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blocks'] })
      qc.invalidateQueries({ queryKey: ['follows'] })
      qc.invalidateQueries({ queryKey: ['feed'] })
      qc.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

export function useReport() {
  const uid = useUserId()
  return useMutation({
    mutationFn: async (v: {
      type: ReportTarget
      id: string
      reason: ReportReason
      details: string
    }) => {
      const { error } = await supabase.from('reports').insert({
        reporter_id: uid!,
        target_type: v.type,
        target_id: v.id,
        reason: v.reason,
        details: v.details.trim() || null,
      })
      if (error && error.code !== '23505') throw error
    },
  })
}
