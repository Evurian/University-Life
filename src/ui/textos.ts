import type { FinalId, OpcionCrisis, Regularidad } from '../core/simulacion.ts'
import { BALANCE, type DecisionId, type ZonaId } from '../data/balance.ts'

export const ZONAS: Record<ZonaId, string> = {
  verde: 'Verde',
  amarilla: 'Amarilla',
  roja: 'Roja',
}

export const DECISIONES_CORTAS: Record<DecisionId, string> = {
  intensivo: 'Intensivo',
  balanceada: 'Balanceada',
  salud: 'Salud',
}

export const REGULARIDAD: Record<Regularidad, string> = {
  asegurada: 'Regularidad asegurada',
  posible: 'Regularidad en juego',
  perdida: 'Regularidad perdida',
}

export const FINALES: Record<FinalId, { titulo: string; texto: string }> = {
  beca: {
    titulo: 'Beca',
    texto: 'Aprobaste las cuatro asignaturas con un rendimiento sobresaliente.',
  },
  aprobado: {
    titulo: 'Aprobado',
    texto: 'Aprobaste todas las asignaturas del cuatrimestre.',
  },
  aprobado_parcial: {
    titulo: 'Aprobado parcial',
    texto: 'Aprobaste algunas asignaturas; el resto tendrás que volver a cursarlas.',
  },
  desaprobado: {
    titulo: 'Desaprobado',
    texto: 'No aprobaste ninguna asignatura este cuatrimestre.',
  },
  abandono: {
    titulo: 'Abandono',
    texto: 'Dejaste la carrera en medio de una crisis.',
  },
}

const { probColapso, alivioReposo, umbralDisparo } = BALANCE.crisis

export const CRISIS: Record<OpcionCrisis, { titulo: string; texto: string }> = {
  forzar: {
    titulo: 'Forzar la cursada',
    texto: `La semana sigue como la planeaste. Mientras el estrés esté en ${umbralDisparo} o más, cada semana hay un ${probColapso * 100} % de colapsar y perderla entera.`,
  },
  reposo: {
    titulo: 'Reposo forzado',
    texto: `El estrés baja ${alivioReposo} puntos, pero esta semana se anula: pierdes las horas y entregas que acabas de planear.`,
  },
  abandono: {
    titulo: 'Abandonar la carrera',
    texto: 'La partida termina ahora. No se puede deshacer.',
  },
}

export const n1 = (valor: number) => valor.toFixed(1)
export const conSigno = (valor: number) => (valor > 0 ? `+${valor}` : `${valor}`.replace('-', '−'))
