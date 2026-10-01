// Integración con Capacitor (Fase 7). En la web todas estas funciones son no-op.
import { Capacitor } from '@capacitor/core'

export const isNative = () => Capacitor.isNativePlatform()

/** Abre la cámara nativa y devuelve la foto como File. */
export async function takeNativePhoto(): Promise<File | null> {
  const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera')
  try {
    const photo = await Camera.getPhoto({
      source: CameraSource.Prompt,
      resultType: CameraResultType.Uri,
      quality: 85,
      promptLabelHeader: 'Foto',
      promptLabelPhoto: 'Elegir de la galería',
      promptLabelPicture: 'Hacer foto',
      promptLabelCancel: 'Cancelar',
    })
    if (!photo.webPath) return null
    const blob = await (await fetch(photo.webPath)).blob()
    return new File([blob], `foto.${photo.format}`, { type: blob.type || `image/${photo.format}` })
  } catch {
    return null // cancelado por el usuario
  }
}

/** Registra el dispositivo para notificaciones push (requiere FCM/APNs configurados). */
export async function registerPush(
  onToken: (token: string, platform: 'android' | 'ios') => void,
  onOpen: (link: string) => void,
) {
  if (!isNative()) return
  const { PushNotifications } = await import('@capacitor/push-notifications')
  const perm = await PushNotifications.requestPermissions()
  if (perm.receive !== 'granted') return
  await PushNotifications.addListener('registration', (t) =>
    onToken(t.value, Capacitor.getPlatform() === 'ios' ? 'ios' : 'android'),
  )
  // Al tocar la notificación, abre la pantalla que indica `data.link` (lo pone send-push).
  await PushNotifications.addListener('pushNotificationActionPerformed', (a) => {
    const link = a.notification.data?.link
    if (typeof link === 'string' && link.startsWith('/')) onOpen(link)
  })
  await PushNotifications.register()
}

/** Recoge el ?code= del deep link es.fachapp.app://auth y abre la sesión (PKCE). */
export async function listenAuthDeepLinks(onCode: (code: string) => Promise<unknown>) {
  if (!isNative()) return
  const { App } = await import('@capacitor/app')
  const { Browser } = await import('@capacitor/browser')
  await App.addListener('appUrlOpen', async ({ url }) => {
    const code = new URL(url).searchParams.get('code')
    if (!code) return
    await onCode(code)
    await Browser.close().catch(() => undefined)
  })
}
