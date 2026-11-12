import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const SECCIONES = [
  {
    title: '1. Aceptación de los términos',
    items: [
      'Al registrarse y utilizar la plataforma UTSC Salud, el usuario acepta cumplir en su totalidad estos Términos y Condiciones.',
      'Si no está de acuerdo con alguna parte de ellos, debe abstenerse de usar el servicio.',
      'Estos términos aplican a todos los usuarios con cuenta institucional (docentes, alumnado y personal administrativo) de la Universidad Tecnológica de Santa Catarina (UTSC).',
    ],
  },
  {
    title: '2. Descripción del servicio',
    items: [
      'UTSC Salud es una plataforma digital de carácter educativo e institucional orientada a la prevención y promoción de la salud. Ofrece servicio a:',
      'Contenido educativo alineado a los Objetivos de Desarrollo Sostenible (ODS 3 y ODS 4).',
      'Biblioteca digital de recursos sobre salud, bienestar y educación continua.',
      'Materiales de apoyo académico para la comunidad universitaria.',
      'Avisos y comunicados institucionales relacionados con la salud.',
    ],
  },
  {
    title: '3. Datos de privacidad',
    items: [
      'En cumplimiento con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP), UTSC Salud recaba y usa únicamente los siguientes datos: correo electrónico institucional, datos de sesión y actividad dentro de la plataforma, y preferencias de uso y configuración de correo.',
      'Los datos son almacenados de forma segura, cifrada y compatible con normas de industria en Firebase (Google Cloud), que cumple con estándares internacionales de seguridad (ISO 27001, SOC 2).',
    ],
  },
  {
    title: '4. Seguridad de la plataforma',
    items: [
      'Transmisión de datos cifrada mediante HTTPS/TLS.',
      'Autenticación gestionada por Firebase Authentication, con encriptación de contraseñas.',
      'Sin almacenamiento local de contraseñas en texto plano.',
      'Protección contra bloqueo de fuerza bruta mediante bloqueo temporal.',
      'Verificación obligatoria de correo electrónico al momento del registro.',
    ],
  },
  {
    title: '5. Obligaciones del usuario',
    items: [
      'Proporcionar información veraz al momento del registro.',
      'No compartir sus credenciales de acceso con terceros.',
      'Usar la plataforma exclusivamente con fines educativos e institucionales.',
      'No intentar acceder a cuentas ajenas ni vulnerar la seguridad del sistema.',
      'Reportar cualquier comportamiento sospechoso al equipo de soporte institucional.',
    ],
  },
  {
    title: '6. Derechos del usuario (ARCO)',
    items: [
      'Conforme a la LFPDPPP, tienes derecho a Acceder, Rectificar, Cancelar y Oponerte al tratamiento de tus datos personales en cualquier momento.',
      'Para ejercer tus derechos ARCO: envía tu solicitud desde tu correo institucional a través del formulario de Contacto.',
      'Tiempo de respuesta: máximo 20 días hábiles.',
    ],
  },
  {
    title: '7. Modificaciones',
    items: [
      'UTSC se reserva el derecho de ampliar estos Términos y Condiciones en cualquier momento. Los cambios serán notificados a través de la plataforma o el correo institucional registrado.',
      'El uso continuado del servicio después de la notificación implica la aceptación de los nuevos términos.',
    ],
  },
  {
    title: '8. Contacto y soporte',
    items: [
      'Para dudas, aclaraciones o solicitudes relacionadas con este aviso y el uso de la plataforma, comunícate con nosotros a través de: el formulario de Contacto dentro de la plataforma, la Universidad Tecnológica de Santa Catarina (Santa Catarina, Nuevo León, México), o el sitio institucional www.utsc.edu.mx.',
    ],
  },
]

export default function Terminos() {
  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-3xl mx-auto bg-emerald-950/20 border border-emerald-500/10 rounded-2xl p-8"
      >
        <h1 className="font-display text-2xl font-bold text-white text-center mb-1">Términos y Condiciones</h1>
        <p className="text-slate-500 text-xs text-center mb-8">Última actualización: julio 2026</p>

        <div className="flex flex-col gap-6 text-slate-400 text-sm leading-relaxed">
          {SECCIONES.map((s) => (
            <div key={s.title}>
              <h2 className="font-display font-bold text-emerald-400 text-base mb-2">{s.title}</h2>
              <ul className="list-disc pl-5 space-y-1">
                {s.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/registro"
            className="inline-block bg-emerald-400 hover:bg-emerald-300 active:scale-95 transition-all text-[#04120c] font-bold uppercase tracking-wide px-6 py-2.5 rounded-full"
          >
            ← Volver al registro
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
