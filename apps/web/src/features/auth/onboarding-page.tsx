import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { FormField } from '@/components/form-field'
import { PageLoader, Spinner } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/select'
import { errorMessage } from '@/lib/errors'
import { PROVINCIAS } from '@/lib/provincias'
import { supabase } from '@/lib/supabase'
import { AuthLayout } from './auth-layout'
import { onboardingSchema, type OnboardingValues } from './schemas'
import { myProfileKey, signOut, useMyProfile, useUserId } from './session'

export function OnboardingPage() {
  const uid = useUserId()
  const { data: profile, isLoading } = useMyProfile()
  const qc = useQueryClient()
  const navigate = useNavigate()

  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    values: {
      username: '',
      display_name: profile?.display_name ?? '',
      provincia: '',
      birthdate: '',
      accept: false as unknown as true,
    },
  })
  const { errors, isSubmitting } = form.formState

  if (isLoading) return <PageLoader />
  if (profile?.onboarded) return <Navigate to="/misiones" replace />

  async function onSubmit(raw: OnboardingValues) {
    const v = onboardingSchema.parse(raw)
    const { data: available } = await supabase.rpc('username_available', { p_username: v.username })
    if (available === false) {
      form.setError('username', { message: 'Ese nombre de usuario ya está cogido' })
      return
    }
    const { data, error } = await supabase.rpc('complete_onboarding', {
      p_username: v.username,
      p_display_name: v.display_name,
      p_provincia: v.provincia,
      p_birthdate: v.birthdate,
      p_accept_terms: v.accept,
    })
    if (error) return toast.error(errorMessage(error))
    qc.setQueryData(myProfileKey(uid), data)
    toast.success('¡Perfil listo! Empieza por tu primera misión 🎯')
    navigate('/misiones', { replace: true })
  }

  return (
    <AuthLayout
      title="Completa tu perfil"
      subtitle="Solo te lo pediremos una vez"
      footer={
        <button className="underline" onClick={() => signOut()}>
          Cerrar sesión
        </button>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
        <FormField
          label="Nombre de usuario"
          error={errors.username}
          hint="Así te encontrarán: letras, números y _"
        >
          <Input
            autoComplete="username"
            autoCapitalize="none"
            placeholder="lucia_sev"
            {...form.register('username')}
          />
        </FormField>
        <FormField label="Nombre visible" error={errors.display_name}>
          <Input autoComplete="name" {...form.register('display_name')} />
        </FormField>
        <FormField label="Provincia" error={errors.provincia}>
          <NativeSelect {...form.register('provincia')}>
            <option value="">Elige tu provincia</option>
            {PROVINCIAS.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField
          label="Fecha de nacimiento"
          error={errors.birthdate}
          hint="Debes tener al menos 14 años. No se muestra en tu perfil."
        >
          <Input type="date" autoComplete="bday" {...form.register('birthdate')} />
        </FormField>
        <div className="grid gap-1">
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 size-4 accent-primary"
              {...form.register('accept')}
            />
            <span>
              He leído y acepto las{' '}
              <Link to="/legal/normas" className="underline" target="_blank">
                normas de la comunidad
              </Link>
              , los{' '}
              <Link to="/legal/terminos" className="underline" target="_blank">
                términos
              </Link>{' '}
              y la{' '}
              <Link to="/legal/privacidad" className="underline" target="_blank">
                política de privacidad
              </Link>
              .
            </span>
          </label>
          {errors.accept && (
            <p className="text-sm text-destructive" role="alert">
              {errors.accept.message}
            </p>
          )}
        </div>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting && <Spinner />} Empezar
        </Button>
      </form>
    </AuthLayout>
  )
}
