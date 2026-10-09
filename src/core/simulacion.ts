// Reglas del juego como funciones puras: reciben un estado y devuelven otro.
// Especificación: REGLAS.md. Números: src/data/balance.ts.

import { BALANCE, type DatosAsignatura, type DecisionId, type ZonaId } from '../data/balance.ts'
import { siguiente } from './rng.ts'

export type Fase = 'decision' | 'crisis' | 'fin'
export type OpcionCrisis = 'forzar' | 'reposo' | 'abandono'
export type SemanaPerdida = 'colapso' | 'reposo'
export type FinalId = 'beca' | 'aprobado' | 'aprobado_parcial' | 'desaprobado' | 'abandono'

export interface Asignatura {
  nombre: string
  /** Horas por tramo con las que se alcanza la nota máxima: mide lo exigente que es. */
  horObjetivo: number
  /** Horas acumuladas desde el parcial anterior, ya multiplicadas por zona. */
  horTramo: number
  ent: number
  /** Una nota por parcial rendido, en orden. */
  notas: number[]
}

export interface RegistroSemana {
  semana: number
  /** null si la semana se perdió por colapso; en un reposo son las decisiones anuladas. */
  decisiones: DecisionId[] | null
  perdida: SemanaPerdida | null
  crisis: OpcionCrisis | null
  /** Estrés al cierre de la semana. */
  estres: number
  /** Notas del parcial rendido esta semana, una por asignatura; null si no hubo parcial. */
  notas: number[] | null
  /** Cómo se llegó a cada nota, en el mismo orden; null si no hubo parcial. */
  detalle: DetalleNota[] | null
}

export interface DetalleNota {
  /** Horas del tramo con las que se rindió. */
  hor: number
  bloqueo: boolean
  /** false si no se rindió por falta de regularidad. */
  rendido: boolean
}

/** Efecto de una decisión sobre una asignatura en la semana en curso. */
export interface Efecto {
  hor: number
  ent: number
  estres: number
}

export type Regularidad = 'asegurada' | 'posible' | 'perdida'

export interface Estado {
  semilla: number
  rng: number
  semana: number
  estres: number
  fase: Fase
  crisisArmada: boolean
  abandono: boolean
  asignaturas: Asignatura[]
  /** Decisiones ya aplicadas de la semana en curso, mientras se resuelve una crisis. */
  decisionesEnCurso: DecisionId[] | null
  /** Asignaturas tal como estaban antes de esas decisiones, por si el reposo anula la semana. */
  asignaturasPrevias: Asignatura[] | null
  historial: RegistroSemana[]
}

export interface ResumenAsignatura {
  nombre: string
  promedio: number
  final: number
  regular: boolean
  aprobada: boolean
}

export interface Resultado {
  asignaturas: ResumenAsignatura[]
  promedioGeneral: number
  ovr: number
  final: FinalId
}

const clamp = (valor: number, min: number, max: number) => Math.min(max, Math.max(min, valor))

export function zonaDe(estres: number): ZonaId {
  if (estres <= BALANCE.zonas.verde.hasta) return 'verde'
  if (estres <= BALANCE.zonas.amarilla.hasta) return 'amarilla'
  return 'roja'
}

/** Índice del parcial que se rinde en la semana, o -1 si no hay. */
export function parcialDeSemana(semana: number): number {
  return (BALANCE.semanasParcial as readonly number[]).indexOf(semana)
}

/** Semanas con entrega que quedan desde `semana`, incluida. */
export function entregasRestantes(semana: number): number {
  let restantes = 0
  for (let s = semana; s <= BALANCE.semanasConDecision; s++) {
    if (parcialDeSemana(s) === -1) restantes++
  }
  return restantes
}

/** Rutina: la misma decisión en todas las asignaturas. Alivia estrés, pero se estudia peor. */
export function esRutina(e: Estado, decisiones: DecisionId[]): boolean {
  return decisiones.length === e.asignaturas.length && decisiones.every((d) => d === decisiones[0])
}

export function efectoDecision(e: Estado, decision: DecisionId, rutina = false): Efecto {
  const d = BALANCE.decisiones[decision]
  return {
    hor: d.hor * BALANCE.zonas[zonaDe(e.estres)].multHor * (rutina ? BALANCE.rutina.multHor : 1),
    ent: parcialDeSemana(e.semana) === -1 ? d.ent : 0,
    estres: d.estres,
  }
}

/** Estrés con el que quedaría el alumno tras aplicar las decisiones de la semana. */
export function estresPrevisto(e: Estado, decisiones: DecisionId[]): number {
  const delta = decisiones.reduce((suma, d) => suma + BALANCE.decisiones[d].estres, 0)
  const alivio = esRutina(e, decisiones) ? BALANCE.rutina.alivioEstres : 0
  return clamp(
    e.estres + delta - alivio - BALANCE.recuperacionPasiva,
    BALANCE.estresMin,
    BALANCE.estresMax,
  )
}

