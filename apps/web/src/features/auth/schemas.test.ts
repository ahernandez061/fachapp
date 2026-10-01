import { ageOn, onboardingSchema, registerSchema, usernameSchema } from './schemas'

const valid = {
  username: 'Lucia_Sev',
  display_name: 'Lucía',
  provincia: 'SE',
  birthdate: '2000-01-01',
  accept: true as const,
}

describe('ageOn', () => {
  it('cuenta el cumpleaños exacto', () => {
    const today = new Date('2026-10-01T12:00:00')
    expect(ageOn(new Date('2012-10-01T00:00:00'), today)).toBe(14)
    expect(ageOn(new Date('2012-10-02T00:00:00'), today)).toBe(13)
  })
})

describe('usernameSchema', () => {
  it('normaliza a minúsculas', () => {
    expect(usernameSchema.parse('  Pablo_BCN ')).toBe('pablo_bcn')
  })
  it.each(['ab', 'con espacio', 'ñandú', 'a'.repeat(21)])('rechaza "%s"', (u) => {
    expect(usernameSchema.safeParse(u).success).toBe(false)
  })
})

describe('onboardingSchema', () => {
  it('acepta un perfil válido', () => {
    expect(onboardingSchema.parse(valid).username).toBe('lucia_sev')
  })

  it('bloquea a menores de 14 años (LOPDGDD)', () => {
    const year = new Date().getFullYear() - 13
    const r = onboardingSchema.safeParse({ ...valid, birthdate: `${year}-01-01` })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].message).toMatch(/14 años/)
  })

  it('exige aceptar las normas', () => {
    expect(onboardingSchema.safeParse({ ...valid, accept: false }).success).toBe(false)
  })

  it('exige una provincia válida', () => {
    expect(onboardingSchema.safeParse({ ...valid, provincia: 'XX' }).success).toBe(false)
  })

  it('rechaza nombres ofensivos', () => {
    expect(
      onboardingSchema.safeParse({ ...valid, display_name: 'eres un gilipollas' }).success,
    ).toBe(false)
  })
})

describe('registerSchema', () => {
  it('exige que las contraseñas coincidan', () => {
    const r = registerSchema.safeParse({
      email: 'a@b.es',
      password: '12345678',
      confirm: '1234567',
    })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].path).toEqual(['confirm'])
  })
})
