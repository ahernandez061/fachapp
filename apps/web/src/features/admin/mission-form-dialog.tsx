import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { FormField } from '@/components/form-field'
import { ImagePicker } from '@/components/image-picker'
import { StorageImage } from '@/components/storage-image'
import { Spinner } from '@/components/states'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useUserId } from '@/features/auth/session'
import { errorMessage } from '@/lib/errors'
import { uploadImage } from '@/lib/images'
import { DIFFICULTY_LABEL, VERIFICATION_LABEL, type Mission } from '@/lib/types'
import { RULE_TYPES } from '@shared/rules'
import { useSaveMission } from './api'
import {
  formToMission,
  missionFormSchema,
  missionToForm,
  type MissionFormInput,
  type MissionFormValues,
} from './mission-schema'

const RULE_EXAMPLES = `Ejemplos:
{"type": "post_with_hashtag", "hashtag": "#FachApp", "min_count": 1, "window_days": 7}
{"type": "followers_min", "value": 100}
{"type": "post_count", "min": 5, "window_days": 7}`

type Props = { open: boolean; onOpenChange: (o: boolean) => void; mission?: Mission }

export function MissionFormDialog({ open, onOpenChange, mission }: Props) {
  const save = useSaveMission()
  const uid = useUserId()
  const [cover, setCover] = useState<Blob | null>(null)
  const [uploading, setUploading] = useState(false)
  const form = useForm<MissionFormInput, unknown, MissionFormValues>({
    resolver: zodResolver(missionFormSchema),
    values: missionToForm(mission),
  })
  const { errors } = form.formState
  const type = useWatch({ control: form.control, name: 'verification_type' })

  async function onSubmit(v: MissionFormValues) {
    try {
      const values = formToMission(v)
      // Portada subida desde el dispositivo → bucket público "covers".
      if (cover) {
        setUploading(true)
        values.cover_image = await uploadImage('covers', uid!, cover, 1280)
      }
      await save.mutateAsync({ id: mission?.id, values })
      setCover(null)
      toast.success(mission ? 'Misión actualizada' : 'Misión creada')
      onOpenChange(false)
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{mission ? 'Editar misión' : 'Nueva misión'}</DialogTitle>
        </DialogHeader>
        <form
          id="mission-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-3"
          noValidate
        >
          <FormField label="Título" error={errors.title}>
            <Input {...form.register('title')} />
          </FormField>
          <FormField label="Descripción" error={errors.description}>
            <Textarea {...form.register('description')} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Categoría" error={errors.category}>
              <Input {...form.register('category')} />
            </FormField>
            <FormField label="Puntos" error={errors.points}>
              <Input type="number" inputMode="numeric" min={1} {...form.register('points')} />
            </FormField>
            <FormField label="Dificultad" error={errors.difficulty}>
              <NativeSelect {...form.register('difficulty')}>
                {Object.entries(DIFFICULTY_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label="Verificación" error={errors.verification_type}>
              <NativeSelect {...form.register('verification_type')}>
                {Object.entries(VERIFICATION_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
          </div>
          {type === 'x_auto' && (
            <FormField
              label={`Regla (JSON) · tipos: ${Object.keys(RULE_TYPES).join(', ')}`}
              error={errors.rules}
              hint={<span className="whitespace-pre-line">{RULE_EXAMPLES}</span>}
            >
              <Textarea className="font-mono text-xs" rows={5} {...form.register('rules')} />
            </FormField>
          )}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Empieza (opcional)" error={errors.starts_at}>
              <Input type="datetime-local" {...form.register('starts_at')} />
            </FormField>
            <FormField label="Termina (opcional)" error={errors.ends_at}>
              <Input type="datetime-local" {...form.register('ends_at')} />
            </FormField>
          </div>
          <ImagePicker value={cover} onChange={setCover} aspect={16 / 9} label="Foto de portada" />
          {!cover && mission?.cover_image && (
            <StorageImage
              path={mission.cover_image}
              alt="Portada actual"
              className="aspect-video w-full rounded-md"
            />
          )}
          <FormField label="…o pega la URL de una imagen" error={errors.cover_image}>
            <Input
              placeholder="https://picsum.photos/seed/mision/800/450"
              {...form.register('cover_image')}
            />
          </FormField>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-4 accent-primary" {...form.register('active')} />{' '}
            Activa (visible para los usuarios)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              {...form.register('featured')}
            />{' '}
            Reto de la semana (destacada en el feed)
          </label>
          <p className="rounded-md bg-muted p-2 text-xs text-muted-foreground">
            Recuerda: las misiones no pueden consistir en acosar, mencionar en masa ni atacar a
            otras personas.
          </p>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="mission-form" disabled={save.isPending || uploading}>
            {(save.isPending || uploading) && <Spinner />} Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
