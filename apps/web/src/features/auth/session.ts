import type { Session } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { create } from 'zustand'
import { listenAuthDeepLinks } from '@/lib/native'
import { queryClient } from '@/lib/query-client'
import { supabase } from '@/lib/supabase'

type SessionState = {
  session: Session | null
  initialized: boolean
  recovering: boolean
  set: (s: Partial<SessionState>) => void
}

export const useSessionStore = create<SessionState>()((set) => ({
  session: null,
  initialized: false,
  recovering: false,
  set: (s) => set(s),
}))

export const useSession = () => useSessionStore((s) => s.session)
export const useUserId = () => useSessionStore((s) => s.session?.user.id ?? null)

/** Escucha los cambios de sesión de Supabase. Se monta una vez en <App/>. */
export function useAuthListener() {
  useEffect(() => {
    const { set } = useSessionStore.getState()
    supabase.auth.getSession().then(({ data }) => set({ session: data.session, initialized: true }))

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      set({ session, initialized: true })
      if (event === 'PASSWORD_RECOVERY') set({ recovering: true })
      if (event === 'SIGNED_OUT') queryClient.clear()
      // Limpia ?code=… de la URL tras volver de OAuth / email.
      if (window.location.search.includes('code=')) {
        window.history.replaceState(null, '', window.location.pathname + window.location.hash)
      }
    })
    listenAuthDeepLinks((code) => supabase.auth.exchangeCodeForSession(code))
    return () => data.subscription.unsubscribe()
  }, [])
}

export const myProfileKey = (uid: string | null) => ['profile', 'me', uid] as const

export function useMyProfile() {
  const uid = useUserId()
  return useQuery({
    queryKey: myProfileKey(uid),
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', uid!).single()
      if (error) throw error
      return data
    },
  })
}

export async function signOut() {
  await supabase.auth.signOut()
}
