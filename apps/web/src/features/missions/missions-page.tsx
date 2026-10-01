import { Plus, Search, SearchX } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'
import { ErrorState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/select'
import { DIFFICULTY_LABEL, VERIFICATION_LABEL } from '@/lib/types'
import { MissionFormDialog } from '@/features/admin/mission-form-dialog'
import { useMyProfile } from '@/features/auth/session'
import { ValidateBanner } from '@/features/validate/validate-banner'
import { useMissions, useMyAttempts } from './api'
import { categoriesOf, EMPTY_FILTERS, filterMissions, type MissionFilters } from './filters'
import { MissionCard, MissionCardSkeleton } from './mission-card'

export function MissionsPage() {
  const missions = useMissions()
  const attempts = useMyAttempts()
  const [f, setF] = useState<MissionFilters>(EMPTY_FILTERS)
  const [creating, setCreating] = useState(false)
  const { data: me } = useMyProfile()

  const list = useMemo(
    () => filterMissions(missions.data ?? [], attempts.data ?? new Map(), f),
    [missions.data, attempts.data, f],
  )
  const categories = useMemo(() => categoriesOf(missions.data ?? []), [missions.data])
  const set = <K extends keyof MissionFilters>(k: K, v: MissionFilters[K]) =>
    setF((p) => ({ ...p, [k]: v }))
  const dirty = JSON.stringify(f) !== JSON.stringify(EMPTY_FILTERS)

  return (
    <>
      <PageHeader title="Misiones">
        {me?.is_admin && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus /> Nuevo reto
          </Button>
        )}
      </PageHeader>
      {me?.is_admin && <MissionFormDialog open={creating} onOpenChange={setCreating} />}
      <ValidateBanner />
      <div className="mb-4 grid gap-2">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            className="pl-9"
            placeholder="Buscar misiones"
            aria-label="Buscar misiones"
            value={f.q}
            onChange={(e) => set('q', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NativeSelect
            aria-label="Estado"
            value={f.status}
            onChange={(e) => set('status', e.target.value as MissionFilters['status'])}
          >
            <option value="">Todas</option>
            <option value="todo">Por hacer</option>
            <option value="pending">En revisión</option>
            <option value="done">Completadas</option>
          </NativeSelect>
          <NativeSelect
            aria-label="Categoría"
            value={f.category}
            onChange={(e) => set('category', e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c[0].toUpperCase() + c.slice(1)}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect
            aria-label="Dificultad"
            value={f.difficulty}
            onChange={(e) => set('difficulty', e.target.value as MissionFilters['difficulty'])}
          >
            <option value="">Cualquier dificultad</option>
            {Object.entries(DIFFICULTY_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect
            aria-label="Verificación"
            value={f.type}
            onChange={(e) => set('type', e.target.value as MissionFilters['type'])}
          >
            <option value="">Cualquier verificación</option>
            {Object.entries(VERIFICATION_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      {missions.isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <MissionCardSkeleton key={i} />
          ))}
        </div>
      ) : missions.error ? (
        <ErrorState error={missions.error} onRetry={() => missions.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No hay misiones con esos filtros"
          action={
            dirty && (
              <Button variant="outline" onClick={() => setF(EMPTY_FILTERS)}>
                Quitar filtros
              </Button>
            )
          }
        />
      ) : (
        <ul className="grid gap-3">
          {list.map((m) => (
            <li key={m.id}>
              <MissionCard mission={m} attempt={attempts.data?.get(m.id)} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
