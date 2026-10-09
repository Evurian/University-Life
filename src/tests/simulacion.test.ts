import { describe, expect, it } from 'vitest'
import {
  aplicarDecisiones,
  crearPartida,
  efectoDecision,
  entregasRestantes,
  esRutina,
  estresPrevisto,
  margenEntregas,
  notaEstimada,
  notaParcial,
  promedioProvisional,
  provocaCrisis,
  regularidadDe,
  parcialDeSemana,
  redondearPromedio,
  resolverCrisis,
  resultado,
  zonaDe,
  type Asignatura,
  type Estado,
} from '../core/simulacion.ts'
import { siguiente } from '../core/rng.ts'
import { BALANCE, type DecisionId } from '../data/balance.ts'

const CURSADAS = BALANCE.asignaturas

const nueva = (semilla = 1, cambios: Partial<Estado> = {}): Estado => ({
  ...crearPartida(semilla, CURSADAS),
  ...cambios,
})

const todas = (decision: DecisionId, e: Estado): DecisionId[] => e.asignaturas.map(() => decision)

/** Juega semanas con la misma decisión en todas las asignaturas, forzando las crisis. */
function jugar(e: Estado, decision: DecisionId, semanas = Infinity): Estado {
  for (let i = 0; i < semanas && e.fase !== 'fin'; i++) {
    e = aplicarDecisiones(e, todas(decision, e))
    if (e.fase === 'crisis') e = resolverCrisis(e, 'forzar')
  }
  return e
}

const asignatura = (notas: number[], ent = 9): Asignatura => ({
  nombre: 'A',
  horObjetivo: 40,
  horTramo: 0,
  ent,
  notas,
})

const conAsignaturas = (asignaturas: Asignatura[], cambios: Partial<Estado> = {}): Estado => ({
  ...nueva(),
  fase: 'fin',
  semana: 16,
  asignaturas,
  ...cambios,
})

describe('rng', () => {
  it('es determinista y devuelve valores en [0, 1)', () => {
    let estado = 123
    const valores: number[] = []
    for (let i = 0; i < 1000; i++) {
      let valor: number
      ;[valor, estado] = siguiente(estado)
      valores.push(valor)
    }
    expect(Math.min(...valores)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...valores)).toBeLessThan(1)
    expect(siguiente(123)).toEqual(siguiente(123))
    expect(siguiente(123)[0]).not.toBe(siguiente(124)[0])
  })
})

describe('crearPartida', () => {
  it('empieza en la semana 1 con estrés 20 y la crisis armada', () => {
    const e = nueva()
    expect(e).toMatchObject({ semana: 1, estres: 20, fase: 'decision', crisisArmada: true })
    expect(e.asignaturas).toHaveLength(4)
  })

  it('rechaza menos de 2 o más de 4 asignaturas', () => {
    expect(() => crearPartida(1, CURSADAS.slice(0, 1))).toThrow()
    expect(() => crearPartida(1, [...CURSADAS, ...CURSADAS.slice(0, 1)])).toThrow()
    expect(crearPartida(1, CURSADAS.slice(0, 2)).asignaturas).toHaveLength(2)
  })
})

describe('zonas y calendario', () => {
  it('respeta los límites de zona', () => {
    expect(zonaDe(0)).toBe('verde')
    expect(zonaDe(40)).toBe('verde')
    expect(zonaDe(41)).toBe('amarilla')
    expect(zonaDe(75)).toBe('amarilla')
    expect(zonaDe(76)).toBe('roja')
    expect(zonaDe(100)).toBe('roja')
  })

  it('ubica los parciales en las semanas 5, 10 y 15', () => {
    expect([5, 10, 15].map(parcialDeSemana)).toEqual([0, 1, 2])
    expect(parcialDeSemana(4)).toBe(-1)
  })
})

