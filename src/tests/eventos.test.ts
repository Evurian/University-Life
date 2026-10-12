import { describe, expect, it } from 'vitest'
import {
  aplicarDecisiones,
  crearPartida,
  efectoDecision,
  efectoDeOpcion,
  parcialDeSemana,
  resolverCrisis,
  resolverEvento,
  resultado,
  type Asignatura,
  type Estado,
} from '../core/simulacion.ts'
import { BALANCE, type DecisionId, type DificultadId } from '../data/balance.ts'
import { EVENTOS, eventoPorId } from '../data/eventos.ts'

const CURSADAS = BALANCE.asignaturas
const NIVELES = Object.keys(BALANCE.dificultades) as DificultadId[]
const LIMITES = BALANCE.eventos

/** Juega una partida completa descansando siempre, eligiendo la primera opción de cada evento. */
function jugar(semilla: number, dificultad: DificultadId | null, decision: DecisionId = 'salud') {
  let e = crearPartida(semilla, CURSADAS, dificultad)
  while (e.fase !== 'fin') {
    if (e.fase === 'evento') e = resolverEvento(e, 0)
    else if (e.fase === 'crisis') e = resolverCrisis(e, 'forzar')
    else
      e = aplicarDecisiones(
        e,
        e.asignaturas.map(() => decision),
      )
  }
  return e
}

/** Partida detenida en un evento concreto, para probar sus efectos. */
const conEvento = (
  id: string,
  dificultad: DificultadId = 'normal',
  cambios: Partial<Estado> = {},
): Estado => ({
  ...crearPartida(1, CURSADAS, dificultad),
  semana: 2,
  fase: 'evento',
  evento: { id, curso: 1, elegida: null },
  ...cambios,
})

const eventosDe = (e: Estado) =>
  e.historial.flatMap((r) => (r.evento ? [{ semana: r.semana, evento: r.evento }] : []))

describe('catálogo de eventos', () => {
  it('tiene identificadores únicos y dos opciones con efecto en cada evento', () => {
    expect(new Set(EVENTOS.map((ev) => ev.id)).size).toBe(EVENTOS.length)
    for (const ev of EVENTOS) {
      expect(ev.opciones).toHaveLength(2)
      for (const opcion of ev.opciones) {
        expect(Object.keys(opcion.efecto).length).toBeGreaterThan(0)
      }
    }
  })

  it('tiene más eventos de cada tipo que el máximo de una partida', () => {
    for (const tipo of ['bueno', 'malo']) {
      expect(EVENTOS.filter((ev) => ev.tipo === tipo).length).toBeGreaterThan(LIMITES.maxPorPartida)
    }
  })

  it('en los buenos ninguna opción solo perjudica y en los malos ninguna solo beneficia', () => {
    const beneficia = (ev: (typeof EVENTOS)[number], i: number) => {
      const { estres = 0, horas = 0, trabajos = 0, multHoras = 1 } = ev.opciones[i]!.efecto
      return estres < 0 || horas > 0 || trabajos > 0 || multHoras > 1
    }
    const perjudica = (ev: (typeof EVENTOS)[number], i: number) => {
      const { estres = 0, horas = 0, trabajos = 0, multHoras = 1 } = ev.opciones[i]!.efecto
      return estres > 0 || horas < 0 || trabajos < 0 || multHoras < 1
    }
    for (const ev of EVENTOS) {
      for (const i of [0, 1]) {
        if (ev.tipo === 'bueno') expect(beneficia(ev, i)).toBe(true)
        else expect(perjudica(ev, i) && !beneficia(ev, i)).toBe(true)
      }
    }
  })

  it('falla si se pide un evento que no existe', () => {
    expect(() => eventoPorId('no_existe')).toThrow()
  })
})

