import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import { useUserId } from '@/features/auth/session'
import { uploadImage } from '@/lib/images'
import { supabase } from '@/lib/supabase'
import type { FeedPost } from '@/lib/types'

export type FeedMode = 'following' | 'discover'
const PAGE = 10

export const feedKeys = {
  list: (mode: FeedMode) => ['feed', mode] as const,
  user: (uid: string) => ['feed', 'user', uid] as const,
  post: (id: string) => ['feed', 'post', id] as const,
  comments: (postId: string) => ['comments', postId] as const,
}

export function useFeed(mode: FeedMode) {
  return useInfiniteQuery({
    queryKey: feedKeys.list(mode),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase.rpc('get_feed', {
        p_mode: mode,
        p_before: pageParam as string,
        p_limit: PAGE,
      })
      if (error) throw error
      return data
    },
    getNextPageParam: (last) =>
      last.length === PAGE ? last[last.length - 1].created_at : undefined,
  })
}

export function useUserPosts(userId: string | undefined) {
  return useQuery({
    queryKey: feedKeys.user(userId ?? ''),
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_feed')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(60)
      if (error) throw error
      return data
    },
  })
}

export function usePost(id: string | undefined) {
  return useQuery({
    queryKey: feedKeys.post(id ?? ''),
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_feed')
        .select('*')
        .eq('id', id!)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}

/** Actualiza un post en todas las cachés donde aparezca (optimistic updates). */
function patchPostEverywhere(
  qc: ReturnType<typeof useQueryClient>,
  id: string,
  patch: (p: FeedPost) => FeedPost,
) {
  qc.setQueriesData<InfiniteData<FeedPost[]>>({ queryKey: ['feed'] }, (old) => {
    if (!old) return old
    if ('pages' in old) {
      return {
        ...old,
        pages: old.pages.map((page) => page.map((p) => (p.id === id ? patch(p) : p))),
      }
    }
    if (Array.isArray(old))
      return (old as FeedPost[]).map((p) => (p.id === id ? patch(p) : p)) as never
    if ((old as FeedPost).id === id) return patch(old as FeedPost) as never
    return old
  })
}

export function useToggleLike() {
  const qc = useQueryClient()
  const uid = useUserId()
  return useMutation({
    mutationFn: async (post: Pick<FeedPost, 'id' | 'liked_by_me'>) => {
      const { error } = post.liked_by_me
        ? await supabase.from('likes').delete().eq('post_id', post.id!).eq('user_id', uid!)
        : await supabase.from('likes').insert({ post_id: post.id!, user_id: uid! })
      if (error) throw error
    },
    onMutate: async (post) => {
      await qc.cancelQueries({ queryKey: ['feed'] })
      patchPostEverywhere(qc, post.id!, (p) => ({
        ...p,
        liked_by_me: !post.liked_by_me,
        like_count: (p.like_count ?? 0) + (post.liked_by_me ? -1 : 1),
      }))
    },
    onError: (_e, post) =>
      patchPostEverywhere(qc, post.id!, (p) => ({
        ...p,
        liked_by_me: post.liked_by_me,
        like_count: (p.like_count ?? 0) + (post.liked_by_me ? 1 : -1),
      })),
  })
}

export function useDeletePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('posts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  })
}

export function useCreatePost() {
  const qc = useQueryClient()
  const uid = useUserId()
  return useMutation({
    mutationFn: async (v: { text: string; photos: Blob[] }) => {
      const images = await Promise.all(v.photos.map((p) => uploadImage('posts', uid!, p)))
      const { error } = await supabase
        .from('posts')
        .insert({ user_id: uid!, text: v.text.trim(), images })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  })
}

// ---------------------------------------------------------------------------
// Comentarios
// ---------------------------------------------------------------------------
export function useComments(postId: string | undefined) {
  return useQuery({
    queryKey: feedKeys.comments(postId ?? ''),
    enabled: !!postId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*, author:profiles!comments_user_id_fkey(username, display_name, avatar_url)')
        .eq('post_id', postId!)
        .order('created_at')
      if (error) throw error
      return data
    },
  })
}

export function useAddComment(postId: string) {
  const qc = useQueryClient()
  const uid = useUserId()
  return useMutation({
    mutationFn: async (text: string) => {
      const { error } = await supabase
        .from('comments')
        .insert({ post_id: postId, user_id: uid!, text: text.trim() })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: feedKeys.comments(postId) })
      patchPostEverywhere(qc, postId, (p) => ({ ...p, comment_count: (p.comment_count ?? 0) + 1 }))
    },
  })
}

export function useDeleteComment(postId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('comments').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: feedKeys.comments(postId) })
      patchPostEverywhere(qc, postId, (p) => ({
        ...p,
        comment_count: Math.max(0, (p.comment_count ?? 1) - 1),
      }))
    },
  })
}
