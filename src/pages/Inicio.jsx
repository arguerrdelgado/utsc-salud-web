import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const ODS_CARDS = [
  {
    numero: '3',
    eyebrow: 'Salud y Bienestar',
    title: 'Salud y Bienestar',
    text: 'Promovemos a los estudiantes una vida sana.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12h4l2-8 4 16 3-9 2 5h5" />
      </svg>
    ),
  },
  {
    numero: '4',
    eyebrow: 'Educación de Calidad',
    title: 'Educación de Calidad',
    text: 'Garantizamos a los estudiantes el acceso a información médica preventiva.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11a2 2 0 0 1 2 2v14a1.2 1.2 0 0 0-1.2-1.2H5.5A1.5 1.5 0 0 1 4 17.3V5.5Z" />
        <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13a2 2 0 0 0-2 2v14a1.2 1.2 0 0 1 1.2-1.2h5.3A1.5 1.5 0 0 0 20 17.3V5.5Z" />
      </svg>
    ),
  },
]

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
}

export default function Inicio() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col">
      <section className="text-center py-24 px-4">
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="uppercase tracking-[0.2em] text-xs font-semibold text-emerald-400 mb-3"
        >
          Biblioteca digital · UTSC
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-5xl md:text-6xl font-extrabold text-white"
        >
          UTSC <span className="text-emerald-400">Salud</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 text-lg text-slate-400 max-w-xl mx-auto"
        >
          Acceso a la biblioteca universitaria digital de la Universidad Tecnológica de Santa Catarina.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            to="/biblioteca"
            className="inline-block mt-8 bg-emerald-400 hover:bg-emerald-300 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95 transition-all text-[#04120c] font-bold uppercase tracking-wide px-7 py-3 rounded-full"
          >
            Explorar libros
          </Link>
        </motion.div>
      </section>

      <section className="max-w-4xl mx-auto w-full px-4 pb-20">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.45 }}
          className="font-display text-2xl md:text-3xl font-bold text-white text-center mb-10"
        >
          Nuestro Compromiso Global
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-6">
          {ODS_CARDS.map((card, i) => (
            <motion.div
              key={card.title}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.4 }}
              whileHover={{ y: -4, borderColor: 'rgba(52,211,153,0.4)' }}
              className="bg-emerald-950/20 border border-emerald-500/10 rounded-2xl p-8 transition-colors"
            >
              <div className="flex items-baseline gap-2 mb-4">
                <span className="font-display text-3xl font-extrabold text-emerald-400">{card.numero}</span>
                <span className="text-[10px] uppercase tracking-wide text-slate-500 leading-tight whitespace-pre-line">
                  {card.eyebrow.split(' ').join('\n')}
                </span>
              </div>
              <div className="text-emerald-400 mb-4">{card.icon}</div>
              <h3 className="font-display font-bold text-white text-lg mb-2">
                {card.title} <span className="text-emerald-400 font-semibold">(ODS {card.numero})</span>
              </h3>
              <p className="text-slate-400 text-sm">{card.text}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}
