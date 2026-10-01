import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { FormField } from '@/components/form-field'
import { Spinner } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { errorMessage } from '@/lib/errors'
import { authRedirectUrl, supabase } from '@/lib/supabase'
import { AuthLayout } from './auth-layout'
import { emailSchema, resetPasswordSchema } from './schemas'
import { useSessionStore } from './session'

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const form = useForm<{ email: string }>({
    resolver: zodResolver(z.object({ email: emailSchema })),
    defaultValues: { email: '' },
  })

  async function onSubmit({ email }: { email: string }) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: authRedirectUrl(),
    })
    if (error) return toast.error(errorMessage(error))
    setSent(true)
  }

  return (
    <AuthLayout
      title="Recuperar contraseña"
      subtitle="Te enviaremos un enlace para crear una nueva"
      footer={
        <Link to="/entrar" className="underline">
          Volver a entrar
        </Link>
      }
    >
      {sent ? (
        <p className="rounded-md bg-accent p-4 text-sm" role="status">
          Si existe una cuenta con ese email, recibirás un enlace en unos minutos.
        </p>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
          <FormField label="Email" error={form.formState.errors.email}>
            <Input type="email" autoComplete="email" {...form.register('email')} />
          </FormField>
          <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Spinner />} Enviar enlace
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const form = useForm<{ password: string; confirm: string }>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirm: '' },
  })

  async function onSubmit({ password }: { password: string }) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return toast.error(errorMessage(error))
    useSessionStore.getState().set({ recovering: false })
    toast.success('Contraseña actualizada')
    navigate('/', { replace: true })
  }

  return (
    <AuthLayout title="Nueva contraseña">
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
        <FormField label="Nueva contraseña" error={form.formState.errors.password}>
          <Input type="password" autoComplete="new-password" {...form.register('password')} />
        </FormField>
        <FormField label="Repite la contraseña" error={form.formState.errors.confirm}>
          <Input type="password" autoComplete="new-password" {...form.register('confirm')} />
        </FormField>
        <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
          Guardar
        </Button>
      </form>
    </AuthLayout>
  )
}
