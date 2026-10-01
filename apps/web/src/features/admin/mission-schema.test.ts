import { formToMission, missionFormSchema, missionToForm } from './mission-schema'

const base = missionToForm()

describe('missionFormSchema', () => {
  it('valida una misión de foto sin reglas', () => {
    const r = missionFormSchema.safeParse({
      ...base,
      title: 'Atardecer',
      verification_type: 'photo',
      rules: 'basura',
    })
    expect(r.success).toBe(true)
  })

  it('exige reglas válidas en misiones x_auto', () => {
    const bad = missionFormSchema.safeParse({
      ...base,
      title: 'Hashtag',
      verification_type: 'x_auto',
      rules: '{"type":"spam_masivo"}',
    })
    expect(bad.success).toBe(false)
    expect(bad.error?.issues[0].path).toEqual(['rules'])

    const notJson = missionFormSchema.safeParse({
      ...base,
      title: 'Hashtag',
      verification_type: 'x_auto',
      rules: '{',
    })
    expect(notJson.error?.issues[0].message).toBe('JSON no válido')
  })

  it('convierte puntos a número y normaliza reglas', () => {
    const v = missionFormSchema.parse({
      ...base,
      title: 'Seguidores',
      verification_type: 'x_auto',
      points: '150',
      rules: '{"type":"followers_min","value":100}',
    })
    const m = formToMission(v)
    expect(m.points).toBe(150)
    expect(m.rules).toEqual({ type: 'followers_min', value: 100 })
  })

  it('fin posterior al inicio', () => {
    const r = missionFormSchema.safeParse({
      ...base,
      title: 'X',
      starts_at: '2026-10-10T10:00',
      ends_at: '2026-10-01T10:00',
    })
    expect(r.success).toBe(false)
  })
})
