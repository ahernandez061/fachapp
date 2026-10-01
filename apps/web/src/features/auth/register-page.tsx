import { zodResolver } from '@hookform/resolvers/zod'
import { MailCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { EmptyState } from '@/components/empty-state'
import { FormField } from '@/components/form-field'
import { Spinner } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { errorMessage } from '@/lib/errors'
import { authRedirectUrl, supabase } from '@/lib/supabase'
import { AuthLayout } from './auth-layout'
import { Divider, OAuthButtons } from './oauth-buttons'
import { registerSchema, type RegisterValues } from './schemas'

export function RegisterPage() {
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirm: '' },
  })
  const { errors, isSubmitting } = form.formState

  async function onSubmit({ email, password }: RegisterValues) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: authRedirectUrl() },
    })
    if (error) return toast.error(errorMessage(error))
    // Si el proyecto exige confirmar el email, no hay sesión todavía.
    if (!data.session) setPendingEmail(email)
  }

  if (pendingEmail) {
    return (
      <AuthLayout title="Revisa tu email">
        <EmptyState
          icon={MailCheck}
          title="Confirma tu cuenta"
          description={`Te hemos enviado un enlace a ${pendingEmail}. Ábrelo para activar tu cuenta.`}
          action={
            <Button variant="outline" asChild>
              <Link to="/entrar">Ir a entrar</Link>
            </Button>
          }
        />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Crear cuenta"
      subtitle="Únete y empieza a completar misiones"
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link
            to="/entrar"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Entrar
          </Link>
        </>
      }
    >
      <OAuthButtons />
      <Divider />
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
        <FormField label="Email" error={errors.email}>
          <Input type="email" autoComplete="email" inputMode="email" {...form.register('email')} />
        </FormField>
        <FormField label="Contraseña" error={errors.password} hint="Mínimo 8 caracteres">
          <Input type="password" autoComplete="new-password" {...form.register('password')} />
        </FormField>
        <FormField label="Repite la contraseña" error={errors.confirm}>
          <Input type="password" autoComplete="new-password" {...form.register('confirm')} />
        </FormField>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting && <Spinner />} Crear cuenta
        </Button>
      </form>
    </AuthLayout>
  )
}
