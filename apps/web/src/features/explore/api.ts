import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useTrendingPosts(days = 7) {
  return useQuery({
    queryKey: ['feed', 'trending', days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_trending_posts', {
        p_days: days,
        p_limit: 30,
      })
      if (error) throw error
      return data
    },
  })
}

export function useTrendingHashtags() {
  return useQuery({
    queryKey: ['hashtags', 'trending'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_trending_hashtags', {
        p_days: 30,
        p_limit: 12,
      })
      if (error) throw error
      return data
    },
  })
}

export function usePostsByTag(tag: string | undefined) {
  return useQuery({
    queryKey: ['feed', 'tag', tag],
    enabled: !!tag,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_posts_by_tag', { p_tag: tag!, p_limit: 60 })
      if (error) throw error
      return data
    },
  })
}

/** Misión destacada ("Reto de la semana"). */
export function useFeaturedMission() {
  return useQuery({
    queryKey: ['missions', 'featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .eq('active', true)
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}
