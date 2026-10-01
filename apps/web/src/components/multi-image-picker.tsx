import { Trash2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { ImagePicker } from '@/components/image-picker'
import { Button } from '@/components/ui/button'

type Props = {
  value: Blob[]
  onChange: (blobs: Blob[]) => void
  max?: number
}

/** Varias fotos (cada una pasa por el recorte de ImagePicker). */
export function MultiImagePicker({ value, onChange, max = 4 }: Props) {
  const previews = useMemo(() => value.map((b) => URL.createObjectURL(b)), [value])
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews])

  return (
    <div className="grid gap-2">
      {value.length > 0 && (
        <ul className="grid grid-cols-4 gap-2" aria-label="Fotos seleccionadas">
          {previews.map((src, i) => (
            <li key={src} className="relative">
              <img
                src={src}
                alt={`Foto ${i + 1}`}
                className="aspect-square w-full rounded-md object-cover"
              />
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute -top-2 -right-2 size-7 rounded-full shadow"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                aria-label={`Quitar foto ${i + 1}`}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      {value.length < max ? (
        <ImagePicker
          value={null}
          onChange={(b) => b && onChange([...value, b])}
          label={
            value.length ? `Añadir otra foto (${value.length}/${max})` : `Fotos (hasta ${max})`
          }
        />
      ) : (
        <p className="text-xs text-muted-foreground">Máximo {max} fotos por publicación.</p>
      )}
    </div>
  )
}