describe('aplicarDecisiones', () => {
  it('suma HOR con el multiplicador de zona, ENT y el estrés de todas las asignaturas', () => {
    const e = aplicarDecisiones(nueva(), ['intensivo', 'balanceada', 'salud', 'balanceada'])
    expect(e.asignaturas.map((a) => a.horTramo)).toEqual([14 * 1.1, 6 * 1.1, 0, 6 * 1.1])
    expect(e.asignaturas.map((a) => a.ent)).toEqual([0, 1, 0, 1])
    expect(e.estres).toBe(20 + 5 + 2 - 6 + 2)
    expect(e.semana).toBe(2)
  })

  it('usa la zona previa a la decisión para el multiplicador', () => {
    const e = aplicarDecisiones(nueva(1, { estres: 40 }), todas('intensivo', nueva()))
    // Misma decisión en todas: rutina, con −2 de estrés y ×0.8 de horas.
    expect(e.estres).toBe(58)
    expect(e.asignaturas[0]?.horTramo).toBeCloseTo(14 * 1.1 * 0.8)

    const amarilla = aplicarDecisiones(nueva(1, { estres: 41 }), todas('balanceada', nueva()))
    expect(amarilla.asignaturas[0]?.horTramo).toBeCloseTo(6 * 0.85 * 0.8)
  })

  it('acota el estrés entre 0 y 100', () => {
    expect(aplicarDecisiones(nueva(), todas('salud', nueva())).estres).toBe(0)
    const alto = nueva(1, { estres: 95, crisisArmada: false })
    expect(aplicarDecisiones(alto, todas('intensivo', alto)).estres).toBe(100)
  })

  it('no da entrega en semana de parcial', () => {
    const e = aplicarDecisiones(nueva(1, { semana: 5 }), todas('balanceada', nueva()))
    expect(e.asignaturas.every((a) => a.ent === 0)).toBe(true)
  })

  it('exige una decisión por asignatura', () => {
    expect(() => aplicarDecisiones(nueva(), ['salud'])).toThrow()
  })

  it('se ignora fuera de la fase de decisión', () => {
    const fin = jugar(nueva(), 'balanceada')
    expect(fin.fase).toBe('fin')
    expect(aplicarDecisiones(fin, todas('salud', fin))).toBe(fin)
  })
})

describe('parciales', () => {
  it('calcula la nota según horas, zona, ruido y bloqueo', () => {
    expect(notaParcial(0, 'verde', 0, false)).toBe(5)
    expect(notaParcial(40, 'amarilla', 0, false)).toBe(20)
    expect(notaParcial(80, 'amarilla', 0, false)).toBe(20)
    expect(notaParcial(40, 'roja', 0, false)).toBe(15)
    expect(notaParcial(40, 'roja', 0, true)).toBe(7.5)
    expect(notaParcial(20, 'amarilla', 0, false)).toBeCloseTo(4 + 16 * 0.5 ** 0.7)
  })

  it('acota la nota a la escala 0–20', () => {
    expect(notaParcial(40, 'verde', 1, false)).toBe(20)
    expect(notaParcial(0, 'roja', -1, false)).toBe(0)
  })

  it('rinde el parcial una vez, reinicia las HOR y lo anota en el historial', () => {
    const e = jugar(nueva(), 'balanceada', 5)
    expect(e.semana).toBe(6)
    expect(e.asignaturas.every((a) => a.notas.length === 1 && a.horTramo === 0)).toBe(true)
    expect(e.historial[4]?.notas).toEqual(e.asignaturas.map((a) => a.notas[0]))
    expect(e.historial[3]?.notas).toBeNull()
  })

  it('mantiene el ruido dentro de ±1', () => {
    for (let semilla = 1; semilla <= 200; semilla++) {
      const e = jugar(nueva(semilla), 'salud', 5)
      for (const a of e.asignaturas) {
        // Sin horas y en zona verde: 4 + 1 ± 1.
        expect(a.notas[0]).toBeGreaterThanOrEqual(4)
        expect(a.notas[0]).toBeLessThanOrEqual(6)
      }
    }
  })

  it('en zona roja a veces hay bloqueo mental y la nota se reduce a la mitad', () => {
    // Con el tramo ya estudiado, en zona roja la nota ronda 13–16; solo un bloqueo la baja de 10.
    let bloqueadas = 0
    let total = 0
    for (let semilla = 1; semilla <= 200; semilla++) {
      const base = nueva(semilla, { semana: 5, estres: 100, crisisArmada: false })
      const inicio = { ...base, asignaturas: base.asignaturas.map((a) => ({ ...a, horTramo: 40 })) }
      const e = aplicarDecisiones(inicio, todas('balanceada', inicio))
      for (const a of e.asignaturas) {
        total++
        if (a.notas[0]! < 10) bloqueadas++
      }
    }
    expect(bloqueadas / total).toBeGreaterThan(0.1)
    expect(bloqueadas / total).toBeLessThan(0.3)
  })

  it('sin regularidad no se rinde el Parcial 3 y cuenta como 0', () => {
    const e = jugar(nueva(), 'salud')
    expect(e.asignaturas.every((a) => a.ent === 0 && a.notas[2] === 0)).toBe(true)
    expect(resultado(e).final).toBe('desaprobado')
  })
})

