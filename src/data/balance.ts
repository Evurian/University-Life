// Todos los números de juego viven aquí. Fuente: REGLAS.md (el número de regla va entre paréntesis).

export type DecisionId = 'intensivo' | 'balanceada' | 'salud'
export type ZonaId = 'verde' | 'amarilla' | 'roja'

export interface Decision {
  nombre: string
  hor: number
  ent: number
  estres: number
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

  // Asignaturas (2, 2a)
  asignaturasMin: 2,
  asignaturasMax: 4,
  asignaturasPorDefecto: 4,

  // Estrés (9, 12)
  estresInicial: 20,
  estresMin: 0,
  estresMax: 100,
  recuperacionPasiva: 0,

  // Decisiones: efecto sobre una asignatura (10)
  decisiones: {
    intensivo: { nombre: 'Estudio Intensivo', hor: 12, ent: 0, estres: 4 },
    balanceada: { nombre: 'Cursada Balanceada', hor: 6, ent: 1, estres: 1 },
    salud: { nombre: 'Priorizar Salud Mental', hor: 0, ent: 0, estres: -5 },
  } satisfies Record<DecisionId, Decision>,

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
    alivioReposo: 40,
  },

  // Beca (31)
  beca: {
    asignaturasRequeridas: 4,
    ovrMin: 85,
    parcialMin: 10.5,
  },
} as const
