export type PixelCrop = { x: number; y: number; width: number; height: number }

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** Recorta la imagen con un canvas y devuelve un Blob JPEG (luego se convierte a WebP). */
export async function cropImage(src: string, crop: PixelCrop): Promise<Blob> {
  const img = await loadImage(src)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(crop.width)
  canvas.height = Math.round(crop.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas no disponible')
  ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('No se pudo recortar'))),
      'image/jpeg',
      0.92,
    ),
  )
}