describe('crisis', () => {
  const alBorde = () => nueva(1, { estres: 79 })

  it('se dispara al cruzar 80 y detiene la semana', () => {
    const e = aplicarDecisiones(alBorde(), todas('balanceada', alBorde()))
    expect(e).toMatchObject({ fase: 'crisis', estres: 85, semana: 1, crisisArmada: false })
    expect(e.historial).toHaveLength(0)
    expect(aplicarDecisiones(e, todas('salud', e))).toBe(e)
  })

  it('no se resuelve si no hay crisis abierta', () => {
    const e = nueva()
    expect(resolverCrisis(e, 'forzar')).toBe(e)
  })

  it('forzar continúa la semana sin cambiar el estrés', () => {
    const crisis = aplicarDecisiones(alBorde(), todas('balanceada', alBorde()))
    const e = resolverCrisis(crisis, 'forzar')
    expect(e.estres).toBe(85)
    expect(e.historial[0]).toMatchObject({ semana: 1, crisis: 'forzar', perdida: null })
  })

  it('no vuelve a dispararse mientras no se rearme', () => {
    let e = resolverCrisis(aplicarDecisiones(alBorde(), todas('balanceada', alBorde())), 'forzar')
    for (let i = 0; i < 5 && e.fase !== 'fin'; i++) {
      e = aplicarDecisiones(e, todas('balanceada', e))
      expect(e.fase).not.toBe('crisis')
    }
  })

  it('no se dispara al bajar si sigue por encima de 80', () => {
    const inicio = nueva(1, { estres: 100, crisisArmada: false })
    const e = aplicarDecisiones(inicio, ['salud', 'salud', 'salud', 'balanceada'])
    expect(e.estres).toBe(84)
    expect(e.historial[0]?.crisis).toBeNull()
  })

  it('se rearma al bajar de 60, no al llegar a 60', () => {
    const descanso: DecisionId[] = ['salud', 'salud', 'balanceada', 'balanceada']
    const en60 = aplicarDecisiones(nueva(1, { estres: 68, crisisArmada: false }), descanso)
    expect(en60).toMatchObject({ estres: 60, crisisArmada: false })
    const en59 = aplicarDecisiones(nueva(1, { estres: 67, crisisArmada: false }), descanso)
    expect(en59).toMatchObject({ estres: 59, crisisArmada: true })
  })

  it('en semana de parcial, el parcial se rinde una sola vez tras resolverla', () => {
    const inicio = nueva(1, { semana: 5, estres: 79 })
    const crisis = aplicarDecisiones(inicio, todas('balanceada', inicio))
    expect(crisis.asignaturas.every((a) => a.notas.length === 0)).toBe(true)
    const e = resolverCrisis(crisis, 'forzar')
    expect(e.asignaturas.every((a) => a.notas.length === 1)).toBe(true)
    expect(e.historial.filter((r) => r.semana === 5)).toHaveLength(1)
  })

  it('el reposo baja 20 de estrés y anula la semana en curso', () => {
    const crisis = aplicarDecisiones(alBorde(), todas('balanceada', alBorde()))
    expect(crisis.asignaturas.map((a) => a.ent)).toEqual([1, 1, 1, 1])
    const e = resolverCrisis(crisis, 'reposo')
    // Queda en 65: por encima de 60, así que la crisis no se rearma.
    expect(e).toMatchObject({ estres: 65, semana: 2, crisisArmada: false })
    expect(e.historial).toHaveLength(1)
    expect(e.historial[0]).toMatchObject({ semana: 1, crisis: 'reposo', perdida: 'reposo' })
    expect(e.asignaturas.every((a) => a.ent === 0 && a.horTramo === 0)).toBe(true)
  })

  it('un reposo en semana de parcial rinde el parcial igual, sin las horas de esa semana', () => {
    const inicio = nueva(1, { semana: 5, estres: 62 })
    const e = resolverCrisis(aplicarDecisiones(inicio, todas('intensivo', inicio)), 'reposo')
    expect(e.semana).toBe(6)
    expect(e.historial[0]?.notas).toHaveLength(4)
    // Sin horas y con estrés 62 (amarilla): 4 ± 1.
    expect(e.asignaturas.every((a) => a.notas[0]! >= 3 && a.notas[0]! <= 5)).toBe(true)
  })

  it('el abandono termina la partida', () => {
    const crisis = aplicarDecisiones(alBorde(), todas('balanceada', alBorde()))
    const e = resolverCrisis(crisis, 'abandono')
    expect(e).toMatchObject({ fase: 'fin', abandono: true })
    expect(e.historial[0]).toMatchObject({ crisis: 'abandono', notas: null })
    expect(resultado(e).final).toBe('abandono')
  })

  it('empezar la semana con estrés ≥ 80 provoca colapso una parte de las veces', () => {
    let colapsos = 0
    const partidas = 400
    for (let semilla = 1; semilla <= partidas; semilla++) {
      const inicio = nueva(semilla, { estres: 90, crisisArmada: false })
      const e = aplicarDecisiones(inicio, todas('balanceada', inicio))
      const segunda = e.historial[1]
      if (segunda?.perdida === 'colapso') {
        colapsos++
        expect(segunda).toMatchObject({ semana: 2, decisiones: null, estres: 96 })
        expect(e.asignaturas.map((a) => a.ent)).toEqual([1, 1, 1, 1])
      }
    }
    expect(colapsos / partidas).toBeGreaterThan(0.15)
    expect(colapsos / partidas).toBeLessThan(0.35)
  })

  it('por debajo de 80 no hay colapso', () => {
    for (let semilla = 1; semilla <= 100; semilla++) {
      const e = jugar(nueva(semilla), 'balanceada', 7)
      expect(e.estres).toBeLessThan(80)
      expect(e.historial.every((r) => r.perdida === null)).toBe(true)
    }
  })
})

