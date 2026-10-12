// Bot de balance: simula partidas completas por estrategia, resume los finales
// y comprueba los criterios de balance de REGLAS.md.
// Uso: npm run sim -- [partidas por estrategia] [ruta.del.balance=valor ...]
// Ejemplo para probar un ajuste sin tocar balance.ts:
//   npm run sim -- 10000 decisiones.balanceada.estres=2 crisis.alivioReposo=30

import {
  aplicarDecisiones,
  crearPartida,
  efectoDeOpcion,
  entregasRestantes,
  esRutina,
  parcialDeSemana,
  resolverCrisis,
  resolverEvento,
  resultado,
  type Estado,
  type FinalId,
  type OpcionCrisis,
} from '../src/core/simulacion.ts'
import { siguiente } from '../src/core/rng.ts'
import { BALANCE, type DecisionId, type DificultadId } from '../src/data/balance.ts'

interface Estrategia {
  nombre: string
  /** Un solo botón: la misma decisión en todas las asignaturas, todas las semanas. */
  unBoton: boolean
  decidir(e: Estado, azar: () => number): DecisionId[]
  crisis(e: Estado, azar: () => number): OpcionCrisis
}

// Ajustes de prueba: se aplican sobre BALANCE antes de simular.
const ajustes = process.argv.slice(3)
for (const ajuste of ajustes) {
  const [ruta, valor] = ajuste.split('=')
  const claves = ruta!.split('.')
  const ultima = claves.pop()!
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const destino = claves.reduce((nodo: any, clave) => nodo[clave], BALANCE)
  if (!(ultima in destino)) throw new Error(`No existe ${ruta} en BALANCE`)
  destino[ultima] = Number(valor)
}

const CURSADAS = BALANCE.asignaturas
const DECISIONES = Object.keys(BALANCE.decisiones) as DecisionId[]
const FINALES: FinalId[] = ['beca', 'aprobado', 'aprobado_parcial', 'desaprobado', 'abandono']

const unBoton = (decision: DecisionId, opcion: OpcionCrisis): Estrategia => ({
  nombre: `solo ${decision} (${opcion})`,
  unBoton: true,
  decidir: (e) => e.asignaturas.map(() => decision),
  crisis: () => opcion,
})

const aleatoria: Estrategia = {
  nombre: 'aleatoria',
  unBoton: false,
  decidir: (e, azar) => e.asignaturas.map(() => DECISIONES[Math.floor(azar() * 3)]!),
  crisis: (_e, azar) => (azar() < 0.5 ? 'forzar' : 'reposo'),
}

// Plan fijo por tramo de 5 semanas: tres entregas, una semana fuerte y descanso antes del parcial.
const planFijo: Estrategia = {
  nombre: 'plan fijo',
  unBoton: false,
  decidir: (e) => {
    const posicion = ((e.semana - 1) % 5) + 1
    const decision: DecisionId =
      posicion <= 3 ? 'balanceada' : posicion === 4 ? 'intensivo' : 'salud'
    return e.asignaturas.map(() => decision)
  },
  crisis: () => 'reposo',
}

// Decide por asignatura: asegura la regularidad y estudia mientras el estrés no pase del techo.
// Con `variada`, si todas las decisiones salen iguales cambia una para no caer en la rutina.
const adaptativa = (nombre: string, techo: number, variada = false): Estrategia => ({
  nombre,
  unBoton: false,
  decidir: (e) => {
    const esParcial = parcialDeSemana(e.semana) !== -1
    const restantes = entregasRestantes(e.semana)
    let estres = e.estres
    const cabe = (d: DecisionId) => estres + BALANCE.decisiones[d].estres <= techo
    const obligadas: boolean[] = []
    const decisiones = e.asignaturas.map((a) => {
      const faltanEntregas = BALANCE.entregasRegularidad - a.ent
      let decision: DecisionId = 'salud'
      const obligada = !esParcial && faltanEntregas > 0 && faltanEntregas >= restantes - 1
      obligadas.push(obligada)
      if (obligada) {
        decision = 'balanceada'
      } else if (a.horTramo < a.horObjetivo && cabe('intensivo')) {
        decision = 'intensivo'
      } else if (!esParcial && faltanEntregas > 0 && cabe('balanceada')) {
        decision = 'balanceada'
      }
      estres += BALANCE.decisiones[decision].estres
      return decision
    })

    const comun = decisiones[0]!
    const libres = decisiones.map((_, i) => i).filter((i) => !obligadas[i])
    if (variada && comun !== 'salud' && libres.length > 0 && esRutina(e, decisiones)) {
      // Cambia la asignatura que menos lo necesita: la más adelantada en horas o en entregas.
      const ventaja = (i: number) => {
        const a = e.asignaturas[i]!
        return comun === 'intensivo' ? a.horTramo / a.horObjetivo : a.ent
      }
      const elegida = libres.reduce((mejor, i) => (ventaja(i) > ventaja(mejor) ? i : mejor))
      const pendiente = e.asignaturas[elegida]!.ent < BALANCE.entregasRegularidad
      if (comun === 'balanceada') decisiones[elegida] = 'salud'
      else decisiones[elegida] = !esParcial && pendiente ? 'balanceada' : 'salud'
    }
    return decisiones
  },
  crisis: () => 'reposo',
})