export function provocaCrisis(e: Estado, decisiones: DecisionId[]): boolean {
  return e.crisisArmada && estresPrevisto(e, decisiones) >= BALANCE.crisis.umbralDisparo
}

export function regularidadDe(a: Asignatura, semana: number): Regularidad {
  if (a.ent >= BALANCE.entregasRegularidad) return 'asegurada'
  return a.ent + entregasRestantes(semana) >= BALANCE.entregasRegularidad ? 'posible' : 'perdida'
}

/** Semanas con entrega que aún se pueden saltar sin perder la regularidad; negativo si ya se perdió. */
export function margenEntregas(a: Asignatura, semana: number): number {
  return a.ent + entregasRestantes(semana) - BALANCE.entregasRegularidad
}

/** Promedio ponderado de los parciales ya rendidos; null si aún no hay ninguno. */
export function promedioProvisional(a: Asignatura): number | null {
  if (a.notas.length === 0) return null
  let suma = 0
  let pesos = 0
  a.notas.forEach((nota, i) => {
    const peso = BALANCE.pesosParciales[i]!
    suma += peso * nota
    pesos += peso
  })
  return suma / pesos
}

export function notaParcial(
  horTramo: number,
  zona: ZonaId,
  ruido: number,
  bloqueo: boolean,
  horObjetivo: number = BALANCE.nota.horObjetivo,
): number {
  const n = BALANCE.nota
  const avance = Math.min(1, horTramo / horObjetivo)
  const bruta = n.base + n.rango * avance ** n.exponente + BALANCE.zonas[zona].modParcial + ruido
  const nota = clamp(bruta, n.min, n.max)
  return bloqueo ? nota / n.divisorBloqueo : nota
}

/** Nota esperada de un parcial con esas horas y ese estrés, sin ruido ni bloqueo. */
export function notaEstimada(horTramo: number, estres: number, horObjetivo?: number): number {
  return notaParcial(horTramo, zonaDe(estres), 0, false, horObjetivo)
}

/** Redondea el promedio de una asignatura a entero; 0.5 sube. */
export function redondearPromedio(promedio: number): number {
  // El épsilon absorbe el error de coma flotante de la suma ponderada (10.5 puede salir 10.4999…).
  return Math.floor(promedio + 0.5 + 1e-9)
}

export function crearPartida(semilla: number, cursadas: readonly DatosAsignatura[]): Estado {
  if (cursadas.length < BALANCE.asignaturasMin || cursadas.length > BALANCE.asignaturasMax) {
    throw new Error(
      `Se cursan entre ${BALANCE.asignaturasMin} y ${BALANCE.asignaturasMax} asignaturas`,
    )
  }
  return {
    semilla,
    rng: semilla | 0,
    semana: 1,
    estres: BALANCE.estresInicial,
    fase: 'decision',
    crisisArmada: true,
    abandono: false,
    asignaturas: cursadas.map((datos) => ({ ...datos, horTramo: 0, ent: 0, notas: [] })),
    decisionesEnCurso: null,
    asignaturasPrevias: null,
    historial: [],
  }
}

/** Aplica una decisión por asignatura. Fuera de la fase de decisión no hace nada. */
export function aplicarDecisiones(e: Estado, decisiones: DecisionId[]): Estado {
  if (e.fase !== 'decision') return e
  if (decisiones.length !== e.asignaturas.length) {
    throw new Error('Hace falta una decisión por asignatura')
  }

  const rutina = esRutina(e, decisiones)
  const asignaturas = e.asignaturas.map((a, i) => {
    const efecto = efectoDecision(e, decisiones[i]!, rutina)
    return { ...a, horTramo: a.horTramo + efecto.hor, ent: a.ent + efecto.ent }
  })
  const estres = estresPrevisto(e, decisiones)
  const aplicado: Estado = { ...e, asignaturas, estres, decisionesEnCurso: decisiones }

  if (e.crisisArmada && estres >= BALANCE.crisis.umbralDisparo) {
    return { ...aplicado, fase: 'crisis', crisisArmada: false, asignaturasPrevias: e.asignaturas }
  }
  return cerrarSemana(rearmar(aplicado), null, null)
}

/** Resuelve la crisis abierta. Fuera de la fase de crisis no hace nada. */
export function resolverCrisis(e: Estado, opcion: OpcionCrisis): Estado {
  if (e.fase !== 'crisis') return e

  if (opcion === 'abandono') {
    const registro: RegistroSemana = {
      semana: e.semana,
      decisiones: e.decisionesEnCurso,
      perdida: null,
      crisis: opcion,
      estres: e.estres,
      notas: null,
      detalle: null,
    }
    return {
      ...e,
      fase: 'fin',
      abandono: true,
      decisionesEnCurso: null,
      asignaturasPrevias: null,
      historial: [...e.historial, registro],
    }
  }

  if (opcion === 'reposo') {
    const estres = clamp(
      e.estres - BALANCE.crisis.alivioReposo,
      BALANCE.estresMin,
      BALANCE.estresMax,
    )
    // El reposo anula la semana en curso: se pierden las HOR y entregas recién sumadas.
    const anulada = { ...e, estres, asignaturas: e.asignaturasPrevias! }
    return cerrarSemana(rearmar(anulada), 'reposo', opcion)
  }
  return cerrarSemana(e, null, opcion)
}

