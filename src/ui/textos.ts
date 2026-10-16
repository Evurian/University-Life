import type { FinalId, OpcionCrisis } from '../core/simulacion.ts'
import { BALANCE, type DecisionId, type DificultadId, type ZonaId } from '../data/balance.ts'
import type { TipoEvento } from '../data/eventos.ts'

// Nombres que ve el jugador. En el código y en REGLAS.md los cursos son "asignaturas",
// los trabajos son "entregas" y tener los trabajos necesarios es la "regularidad".

export const ZONAS: Record<ZonaId, string> = {
  verde: 'Verde',
  amarilla: 'Amarilla',
  roja: 'Roja',
}

export const DECISIONES_CORTAS: Record<DecisionId, string> = {
  intensivo: 'Estudiar a fondo',
  balanceada: 'Trabajo semanal',
  salud: 'Descansar',
}

export const DIFICULTADES: Record<DificultadId, string> = {
  relajado: 'Más eventos buenos que malos, y los malos pesan menos.',
  normal: 'Tantos eventos buenos como malos.',
  exigente: 'Más eventos, casi todos malos, y pesan más.',
}

/** Para qué sirve cada acción, en una línea. */
export const INTENCION: Record<DecisionId, string> = {
  intensivo: 'Muchas horas de estudio para subir la nota, a costa de bastante estrés.',
  balanceada: 'Entregas 1 trabajo de ese curso y estudias un poco, con algo de estrés.',
  salud: 'No estudias ni entregas, pero el estrés baja.',
}

export const FINALES: Record<FinalId, { titulo: string; texto: string }> = {
  beca: {
    titulo: 'Beca',
    texto: 'Aprobaste los cuatro cursos con un rendimiento sobresaliente.',
  },
  aprobado: {
    titulo: 'Aprobado',
    texto: 'Aprobaste todos los cursos del cuatrimestre.',
  },
  aprobado_parcial: {
    titulo: 'Aprobado parcial',
    texto: 'Aprobaste algunos cursos; el resto tendrás que volver a llevarlos.',
  },
  desaprobado: {
    titulo: 'Desaprobado',
    texto: 'No aprobaste ningún curso este cuatrimestre.',
  },
  abandono: {
    titulo: 'Abandono',
    texto: 'Dejaste la carrera en medio de una crisis.',
  },
}

const { probColapso, alivioReposo, umbralDisparo } = BALANCE.crisis

export const CRISIS: Record<OpcionCrisis, { titulo: string; texto: string }> = {
  forzar: {
    titulo: 'Forzar la semana',
    texto: `La semana sigue como la planeaste. Mientras el estrés esté en ${umbralDisparo} o más, cada semana hay un ${probColapso * 100} % de colapsar y perderla entera.`,
  },
  reposo: {
    titulo: 'Reposo forzado',
    texto: `El estrés baja ${alivioReposo} puntos, pero esta semana se anula: pierdes las horas y los trabajos que acabas de planear.`,
  },
  abandono: {
    titulo: 'Abandonar la carrera',
    texto: 'La partida termina ahora. No se puede deshacer.',
  },
}

/** Tipo de evento con nombre y marca propios, para no depender solo del color. */
export const TIPO_EVENTO: Record<TipoEvento, { nombre: string; marca: string }> = {
  bueno: { nombre: 'Evento favorable', marca: '◆' },
  malo: { nombre: 'Evento adverso', marca: '▲' },
}

/** Cómo rinden las horas de estudio con un multiplicador semanal, en el mismo texto en todas partes. */
export const rendimientoHoras = (mult: number) =>
  `las horas de estudio rinden ${conSigno(Math.round((mult - 1) * 100))} %`

/** Exigencia de un curso según las horas que pide, comparadas con las de referencia. */
export const exigencia = (horObjetivo: number) =>
  horObjetivo > BALANCE.nota.horObjetivo
    ? 'Exigente'
    : horObjetivo < BALANCE.nota.horObjetivo
      ? 'Ligero'
      : 'Medio'

/** Texto de un evento con el nombre del curso afectado. */
export const textoEvento = (texto: string, curso: string) => texto.replaceAll('{curso}', curso)

export const n1 = (valor: number) => valor.toFixed(1)
export const conSigno = (valor: number) => (valor > 0 ? `+${valor}` : `${valor}`.replace('-', '−'))