describe('sorteo de eventos', () => {
  it('sin dificultad la partida no tiene eventos', () => {
    for (let semilla = 1; semilla <= 30; semilla++) {
      expect(eventosDe(jugar(semilla, null))).toHaveLength(0)
    }
  })

  it('respeta los límites de la partida en los tres niveles', () => {
    for (const nivel of NIVELES) {
      for (let semilla = 1; semilla <= 200; semilla++) {
        const fin = jugar(semilla, nivel)
        const eventos = eventosDe(fin)
        const datos = eventos.map((r) => eventoPorId(r.evento.id))

        expect(eventos.length).toBeLessThanOrEqual(LIMITES.maxPorPartida)
        // Descansando siempre no hay semanas perdidas, así que el mínimo se cumple.
        expect(eventos.length).toBeGreaterThanOrEqual(LIMITES.minPorPartida)
        expect(new Set(datos.map((d) => d.id)).size).toBe(datos.length)
        expect(eventos.every((r) => r.semana > 1)).toBe(true)

        let malosSeguidos = 0
        eventos.forEach((r, i) => {
          const malo = datos[i]!.tipo === 'malo'
          malosSeguidos = malo ? malosSeguidos + 1 : 0
          expect(malosSeguidos).toBeLessThanOrEqual(LIMITES.maxMalosSeguidos)
          if (parcialDeSemana(r.semana) !== -1) expect(malo).toBe(false)
          expect(r.evento.curso).toBeLessThan(fin.asignaturas.length)
          expect(r.evento.elegida).toBe(0)
        })
      }
    }
  })

  it('cuanto más difícil el nivel, más eventos y menos de ellos buenos', () => {
    const medir = (nivel: DificultadId) => {
      let total = 0
      let buenos = 0
      for (let semilla = 1; semilla <= 400; semilla++) {
        for (const r of eventosDe(jugar(semilla, nivel))) {
          total++
          if (eventoPorId(r.evento.id).tipo === 'bueno') buenos++
        }
      }
      return { porPartida: total / 400, buenos: buenos / total }
    }
    const [relajado, normal, exigente] = NIVELES.map(medir)
    expect(relajado!.porPartida).toBeLessThan(normal!.porPartida)
    expect(normal!.porPartida).toBeLessThan(exigente!.porPartida)
    expect(relajado!.buenos).toBeGreaterThan(normal!.buenos)
    expect(normal!.buenos).toBeGreaterThan(exigente!.buenos)
  })

  it('con la misma semilla salen los mismos eventos', () => {
    expect(jugar(11, 'normal')).toEqual(jugar(11, 'normal'))
    expect(eventosDe(jugar(11, 'normal')).map((r) => r.evento.id)).not.toEqual(
      eventosDe(jugar(12, 'normal')).map((r) => r.evento.id),
    )
  })

  it('una semana perdida por colapso no trae evento', () => {
    for (let semilla = 1; semilla <= 60; semilla++) {
      const fin = jugar(semilla, 'exigente', 'intensivo')
      for (const r of fin.historial) {
        if (r.perdida === 'colapso') expect(r.evento).toBeNull()
      }
    }
  })
})

describe('resolver un evento', () => {
  it('la partida espera la elección: no se puede planificar hasta resolverlo', () => {
    const e = conEvento('feriado')
    expect(aplicarDecisiones(e, ['salud', 'salud', 'salud', 'salud'])).toBe(e)

    const resuelto = resolverEvento(e, 0)
    expect(resuelto).toMatchObject({ fase: 'decision', estres: 10 })
    expect(resuelto.evento).toEqual({ id: 'feriado', curso: 1, elegida: 0 })

    const cerrada = aplicarDecisiones(resuelto, ['salud', 'salud', 'salud', 'intensivo'])
    expect(cerrada.historial.at(-1)?.evento).toEqual({ id: 'feriado', curso: 1, elegida: 0 })
  })

  it('no hace nada fuera de la fase de evento ni con una opción que no existe', () => {
    const sinEvento = crearPartida(1, CURSADAS, 'normal')
    expect(resolverEvento(sinEvento, 0)).toBe(sinEvento)
    expect(efectoDeOpcion(sinEvento, 0)).toBeNull()

    const e = conEvento('feriado')
    expect(resolverEvento(e, 2)).toBe(e)
    expect(efectoDeOpcion({ ...e, dificultad: null }, 0)).toBeNull()

    const yaResuelto = resolverEvento(e, 0)
    expect(resolverEvento(yaResuelto, 1)).toBe(yaResuelto)
  })

  it('las horas y los trabajos van al curso afectado', () => {
    const horas = resolverEvento(conEvento('feriado'), 1)
    expect(horas.asignaturas.map((a) => a.horTramo)).toEqual([0, 6, 0, 0])

    const trabajo = resolverEvento(conEvento('trabajo_perdonado'), 0)
    expect(trabajo.asignaturas.map((a) => a.ent)).toEqual([0, 1, 0, 0])
  })

  it('las horas y los trabajos no bajan de cero ni pasan del máximo', () => {
    const sinNada = resolverEvento(conEvento('transporte'), 1)
    expect(sinNada.asignaturas[1]?.horTramo).toBe(0)
    expect(resolverEvento(conEvento('trabajo_sorpresa'), 1).asignaturas[1]?.ent).toBe(0)

    const lleno = (a: Asignatura): Asignatura => ({ ...a, ent: BALANCE.entregasPosibles })
    const base = conEvento('trabajo_perdonado')
    const tope = resolverEvento({ ...base, asignaturas: base.asignaturas.map(lleno) }, 0)
    expect(tope.asignaturas[1]?.ent).toBe(BALANCE.entregasPosibles)
  })

  it('un evento no provoca una crisis por sí solo', () => {
    const cerca = resolverEvento(conEvento('mala_salud', 'normal', { estres: 75 }), 1)
    expect(cerca).toMatchObject({ estres: 79, fase: 'decision', crisisArmada: true })

    const yaAlto = conEvento('mala_salud', 'normal', { estres: 85, crisisArmada: false })
    expect(resolverEvento(yaAlto, 1).estres).toBe(85)
  })

  it('bajar de 60 con un evento rearma la crisis', () => {
    const e = conEvento('feriado', 'normal', { estres: 62, crisisArmada: false })
    expect(resolverEvento(e, 0)).toMatchObject({ estres: 52, crisisArmada: true })
  })

  it('el modificador de horas dura solo esa semana', () => {
    const e = resolverEvento(conEvento('mala_salud'), 0)
    expect(e.modificadores.multHoras).toBeCloseTo(0.7)
    expect(efectoDecision(e, 'intensivo').hor).toBeCloseTo(14 * 1.1 * 0.7)

    const siguiente = aplicarDecisiones(e, ['intensivo', 'salud', 'salud', 'salud'])
    expect(siguiente.asignaturas[0]?.horTramo).toBeCloseTo(14 * 1.1 * 0.7)
    expect(siguiente.modificadores.multHoras).toBe(1)
  })
})

