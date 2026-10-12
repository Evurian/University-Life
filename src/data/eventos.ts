// Catálogo de eventos (REGLAS.md, sección 7). Cada evento es un dilema con dos opciones.
// Los efectos son los del nivel Normal; el núcleo aplica el peso de la dificultad.

export type TipoEvento = 'bueno' | 'malo'

export interface EfectoEvento {
  /** Cambio inmediato de estrés. */
  estres?: number
  /** Horas de estudio que gana o pierde el curso afectado. */
  horas?: number
  /** Trabajos que gana o pierde el curso afectado. */
  trabajos?: number
  /** Multiplicador de las horas de estudio de todos los cursos, solo esta semana. */
  multHoras?: number
}

export interface OpcionEvento {
  texto: string
  efecto: EfectoEvento
}

export interface DatosEvento {
  id: string
  tipo: TipoEvento
  titulo: string
  /** `{curso}` se sustituye por el nombre del curso afectado. */
  situacion: string
  opciones: [OpcionEvento, OpcionEvento]
}

export const EVENTOS: DatosEvento[] = [
  // Buenos: las dos opciones benefician
  {
    id: 'feriado',
    tipo: 'bueno',
    titulo: 'Feriado largo',
    situacion: 'Se junta un feriado con el fin de semana y tienes tres días libres.',
    opciones: [
      { texto: 'Desconectar del todo', efecto: { estres: -10 } },
      { texto: 'Adelantar {curso}', efecto: { horas: 6 } },
    ],
  },
  {
    id: 'grupo_estudio',
    tipo: 'bueno',
    titulo: 'Grupo de estudio',
    situacion: 'Unos compañeros se juntan a repasar {curso} y te invitan.',
    opciones: [
      { texto: 'Ir a la sesión completa', efecto: { horas: 8, estres: 2 } },
      { texto: 'Pedir solo los apuntes', efecto: { horas: 4 } },
    ],
  },
  {
    id: 'trabajo_perdonado',
    tipo: 'bueno',
    titulo: 'El profesor perdona un trabajo',
    situacion: 'En {curso} dan por entregado un trabajo a todo el salón.',
    opciones: [
      { texto: 'Aceptarlo y seguir', efecto: { trabajos: 1 } },
      { texto: 'Hacerlo igual, como repaso', efecto: { horas: 5 } },
    ],
  },
  {
    id: 'clase_suspendida',
    tipo: 'bueno',
    titulo: 'Clase suspendida',
    situacion: 'Un profesor avisa a última hora de que no viene. Tienes la mañana libre.',
    opciones: [
      { texto: 'Volver a casa a dormir', efecto: { estres: -7 } },
      { texto: 'Aprovechar en la biblioteca', efecto: { multHoras: 1.2 } },
    ],
  },
  {
    id: 'tutoria',
    tipo: 'bueno',
    titulo: 'Tutoría gratuita',
    situacion: 'La facultad abre tutorías con alumnos de últimos ciclos.',
    opciones: [
      { texto: 'Una sesión de {curso}', efecto: { horas: 6 } },
      { texto: 'Resolver dudas de todos los cursos', efecto: { multHoras: 1.15 } },
    ],
  },
  {
    id: 'visita_familia',
    tipo: 'bueno',
    titulo: 'Fin de semana en familia',
    situacion: 'Tu familia te propone pasar el fin de semana con ellos.',
    opciones: [
      { texto: 'Ir los dos días', efecto: { estres: -12, multHoras: 0.85 } },
      { texto: 'Pasar solo a almorzar', efecto: { estres: -4 } },
    ],
  },
  {
    id: 'apuntes',
    tipo: 'bueno',
    titulo: 'Apuntes heredados',
    situacion: 'Un alumno mayor te pasa su cuaderno completo de {curso}.',
    opciones: [
      { texto: 'Estudiarlos a fondo', efecto: { horas: 7 } },
      { texto: 'Guardarlos y quedarte tranquilo', efecto: { estres: -5 } },
    ],
  },
  {
    id: 'banco_examenes',
    tipo: 'bueno',
    titulo: 'Banco de exámenes',
    situacion: 'El centro de estudiantes publica exámenes pasados de {curso}.',
    opciones: [
      { texto: 'Resolverlos todos', efecto: { horas: 6 } },
      { texto: 'Mirar solo los tipos de pregunta', efecto: { horas: 3, estres: -3 } },
    ],
  },
  {
    id: 'partido',
    tipo: 'bueno',
    titulo: 'Partido con amigos',
    situacion: 'Se arma un partido el sábado y falta uno.',
    opciones: [
      { texto: 'Jugar toda la tarde', efecto: { estres: -9 } },
      { texto: 'Jugar un rato y volver a {curso}', efecto: { estres: -4, horas: 3 } },
    ],
  },
  {
    id: 'equipo_adelanta',
    tipo: 'bueno',
    titulo: 'Tu grupo se adelantó',
    situacion:
      'Tus compañeros de {curso} terminaron el trabajo en equipo sin que tuvieras que pedirlo.',
    opciones: [
      { texto: 'Entregarlo ya', efecto: { trabajos: 1 } },
      { texto: 'Agradecer y tomarte la tarde', efecto: { estres: -6 } },
    ],
  },

  // Malos: las dos opciones cuestan
  {
    id: 'mala_salud',
    tipo: 'malo',
    titulo: 'Semana de mala salud',
    situacion: 'Amaneces resfriado y con fiebre.',
    opciones: [
      { texto: 'Guardar reposo', efecto: { multHoras: 0.7 } },
      { texto: 'Aguantar como si nada', efecto: { estres: 10 } },
    ],
  },
  {
    id: 'trabajo_sorpresa',
    tipo: 'malo',
    titulo: 'Trabajo sorpresa',
    situacion: 'En {curso} piden un informe adicional para pasado mañana.',
    opciones: [
      { texto: 'Hacerlo de madrugada', efecto: { estres: 6 } },
      { texto: 'No presentarlo', efecto: { trabajos: -1 } },
    ],
  },
  {
    id: 'transporte',
    tipo: 'malo',
    titulo: 'Problemas de transporte',
    situacion: 'Hay paro de transportistas toda la semana.',
    opciones: [
      { texto: 'Madrugar y caminar', efecto: { estres: 5 } },
      { texto: 'Faltar a las clases de {curso}', efecto: { horas: -5 } },
    ],
  },
  {
    id: 'laptop',
    tipo: 'malo',
    titulo: 'Se malogró la laptop',
    situacion: 'Tu laptop no enciende justo cuando más la necesitas.',
    opciones: [
      { texto: 'Correr a repararla hoy', efecto: { estres: 7 } },
      { texto: 'Usar la sala de cómputo', efecto: { multHoras: 0.8 } },
    ],
  },
  {
    id: 'problema_familiar',
    tipo: 'malo',
    titulo: 'Asunto familiar',
    situacion: 'En casa necesitan que ayudes varios días.',
    opciones: [
      { texto: 'Acompañar a tu familia', efecto: { multHoras: 0.75 } },
      { texto: 'Seguir con todo y cargar con la culpa', efecto: { estres: 9 } },
    ],
  },
  {
    id: 'clase_reprogramada',
    tipo: 'malo',
    titulo: 'Clase reprogramada',
    situacion: 'Mueven una clase de {curso} a un horario que te cruza con todo.',
    opciones: [
      { texto: 'Reorganizar tu semana', efecto: { estres: 4 } },
      { texto: 'Perderte esa clase', efecto: { horas: -4 } },
    ],
  },
  {
    id: 'discusion_grupo',
    tipo: 'malo',
    titulo: 'Discusión en el grupo',
    situacion: 'Tu equipo de {curso} se pelea por quién hace qué.',
    opciones: [
      { texto: 'Mediar hasta resolverlo', efecto: { estres: 6 } },
      { texto: 'Desentenderte del grupo', efecto: { horas: -4 } },
    ],
  },
  {
    id: 'trabajo_rechazado',
    tipo: 'malo',
    titulo: 'Trabajo rechazado',
    situacion: 'En {curso} te devuelven un trabajo por no seguir el formato.',
    opciones: [
      { texto: 'Rehacerlo esta noche', efecto: { estres: 7 } },
      { texto: 'Dejarlo como no entregado', efecto: { trabajos: -1 } },
    ],
  },
  {
    id: 'insomnio',
    tipo: 'malo',
    titulo: 'Noches sin dormir',
    situacion: 'Llevas varias noches dando vueltas en la cama.',
    opciones: [
      { texto: 'Tirar de café', efecto: { estres: 8 } },
      { texto: 'Recuperar sueño por las tardes', efecto: { multHoras: 0.8 } },
    ],
  },
  {
    id: 'corte_luz',
    tipo: 'malo',
    titulo: 'Corte de luz',
    situacion: 'Tu zona se queda sin electricidad toda una tarde.',
    opciones: [
      { texto: 'Irte a estudiar a otro sitio', efecto: { estres: 5 } },
      { texto: 'Dar la tarde por perdida en {curso}', efecto: { horas: -5 } },
    ],
  },
]

export function eventoPorId(id: string): DatosEvento {
  const evento = EVENTOS.find((e) => e.id === id)
  if (!evento) throw new Error(`No existe el evento ${id}`)
  return evento
}