describe('fin de partida', () => {
  it('termina tras la semana 15 y queda en la 16', () => {
    const e = jugar(nueva(), 'salud')
    expect(e).toMatchObject({ fase: 'fin', semana: 16 })
    expect(e.historial).toHaveLength(15)
    expect(e.asignaturas.every((a) => a.notas.length === 3)).toBe(true)
  })

  it('con la misma semilla y decisiones el resultado es idéntico', () => {
    expect(jugar(nueva(7), 'intensivo')).toEqual(jugar(nueva(7), 'intensivo'))
    expect(jugar(nueva(7), 'balanceada').asignaturas).not.toEqual(
      jugar(nueva(8), 'balanceada').asignaturas,
    )
  })
})

describe('resultado', () => {
  it('redondea 10.5 hacia 11 y 10.49 hacia 10', () => {
    expect(redondearPromedio(10.5)).toBe(11)
    expect(redondearPromedio(10.49)).toBe(10)
    expect(redondearPromedio(0.3 * 10.5 + 0.3 * 10.5 + 0.4 * 10.5)).toBe(11)
  })

  it('pondera los parciales 30/30/40', () => {
    const r = resultado(conAsignaturas([asignatura([10, 20, 15]), asignatura([10, 20, 15])]))
    expect(r.asignaturas[0]?.promedio).toBeCloseTo(15)
    expect(r.promedioGeneral).toBeCloseTo(15)
    expect(r.ovr).toBeCloseTo(75)
  })

  it('aprueba con promedio 10.5 y desaprueba justo por debajo', () => {
    const r = resultado(
      conAsignaturas([asignatura([10.5, 10.5, 10.5]), asignatura([10.4, 10.5, 10.5])]),
    )
    expect(r.asignaturas.map((a) => a.final)).toEqual([11, 10])
    expect(r.asignaturas.map((a) => a.aprobada)).toEqual([true, false])
    expect(r.final).toBe('aprobado_parcial')
  })

  it('sin regularidad la asignatura no aprueba y el OVR pierde 5', () => {
    const r = resultado(conAsignaturas([asignatura([20, 20, 20], 8), asignatura([20, 20, 20])]))
    expect(r.asignaturas[0]).toMatchObject({ regular: false, aprobada: false })
    expect(r.ovr).toBeCloseTo(95)
  })

  it('el OVR no baja de 0', () => {
    const r = resultado(conAsignaturas([asignatura([0, 0, 0], 0), asignatura([0, 0, 0], 0)]))
    expect(r.ovr).toBe(0)
    expect(r.final).toBe('desaprobado')
  })

  it('da beca con 4 asignaturas aprobadas, OVR ≥ 85 y ningún parcial bajo', () => {
    const cuatro = [0, 1, 2, 3].map(() => asignatura([17, 17, 17]))
    expect(resultado(conAsignaturas(cuatro))).toMatchObject({ ovr: 85, final: 'beca' })
  })

  it('no da beca con menos de 4 asignaturas', () => {
    const tres = [0, 1, 2].map(() => asignatura([20, 20, 20]))
    expect(resultado(conAsignaturas(tres)).final).toBe('aprobado')
  })

  it('no da beca con OVR bajo ni con un parcial por debajo de 10.5', () => {
    const ovrBajo = [0, 1, 2, 3].map(() => asignatura([16, 16, 16]))
    expect(resultado(conAsignaturas(ovrBajo)).final).toBe('aprobado')

    const parcialBajo = [0, 1, 2].map(() => asignatura([20, 20, 20]))
    parcialBajo.push(asignatura([20, 10, 20]))
    const r = resultado(conAsignaturas(parcialBajo))
    expect(r.ovr).toBeGreaterThanOrEqual(85)
    expect(r.final).toBe('aprobado')
  })

  it('el abandono tiene prioridad sobre cualquier otro final', () => {
    const cuatro = [0, 1, 2, 3].map(() => asignatura([20, 20, 20]))
    expect(resultado(conAsignaturas(cuatro, { abandono: true })).final).toBe('abandono')
  })
})

