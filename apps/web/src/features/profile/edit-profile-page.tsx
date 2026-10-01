import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { FormField } from '@/components/form-field'
import { ImagePicker } from '@/components/image-picker'
import { PageLoader, Spinner } from '@/components/states'
import { UserAvatar } from '@/components/user-avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { profileSchema, type ProfileValues } from '@/features/auth/schemas'
import { useMyProfile } from '@/features/auth/session'
import { errorMessage } from '@/lib/errors'
import { PROVINCIAS } from '@/lib/provincias'
import { useUpdateProfile } from './api'

export function EditProfilePage() {
  const navigate = useNavigate()
  const { data: me, isLoading } = useMyProfile()
  const update = useUpdateProfile()
  const [avatar, setAvatar] = useState<Blob | null>(null)
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: me
      ? { display_name: me.display_name, bio: me.bio, provincia: me.provincia ?? '' }
      : undefined,
  })
  const { errors } = form.formState
  const bio = useWatch({ control: form.control, name: 'bio' }) ?? ''

  if (isLoading || !me) return <PageLoader />

  async function onSubmit(v: ProfileValues) {
    try {
      await update.mutateAsync({ ...v, avatar })
      toast.success('Perfil actualizado')
      navigate(`/u/${me!.username}`)
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Volver">
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-bold">Editar perfil</h1>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
        <div className="flex items-center gap-4">
          {!avatar && (
            <UserAvatar
              name={me.display_name}
              username={me.username}
              url={me.avatar_url}
              className="size-20"
            />
          )}
          <div className={avatar ? 'w-40' : 'flex-1'}>
            <ImagePicker value={avatar} onChange={setAvatar} label="Foto de perfil" />
          </div>
        </div>
        <FormField label="Nombre visible" error={errors.display_name}>
          <Input {...form.register('display_name')} />
        </FormField>
        <FormField label="Biografía" error={errors.bio} hint={`${bio.length}/160`}>
          <Textarea maxLength={160} {...form.register('bio')} />
        </FormField>
        <FormField label="Provincia" error={errors.provincia}>
          <NativeSelect {...form.register('provincia')}>
            {PROVINCIAS.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <p className="text-xs text-muted-foreground">
          Tu nombre de usuario (@{me.username}) no se puede cambiar.
        </p>
        <Button type="submit" size="lg" disabled={update.isPending}>
          {update.isPending && <Spinner />} Guardar
        </Button>
      </form>
    </>
  )
}