// Nunca descansa por decisión propia: alterna entregas y estudio y usa el reposo de las crisis.
const alLimite: Estrategia = {
  nombre: 'al límite',
  unBoton: false,
  decidir: (e) => {
    const esParcial = parcialDeSemana(e.semana) !== -1
    return e.asignaturas.map((a) =>
      esParcial || a.ent >= BALANCE.entregasRegularidad ? 'intensivo' : 'balanceada',
    )
  },
  crisis: () => 'reposo',
}

const ESTRATEGIAS: Estrategia[] = [
  ...DECISIONES.flatMap((d) => [unBoton(d, 'forzar'), unBoton(d, 'reposo')]),
  aleatoria,
  planFijo,
  alLimite,
  adaptativa('adaptativa (zona verde)', BALANCE.zonas.verde.hasta),
  adaptativa('adaptativa variada (zona verde)', BALANCE.zonas.verde.hasta, true),
  adaptativa('adaptativa (zona amarilla)', BALANCE.zonas.amarilla.hasta),
]

// Valora una opción de evento con una regla simple: el estrés pesa por punto, las horas la mitad,
// y un trabajo vale mucho solo si al curso todavía le faltan.
function valorOpcion(e: Estado, opcion: number): number {
  const efecto = efectoDeOpcion(e, opcion)
  if (!efecto || !e.evento) return -Infinity
  const curso = e.asignaturas[e.evento.curso]!
  const faltan = curso.ent < BALANCE.entregasRegularidad
  return (
    -(efecto.estres ?? 0) +
    0.5 * (efecto.horas ?? 0) +
    (faltan ? 6 : 0) * (efecto.trabajos ?? 0) +
    40 * ((efecto.multHoras ?? 1) - 1)
  )
}

function jugar(
  estrategia: Estrategia,
  semilla: number,
  cursos: number = CURSADAS.length,
  dificultad: DificultadId | null = null,
) {
  // El azar de la estrategia usa un flujo propio para no alterar el de la partida.
  let rng = semilla ^ 0x5bd1e995
  const azar = () => {
    let valor: number
    ;[valor, rng] = siguiente(rng)
    return valor
  }
  let e = crearPartida(semilla, CURSADAS.slice(0, cursos), dificultad)
  let crisis = 0
  while (e.fase !== 'fin') {
    if (e.fase === 'crisis') {
      crisis++
      e = resolverCrisis(e, estrategia.crisis(e, azar))
    } else if (e.fase === 'evento') {
      const opcion =
        estrategia === aleatoria
          ? Math.floor(azar() * 2)
          : valorOpcion(e, 0) >= valorOpcion(e, 1)
            ? 0
            : 1
      e = resolverEvento(e, opcion)
    } else {
      e = aplicarDecisiones(e, estrategia.decidir(e, azar))
    }
  }
  const perdidas = e.historial.filter((r) => r.perdida !== null).length
  const eventos = e.historial.filter((r) => r.evento !== null).length
  return { ...resultado(e), crisis, perdidas, eventos }
}

const partidas = Number(process.argv[2] ?? 10_000)
const pct = (n: number) => `${((100 * n) / partidas).toFixed(1)}%`

