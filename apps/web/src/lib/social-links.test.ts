import {
  gmailComposeUrl,
  instagramUrl,
  inviteMessage,
  mailtoUrl,
  normalizeInstagram,
  share,
} from './social-links'

describe('normalizeInstagram', () => {
  it.each([
    ['lucia_sev', 'lucia_sev'],
    ['@Lucia.Sev', 'lucia.sev'],
    ['https://www.instagram.com/lucia_sev/', 'lucia_sev'],
    ['instagram.com/lucia_sev?igsh=abc', 'lucia_sev'],
    ['  @pablo_bcn  ', 'pablo_bcn'],
  ])('"%s" → %s', (input, out) => {
    expect(normalizeInstagram(input)).toBe(out)
  })

  it.each(['', '   ', 'con espacio', 'a'.repeat(31), 'ñandú'])('rechaza "%s"', (input) => {
    expect(normalizeInstagram(input)).toBeNull()
  })

  it('construye la URL del perfil', () => {
    expect(instagramUrl('lucia_sev')).toBe('https://www.instagram.com/lucia_sev/')
  })
})

describe('invitar por email', () => {
  const msg = inviteMessage('Lucía')

  it('el mensaje incluye quién invita y el enlace', () => {
    expect(msg.subject).toContain('FachApp')
    expect(msg.body).toContain('Lucía te invita')
    expect(msg.body).toContain('#/bienvenida')
  })

  it('Gmail abre la redacción con asunto y cuerpo', () => {
    const url = new URL(gmailComposeUrl({ subject: msg.subject, body: msg.body }))
    expect(url.hostname).toBe('mail.google.com')
    expect(url.searchParams.get('view')).toBe('cm')
    expect(url.searchParams.get('su')).toBe(msg.subject)
    expect(url.searchParams.get('body')).toBe(msg.body)
  })

  it('mailto codifica asunto y cuerpo', () => {
    expect(mailtoUrl({ subject: 'Hola y adiós', body: 'a&b' })).toBe(
      'mailto:?subject=Hola%20y%20adi%C3%B3s&body=a%26b',
    )
  })
})

describe('share', () => {
  const original = { share: navigator.share, clipboard: navigator.clipboard }
  afterEach(() => {
    Object.assign(navigator, original)
  })

  it('usa la hoja de compartir del sistema si existe', async () => {
    const spy = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { share: spy })
    expect(await share({ title: 't', text: 'x', url: 'https://a.es' })).toBe('shared')
    expect(spy).toHaveBeenCalledWith({ title: 't', text: 'x', url: 'https://a.es' })
  })

  it('si el usuario cancela, no copia nada', async () => {
    Object.assign(navigator, {
      share: vi.fn().mockRejectedValue(new DOMException('x', 'AbortError')),
    })
    expect(await share({ title: 't', text: 'x', url: 'https://a.es' })).toBe('cancelled')
  })

  it('sin hoja de compartir, copia el enlace', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { share: undefined, clipboard: { writeText } })
    expect(await share({ title: 't', text: 'x', url: 'https://a.es/p/1' })).toBe('copied')
    expect(writeText).toHaveBeenCalledWith('https://a.es/p/1')
  })
})
