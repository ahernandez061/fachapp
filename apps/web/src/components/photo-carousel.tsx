import { Heart } from 'lucide-react'
import { useRef, useState } from 'react'
import { StorageImage } from '@/components/storage-image'
import { cn } from '@/lib/utils'

type Props = {
  images: string[]
  alt: string
  /** Doble toque sobre la foto (estilo Instagram): normalmente "me gusta". */
  onDoubleTap?: () => void
  /** Toque simple: p. ej. abrir el visor a pantalla completa. */
  onOpen?: (index: number) => void
  className?: string
}

/** Carrusel de fotos con scroll-snap, puntos indicadores y doble toque para dar like. */
export function PhotoCarousel({ images, alt, onDoubleTap, onOpen, className }: Props) {
  const [index, setIndex] = useState(0)
  const [burst, setBurst] = useState(0)
  const lastTap = useRef(0)
  const singleTap = useRef<ReturnType<typeof setTimeout> | null>(null)

  function onTap(i: number, now: number) {
    if (now - lastTap.current < 300) {
      // Doble toque: cancela el toque simple pendiente.
      if (singleTap.current) clearTimeout(singleTap.current)
      lastTap.current = 0
      onDoubleTap?.()
      setBurst((b) => b + 1)
      return
    }
    lastTap.current = now
    if (onOpen) singleTap.current = setTimeout(() => onOpen(i), 300)
  }

  return (
    <div className={cn('relative', className)}>
      <div
        className="flex snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto [&::-webkit-scrollbar]:hidden"
        onScroll={(e) => {
          const el = e.currentTarget
          setIndex(Math.round(el.scrollLeft / el.clientWidth))
        }}
        aria-roledescription="carrusel"
        aria-label={images.length > 1 ? `${images.length} fotos` : undefined}
      >
        {images.map((path, i) => (
          <button
            key={path + i}
            type="button"
            className="w-full shrink-0 snap-center"
            onClick={(e) => onTap(i, e.timeStamp)}
            aria-label={images.length > 1 ? `Foto ${i + 1} de ${images.length}` : 'Ver foto'}
          >
            <StorageImage
              path={path}
              alt={alt}
              className="aspect-square w-full"
              draggable={false}
            />
          </button>
        ))}
      </div>

      {burst > 0 && (
        <Heart
          key={burst}
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 size-24 -translate-x-1/2 -translate-y-1/2 animate-[heart-pop_0.8s_ease-out_forwards] fill-white text-white drop-shadow-lg"
        />
      )}

      {images.length > 1 && (
        <>
          <span className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
            {index + 1}/{images.length}
          </span>
          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5" aria-hidden>
            {images.map((_, i) => (
              <span
                key={i}
                className={cn(
                  'size-1.5 rounded-full bg-white/60 transition-all',
                  i === index && 'w-3 bg-white',
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
