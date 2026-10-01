// Divide un texto en trozos para pintar #hashtags y @menciones como enlaces.
// El patrón de hashtag coincide con public.extract_hashtags() de la BD.

export type RichToken =
  | { type: 'text'; value: string }
  | { type: 'hashtag'; value: string; tag: string }
  | { type: 'mention'; value: string; username: string }

const PATTERN = /(^|[^\p{L}\p{N}_])([#@])([\p{L}\p{N}_]{2,40})/gu

export function parseRichText(text: string): RichToken[] {
  const tokens: RichToken[] = []
  let last = 0
  for (const m of text.matchAll(PATTERN)) {
    const [, before, sigil, word] = m
    const start = m.index + before.length
    if (start > last) tokens.push({ type: 'text', value: text.slice(last, start) })
    if (sigil === '#') {
      tokens.push({ type: 'hashtag', value: `#${word}`, tag: word.toLowerCase() })
    } else {
      tokens.push({ type: 'mention', value: `@${word}`, username: word.toLowerCase() })
    }
    last = start + 1 + word.length
  }
  if (last < text.length) tokens.push({ type: 'text', value: text.slice(last) })
  return tokens
}

/** Hashtags únicos en minúscula (igual que la columna generada posts.hashtags). */
export function extractHashtags(text: string) {
  return [
    ...new Set(
      parseRichText(text)
        .filter((t): t is Extract<RichToken, { type: 'hashtag' }> => t.type === 'hashtag')
        .map((t) => t.tag),
    ),
  ]
}
