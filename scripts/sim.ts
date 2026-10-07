// Bot de balance: simula partidas completas por estrategia, resume los finales
// y comprueba los criterios de balance de REGLAS.md.
// Uso: npm run sim -- [partidas por estrategia] [ruta.del.balance=valor ...]
// Ejemplo para probar un ajuste sin tocar balance.ts:
//   npm run sim -- 10000 decisiones.balanceada.estres=2 crisis.alivioReposo=30

import {
  aplicarDecisiones,
  crearPartida,
  entregasRestantes,
  parcialDeSemana,
  resolverCrisis,
  resultado,
  type Estado,
  type FinalId,
  type OpcionCrisis,
} from '../src/core/simulacion.ts'
import { siguiente } from '../src/core/rng.ts'
import { BALANCE, type DecisionId } from '../src/data/balance.ts'

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

const NOMBRES = ['Cálculo', 'Programación', 'Física', 'Redacción']
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
const adaptativa = (nombre: string, techo: number): Estrategia => ({
  nombre,
  unBoton: false,
  decidir: (e) => {
    const esParcial = parcialDeSemana(e.semana) !== -1
    const restantes = entregasRestantes(e.semana)
    let estres = e.estres
    const cabe = (d: DecisionId) => estres + BALANCE.decisiones[d].estres <= techo
    return e.asignaturas.map((a) => {
      const faltanEntregas = BALANCE.entregasRegularidad - a.ent
      let decision: DecisionId = 'salud'
      if (!esParcial && faltanEntregas > 0 && faltanEntregas >= restantes - 1) {
        decision = 'balanceada'
      } else if (a.horTramo < BALANCE.nota.horObjetivo && cabe('intensivo')) {
        decision = 'intensivo'
      } else if (!esParcial && faltanEntregas > 0 && cabe('balanceada')) {
        decision = 'balanceada'
      }
      estres += BALANCE.decisiones[decision].estres
      return decision
    })
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
  adaptativa('adaptativa (zona amarilla)', BALANCE.zonas.amarilla.hasta),
]

function jugar(estrategia: Estrategia, semilla: number) {
  // El azar de la estrategia usa un flujo propio para no alterar el de la partida.
  let rng = semilla ^ 0x5bd1e995
  const azar = () => {
    let valor: number
    ;[valor, rng] = siguiente(rng)
    return valor
  }
  let e = crearPartida(semilla, NOMBRES)
  let crisis = 0
  while (e.fase !== 'fin') {
    if (e.fase === 'crisis') {
      crisis++
      e = resolverCrisis(e, estrategia.crisis(e, azar))
    } else {
      e = aplicarDecisiones(e, estrategia.decidir(e, azar))
    }
  }
  const perdidas = e.historial.filter((r) => r.perdida !== null).length
  return { ...resultado(e), crisis, perdidas }
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

console.log(`Partidas por estrategia: ${partidas} · asignaturas: ${NOMBRES.length}\n`)
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

console.log('\nCriterios de balance')
for (const [texto, cumple] of criterios) console.log(`${cumple ? '  OK  ' : ' FALLA'}  ${texto}`)
process.exitCode = criterios.every(([, cumple]) => cumple) ? 0 : 1