const filas = ESTRATEGIAS.map((estrategia) => {
  const finales: Record<FinalId, number> = {
    beca: 0,
    aprobado: 0,
    aprobado_parcial: 0,
    desaprobado: 0,
    abandono: 0,
  }
  let ovr = 0
  let crisis = 0
  let perdidas = 0
  for (let semilla = 1; semilla <= partidas; semilla++) {
    const r = jugar(estrategia, semilla)
    finales[r.final]++
    ovr += r.ovr
    crisis += r.crisis
    perdidas += r.perdidas
  }
  return {
    estrategia,
    finales,
    ovr: ovr / partidas,
    crisis: crisis / partidas,
    perdidas: perdidas / partidas,
  }
})

console.log(`Partidas por estrategia: ${partidas} · asignaturas: ${CURSADAS.length}\n`)
console.table(
  Object.fromEntries(
    filas.map((f) => [
      f.estrategia.nombre,
      {
        ...Object.fromEntries(FINALES.map((id) => [id, pct(f.finales[id])])),
        OVR: f.ovr.toFixed(1),
        crisis: f.crisis.toFixed(2),
        'sem. perdidas': f.perdidas.toFixed(2),
      },
    ]),
  ),
)

const becaUnBoton = filas.filter((f) => f.estrategia.unBoton && f.finales.beca > 0)
const filaAleatoria = filas.find((f) => f.estrategia === aleatoria)!
const apruebaAleatoria = (filaAleatoria.finales.beca + filaAleatoria.finales.aprobado) / partidas
const mejorMixta = filas
  .filter((f) => !f.estrategia.unBoton && f.estrategia !== aleatoria)
  .reduce((mejor, f) => (f.finales.beca > mejor.finales.beca ? f : mejor))

const criterios: [string, boolean][] = [
  [
    `Ninguna estrategia de un botón obtiene Beca${
      becaUnBoton.length
        ? ` (falla: ${becaUnBoton.map((f) => f.estrategia.nombre).join(', ')})`
        : ''
    }`,
    becaUnBoton.length === 0,
  ],
  [
    `La aleatoria aprueba menos de la mitad (${pct(apruebaAleatoria * partidas)})`,
    apruebaAleatoria < 0.5,
  ],
  [
    `Una estrategia mixta llega a Beca (${mejorMixta.estrategia.nombre}: ${pct(mejorMixta.finales.beca)})`,
    mejorMixta.finales.beca > 0,
  ],
]

// Dificultad: las mismas estrategias con eventos, por nivel y número de cursos.
const NIVELES = Object.keys(BALANCE.dificultades) as DificultadId[]
const muestra = ESTRATEGIAS.filter((est) =>
  ['solo balanceada (reposo)', 'plan fijo', 'adaptativa variada (zona verde)'].includes(est.nombre),
)
const porNivel: Record<string, Record<string, string>> = {}
const aprueba: Record<string, number> = {}
for (const cursos of [3, 4]) {
  for (const nivel of [null, ...NIVELES]) {
    for (const estrategia of muestra) {
      let ok = 0
      let beca = 0
      let ovr = 0
      let eventos = 0
      for (let semilla = 1; semilla <= partidas; semilla++) {
        const r = jugar(estrategia, semilla, cursos, nivel)
        if (r.final === 'beca') beca++
        if (r.final === 'beca' || r.final === 'aprobado') ok++
        ovr += r.ovr
        eventos += r.eventos
      }
      const clave = `${cursos} cursos · ${nivel ?? 'sin eventos'}`
      porNivel[clave] ??= { eventos: (eventos / partidas).toFixed(1) }
      porNivel[clave][estrategia.nombre] =
        `${pct(ok)} aprueba · ${pct(beca)} beca · ${(ovr / partidas).toFixed(0)}`
      if (estrategia.nombre.startsWith('adaptativa')) aprueba[`${cursos}:${nivel}`] = ovr / partidas
    }
  }
}
console.log('\nDificultad y eventos (aprueba · beca · rendimiento medio)')
console.table(porNivel)

for (const cursos of [3, 4]) {
  const [relajado, normal, exigente] = NIVELES.map((n) => aprueba[`${cursos}:${n}`]!)
  criterios.push([
    `Con ${cursos} cursos, el rendimiento baja de Relajado a Exigente (${relajado!.toFixed(1)} > ${normal!.toFixed(1)} > ${exigente!.toFixed(1)})`,
    relajado! > normal! && normal! > exigente!,
  ])
}

console.log('\nCriterios de balance')
for (const [texto, cumple] of criterios) console.log(`${cumple ? '  OK  ' : ' FALLA'}  ${texto}`)
process.exitCode = criterios.every(([, cumple]) => cumple) ? 0 : 1
