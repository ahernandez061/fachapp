import { resolveDark } from './theme'

describe('resolveDark', () => {
  it('respeta la elección explícita', () => {
    expect(resolveDark('dark', false)).toBe(true)
    expect(resolveDark('light', true)).toBe(false)
  })

  it('sigue al sistema en modo "system"', () => {
    expect(resolveDark('system', true)).toBe(true)
    expect(resolveDark('system', false)).toBe(false)
  })
})
