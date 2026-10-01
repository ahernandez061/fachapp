import { CheckCircle2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { ImagePicker } from '@/components/image-picker'
import { MultiImagePicker } from '@/components/multi-image-picker'
import { PageHeader } from '@/components/page-header'
import { Spinner } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useCreatePost } from '@/features/feed/api'
import { errorMessage } from '@/lib/errors'
import { formatNumber } from '@/lib/i18n'
import { containsOffensive, OFFENSIVE_MESSAGE } from '@/lib/offensive'
import { useMissions, useMyAttempts, useSubmitAttempt } from './api'
import { missionAvailability } from './filters'

const FREE_POST = '__libre__'

export function UploadPage() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const missions = useMissions()
  const attempts = useMyAttempts()
  const submit = useSubmitAttempt()
  const createPost = useCreatePost()

  const [photo, setPhoto] = useState<Blob | null>(null)
  const [photos, setPhotos] = useState<Blob[]>([])
  const [text, setText] = useState('')
  const [done, setDone] = useState<'attempt' | 'post' | null>(null)

  const selected = params.get('mision') ?? ''
  // Solo misiones que se completan subiendo algo y que aún no has completado.
  const eligible = useMemo(
    () =>
      (missions.data ?? []).filter(
        (m) =>
          m.verification_type !== 'x_auto' &&
          missionAvailability(m) === 'open' &&
          !['verified', 'pending'].includes(attempts.data?.get(m.id)?.status ?? ''),
      ),
    [missions.data, attempts.data],
  )
  const mission = eligible.find((m) => m.id === selected)
  const isFree = selected === FREE_POST
  const needsPhoto = mission?.verification_type === 'photo'
  const pending = submit.isPending || createPost.isPending

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (containsOffensive(text)) return toast.error(OFFENSIVE_MESSAGE)
    try {
      if (mission) {
        if (needsPhoto && !photo) return toast.error('Añade una foto como prueba')
        await submit.mutateAsync({ missionId: mission.id, photo, note: text })
        setDone('attempt')
      } else if (isFree) {
        if (!photos.length && !text.trim()) return toast.error('Escribe algo o añade una foto')
        await createPost.mutateAsync({ text, photos })
        toast.success('Publicado')
        navigate('/')
      }
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  if (done === 'attempt') {
    return (
      <div className="grid justify-items-center gap-3 py-16 text-center">
        <CheckCircle2 className="size-16 text-emerald-600" aria-hidden />
        <h1 className="text-2xl font-bold">¡Prueba enviada!</h1>
        <p className="max-w-xs text-muted-foreground">
          Ahora la votará la comunidad: con 5 votos a favor el reto queda superado (y con 10 en
          contra, fallido). Te avisaremos con una notificación.
        </p>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/misiones">Más misiones</Link>
          </Button>
          <Button asChild>
            <Link to="/">Ir al feed</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <PageHeader title="Subir" />
      <form onSubmit={onSubmit} className="grid gap-5">
        <div className="grid gap-1.5">
          <Label htmlFor="upload-mission">¿Qué quieres subir?</Label>
          <NativeSelect
            id="upload-mission"
            value={selected}
            onChange={(e) =>
              setParams(e.target.value ? { mision: e.target.value } : {}, { replace: true })
            }
          >
            <option value="">Elige una opción</option>
            <option value={FREE_POST}>Publicación libre</option>
            <optgroup label="Prueba de misión">
              {eligible.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} (+{formatNumber(m.points)})
                </option>
              ))}
            </optgroup>
          </NativeSelect>
          {selected && !isFree && !mission && missions.isSuccess && (
            <p className="text-sm text-muted-foreground">
              Esa misión no admite pruebas ahora mismo.
            </p>
          )}
        </div>

        {(mission || isFree) && (
          <>
            {mission && <p className="rounded-md bg-accent p-3 text-sm">{mission.description}</p>}
            {isFree && <MultiImagePicker value={photos} onChange={setPhotos} />}
            {mission?.verification_type === 'photo' && (
              <ImagePicker value={photo} onChange={setPhoto} label="Foto de prueba (obligatoria)" />
            )}
            <div className="grid gap-1.5">
              <Label htmlFor="upload-text">
                {mission?.verification_type === 'manual'
                  ? 'Cuéntanos cómo la completaste'
                  : 'Texto'}
              </Label>
              <Textarea
                id="upload-text"
                maxLength={500}
                placeholder={
                  isFree
                    ? '¿Qué quieres contar? Usa #hashtags y @menciones'
                    : 'Añade un comentario (aparecerá en tu publicación)'
                }
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <p className="text-right text-xs text-muted-foreground">{text.length}/500</p>
            </div>
            <Button type="submit" size="lg" disabled={pending}>
              {pending && <Spinner />} {mission ? 'Enviar prueba' : 'Publicar'}
            </Button>
          </>
        )}
      </form>
    </>
  )
}