export function resultado(e: Estado): Resultado {
  const asignaturas = e.asignaturas.map((a): ResumenAsignatura => {
    const promedio = BALANCE.pesosParciales.reduce(
      (suma, peso, i) => suma + peso * (a.notas[i] ?? 0),
      0,
    )
    const final = redondearPromedio(promedio)
    const regular = a.ent >= BALANCE.entregasRegularidad
    return {
      nombre: a.nombre,
      promedio,
      final,
      regular,
      aprobada: regular && final >= BALANCE.finalAprobatorio,
    }
  })

  const promedioGeneral = asignaturas.reduce((s, a) => s + a.promedio, 0) / asignaturas.length
  const sinRegularidad = asignaturas.filter((a) => !a.regular).length
  const ovr = clamp(
    BALANCE.ovr.factorPromedio * promedioGeneral -
      BALANCE.ovr.penalizacionSinRegularidad * sinRegularidad,
    BALANCE.ovr.min,
    BALANCE.ovr.max,
  )

  const aprobadas = asignaturas.filter((a) => a.aprobada).length
  const todas = aprobadas === asignaturas.length
  const sinParcialBajo = e.asignaturas.every((a) =>
    a.notas.every((nota) => nota >= BALANCE.beca.parcialMin),
  )
  const beca =
    todas &&
    asignaturas.length === BALANCE.beca.asignaturasRequeridas &&
    ovr >= BALANCE.beca.ovrMin &&
    sinParcialBajo

  let final: FinalId
  if (e.abandono) final = 'abandono'
  else if (beca) final = 'beca'
  else if (todas) final = 'aprobado'
  else if (aprobadas > 0) final = 'aprobado_parcial'
  else final = 'desaprobado'

  return { asignaturas, promedioGeneral, ovr, final }
}

function rearmar(e: Estado): Estado {
  return e.estres < BALANCE.crisis.umbralRearme ? { ...e, crisisArmada: true } : e
}

/** Cierra la semana en curso y, si las siguientes se pierden, las cierra también. */
function cerrarSemana(
  inicial: Estado,
  perdida: SemanaPerdida | null,
  crisis: OpcionCrisis | null,
): Estado {
  let e = registrar(inicial, inicial.decisionesEnCurso, perdida, crisis)
  while (e.fase !== 'fin') {
    const [colapso, siguienteEstado] = colapsoAlEmpezar(e)
    if (!colapso) break
    e = registrar(siguienteEstado, null, 'colapso', null)
  }
  return e
}

/** Con estrés de crisis al empezar la semana, tira si el alumno colapsa y la pierde. */
function colapsoAlEmpezar(e: Estado): [boolean, Estado] {
  if (e.estres < BALANCE.crisis.umbralDisparo) return [false, e]
  const [tirada, rng] = siguiente(e.rng)
  return [tirada < BALANCE.crisis.probColapso, { ...e, rng }]
}

/** Rinde el parcial si toca, anota la semana en el historial y avanza a la siguiente. */
function registrar(
  e: Estado,
  decisiones: DecisionId[] | null,
  perdida: SemanaPerdida | null,
  crisis: OpcionCrisis | null,
): Estado {
  const indice = parcialDeSemana(e.semana)
  let { rng, asignaturas } = e
  let notas: number[] | null = null
  let detalle: DetalleNota[] | null = null

  if (indice !== -1) {
    const zona = zonaDe(e.estres)
    const esUltimo = indice === BALANCE.semanasParcial.length - 1
    notas = []
    detalle = []
    asignaturas = asignaturas.map((a) => {
      let nota: number = BALANCE.notaParcialSinRegularidad
      let bloqueo = false
      const rendido = !esUltimo || a.ent >= BALANCE.entregasRegularidad
      if (rendido) {
        let tirada: number
        ;[tirada, rng] = siguiente(rng)
        const ruido = (tirada * 2 - 1) * BALANCE.nota.ruido
        if (zona === 'roja') {
          ;[tirada, rng] = siguiente(rng)
          bloqueo = tirada < BALANCE.nota.probBloqueo
        }
        nota = notaParcial(a.horTramo, zona, ruido, bloqueo, a.horObjetivo)
      }
      notas!.push(nota)
      detalle!.push({ hor: a.horTramo, bloqueo, rendido })
      return { ...a, horTramo: 0, notas: [...a.notas, nota] }
    })
  }

  const registro: RegistroSemana = {
    semana: e.semana,
    decisiones,
    perdida,
    crisis,
    estres: e.estres,
    notas,
    detalle,
  }
  const semana = e.semana + 1
  return {
    ...e,
    rng,
    asignaturas,
    semana,
    fase: semana > BALANCE.semanasConDecision ? 'fin' : 'decision',
    decisionesEnCurso: null,
    asignaturasPrevias: null,
    historial: [...e.historial, registro],
  }
}
