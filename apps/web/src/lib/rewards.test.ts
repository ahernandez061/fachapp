import { applyRewardTheme, FRAMES, THEMES } from './rewards'

describe('premios: temas de color', () => {
  afterEach(() => applyRewardTheme(null, false))

  it('aplica el color del tema en claro y oscuro', () => {
    applyRewardTheme('tema_azul_marino', false)
    expect(document.documentElement.style.getPropertyValue('--primary')).toBe(
      THEMES.tema_azul_marino.light,
    )
    applyRewardTheme('tema_azul_marino', true)
    expect(document.documentElement.style.getPropertyValue('--primary')).toBe(
      THEMES.tema_azul_marino.dark,
    )
  })

  it('sin tema (o desconocido) vuelve al color de serie', () => {
    applyRewardTheme('tema_oro', false)
    applyRewardTheme(null, false)
    expect(document.documentElement.style.getPropertyValue('--primary')).toBe('')
    applyRewardTheme('no_existe', false)
    expect(document.documentElement.style.getPropertyValue('--ring')).toBe('')
  })

  it('los marcos y temas del catálogo de la BD tienen estilo', () => {
    // Deben coincidir con los códigos insertados en la migración …1100_rewards.
    expect(Object.keys(THEMES).sort()).toEqual([
      'tema_azul_marino',
      'tema_morado',
      'tema_oro',
      'tema_rojigualda',
      'tema_verde_olivo',
    ])
    expect(Object.keys(FRAMES).sort()).toEqual(['marco_oro', 'marco_plata', 'marco_rojigualda'])
  })
})
