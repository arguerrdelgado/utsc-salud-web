# UTSC Salud

Biblioteca universitaria digital de la Universidad Tecnológica de Santa Catarina, enfocada en material de Salud y Bienestar (ODS 3) y Educación de Calidad (ODS 4).

## Stack

- **Frontend:** React 18 + Vite + React Router DOM + Tailwind CSS + Framer Motion
- **Backend / Datos:** Firebase Auth, Cloud Firestore y Firebase Hosting
- **Notificaciones:** EmailJS (API REST) para bienvenida, solicitud al administrador y token de recolección al alumno
- **Pruebas y CI:** Vitest + React Testing Library + GitHub Actions (`.github/workflows/unit-tests.yml`)
- **PWA:** Web App Manifest, Service Worker (`public/sw.js`) con precaché de shell y banner de instalación para iOS (`IosInstallBanner`)

## Estructura

```text
.github/workflows/
  unit-tests.yml        CI automático en push/PR a develop y main
public/
  manifest.json         Metadatos de aplicación instalable (PWA)
  sw.js                 Service Worker (network-first con fallback offline)
  icon-*.png            Íconos PWA y apple-touch-icon
scripts/
  seed.mjs              Carga inicial de catálogo vía Firebase Admin SDK
src/
  components/           Navbar, BottomNav, Footer, BookCard, IosInstallBanner
    admin/              Modal, AgregarLibros, SolicitudesLista, Estadisticas
    __tests__/          Pruebas unitarias de componentes UI
  config/               firebase.js (singleton), admin.js, emailjs.js
  context/              AuthContext.jsx (observer de sesión Firebase)
  data/                 categorias.js, estados.js, seedBooks.js
  hooks/                useScrollDirection.js
  pages/                Inicio, Biblioteca, Contacto, Login, Registro, Aviso, Terminos, Admin
  services/             prestamos.js (transacciones Firestore) y __tests__/
  utils/                filterBooks.js, validateRegistro.js, estadisticas.js, generarScript.js y __tests__/
```

## Requisitos y Variables de Entorno

- Node.js 20+
- Copia `.env.example` a `.env` y completa tus credenciales (nunca subas `.env` al repositorio):

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_ID=
VITE_EMAILJS_LOAN_TEMPLATE_ID=
VITE_EMAILJS_PUBLIC_KEY=
VITE_ADMIN_NOTIFY_EMAIL=
```

## Instalación, Desarrollo y Pruebas

```bash
npm ci
npm run dev       # Servidor de desarrollo
npm test          # Ejecuta la suite completa con Vitest
npm run build     # Compila dist/ con code-splitting por rutas y chunks
```

## Flujo de Préstamos y Seguridad

1. **Acceso institucional:** Registro y acceso restringidos al dominio `@virtual.utsc.edu.mx` con verificación obligatoria de correo (`email_verified == true`), salvo la cuenta interna de administración.
2. **Solicitud:** Un alumno puede tener máximo 3 solicitudes vigentes y 1 libro asignado a la vez. Al solicitar, se notifica al administrador por EmailJS.
3. **Apartado y Token privado (`tokens_recoleccion`):** Al aprobar una solicitud, el libro pasa a estado `recoleccion` y se genera un token (`UTSC-XXXX`) almacenado en la colección privada `tokens_recoleccion/{prestamoId}` (legible únicamente por el administrador en Firestore para evitar su lectura en red desde sesiones prestadas) y enviado por correo al titular.
4. **Entrega en ventanilla:** El administrador valida el token dictado por el alumno y confirma la verificación física de su credencial UTSC antes de activar el préstamo.
5. **Reglas de Firestore (`firestore.rules`):** Controlan acceso a `libros`, transiciones permitidas de `prestamos`, aislamiento de `tokens_recoleccion`, registro auditado en `usuarios` y lectura administrativa de `mensajes_contacto`.

## Seed de Catálogo (Opcional)

```bash
npm install firebase-admin --save-dev
node scripts/seed.mjs
```

Requiere `serviceAccountKey.json` en la raíz del proyecto (Firebase Console → Configuración del proyecto → Cuentas de servicio). Este archivo está excluido en `.gitignore` y `.dockerignore` y jamás debe versionarse.

## Despliegue

### Firebase Hosting y Reglas de Firestore

```bash
npm run build
firebase deploy --only hosting,firestore:rules
```

### Docker

El `Dockerfile` utiliza `npm ci` y recibe las variables `VITE_*` en tiempo de compilación mediante `--build-arg`:

```bash
docker build \
  --build-arg VITE_FIREBASE_API_KEY="..." \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN="..." \
  --build-arg VITE_FIREBASE_PROJECT_ID="..." \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET="..." \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID="..." \
  --build-arg VITE_FIREBASE_APP_ID="..." \
  --build-arg VITE_EMAILJS_SERVICE_ID="..." \
  --build-arg VITE_EMAILJS_TEMPLATE_ID="..." \
  --build-arg VITE_EMAILJS_LOAN_TEMPLATE_ID="..." \
  --build-arg VITE_EMAILJS_PUBLIC_KEY="..." \
  --build-arg VITE_ADMIN_NOTIFY_EMAIL="..." \
  -t utsc-salud .

docker run -p 4173:4173 utsc-salud
```

Levanta el build de producción en `http://localhost:4173`.

## Flujo Git y CI

- **Estrategia:** Gitflow-lite (`main` producción, `develop` integración, ramas `feature/*`).
- **CI y Protección de Ramas:** GitHub Actions (`Run unit tests`) valida automáticamente cada `push` y `pull_request` hacia `develop` y `main`, protegido mediante Branch Protection Rules.

## Manual de Usuario

Manual completo disponible en [`Manual_Usuario_UTSC_Salud.pdf`](./Manual_Usuario_UTSC_Salud.pdf).
