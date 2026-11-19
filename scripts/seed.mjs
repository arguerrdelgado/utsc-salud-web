import admin from 'firebase-admin'
import { readFileSync } from 'fs'
import books from '../src/data/seedBooks.js'

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf-8'))
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
const db = admin.firestore()

for (const book of books) {
  await db.collection('libros').add(book)
}
console.log('Seed completo:', books.length, 'libros')
