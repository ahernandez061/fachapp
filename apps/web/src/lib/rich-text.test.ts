import { extractHashtags, parseRichText } from './rich-text'

describe('parseRichText', () => {
  it('separa texto, hashtags y menciones', () => {
    expect(parseRichText('Hola @lucia_sev, ¿#ConCebolla o no?')).toEqual([
      { type: 'text', value: 'Hola ' },
      { type: 'mention', value: '@lucia_sev', username: 'lucia_sev' },
      { type: 'text', value: ', ¿' },
      { type: 'hashtag', value: '#ConCebolla', tag: 'concebolla' },
      { type: 'text', value: ' o no?' },
    ])
  })

  it('admite tildes y ñ', () => {
    expect(parseRichText('#Otoño en #España')).toEqual([
      { type: 'hashtag', value: '#Otoño', tag: 'otoño' },
      { type: 'text', value: ' en ' },
      { type: 'hashtag', value: '#España', tag: 'españa' },
    ])
  })

  it('no confunde emails ni almohadillas sueltas', () => {
    expect(parseRichText('escribe a hola@fachapp.es # nada')).toEqual([
      { type: 'text', value: 'escribe a hola@fachapp.es # nada' },
    ])
  })

  it('texto vacío', () => {
    expect(parseRichText('')).toEqual([])
  })
})

describe('extractHashtags', () => {
  it('únicos y en minúscula', () => {
    expect(extractHashtags('#Croquetas y más #croquetas, #Madrid')).toEqual(['croquetas', 'madrid'])
  })
})
