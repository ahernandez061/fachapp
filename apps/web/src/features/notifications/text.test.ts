import { notificationText } from './text'

describe('notificationText', () => {
  it('follow', () => {
    expect(
      notificationText({
        type: 'follow',
        payload: { actor_name: 'Lucía', actor_username: 'lucia_sev' },
      }),
    ).toEqual({ title: 'Lucía ha empezado a seguirte', href: '/u/lucia_sev' })
  })

  it('misión verificada con puntos', () => {
    const r = notificationText({
      type: 'mission_verified',
      payload: { mission_id: 'm1', mission_title: 'Tapeo', points: 60 },
    })
    expect(r.title).toBe('¡Misión completada! “Tapeo” (+60 pts)')
    expect(r.href).toBe('/misiones/m1')
  })

  it('rechazo con motivo', () => {
    expect(
      notificationText({
        type: 'mission_rejected',
        payload: { mission_title: 'Ruta', note: 'foto borrosa' },
      }).title,
    ).toBe('Tu prueba de “Ruta” no se ha aceptado: foto borrosa')
  })

  it('mención', () => {
    expect(
      notificationText({
        type: 'mention',
        payload: { actor_name: 'Pablo', excerpt: 'Mira esto @lucia_sev', post_id: 'p9' },
      }),
    ).toEqual({ title: 'Pablo te ha mencionado: “Mira esto @lucia_sev”', href: '/p/p9' })
  })

  it('tipo desconocido', () => {
    expect(notificationText({ type: 'otro', payload: {} }).href).toBe('/notificaciones')
  })
})
