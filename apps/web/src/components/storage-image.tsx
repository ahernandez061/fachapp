import { ImageOff } from 'lucide-react'
import { useState, type ComponentProps } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useImageUrl } from '@/lib/use-image-url'
import { cn } from '@/lib/utils'

type Props = Omit<ComponentProps<'img'>, 'src'> & { path: string | null | undefined }

export function StorageImage({ path, className, alt = '', ...props }: Props) {
  const { url, loading, error } = useImageUrl(path)
  const [failed, setFailed] = useState(false)

  if (loading) return <Skeleton className={cn('rounded-none', className)} />
  if (!url || error || failed) {
    return (
      <div
        className={cn('grid place-items-center bg-muted text-muted-foreground', className)}
        role="img"
        aria-label={alt}
      >
        <ImageOff className="size-6" aria-hidden />
      </div>
    )
  }
  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={cn('object-cover', className)}
      {...props}
    />
  )
}