describe('peso de la dificultad', () => {
  it('en un evento bueno pesa más o menos lo que beneficia, no lo que cuesta', () => {
    expect(efectoDeOpcion(conEvento('grupo_estudio', 'relajado'), 0)).toEqual({
      horas: 10,
      estres: 2,
    })
    expect(efectoDeOpcion(conEvento('grupo_estudio', 'normal'), 0)).toEqual({
      horas: 8,
      estres: 2,
    })
    expect(efectoDeOpcion(conEvento('grupo_estudio', 'exigente'), 0)).toEqual({
      horas: 6,
      estres: 2,
    })
  })

  it('en un evento malo pesa más o menos lo que perjudica', () => {
    expect(efectoDeOpcion(conEvento('mala_salud', 'relajado'), 1)?.estres).toBe(8)
    expect(efectoDeOpcion(conEvento('mala_salud', 'normal'), 1)?.estres).toBe(10)
    expect(efectoDeOpcion(conEvento('mala_salud', 'exigente'), 1)?.estres).toBe(13)

    expect(efectoDeOpcion(conEvento('mala_salud', 'relajado'), 0)?.multHoras).toBeCloseTo(0.775)
    expect(efectoDeOpcion(conEvento('mala_salud', 'exigente'), 0)?.multHoras).toBeCloseTo(0.625)
  })

  it('el alivio de estrés y los bonos de horas de los buenos siguen al nivel', () => {
    expect(efectoDeOpcion(conEvento('feriado', 'relajado'), 0)?.estres).toBe(-12)
    expect(efectoDeOpcion(conEvento('feriado', 'exigente'), 0)?.estres).toBe(-7)
    expect(efectoDeOpcion(conEvento('clase_suspendida', 'relajado'), 1)?.multHoras).toBeCloseTo(
      1.25,
    )
    // Lo que cuesta dentro de un evento bueno no se toca.
    expect(efectoDeOpcion(conEvento('visita_familia', 'relajado'), 0)).toEqual({
      estres: -15,
      multHoras: 0.85,
    })
  })

  it('los trabajos no se escalan', () => {
    for (const nivel of NIVELES) {
      expect(efectoDeOpcion(conEvento('trabajo_sorpresa', nivel), 1)).toEqual({ trabajos: -1 })
    }
  })
})

describe('beca según el número de cursos', () => {
  const curso = (nota: number): Asignatura => ({
    nombre: 'A',
    horObjetivo: 40,
    horTramo: 0,
    ent: 9,
    notas: [nota, nota, nota],
  })
  const final = (cursos: number, nota: number) =>
    resultado({
      ...crearPartida(1, CURSADAS),
      fase: 'fin',
      asignaturas: Array.from({ length: cursos }, () => curso(nota)),
    }).final

  it('con 3 cursos pide rendimiento 85', () => {
    expect(final(3, 17)).toBe('beca')
    expect(final(3, 16.9)).toBe('aprobado')
  })

  it('con 4 cursos pide algo menos', () => {
    const minimo = BALANCE.beca.ovrMinPorCursos[4]! / BALANCE.ovr.factorPromedio
    expect(BALANCE.beca.ovrMinPorCursos[4]).toBeLessThan(BALANCE.beca.ovrMinPorCursos[3]!)
    expect(final(4, minimo)).toBe('beca')
    expect(final(4, minimo - 0.1)).toBe('aprobado')
  })

  it('solo se juega con 3 o 4 cursos', () => {
    expect(() => crearPartida(1, CURSADAS.slice(0, 2))).toThrow()
    expect(crearPartida(1, CURSADAS.slice(0, 3)).asignaturas).toHaveLength(3)
  })
})
