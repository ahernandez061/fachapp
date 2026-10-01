import { useMutation, useQueryClient } from '@tanstack/react-query'
import { functionError } from '@/lib/errors'
import { appRedirectUrl, supabase } from '@/lib/supabase'

export function useConnectX() {
  return useMutation({
    mutationFn: async (returnTo: string) => {
      const { error: consentError } = await supabase.rpc('give_x_consent')
      if (consentError) throw consentError
      const { data, error } = await supabase.functions.invoke('x-oauth-start', {
        body: { redirect_to: appRedirectUrl(`#${returnTo}`) },
      })
      if (error) throw new Error((await functionError(error)).message)
      return data as { url: string; mock?: boolean }
    },
  })
}

export function useDisconnectX() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke('x-disconnect', { body: {} })
      if (error) throw new Error((await functionError(error)).message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  })
}
