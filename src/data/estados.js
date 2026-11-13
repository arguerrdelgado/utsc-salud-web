// Estados del flujo de préstamos (sin dependencias de Firebase para poder usarse en tests)

export const ESTADO_LIBRO = {
  DISPONIBLE: 'disponible',
  RECOLECCION: 'recoleccion',
  PRESTADO: 'prestado',
  DEVOLUCION: 'devolucion',
}

export const ESTADO_PRESTAMO = {
  PENDIENTE: 'pendiente',
  RECOLECCION_PENDIENTE: 'recoleccion_pendiente',
  ACTIVO: 'activo',
  DEVOLUCION_PENDIENTE: 'devolucion_pendiente',
  DEVUELTO: 'devuelto',
  RECHAZADO: 'rechazado',
  CANCELADO: 'cancelado',
}

export const estadoLibro = (book) => book?.estado ?? ESTADO_LIBRO.DISPONIBLE
