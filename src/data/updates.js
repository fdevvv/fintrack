/**
 * UPDATES — historial de novedades de la app.
 * Agregar siempre al principio del array (más nuevo primero).
 * Formato de id:   'update-YYYYMMDD-N' (N = número si hay más de uno en el día)
 * Formato de date: 'DD de mes de YYYY · HH:MM' — siempre hora Argentina (UTC-3)
 */
export const UPDATES = [
  {
    id: 'update-20260403-1',
    date: '3 de abril de 2026 · 12:43 (ARG)',
    title: 'Colores, rendimiento y mejoras en formularios',
    items: [
      'La app carga notablemente más rápido en todos los dispositivos.',
      'El panel, las solapas de mes y el detalle de cada mes ahora tienen colores distintos en cada tarjeta, haciéndolos más fáciles de leer de un vistazo.',
      'Los gráficos de torta muestran más colores distintos cuando hay muchas categorías.',
      'Se quitaron la Proyección de cierre y el Promedio diario del panel porque no estaban calculando bien.',
      'En Agregar, todos los campos de monto (presupuesto, metas de ahorro) ahora aceptan el formato argentino con punto como miles y coma como decimal. Por ejemplo: 50.000 o 50.000,50.',
    ],
  },
  {
    id: 'update-20260401-2',
    date: '1 de abril de 2026 · 15:36 (ARG)',
    title: 'Perfil, cuotas corregidas, nuevo favicon y mejoras generales',
    items: [
      'Mi Perfil: nueva sección donde podés ver tu foto, nombre y datos de tu cuenta. Desde ahí podés cambiar tu foto, editar tu nombre y cambiar tu contraseña.',
      'El monto al agregar un gasto ahora acepta formato argentino: podés escribir 21.375,53 con punto como separador de miles y coma como decimal.',
      'Cuotas — corrección: el monto ahora se divide correctamente entre las cuotas. Antes se guardaba el total en cada cuota en lugar del valor por cuota.',
      'Cuotas — año siguiente: si las cuotas superan diciembre se registran en los meses correspondientes del año siguiente.',
      'Al eliminar un gasto en cuotas ahora aparece un menú que te pregunta si querés borrar solo esa cuota o todas.',
      'Al crear un nuevo rubro podés elegir el ícono directamente desde la pantalla Agregar, sin tener que ir a Configuración.',
      'Actualización automática: cuando haya una nueva versión de la app vas a ver un aviso con un botón para actualizar sin perder lo que estabas haciendo.',
    ],
  },
  {
    id: 'update-20260401-1',
    date: '1 de abril de 2026 · 00:15 (ARG)',
    title: 'Panel rediseñado, metas de ahorro, gráficos y nuevas herramientas',
    items: [
      'Panel — Chips rápidos: en la parte superior del panel ahora aparecen tres chips con cuánto gastaste hoy, cuánto gastaste esta semana y cuál es tu promedio diario del mes.',
      'Panel — Proyección de cierre: a partir del día 3 del mes el panel calcula cuánto gastarías a fin de mes si seguís al mismo ritmo, basándose en tu promedio diario.',
      'Panel — Comparación vs mes anterior: podés ver en un solo vistazo cómo cambiaron tus ingresos, gastos y balance respecto al mes pasado, con la variación en porcentaje.',
      'Panel — Ingreso neto editable: el ingreso del mes se puede modificar directamente desde el panel tocando el lápiz, sin tener que ir a Agregar.',
      'Panel — Metas de ahorro: nueva sección en el panel que muestra todas tus metas con barra de progreso, monto ahorrado y objetivo.',
      'Panel — Gráfico de gastos por tarjeta: barras apiladas que muestran cuánto gastaste por tarjeta (Visa, Mastercard, etc.) mes a mes.',
      'Panel — Gráfico de distribución por rubro: torta con el desglose del mes actual por categoría, para ver dónde va tu plata.',
      'Panel — Gráfico de ingreso vs gasto: línea comparativa entre lo que entra y lo que sale mes a mes durante el año.',
      'Metas de ahorro: creá objetivos con nombre, monto y fecha límite. Se guardan en la nube, se ven desde cualquier dispositivo y no se pierden al limpiar el caché.',
      'Metas de ahorro — Agregar dinero: con el botón "+" en cada meta podés ir sumando lo que vas ahorrando sin borrar y recrear la meta.',
      'Repetir gastos: copiá todos los gastos manuales de cualquier mes al mes actual con un solo botón, ahora con selector para elegir el mes de origen.',
    ],
  },
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
