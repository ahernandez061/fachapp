import { Camera, ImagePlus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cropImage } from '@/lib/crop'
import { isNative, takeNativePhoto } from '@/lib/native'

type Props = {
  value: Blob | null
  onChange: (blob: Blob | null) => void
  aspect?: number
  label?: string
}

/** Elegir foto (cámara o galería) → recortar → Blob. La compresión a WebP se hace al subir. */
export function ImagePicker({ value, onChange, aspect = 1, label = 'Foto' }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const [source, setSource] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [area, setArea] = useState<Area | null>(null)
  const preview = useMemo(() => (value ? URL.createObjectURL(value) : null), [value])
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview])

  function openFile(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('El archivo debe ser una imagen')
    if (file.size > 20 * 1024 * 1024)
      return toast.error('La imagen es demasiado grande (máx. 20 MB)')
    setSource(URL.createObjectURL(file))
    setZoom(1)
    setCrop({ x: 0, y: 0 })
  }

  async function openCamera() {
    if (isNative()) {
      const file = await takeNativePhoto()
      if (file) openFile(file)
    } else {
      cameraRef.current?.click()
    }
  }

  const onCropComplete = useCallback((_: Area, px: Area) => setArea(px), [])

  async function confirmCrop() {
    if (!source || !area) return
    const cropping = source
    // Cierra el recorte ya; si mientras tanto se elige otra foto, no la cerramos.
    setSource(null)
    try {
      onChange(await cropImage(cropping, area))
    } catch {
      toast.error('No se pudo recortar la imagen')
    } finally {
      URL.revokeObjectURL(cropping)
    }
  }

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      {preview ? (
        <div className="relative overflow-hidden rounded-xl border">
          <img
            src={preview}
            alt="Vista previa de la foto"
            className="w-full object-cover"
            style={{ aspectRatio: aspect }}
          />
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute top-2 right-2 rounded-full"
            onClick={() => onChange(null)}
            aria-label="Quitar foto"
          >
            <Trash2 />
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" className="h-24 flex-col" onClick={openCamera}>
            <Camera className="size-6" /> Cámara
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-24 flex-col"
            onClick={() => galleryRef.current?.click()}
          >
            <ImagePlus className="size-6" /> Galería
          </Button>
        </div>
      )}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          openFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        data-testid="gallery-input"
        onChange={(e) => {
          openFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />

      <Dialog open={!!source} onOpenChange={(o) => !o && setSource(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recorta la foto</DialogTitle>
          </DialogHeader>
          <div className="relative h-72 overflow-hidden rounded-lg bg-black">
            {source && (
              <Cropper
                image={source}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <label className="grid gap-1 text-sm">
            Zoom
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="accent-primary"
            />
          </label>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSource(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmCrop}>Usar foto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
