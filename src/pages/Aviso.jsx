import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function Aviso() {
  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-3xl mx-auto bg-emerald-950/20 border border-emerald-500/10 rounded-2xl p-8 text-slate-400 text-sm leading-relaxed"
      >
        <h1 className="font-display text-2xl font-bold text-white mb-4">Aviso de Protección de Datos Personales</h1>
        <p className="mb-3">
          En cumplimiento con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares,
          la Universidad Tecnológica de Santa Catarina (UTSC), a través de la plataforma UTSC Salud, informa
          que los datos personales recabados durante el registro —específicamente el correo electrónico
          institucional (@virtual.utsc.edu.mx)— serán utilizados exclusivamente para los siguientes fines:
        </p>
        <ul className="list-disc pl-6 mb-3 space-y-1">
          <li>Verificar la identidad y calidad de estudiante de la comunidad UTSC.</li>
          <li>Otorgar acceso al catálogo digital de la Biblioteca de Salud y Prevención.</li>
          <li>Enviar notificaciones relacionadas con el uso de la plataforma.</li>
        </ul>
        <p className="mb-3">
          Los datos no serán compartidos con terceros ajenos a la institución sin consentimiento previo,
          salvo requerimiento legal. El usuario puede ejercer sus derechos de Acceso, Rectificación,
          Cancelación y Oposición (derechos ARCO) contactando al departamento de servicios escolares de la UTSC,
          a través del formulario de Contacto. El tiempo de respuesta máximo establecido es de 20 días hábiles.
        </p>
        <p>
          Al registrarte en UTSC Salud y marcar la casilla de aceptación, confirmas haber leído y
          aceptado los términos de este aviso. Consulta también nuestros{' '}
          <Link to="/terminos" className="text-emerald-400 underline">Términos y Condiciones</Link>.
        </p>
      </motion.div>
    </div>
  )
}
