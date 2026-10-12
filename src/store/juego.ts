import { create } from 'zustand'
import {
  aplicarDecisiones,
  crearPartida,
  resolverCrisis,
  resolverEvento,
  type Estado,
  type OpcionCrisis,
  type RegistroSemana,
} from '../core/simulacion.ts'
import { BALANCE, type DecisionId, type DificultadId } from '../data/balance.ts'

export const NOMBRES_ASIGNATURAS = BALANCE.asignaturas.map((a) => a.nombre)

interface Juego {
  estado: Estado | null
  /** Semanas cerradas por la última acción, para mostrar qué pasó. */
  resumen: RegistroSemana[]
  /** `dificultad` null juega sin eventos. */
  nueva(cantidad: number, dificultad: DificultadId | null, semilla?: number): void
  elegirEvento(opcion: number): void
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
    nueva: (cantidad, dificultad, semilla = semillaAlAzar()) =>
      set({
        estado: crearPartida(semilla, BALANCE.asignaturas.slice(0, cantidad), dificultad),
        resumen: [],
      }),
    // Resolver el evento no cierra ninguna semana: el resumen de la anterior sigue a la vista.
    elegirEvento: (opcion) => {
      const previo = get().estado
      if (previo) set({ estado: resolverEvento(previo, opcion) })
    },
    decidir: (decisiones) => avanzar((e) => aplicarDecisiones(e, decisiones)),
    resolver: (opcion) => avanzar((e) => resolverCrisis(e, opcion)),
    salir: () => set({ estado: null, resumen: [] }),
  }
})
