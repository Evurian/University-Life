import { create } from 'zustand'
import {
  aplicarDecisiones,
  crearPartida,
  resolverCrisis,
  type Estado,
  type OpcionCrisis,
  type RegistroSemana,
} from '../core/simulacion.ts'
import type { DecisionId } from '../data/balance.ts'

export const NOMBRES_ASIGNATURAS = ['Cálculo', 'Programación', 'Física', 'Redacción']

interface Juego {
  estado: Estado | null
  /** Semanas cerradas por la última acción, para mostrar qué pasó. */
  resumen: RegistroSemana[]
  nueva(cantidad: number, semilla?: number): void
  decidir(decisiones: DecisionId[]): void
  resolver(opcion: OpcionCrisis): void
  salir(): void
}

const semillaAlAzar = () => Math.floor(Math.random() * 2 ** 31)

export const useJuego = create<Juego>((set, get) => {
  const avanzar = (paso: (e: Estado) => Estado) => {
    const previo = get().estado
    if (!previo) return
    const estado = paso(previo)
    if (estado !== previo) {
      set({ estado, resumen: estado.historial.slice(previo.historial.length) })
    }
  }
  return {
    estado: null,
    resumen: [],
    nueva: (cantidad, semilla = semillaAlAzar()) =>
      set({ estado: crearPartida(semilla, NOMBRES_ASIGNATURAS.slice(0, cantidad)), resumen: [] }),
    decidir: (decisiones) => avanzar((e) => aplicarDecisiones(e, decisiones)),
    resolver: (opcion) => avanzar((e) => resolverCrisis(e, opcion)),
    salir: () => set({ estado: null, resumen: [] }),
  }
})
