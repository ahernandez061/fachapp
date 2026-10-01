import { Check, Coins, Gift, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/page-header'
import { ErrorState, PageLoader, Spinner } from '@/components/states'
import { UserAvatar } from '@/components/user-avatar'
import { Button } from '@/components/ui/button'
import { useMyProfile } from '@/features/auth/session'
import { BadgeIcon } from '@/features/profile/badge-icon'
import { errorMessage } from '@/lib/errors'
import { formatNumber } from '@/lib/i18n'
import { THEMES } from '@/lib/rewards'
import { cn } from '@/lib/utils'
import {
  KIND_LABEL,
  useBalance,
  useBuyReward,
  useEquipReward,
  useMyRewards,
  useRewards,
  type Reward,
  type RewardKind,
} from './api'

const BADGE_ICON: Record<string, string> = {
  insignia_mecenas: 'mecenas',
  insignia_toro: 'toro',
}

function Preview({ reward }: { reward: Reward }) {
  const { data: me } = useMyProfile()
  if (reward.kind === 'theme') {
    return (
      <span
        className="size-12 shrink-0 rounded-full border shadow-inner"
        style={{ background: THEMES[reward.code]?.swatch }}
        aria-hidden
      />
    )
  }
  if (reward.kind === 'frame') {
    return (
      <UserAvatar
        name={me?.display_name}
        username={me?.username}
        url={me?.avatar_url}
        frame={reward.code}
        className="size-12"
      />
    )
  }
  if (reward.kind === 'badge') {
    return <BadgeIcon icon={BADGE_ICON[reward.code] ?? 'star'} className="size-12 shrink-0" />
  }
  return (
    <span
      className="grid size-12 shrink-0 place-items-center rounded-full bg-accent text-xl"
      aria-hidden
    >
      🏷️
    </span>
  )
}

export function RewardsPage() {
  const rewards = useRewards()
  const mine = useMyRewards()
  const balance = useBalance()
  const buy = useBuyReward()
  const equip = useEquipReward()
  const { data: me } = useMyProfile()

  if (rewards.isLoading || mine.isLoading) return <PageLoader />
  if (rewards.error) return <ErrorState error={rewards.error} onRetry={() => rewards.refetch()} />

  const equipped: Record<RewardKind, string | null | undefined> = {
    theme: me?.equipped_theme,
    frame: me?.equipped_frame,
    title: me?.equipped_title,
    badge: null,
  }
  const bal = balance.data?.balance ?? 0
  const kinds = Object.keys(KIND_LABEL) as RewardKind[]

  async function onBuy(r: Reward) {
    try {
      await buy.mutateAsync(r.code)
      if (r.kind !== 'badge') await equip.mutateAsync({ kind: r.kind, code: r.code })
      toast.success(`¡Canjeado: ${r.name}! 🎁`)
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  async function onEquip(r: Reward, on: boolean) {
    try {
      await equip.mutateAsync({ kind: r.kind, code: on ? r.code : null })
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5">
      <PageHeader title="Premios" />
      <section
        aria-label="Tu saldo"
        className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-primary to-primary/70 p-4 text-primary-foreground shadow-sm"
      >
        <Coins className="size-10 shrink-0" aria-hidden />
        <div className="flex-1">
          <p className="text-3xl font-extrabold tabular-nums">{formatNumber(bal)}</p>
          <p className="text-sm opacity-90">puntos para canjear</p>
        </div>
        <p className="max-w-36 text-right text-xs opacity-90">
          Canjear no te quita puntos del ranking ({formatNumber(balance.data?.total_points ?? 0)}{' '}
          pts ganados).
        </p>
      </section>

      {kinds.map((kind) => {
        const items = rewards.data?.filter((r) => r.kind === kind) ?? []
        if (!items.length) return null
        return (
          <section key={kind} aria-labelledby={`k-${kind}`}>
            <h2 id={`k-${kind}`} className="mb-2 font-semibold">
              {KIND_LABEL[kind]}
            </h2>
            <ul className="grid gap-2">
              {items.map((r) => {
                const owned = mine.data?.has(r.code) ?? false
                const isOn = equipped[kind] === r.code
                const affordable = bal >= r.cost
                return (
                  <li
                    key={r.code}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border bg-card p-3',
                      isOn && 'border-primary ring-1 ring-primary',
                    )}
                    aria-label={r.name}
                  >
                    <Preview reward={r} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.description}</p>
                    </div>
                    {owned ? (
                      kind === 'badge' ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          <Check className="size-4" /> Tuya
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant={isOn ? 'default' : 'outline'}
                          disabled={equip.isPending}
                          onClick={() => onEquip(r, !isOn)}
                          aria-pressed={isOn}
                        >
                          {isOn ? (
                            <>
                              <Check /> Puesto
                            </>
                          ) : (
                            'Usar'
                          )}
                        </Button>
                      )
                    ) : (
                      <Button
                        size="sm"
                        variant={affordable ? 'default' : 'outline'}
                        disabled={!affordable || buy.isPending}
                        onClick={() => onBuy(r)}
                        aria-label={`Canjear ${r.name} por ${r.cost} puntos`}
                      >
                        {buy.isPending && buy.variables === r.code ? (
                          <Spinner />
                        ) : affordable ? (
                          <Gift />
                        ) : (
                          <Lock />
                        )}
                        {formatNumber(r.cost)}
                      </Button>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
