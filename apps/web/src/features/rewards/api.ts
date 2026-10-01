import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { myProfileKey, useUserId } from '@/features/auth/session'
import type { Database } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'

export type RewardKind = Database['public']['Enums']['reward_kind']
export type Reward = Database['public']['Tables']['rewards']['Row']

export const KIND_LABEL: Record<RewardKind, string> = {
  theme: 'Colores de la app',
  frame: 'Marcos de avatar',
  title: 'Títulos',
  badge: 'Insignias exclusivas',
}

export function useRewards() {
  return useQuery({
    queryKey: ['rewards'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('rewards').select('*').order('sort_order')
      if (error) throw error
      return data
    },
  })
}

export function useMyRewards() {
  const uid = useUserId()
  return useQuery({
    queryKey: ['rewards', 'mine', uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_rewards')
        .select('reward_code')
        .eq('user_id', uid!)
      if (error) throw error
      return new Set(data.map((r) => r.reward_code))
    },
  })
}

export function useBalance() {
  const uid = useUserId()
  return useQuery({
    queryKey: ['rewards', 'balance', uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('points_balance')
      if (error) throw error
      return data[0]
    },
  })
}

export function useBuyReward() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (code: string) => {
      const { error } = await supabase.rpc('buy_reward', { p_code: code })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rewards'] })
      qc.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

export function useEquipReward() {
  const qc = useQueryClient()
  const uid = useUserId()
  return useMutation({
    mutationFn: async ({ kind, code }: { kind: RewardKind; code: string | null }) => {
      const { error } = await supabase.rpc('equip_reward', {
        p_kind: kind,
        p_code: code as string,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: myProfileKey(uid) })
      qc.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}
