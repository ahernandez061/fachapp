import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'

function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  const navigate = useNavigate()
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft /> Volver
      </Button>
      <article className="mt-4 grid gap-3 text-sm leading-relaxed [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-xs text-muted-foreground">
          Última actualización: 1 de octubre de 2026 · Texto provisional, pendiente de revisión
          legal.
        </p>
        {children}
      </article>
    </div>
  )
}

export function PrivacyPage() {
  return (
    <LegalLayout title="Política de privacidad">
      <h2>Responsable</h2>
      <p>FachApp (proyecto en desarrollo). Contacto: privacidad@fachapp.example.</p>
      <h2>Qué datos tratamos</h2>
      <ul>
        <li>Cuenta: email, contraseña cifrada o identificador de Google/X.</li>
        <li>Perfil: nombre de usuario, nombre, foto, biografía y provincia (públicos).</li>
        <li>Fecha de nacimiento: solo para comprobar la edad mínima de 14 años (no es pública).</li>
        <li>Contenido: fotos de prueba, publicaciones, comentarios, likes y seguidores.</li>
        <li>
          Cuenta de X (solo si la conectas y das tu consentimiento): usuario, nº de seguidores y
          posts recientes, leídos únicamente al verificar una misión. Los tokens se guardan
          cifrados.
        </li>
      </ul>
      <h2>Para qué y con qué base legal</h2>
      <ul>
        <li>Prestar el servicio de la red social (ejecución del contrato, art. 6.1.b RGPD).</li>
        <li>
          Verificar misiones con X (consentimiento, art. 6.1.a RGPD), que puedes retirar en
          cualquier momento desconectando X.
        </li>
        <li>Moderación y seguridad de la comunidad (interés legítimo, art. 6.1.f RGPD).</li>
      </ul>
      <h2>Menores</h2>
      <p>La edad mínima es 14 años, conforme al art. 7 de la LOPDGDD.</p>
      <h2>Conservación</h2>
      <p>
        Mientras mantengas la cuenta. Al eliminarla se borran tus datos y archivos de forma
        inmediata.
      </p>
      <h2>Encargados y transferencias</h2>
      <p>
        Usamos Supabase (alojamiento en la UE) para base de datos, autenticación y archivos. No
        vendemos tus datos.
      </p>
      <h2>Tus derechos</h2>
      <p>
        Acceso, rectificación, supresión, portabilidad, oposición y limitación. Desde Ajustes puedes
        descargar todos tus datos en JSON y eliminar tu cuenta. También puedes reclamar ante la
        Agencia Española de Protección de Datos (aepd.es).
      </p>
      <h2>Cookies</h2>
      <p>
        Solo usamos almacenamiento técnico imprescindible (sesión y preferencia de tema). No usamos
        cookies de analítica ni publicidad, por eso no mostramos banner de cookies.
      </p>
    </LegalLayout>
  )
}

export function TermsPage() {
  return (
    <LegalLayout title="Términos de uso">
      <p>Al usar FachApp aceptas estos términos y las normas de la comunidad.</p>
      <h2>Tu cuenta</h2>
      <p>Debes tener al menos 14 años y dar datos veraces. Eres responsable de lo que publicas.</p>
      <h2>Contenido</h2>
      <p>
        Conservas los derechos sobre tus fotos y textos, y nos das permiso para mostrarlos dentro de
        FachApp. Puedes borrarlos cuando quieras.
      </p>
      <h2>Puntos e insignias</h2>
      <p>No tienen valor económico. Podemos anular puntos obtenidos con trampas.</p>
      <h2>Suspensión</h2>
      <p>Podemos retirar contenido o suspender cuentas que incumplan las normas.</p>
    </LegalLayout>
  )
}

export function RulesPage() {
  return (
    <LegalLayout title="Normas de la comunidad">
      <p>FachApp es un sitio para retarse y pasarlo bien. Para que siga así:</p>
      <ul>
        <li>Respeta a todo el mundo. Nada de insultos, acoso, amenazas ni discursos de odio.</li>
        <li>
          Las misiones nunca consisten en acosar, mencionar en masa ni atacar a otras personas o
          colectivos.
        </li>
        <li>No publiques fotos de otras personas sin su permiso, ni datos personales ajenos.</li>
        <li>Nada de contenido sexual, violento o ilegal.</li>
        <li>Las pruebas deben ser reales y tuyas. Nada de trampas ni fotos ajenas.</li>
        <li>No hagas spam ni suplantes a nadie.</li>
      </ul>
      <p>
        Puedes reportar y bloquear a cualquiera desde su perfil o desde sus publicaciones. Un filtro
        automático bloquea el lenguaje ofensivo y el equipo de moderación revisa los reportes.
      </p>
    </LegalLayout>
  )
}
