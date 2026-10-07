import { useState } from 'react'
import { BALANCE } from '../data/balance.ts'
import { NOMBRES_ASIGNATURAS, useJuego } from '../store/juego.ts'

const CANTIDADES = [2, 3, 4].filter(
  (n) => n >= BALANCE.asignaturasMin && n <= BALANCE.asignaturasMax,
)

export function Inicio() {
  const nueva = useJuego((s) => s.nueva)
  const [cantidad, setCantidad] = useState<number>(BALANCE.asignaturasPorDefecto)

  return (
    <main className="pantalla">
      <h1>UniversityLife</h1>
      <p>
        Cursas un cuatrimestre de {BALANCE.semanasTotales} semanas. Cada semana decides, asignatura
        por asignatura, si estudias a fondo, llevas la cursada al día o descansas.
      </p>
      <ul>
        <li>
          <strong>Horas de estudio:</strong> suben la nota de los parciales de las semanas{' '}
          {BALANCE.semanasParcial.join(', ')}.
        </li>
        <li>
          <strong>Entregas:</strong> necesitas {BALANCE.entregasRegularidad} de{' '}
          {BALANCE.entregasPosibles} en cada asignatura para mantener la regularidad.
        </li>
        <li>
          <strong>Estrés:</strong> es uno solo para todo. Si sube, estudias peor; si llega a{' '}
          {BALANCE.crisis.umbralDisparo}, entras en crisis.
        </li>
      </ul>
      <p>Cada asignatura se aprueba con promedio {BALANCE.beca.parcialMin} o más y regularidad.</p>

      <fieldset>
        <legend>¿Cuántas asignaturas cursas?</legend>
        {CANTIDADES.map((n) => (
          <label key={n} className="opcion">
            <input
              type="radio"
              name="cantidad"
              checked={cantidad === n}
              onChange={() => setCantidad(n)}
            />
            {n} — {NOMBRES_ASIGNATURAS.slice(0, n).join(', ')}
          </label>
        ))}
        <p className="nota">
          Menos asignaturas generan menos estrés. La beca exige cursar{' '}
          {BALANCE.beca.asignaturasRequeridas}.
        </p>
      </fieldset>

      <button type="button" className="principal" onClick={() => nueva(cantidad)}>
        Empezar
      </button>
    </main>
  )
}
