import { describe, expect, it } from 'vitest'
import {
  aplicarDecisiones,
  crearPartida,
  resolverCrisis,
  resultado,
  type Estado,
  type OpcionCrisis,
} from '../core/simulacion.ts'
import { siguiente } from '../core/rng.ts'
import { BALANCE, type DecisionId } from '../data/balance.ts'

const DECISIONES = Object.keys(BALANCE.decisiones) as DecisionId[]
const OPCIONES: OpcionCrisis[] = ['forzar', 'forzar', 'reposo', 'reposo', 'abandono']
const NOMBRES = ['A', 'B', 'C', 'D']

function congelar<T>(valor: T): T {
  if (typeof valor === 'object' && valor !== null && !Object.isFrozen(valor)) {
    Object.freeze(valor)
    Object.values(valor).forEach(congelar)
  }
  return valor
}

/** Juega una partida al azar. Cada estado se congela: si el núcleo mutara su entrada, lanzaría. */
function partidaAlAzar(semilla: number): {
  estados: Estado[]
  acciones: (DecisionId[] | OpcionCrisis)[]
} {
  let rng = semilla * 7919
  const azar = (n: number) => {
    let valor: number
    ;[valor, rng] = siguiente(rng)
    return Math.floor(valor * n)
  }
  let e = congelar(crearPartida(semilla, NOMBRES.slice(0, 2 + azar(3))))
  const estados = [e]
  const acciones: (DecisionId[] | OpcionCrisis)[] = []
  while (e.fase !== 'fin') {
    const accion =
      e.fase === 'crisis'
        ? OPCIONES[azar(OPCIONES.length)]!
        : e.asignaturas.map(() => DECISIONES[azar(DECISIONES.length)]!)
    e = congelar(
      typeof accion === 'string' ? resolverCrisis(e, accion) : aplicarDecisiones(e, accion),
    )
    acciones.push(accion)
    estados.push(e)
  }
  return { estados, acciones }
}

describe('invariantes en partidas al azar', () => {
  const partidas = Array.from({ length: 1500 }, (_, i) => partidaAlAzar(i + 1))

  it('cada estado respeta los rangos de las reglas', () => {
    for (const { estados } of partidas) {
      for (const e of estados) {
        expect(e.estres).toBeGreaterThanOrEqual(BALANCE.estresMin)
        expect(e.estres).toBeLessThanOrEqual(BALANCE.estresMax)
        expect(e.semana).toBeGreaterThanOrEqual(1)
        expect(e.semana).toBeLessThanOrEqual(BALANCE.semanasTotales)
        for (const a of e.asignaturas) {
          expect(a.horTramo).toBeGreaterThanOrEqual(0)
          expect(a.ent).toBeLessThanOrEqual(BALANCE.entregasPosibles)
          for (const nota of a.notas) {
            expect(nota).toBeGreaterThanOrEqual(BALANCE.nota.min)
            expect(nota).toBeLessThanOrEqual(BALANCE.nota.max)
          }
        }
      }
    }
  })

  it('el historial registra cada semana una sola vez y en orden', () => {
    for (const { estados } of partidas) {
      const fin = estados.at(-1)!
      expect(fin.historial.map((r) => r.semana)).toEqual(fin.historial.map((_, i) => i + 1))
      if (fin.abandono) continue
      expect(fin.semana).toBe(BALANCE.semanasTotales)
      expect(fin.historial).toHaveLength(BALANCE.semanasConDecision)
      expect(fin.asignaturas.every((a) => a.notas.length === 3)).toBe(true)
    }
  })

  it('la crisis solo se abre con estrés ≥ 80 y nunca dos semanas seguidas sin rearme', () => {
    for (const { estados } of partidas) {
      let armada = true
      for (const e of estados) {
        if (e.fase === 'crisis') {
          expect(e.estres).toBeGreaterThanOrEqual(BALANCE.crisis.umbralDisparo)
          expect(armada).toBe(true)
        }
        armada = e.crisisArmada
      }
    }
  })

  it('el resultado final es coherente', () => {
    for (const { estados } of partidas) {
      const fin = estados.at(-1)!
      const r = resultado(fin)
      expect(r.ovr).toBeGreaterThanOrEqual(BALANCE.ovr.min)
      expect(r.ovr).toBeLessThanOrEqual(BALANCE.ovr.max)
      expect(r.final === 'abandono').toBe(fin.abandono)
      if (r.final === 'beca') {
        expect(fin.asignaturas).toHaveLength(BALANCE.beca.asignaturasRequeridas)
        expect(r.asignaturas.every((a) => a.aprobada)).toBe(true)
      }
      for (const a of r.asignaturas) {
        if (a.aprobada) expect(a.promedio).toBeGreaterThanOrEqual(10.5 - 1e-9)
      }
    }
  })

  it('el estado sobrevive a guardarse como JSON y la partida se reproduce igual', () => {
    for (const { estados, acciones } of partidas.slice(0, 200)) {
      // Se retoma desde una copia serializada a mitad de partida.
      const mitad = Math.floor(acciones.length / 2)
      let e: Estado = JSON.parse(JSON.stringify(estados[mitad]))
      expect(e).toEqual(estados[mitad])
      for (const accion of acciones.slice(mitad)) {
        e = typeof accion === 'string' ? resolverCrisis(e, accion) : aplicarDecisiones(e, accion)
      }
      expect(e).toEqual(estados.at(-1))
    }
  })
})
