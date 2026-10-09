import type { FinalId, OpcionCrisis } from '../core/simulacion.ts'
import { BALANCE, type DecisionId, type ZonaId } from '../data/balance.ts'

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

export const n1 = (valor: number) => valor.toFixed(1)
export const conSigno = (valor: number) => (valor > 0 ? `+${valor}` : `${valor}`.replace('-', '−'))
