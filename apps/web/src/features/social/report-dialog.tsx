import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { errorMessage } from '@/lib/errors'
import { REPORT_REASONS, type ReportReason, type ReportTarget } from '@/lib/types'
import { useReport } from './api'

type Props = {
  open: boolean
  onOpenChange: (o: boolean) => void
  target: { type: ReportTarget; id: string }
}

export function ReportDialog({ open, onOpenChange, target }: Props) {
  const [reason, setReason] = useState<ReportReason | ''>('')
  const [details, setDetails] = useState('')
  const report = useReport()

  async function submit() {
    if (!reason) return
    try {
      await report.mutateAsync({ ...target, reason, details })
      toast.success('Gracias. El equipo de moderación lo revisará.')
      onOpenChange(false)
      setReason('')
      setDetails('')
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Reportar{' '}
            {target.type === 'user'
              ? 'usuario'
              : target.type === 'post'
                ? 'publicación'
                : 'comentario'}
          </DialogTitle>
          <DialogDescription>Tu reporte es anónimo para la otra persona.</DialogDescription>
        </DialogHeader>
        <fieldset className="grid gap-2">
          <legend className="mb-1 text-sm font-medium">Motivo</legend>
          {Object.entries(REPORT_REASONS).map(([k, label]) => (
            <label
              key={k}
              className="flex items-center gap-3 rounded-md border p-2.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-accent"
            >
              <input
                type="radio"
                name="reason"
                value={k}
                checked={reason === k}
                onChange={() => setReason(k as ReportReason)}
                className="accent-primary"
              />
              {label}
            </label>
          ))}
        </fieldset>
        <Textarea
          placeholder="Detalles (opcional)"
          aria-label="Detalles"
          maxLength={500}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!reason || report.isPending}>
            Enviar reporte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
