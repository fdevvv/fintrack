/**
 * UPDATES — historial de novedades de la app.
 * Agregar siempre al principio del array (más nuevo primero).
 * Formato de id:   'update-YYYYMMDD-N' (N = número si hay más de uno en el día)
 * Formato de date: 'DD de mes de YYYY · HH:MM' — siempre hora Argentina (UTC-3)
 */
export const UPDATES = [
  {
    id: 'update-20260331-1',
    date: '31 de marzo de 2026 · 14:06 (ARG)',
    title: 'Mejoras en ingreso neto, formulario y correcciones en iPhone',
    items: [
      'El ingreso neto mensual ahora solo muestra los meses que cargaste, sin meses vacíos.',
      'Podés eliminar un registro de ingreso mensual si ya no lo necesitás.',
      'El selector "Gasto del día / Tarjeta" en Agregar tiene un diseño más limpio y sin colores repetidos.',
      'Se corrigió el zoom automático que aparecía al tocar cualquier campo de texto en iPhone.',
    ],
  },
  {
    id: 'update-20260330-1',
    date: '30 de marzo de 2026 · 23:30 (ARG)',
    title: 'Grandes mejoras en importación, detalle y configuración',
    items: [
      'Al importar un PDF ahora podés elegir en qué mes querés que aparezcan los gastos.',
      'Cada item del PDF tiene su propio selector de rubro antes de importar.',
      'Netflix, Spotify, Apple, Amazon, Disney y otros servicios se reconocen automáticamente y muestran su ícono oficial en la lista de importación.',
      'Podés editar el nombre de cualquier item del PDF antes de importarlo.',
      'La detección de duplicados mejoró: solo marca como duplicado si coinciden nombre y monto, así dos cobros distintos del mismo servicio ya no se confunden.',
      'Se corrigió un problema donde algunos gastos del PDF no aparecían si tenían el mismo nombre pero distinto importe.',
      'En Detalle podés renombrar cualquier gasto ya guardado tocando el ícono de lápiz.',
      'La sección Dólar ahora muestra un mensaje claro si hay un error al cargar las cotizaciones, y el botón indica cuando está actualizando.',
      'Sincronizar gastos USD ahora usa el tipo de cambio oficial y actualiza todos los meses del año, no solo el mes actual.',
      'Al editar un rubro en Configuración ahora se abre un selector visual de emojis con buscador para elegir el ícono que quieras.',
    ],
  },
];