describe('ayudas para la interfaz', () => {
  it('cuenta las entregas que quedan sin las semanas de parcial', () => {
    expect(entregasRestantes(1)).toBe(12)
    expect(entregasRestantes(5)).toBe(8)
    expect(entregasRestantes(14)).toBe(1)
    expect(entregasRestantes(15)).toBe(0)
    expect(entregasRestantes(16)).toBe(0)
  })

  it('anticipa el efecto de una decisión con la zona y la semana actuales', () => {
    expect(efectoDecision(nueva(), 'intensivo')).toEqual({ hor: 14 * 1.1, ent: 0, estres: 5 })
    const parcialEnRoja = nueva(1, { semana: 5, estres: 90 })
    expect(efectoDecision(parcialEnRoja, 'balanceada')).toEqual({ hor: 6 * 0.6, ent: 0, estres: 2 })
  })

  it('anticipa el estrés y la crisis igual que al aplicar las decisiones', () => {
    const e = nueva(1, { estres: 74 })
    const decisiones = todas('balanceada', e)
    expect(estresPrevisto(e, decisiones)).toBe(80)
    expect(provocaCrisis(e, decisiones)).toBe(true)
    expect(aplicarDecisiones(e, decisiones).fase).toBe('crisis')
    expect(provocaCrisis({ ...e, crisisArmada: false }, decisiones)).toBe(false)
    expect(provocaCrisis(nueva(), todas('salud', e))).toBe(false)
    expect(estresPrevisto(nueva(), todas('salud', e))).toBe(0)
  })

  it('clasifica la regularidad según las entregas hechas y las que quedan', () => {
    expect(regularidadDe(asignatura([], 9), 10)).toBe('asegurada')
    expect(regularidadDe(asignatura([], 0), 1)).toBe('posible')
    expect(regularidadDe(asignatura([], 8), 14)).toBe('posible')
    expect(regularidadDe(asignatura([], 7), 14)).toBe('perdida')
    expect(regularidadDe(asignatura([], 8), 16)).toBe('perdida')
  })

  it('calcula cuántas semanas con entrega se pueden saltar todavía', () => {
    expect(margenEntregas(asignatura([], 0), 1)).toBe(3)
    expect(margenEntregas(asignatura([], 8), 14)).toBe(0)
    expect(margenEntregas(asignatura([], 7), 14)).toBe(-1)
    expect(margenEntregas(asignatura([], 9), 16)).toBe(0)
  })

  it('promedia solo los parciales rendidos', () => {
    expect(promedioProvisional(asignatura([]))).toBeNull()
    expect(promedioProvisional(asignatura([14]))).toBeCloseTo(14)
    expect(promedioProvisional(asignatura([10, 20]))).toBeCloseTo(15)
    expect(promedioProvisional(asignatura([10, 20, 15]))).toBeCloseTo(15)
  })

  it('guarda con qué horas se rindió cada parcial y si hubo bloqueo', () => {
    const e = jugar(nueva(), 'balanceada', 5)
    const registro = e.historial[4]!
    expect(registro.detalle).toHaveLength(4)
    expect(registro.detalle![0]).toMatchObject({ bloqueo: false, rendido: true })
    expect(registro.detalle![0]!.hor).toBeGreaterThan(0)
    expect(e.historial[3]!.detalle).toBeNull()

    const sinEntregas = jugar(nueva(), 'salud')
    expect(sinEntregas.historial[14]!.detalle![0]).toMatchObject({ rendido: false, bloqueo: false })
  })
})

