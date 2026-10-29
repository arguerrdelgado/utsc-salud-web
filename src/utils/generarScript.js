// Genera un script de Node (firebase-admin) que inserta los libros en Firestore

export function generarScriptLibros(libros, fecha = new Date()) {
  const datos = JSON.stringify(libros, null, 2)
  return `// Script generado por el Panel de Administración de UTSC Salud
// Fecha: ${fecha.toLocaleString('es-MX')}
// Libros: ${libros.length}
//
// Uso:
//   1. Coloca tu llave de servicio en la raíz del proyecto como serviceAccountKey.json
//   2. Instala la dependencia (solo una vez): npm install firebase-admin
//   3. Ejecuta: node scripts/agregar-libros.mjs

import admin from 'firebase-admin'
import { readFileSync } from 'fs'

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf-8'))
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
const db = admin.firestore()

const libros = ${datos}

const batch = db.batch()
for (const libro of libros) {
  batch.set(db.collection('libros').doc(), {
    ...libro,
    estado: 'disponible',
    fechaAlta: admin.firestore.FieldValue.serverTimestamp(),
  })
}
await batch.commit()
console.log(\`\${libros.length} libro(s) agregados a Firestore.\`)
`
}
