import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { FormField } from '@/components/form-field'
import { Spinner } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { errorMessage } from '@/lib/errors'
import { authRedirectUrl, supabase } from '@/lib/supabase'
import { AuthLayout } from './auth-layout'
import { DemoAccounts } from './demo-accounts'
import { Divider, OAuthButtons } from './oauth-buttons'
import { emailSchema, loginSchema, type LoginValues } from './schemas'

export function LoginPage() {
  const [magicSent, setMagicSent] = useState(false)
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })
  const { errors, isSubmitting } = form.formState

  async function onSubmit(values: LoginValues) {
    const { error } = await supabase.auth.signInWithPassword(values)
    if (error) toast.error(errorMessage(error))
  }

  async function sendMagicLink() {
    const email = form.getValues('email')
    if (!emailSchema.safeParse(email).success) {
      form.setError('email', { message: 'Escribe tu email para recibir el enlace' })
      return
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: authRedirectUrl(), shouldCreateUser: false },
    })
    if (error) toast.error(errorMessage(error))
    else setMagicSent(true)
  }

  return (
    <AuthLayout
      title="Entrar"
      subtitle="Bienvenido de nuevo"
      footer={
        <>
          ¿No tienes cuenta?{' '}
          <Link
            to="/registro"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Regístrate
          </Link>
        </>
      }
    >
      <DemoAccounts />
      <OAuthButtons />
      <Divider />
      {magicSent ? (
        <p className="rounded-md bg-accent p-4 text-sm" role="status">
          Te hemos enviado un enlace mágico a <strong>{form.getValues('email')}</strong>. Ábrelo
          desde este dispositivo.
        </p>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
          <FormField label="Email" error={errors.email}>
            <Input
              type="email"
              autoComplete="email"
              inputMode="email"
              {...form.register('email')}
            />
          </FormField>
          <FormField label="Contraseña" error={errors.password}>
            <Input type="password" autoComplete="current-password" {...form.register('password')} />
          </FormField>
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting && <Spinner />} Entrar
          </Button>
          <div className="flex justify-between text-sm">
            <button
              type="button"
              onClick={sendMagicLink}
              className="text-primary underline-offset-4 hover:underline"
            >
              Entrar con enlace mágico
            </button>
            <Link
              to="/recuperar"
              className="text-muted-foreground underline-offset-4 hover:underline"
            >
              ¿Olvidaste la contraseña?
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  )
}
