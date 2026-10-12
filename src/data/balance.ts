// Todos los números de juego viven aquí. Fuente: REGLAS.md (el número de regla va entre paréntesis).

export type DecisionId = 'intensivo' | 'balanceada' | 'salud'
export type ZonaId = 'verde' | 'amarilla' | 'roja'
export type DificultadId = 'relajado' | 'normal' | 'exigente'

export interface Decision {
  nombre: string
  hor: number
  ent: number
  estres: number
}

export interface DatosAsignatura {
  nombre: string
  /** Horas de estudio por tramo con las que se alcanza la nota máxima. */
  horObjetivo: number
}

export interface Dificultad {
  nombre: string
  /** Probabilidad de que una semana traiga evento. */
  probEvento: number
  /** Probabilidad de que el evento sea bueno. */
  probBueno: number
  /** Peso de lo que beneficia en un evento bueno. */
  pesoBueno: number
  /** Peso de lo que perjudica en un evento malo. */
  pesoMalo: number
}

export interface Zona {
  /** Estrés máximo incluido en la zona. */
  hasta: number
  multHor: number
  modParcial: number
}

export const BALANCE = {
  // Calendario (6, 8)
  semanasConDecision: 15,
  semanasTotales: 16,
  semanasParcial: [5, 10, 15],
  entregasPosibles: 12,

  // Asignaturas (2, 2a, 2b): se cursan las primeras N de la lista
  asignaturas: [
    { nombre: 'Cálculo', horObjetivo: 46 },
    { nombre: 'Programación', horObjetivo: 40 },
    { nombre: 'Física', horObjetivo: 42 },
    { nombre: 'Redacción', horObjetivo: 32 },
  ] satisfies DatosAsignatura[],
  asignaturasMin: 3,
  asignaturasMax: 4,
  asignaturasPorDefecto: 4,

  // Estrés (9, 12)
  estresInicial: 20,
  estresMin: 0,
  estresMax: 100,
  recuperacionPasiva: 0,

  // Decisiones: efecto sobre una asignatura (10)
  decisiones: {
    intensivo: { nombre: 'Estudiar a fondo', hor: 14, ent: 0, estres: 5 },
    balanceada: { nombre: 'Hacer el trabajo semanal', hor: 6, ent: 1, estres: 2 },
    salud: { nombre: 'Descansar', hor: 0, ent: 0, estres: -6 },
  } satisfies Record<DecisionId, Decision>,

  // Rutina: la misma decisión en todas las asignaturas (10a)
  rutina: {
    alivioEstres: 2,
    multHor: 0.8,
  },

  // Zonas de estrés (13, 14, 16)
  zonas: {
    verde: { hasta: 40, multHor: 1.1, modParcial: 1 },
    amarilla: { hasta: 75, multHor: 0.85, modParcial: 0 },
    roja: { hasta: 100, multHor: 0.6, modParcial: -5 },
  } satisfies Record<ZonaId, Zona>,

  // Nota de parcial (15, 17, 18)
  nota: {
    min: 0,
    max: 20,
    base: 4,
    rango: 16,
    horObjetivo: 40,
    exponente: 0.7,
    ruido: 1,
    probBloqueo: 0.2,
    divisorBloqueo: 2,
  },

  // Promedio y aprobación (19, 20, 21, 22)
  pesosParciales: [0.3, 0.3, 0.4],
  finalAprobatorio: 11,
  entregasRegularidad: 9,
  notaParcialSinRegularidad: 0,

  // OVR (23)
  ovr: {
    factorPromedio: 5,
    penalizacionSinRegularidad: 5,
    min: 0,
    max: 100,
  },

  // Crisis (25, 27, 28)
  crisis: {
    umbralDisparo: 80,
    umbralRearme: 60,
    probColapso: 0.25,
    alivioReposo: 20,
  },

  // Beca (31, 38): con más cursos se exige menos rendimiento
  beca: {
    ovrMinPorCursos: { 3: 85, 4: 84 } as Record<number, number>,
    parcialMin: 10.5,
  },

  // Dificultad (36, 37): solo cambia los eventos
  dificultades: {
    relajado: {
      nombre: 'Relajado',
      probEvento: 0.45,
      probBueno: 0.65,
      pesoBueno: 1.25,
      pesoMalo: 0.75,
    },
    normal: { nombre: 'Normal', probEvento: 0.5, probBueno: 0.5, pesoBueno: 1, pesoMalo: 1 },
    exigente: {
      nombre: 'Exigente',
      probEvento: 0.6,
      probBueno: 0.35,
      pesoBueno: 0.75,
      pesoMalo: 1.25,
    },
  } satisfies Record<DificultadId, Dificultad>,
  dificultadPorDefecto: 'normal' as DificultadId,

  // Eventos (41)
  eventos: {
    minPorPartida: 4,
    maxPorPartida: 9,
    maxMalosSeguidos: 2,
  },
} as const
