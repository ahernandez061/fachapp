import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react'
import type { FieldError } from 'react-hook-form'
import { Label } from '@/components/ui/label'

type Props = {
  label: ReactNode
  error?: FieldError
  hint?: ReactNode
  children: ReactElement<Record<string, unknown>>
}

/** Etiqueta + control + mensaje de error accesible (aria-invalid / aria-describedby). */
export function FormField({ label, error, hint, children }: Props) {
  const id = useId()
  const msgId = `${id}-msg`
  const control = isValidElement(children)
    ? cloneElement(children, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error || hint ? msgId : undefined,
      })
    : children
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {control}
      {error ? (
        <p id={msgId} className="text-sm text-destructive" role="alert">
          {error.message}
        </p>
      ) : (
        hint && (
          <p id={msgId} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
