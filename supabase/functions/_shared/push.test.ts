import { describe, expect, it } from 'vitest'
import { pushMessage } from './push.ts'

describe('pushMessage', () => {
  it('like', () => {
    expect(pushMessage({ type: 'like', payload: { actor_name: 'Lucía', post_id: 'p1' } })).toEqual({
      title: 'Me gusta',
      body: 'A Lucía le gusta tu publicación',
      link: '/p/p1',
    })
  })

  it('misión completada con puntos', () => {
    const m = pushMessage({
      type: 'mission_verified',
      payload: { mission_id: 'm1', mission_title: 'Tapeo', points: 60 },
    })
    expect(m.body).toBe('“Tapeo” · +60 puntos')
    expect(m.link).toBe('/misiones/m1')
  })

  it('usa @usuario si no hay nombre', () => {
    expect(pushMessage({ type: 'follow', payload: { actor_username: 'pablo_bcn' } }).body).toBe(
      '@pablo_bcn ha empezado a seguirte',
    )
  })

  it('payload vacío o tipo desconocido', () => {
    expect(pushMessage({ type: 'raro', payload: null }).link).toBe('/notificaciones')
  })
})
