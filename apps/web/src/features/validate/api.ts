import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUserId } from '@/features/auth/session'
import { supabase } from '@/lib/supabase'

export const validateKeys = {
  queue: (uid: string | null) => ['validate', 'queue', uid] as const,
  count: (uid: string | null) => ['validate', 'count', uid] as const,
  votes: (attemptId: string) => ['validate', 'votes', attemptId] as const,
}

/** Lote de pruebas pendientes de otros usuarios, en orden aleatorio. */
export function useValidationQueue() {
  const uid = useUserId()
  return useQuery({
    queryKey: validateKeys.queue(uid),
    enabled: !!uid,
    staleTime: Infinity, // el orden es aleatorio: no lo cambiamos mientras votas
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_attempts_to_validate', { p_limit: 10 })
      if (error) throw error
      return data
    },
  })
}

export type ValidationItem = NonNullable<ReturnType<typeof useValidationQueue>['data']>[number]

export function usePendingValidationsCount() {
  const uid = useUserId()
  return useQuery({
    queryKey: validateKeys.count(uid),
    enabled: !!uid,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('pending_validations_count')
      if (error) throw error
      return data
    },
  })
}

export function useAttemptVotes(attemptId: string | undefined) {
  return useQuery({
    queryKey: validateKeys.votes(attemptId ?? ''),
    enabled: !!attemptId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('attempt_vote_counts', {
        p_attempt_id: attemptId!,
      })
      if (error) throw error
      return data[0]
    },
  })
}

export function useVote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ attemptId, approve }: { attemptId: string; approve: boolean }) => {
      const { data, error } = await supabase.rpc('vote_attempt', {
        p_attempt_id: attemptId,
        p_approve: approve,
      })
      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['validate', 'count'] })
      qc.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}
