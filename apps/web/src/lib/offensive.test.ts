import { containsOffensive } from './offensive'

describe('containsOffensive', () => {
  it('detecta insultos como palabra completa, sin importar mayúsculas', () => {
    expect(containsOffensive('Eres un GILIPOLLAS')).toBe(true)
    expect(containsOffensive('vaya imbécil.')).toBe(true)
  })

  it('no da falsos positivos dentro de otras palabras', () => {
    expect(containsOffensive('Disputa en el computador')).toBe(false)
    expect(containsOffensive('Me encanta la capulla de la iglesia')).toBe(false)
  })

  it('texto normal', () => {
    expect(containsOffensive('¡Qué atardecer más bonito en Triana!')).toBe(false)
  })
})
