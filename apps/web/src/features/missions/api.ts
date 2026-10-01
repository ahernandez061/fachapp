import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUserId } from '@/features/auth/session'
import { functionError } from '@/lib/errors'
import { uploadImage } from '@/lib/images'
import { supabase } from '@/lib/supabase'
import type { MissionAttempt } from '@/lib/types'
import type { RuleResult } from '@shared/rules'

export const missionKeys = {
  all: ['missions'] as const,
  detail: (id: string) => ['missions', id] as const,
  myAttempts: (uid: string | null) => ['attempts', 'mine', uid] as const,
}

export function useMissions() {
  return useQuery({
    queryKey: missionKeys.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useMission(id: string | undefined) {
  return useQuery({
    queryKey: missionKeys.detail(id ?? ''),
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('missions').select('*').eq('id', id!).single()
      if (error) throw error
      return data
    },
  })
}

/** Mis intentos, indexados por misión. */
export function useMyAttempts() {
  const uid = useUserId()
  return useQuery({
    queryKey: missionKeys.myAttempts(uid),
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mission_attempts')
        .select('*')
        .eq('user_id', uid!)
      if (error) throw error
      return new Map<string, MissionAttempt>(data.map((a) => [a.mission_id, a]))
    },
  })
}

export function useSubmitAttempt() {
  const uid = useUserId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: { missionId: string; photo: Blob | null; note: string }) => {
      const photoPath = v.photo ? await uploadImage('proofs', uid!, v.photo) : null
      const { data, error } = await supabase.rpc('submit_attempt', {
        p_mission_id: v.missionId,
        p_photo_path: photoPath as string,
        p_note: v.note,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attempts'] }),
  })
}

export type VerifyResponse = {
  status: 'verified' | 'rejected'
  already?: boolean
  cached?: boolean
  result?: RuleResult
}

export class VerifyError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message)
  }
}

export function useVerifyX() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (missionId: string): Promise<VerifyResponse> => {
      const { data, error } = await supabase.functions.invoke('x-verify', {
        body: { mission_id: missionId },
      })
      if (error) {
        const { code, message } = await functionError(error)
        throw new VerifyError(code, message)
      }
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attempts'] })
      qc.invalidateQueries({ queryKey: ['feed'] })
      qc.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}
