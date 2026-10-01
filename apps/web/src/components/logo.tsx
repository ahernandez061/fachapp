import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn('flex items-center gap-2 text-lg font-extrabold tracking-tight', className)}
    >
      <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" className="size-7" />
      FachApp
    </span>
  )
}
