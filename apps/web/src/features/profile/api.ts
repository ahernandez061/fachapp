import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { myProfileKey, useUserId } from '@/features/auth/session'
import { uploadImage } from '@/lib/images'
import { supabase } from '@/lib/supabase'
import type { ProfileValues } from '@/features/auth/schemas'
import type { Database } from '@/lib/database.types'

type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export const profileKeys = {
  byUsername: (u: string) => ['profile', 'u', u] as const,
  stats: (id: string) => ['profile', 'stats', id] as const,
  badges: (id: string) => ['profile', 'badges', id] as const,
  completed: (id: string) => ['profile', 'completed', id] as const,
  allBadges: ['badges'] as const,
}

export function useProfileByUsername(username: string | undefined) {
  return useQuery({
    queryKey: profileKeys.byUsername(username ?? ''),
    enabled: !!username,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username!)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}

export function useProfileStats(userId: string | undefined) {
  return useQuery({
    queryKey: profileKeys.stats(userId ?? ''),
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_profile_stats', { p_user_id: userId! })
      if (error) throw error
      return data[0]
    },
  })
}

export function useAllBadges() {
  return useQuery({
    queryKey: profileKeys.allBadges,
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase.from('badges').select('*').order('sort_order')
      if (error) throw error
      return data
    },
  })
}

export function useUserBadges(userId: string | undefined) {
  return useQuery({
    queryKey: profileKeys.badges(userId ?? ''),
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_badges')
        .select('badge_code, awarded_at')
        .eq('user_id', userId!)
      if (error) throw error
      return new Map(data.map((b) => [b.badge_code, b.awarded_at]))
    },
  })
}

export function useCompletedMissions(userId: string | undefined) {
  return useQuery({
    queryKey: profileKeys.completed(userId ?? ''),
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mission_attempts')
        .select('id, verified_at, mission:missions(id, title, points, verification_type, category)')
        .eq('user_id', userId!)
        .eq('status', 'verified')
        .order('verified_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useUpdateProfile() {
  const uid = useUserId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: ProfileValues & { avatar?: Blob | null }) => {
      const patch: ProfileUpdate = {
        display_name: v.display_name,
        bio: v.bio,
        provincia: v.provincia,
      }
      if (v.avatar) patch.avatar_url = await uploadImage('avatars', uid!, v.avatar, 512)
      const { error } = await supabase.from('profiles').update(patch).eq('id', uid!)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: myProfileKey(uid) })
      qc.invalidateQueries({ queryKey: ['profile'] })
      qc.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}
