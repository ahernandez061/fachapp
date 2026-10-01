import { Camera, Target, Trophy, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DemoAccounts } from './demo-accounts'

const slides: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Target,
    title: 'Completa misiones',
    text: 'Retos semanales de fotografía, deporte, cultura, solidaridad y redes sociales.',
  },
  {
    icon: Camera,
    title: 'Demuéstralo',
    text: 'Sube una foto como prueba o conecta tu cuenta de X y lo verificamos automáticamente.',
  },
  {
    icon: Trophy,
    title: 'Sube en el ranking',
    text: 'Gana puntos e insignias y compite con tus amigos y con tu provincia.',
  },
]

export function WelcomePage() {
  const [i, setI] = useState(0)
  const slide = slides[i]
  const Icon = slide.icon

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col px-6 py-10">
      <Logo className="self-center text-2xl" />
      <section
        className="flex flex-1 flex-col items-center justify-center gap-5 text-center"
        aria-roledescription="carrusel"
        aria-label={`Paso ${i + 1} de ${slides.length}`}
      >
        <div className="grid size-32 place-items-center rounded-full bg-accent text-primary">
          <Icon className="size-16" aria-hidden />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">{slide.title}</h1>
        <p className="text-muted-foreground">{slide.text}</p>
        <div className="flex gap-2" role="tablist" aria-label="Pasos">
          {slides.map((s, idx) => (
            <button
              key={s.title}
              role="tab"
              aria-selected={idx === i}
              aria-label={`Paso ${idx + 1}: ${s.title}`}
              onClick={() => setI(idx)}
              className={cn(
                'h-2 rounded-full transition-all',
                idx === i ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30',
              )}
            />
          ))}
        </div>
      </section>
      <div className="grid gap-2">
        {i < slides.length - 1 ? (
          <Button size="lg" onClick={() => setI(i + 1)}>
            Siguiente
          </Button>
        ) : (
          <Button size="lg" asChild>
            <Link to="/registro">Crear cuenta</Link>
          </Button>
        )}
        <Button size="lg" variant="ghost" asChild>
          <Link to="/entrar">Ya tengo cuenta</Link>
        </Button>
        <DemoAccounts />
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Al continuar aceptas las{' '}
          <Link to="/legal/normas" className="underline">
            normas
          </Link>{' '}
          y la{' '}
          <Link to="/legal/privacidad" className="underline">
            política de privacidad
          </Link>
          . Edad mínima: 14 años.
        </p>
      </div>
    </div>
  )
}
