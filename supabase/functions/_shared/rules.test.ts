import { describe, expect, it } from 'vitest'
import {
  describeRule,
  evaluateRule,
  parseRule,
  RuleError,
  ruleNeeds,
  tweetHasHashtag,
  type XTweet,
} from './rules.ts'

const now = new Date('2026-10-01T12:00:00Z')
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000).toISOString()
const tweet = (text: string, d: number, hashtags?: string[]): XTweet => ({
  id: `${text}-${d}`,
  text,
  created_at: daysAgo(d),
  hashtags,
})

describe('parseRule', () => {
  it('acepta las reglas de ejemplo y rellena valores por defecto', () => {
    expect(parseRule({ type: 'post_with_hashtag', hashtag: '#FachApp' })).toEqual({
      type: 'post_with_hashtag',
      hashtag: '#FachApp',
      min_count: 1,
      window_days: 7,
    })
    expect(parseRule({ type: 'followers_min', value: 100 })).toEqual({
      type: 'followers_min',
      value: 100,
    })
    expect(parseRule({ type: 'post_count', min: 5, window_days: 7 })).toEqual({
      type: 'post_count',
      min: 5,
      window_days: 7,
    })
  })

  it.each([
    [null],
    [[]],
    [{}],
    [{ type: 'mention_everyone' }],
    [{ type: 'post_with_hashtag', hashtag: 'dos palabras' }],
    [{ type: 'post_with_hashtag', hashtag: '#ok', min_count: 0 }],
    [{ type: 'post_with_hashtag', hashtag: '#ok', window_days: 365 }],
    [{ type: 'followers_min', value: -1 }],
    [{ type: 'followers_min', value: 1.5 }],
    [{ type: 'post_count', min: '5' }],
  ])('rechaza reglas inválidas: %j', (raw) => {
    expect(() => parseRule(raw)).toThrow(RuleError)
  })
})

describe('followers_min', () => {
  const rule = parseRule({ type: 'followers_min', value: 100 })

  it('pasa justo en el límite', () => {
    expect(evaluateRule(rule, { followers_count: 100, tweets: [] }, now)).toMatchObject({
      passed: true,
      current: 100,
      target: 100,
    })
  })

  it('no pasa por debajo', () => {
    const r = evaluateRule(rule, { followers_count: 99, tweets: [] }, now)
    expect(r.passed).toBe(false)
    expect(r.detail).toBe('Tienes 99 de 100 seguidores')
  })

  it('no necesita leer posts', () => {
    expect(ruleNeeds(rule).tweets).toBe(false)
  })
})

describe('post_with_hashtag', () => {
  const rule = parseRule({
    type: 'post_with_hashtag',
    hashtag: '#FachApp',
    min_count: 2,
    window_days: 7,
  })

  it('cuenta solo posts con el hashtag dentro de la ventana', () => {
    const tweets = [
      tweet('Empiezo hoy #FachApp', 1),
      tweet('Otro día con #fachapp 💪', 3),
      tweet('#FachApp hace mucho', 10), // fuera de la ventana
      tweet('Sin hashtag', 2),
    ]
    expect(evaluateRule(rule, { followers_count: 0, tweets }, now)).toMatchObject({
      passed: true,
      current: 2,
      target: 2,
    })
  })

  it('no confunde hashtags más largos', () => {
    expect(tweetHasHashtag(tweet('#FachAppFake', 1), '#FachApp')).toBe(false)
    expect(tweetHasHashtag(tweet('email#FachApp', 1), '#FachApp')).toBe(false)
    expect(tweetHasHashtag(tweet('(#FachApp)', 1), 'FachApp')).toBe(true)
  })

  it('usa entities.hashtags si vienen de la API', () => {
    expect(tweetHasHashtag(tweet('texto truncado…', 1, ['FACHAPP']), '#FachApp')).toBe(true)
  })

  it('soporta acentos y ñ', () => {
    expect(tweetHasHashtag(tweet('Vamos #España', 1), '#españa')).toBe(true)
  })

  it('falla si no llega al mínimo', () => {
    const r = evaluateRule(rule, { followers_count: 0, tweets: [tweet('#FachApp', 1)] }, now)
    expect(r).toMatchObject({ passed: false, current: 1, target: 2 })
  })
})

describe('post_count', () => {
  const rule = parseRule({ type: 'post_count', min: 5, window_days: 7 })

  it('cuenta los posts de los últimos N días', () => {
    const tweets = [1, 2, 3, 4, 5, 8, 9].map((d) => tweet(`post ${d}`, d))
    expect(evaluateRule(rule, { followers_count: 0, tweets }, now)).toMatchObject({
      passed: true,
      current: 5,
    })
  })

  it('ignora posts con fecha futura', () => {
    const tweets = [tweet('futuro', -1), tweet('hoy', 0)]
    expect(evaluateRule(rule, { followers_count: 0, tweets }, now).current).toBe(1)
  })

  it('pide los posts de la ventana', () => {
    expect(ruleNeeds(rule)).toEqual({ tweets: true, windowDays: 7 })
  })
})

describe('describeRule', () => {
  it('describe en español', () => {
    expect(describeRule(parseRule({ type: 'post_with_hashtag', hashtag: '#FachApp' }))).toBe(
      'Publicar un post en X con #fachapp en los últimos 7 días.',
    )
    expect(describeRule(parseRule({ type: 'followers_min', value: 100 }))).toBe(
      'Tener al menos 100 seguidores en X.',
    )
  })
})
