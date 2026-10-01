import { useQuery } from '@tanstack/react-query'
import { directImageUrl, signedImageUrl } from '@/lib/images'

/** Resuelve la URL de una imagen guardada como "bucket/ruta" (pública o firmada) o URL externa. */
export function useImageUrl(path: string | null | undefined) {
  const direct = directImageUrl(path)
  const signed = useQuery({
    queryKey: ['signed-url', path],
    queryFn: () => signedImageUrl(path!),
    enabled: !!path && !direct,
    staleTime: 50 * 60_000,
  })
  return {
    url: direct ?? signed.data ?? null,
    loading: !direct && signed.isLoading,
    error: signed.isError,
  }
}