describe('nota estimada', () => {
  it('es la nota del parcial sin ruido ni bloqueo, con la zona del estrés dado', () => {
    expect(notaEstimada(0, 20)).toBe(5)
    expect(notaEstimada(40, 50)).toBe(20)
    expect(notaEstimada(40, 90)).toBe(15)
    expect(notaEstimada(20, 50)).toBeCloseTo(notaParcial(20, 'amarilla', 0, false))
  })
})

describe('rutina: la misma decisión en todas las asignaturas', () => {
  it('se detecta solo cuando están todas decididas y son iguales', () => {
    const e = nueva()
    expect(esRutina(e, todas('intensivo', e))).toBe(true)
    expect(esRutina(e, ['intensivo', 'intensivo', 'intensivo', 'balanceada'])).toBe(false)
    expect(esRutina(e, ['intensivo', 'intensivo'])).toBe(false)
  })

  it('premia con menos estrés y castiga con menos horas', () => {
    const e = nueva()
    const rutina = aplicarDecisiones(e, todas('intensivo', e))
    const variada = aplicarDecisiones(e, ['intensivo', 'intensivo', 'intensivo', 'balanceada'])

    expect(rutina.estres).toBe(20 + 4 * 5 - BALANCE.rutina.alivioEstres)
    expect(variada.estres).toBe(20 + 3 * 5 + 2)
    expect(rutina.asignaturas[0]?.horTramo).toBeCloseTo(14 * 1.1 * BALANCE.rutina.multHor)
    expect(variada.asignaturas[0]?.horTramo).toBeCloseTo(14 * 1.1)
    expect(efectoDecision(e, 'intensivo', true).hor).toBeCloseTo(rutina.asignaturas[0]!.horTramo)
  })

  it('no quita entregas', () => {
    const e = nueva()
    expect(aplicarDecisiones(e, todas('balanceada', e)).asignaturas.map((a) => a.ent)).toEqual([
      1, 1, 1, 1,
    ])
  })
})

describe('dificultad de las asignaturas', () => {
  it('cada asignatura trae su propio objetivo de horas', () => {
    expect(nueva().asignaturas.map((a) => a.horObjetivo)).toEqual(
      CURSADAS.map((a) => a.horObjetivo),
    )
    expect(new Set(CURSADAS.map((a) => a.horObjetivo)).size).toBeGreaterThan(1)
  })

  it('con las mismas horas, la asignatura más exigente saca menos nota', () => {
    expect(notaParcial(30, 'amarilla', 0, false, 46)).toBeLessThan(
      notaParcial(30, 'amarilla', 0, false, 32),
    )
    expect(notaParcial(32, 'amarilla', 0, false, 32)).toBe(20)
    expect(notaEstimada(30, 50, 46)).toBeCloseTo(notaParcial(30, 'amarilla', 0, false, 46))
  })

  it('en una partida, las mismas decisiones dan notas distintas por asignatura', () => {
    const e = jugar(nueva(), 'balanceada', 5)
    const [calculo, , , redaccion] = e.historial[4]!.notas!
    // Cálculo exige 46 h y Redacción 32: la diferencia supera con holgura el ruido de ±1.
    expect(redaccion! - calculo!).toBeGreaterThan(1)
  })
})
