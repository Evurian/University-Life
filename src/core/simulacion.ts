// Reglas del juego como funciones puras: reciben un estado y devuelven otro.
// Especificación: REGLAS.md. Números: src/data/balance.ts.

import {
  BALANCE,
  type DatosAsignatura,
  type DecisionId,
  type DificultadId,
  type ZonaId,
} from '../data/balance.ts'
import { EVENTOS, eventoPorId, type EfectoEvento } from '../data/eventos.ts'
import { siguiente } from './rng.ts'

export type Fase = 'decision' | 'evento' | 'crisis' | 'fin'
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

/** Evento de una semana: cuál salió, a qué curso afecta y qué opción se eligió. */
export interface EventoActivo {
  id: string
  /** Índice del curso al que se refiere el evento, si lo menciona. */
  curso: number
  /** Índice de la opción elegida; null mientras el jugador no decide. */
  elegida: number | null
}

/** Efectos de un evento que duran solo la semana en curso. */
export interface Modificadores {
  multHoras: number
}

const SIN_MODIFICADORES: Modificadores = { multHoras: 1 }

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
  /** Evento que trajo la semana, con la opción elegida; null si no hubo. */
  evento: EventoActivo | null
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
  /** Nivel de dificultad; null juega sin eventos (pruebas y simulación base). */
  dificultad: DificultadId | null
  /** Evento de la semana en curso, resuelto o por resolver. */
  evento: EventoActivo | null
  modificadores: Modificadores
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
    hor:
      d.hor *
      BALANCE.zonas[zonaDe(e.estres)].multHor *
      (rutina ? BALANCE.rutina.multHor : 1) *
      e.modificadores.multHoras,
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

export function crearPartida(
  semilla: number,
  cursadas: readonly DatosAsignatura[],
  dificultad: DificultadId | null = null,
): Estado {
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
    dificultad,
    evento: null,
    modificadores: SIN_MODIFICADORES,
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
      evento: e.evento,
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

/**
 * Efecto de una opción del evento en curso, ya con el peso de la dificultad:
 * en un evento bueno pesa más lo que beneficia; en uno malo, lo que perjudica.
 */
export function efectoDeOpcion(e: Estado, opcion: number): EfectoEvento | null {
  const nivel = e.dificultad && BALANCE.dificultades[e.dificultad]
  const datos = e.evento && eventoPorId(e.evento.id)
  const base = datos?.opciones[opcion]?.efecto
  if (!nivel || !datos || !base) return null

  const peso = (beneficia: boolean) =>
    datos.tipo === 'bueno' ? (beneficia ? nivel.pesoBueno : 1) : beneficia ? 1 : nivel.pesoMalo
  const efecto: EfectoEvento = {}
  if (base.estres !== undefined) efecto.estres = Math.round(base.estres * peso(base.estres < 0))
  if (base.horas !== undefined) efecto.horas = base.horas * peso(base.horas > 0)
  if (base.trabajos !== undefined) efecto.trabajos = base.trabajos
  if (base.multHoras !== undefined) {
    efecto.multHoras = 1 + (base.multHoras - 1) * peso(base.multHoras > 1)
  }
  return efecto
}

/** Elige una opción del evento de la semana. Fuera de la fase de evento no hace nada. */
export function resolverEvento(e: Estado, opcion: number): Estado {
  const efecto = efectoDeOpcion(e, opcion)
  if (e.fase !== 'evento' || !e.evento || !efecto) return e

  let estres = e.estres + (efecto.estres ?? 0)
  // Un evento no provoca una crisis por sí solo: lo que suma se detiene justo antes del umbral.
  if (estres > e.estres)
    estres = Math.min(estres, Math.max(e.estres, BALANCE.crisis.umbralDisparo - 1))
  estres = clamp(estres, BALANCE.estresMin, BALANCE.estresMax)

  const afectado = e.evento.curso
  const asignaturas = e.asignaturas.map((a, i) =>
    i === afectado
      ? {
          ...a,
          horTramo: Math.max(0, a.horTramo + (efecto.horas ?? 0)),
          ent: clamp(a.ent + (efecto.trabajos ?? 0), 0, BALANCE.entregasPosibles),
        }
      : a,
  )
  return rearmar({
    ...e,
    estres,
    asignaturas,
    modificadores: { multHoras: efecto.multHoras ?? 1 },
    evento: { ...e.evento, elegida: opcion },
    fase: 'decision',
  })
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
  const ovrBeca = BALANCE.beca.ovrMinPorCursos[asignaturas.length]
  const beca = todas && ovrBeca !== undefined && ovr >= ovrBeca && sinParcialBajo

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
  return e.fase === 'fin' ? e : sortearEvento(e)
}

/** Al empezar una semana, tira si trae evento y cuál; si lo trae, la partida espera la elección. */
function sortearEvento(e: Estado): Estado {
  const nivel = e.dificultad && BALANCE.dificultades[e.dificultad]
  if (!nivel) return e
  const limites = BALANCE.eventos
  const previos = e.historial.flatMap((r) => (r.evento ? [eventoPorId(r.evento.id)] : []))
  if (previos.length >= limites.maxPorPartida) return e

  let { rng } = e
  let tirada: number
  ;[tirada, rng] = siguiente(rng)
  // Si las semanas que quedan son justas para llegar al mínimo, el evento es seguro.
  const semanasRestantes = BALANCE.semanasConDecision - e.semana + 1
  const forzado = limites.minPorPartida - previos.length >= semanasRestantes
  if (!forzado && tirada >= nivel.probEvento) return { ...e, rng }

  ;[tirada, rng] = siguiente(rng)
  let malosSeguidos = 0
  for (let i = previos.length - 1; i >= 0 && previos[i]!.tipo === 'malo'; i--) malosSeguidos++
  const soloBueno = parcialDeSemana(e.semana) !== -1 || malosSeguidos >= limites.maxMalosSeguidos
  const tipo = soloBueno || tirada < nivel.probBueno ? 'bueno' : 'malo'

  const usados = new Set(previos.map((p) => p.id))
  const candidatos = EVENTOS.filter((ev) => ev.tipo === tipo && !usados.has(ev.id))
  ;[tirada, rng] = siguiente(rng)
  const elegido = candidatos[Math.floor(tirada * candidatos.length)]
  // El catálogo tiene más eventos de cada tipo que el máximo por partida; si faltaran, no hay evento.
  if (!elegido) return { ...e, rng }
  ;[tirada, rng] = siguiente(rng)
  const curso = Math.floor(tirada * e.asignaturas.length)
  return { ...e, rng, fase: 'evento', evento: { id: elegido.id, curso, elegida: null } }
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
    evento: e.evento,
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
    evento: null,
    modificadores: SIN_MODIFICADORES,
    historial: [...e.historial, registro],
  }
}
