import { Fragment, useMemo } from 'react'
import { Link } from 'react-router'
import { parseRichText } from '@/lib/rich-text'
import { cn } from '@/lib/utils'

/** Texto de un post o comentario con #hashtags y @menciones enlazados. */
export function RichText({ text, className }: { text: string; className?: string }) {
  const tokens = useMemo(() => parseRichText(text), [text])
  return (
    <p className={cn('break-words whitespace-pre-line', className)}>
      {tokens.map((t, i) =>
        t.type === 'text' ? (
          <Fragment key={i}>{t.value}</Fragment>
        ) : (
          <Link
            key={i}
            to={
              t.type === 'hashtag'
                ? `/explorar/tag/${encodeURIComponent(t.tag)}`
                : `/u/${t.username}`
            }
            className="font-medium text-primary hover:underline"
          >
            {t.value}
          </Link>
        ),
      )}
    </p>
  )
}
