import { useState } from 'react'
import { BALANCE } from '../data/balance.ts'
import { NOMBRES_ASIGNATURAS, useJuego } from '../store/juego.ts'
import { ComoSeJuega } from './ComoSeJuega.tsx'

const CANTIDADES = [2, 3, 4].filter(
  (n) => n >= BALANCE.asignaturasMin && n <= BALANCE.asignaturasMax,
)
const DIFICULTAD: Record<number, string> = { 2: 'Fácil', 3: 'Normal', 4: 'Difícil · opta a beca' }

export function Inicio() {
  const nueva = useJuego((s) => s.nueva)
  const [cantidad, setCantidad] = useState<number>(BALANCE.asignaturasPorDefecto)

  return (
    <main className="pantalla inicio">
      <h1>UniversityLife</h1>
      <p className="entrada">
        Sobrevive a un cuatrimestre: cada semana decides cuánto estudiar y cuánto descansar.
      </p>

      <section className="panel" aria-label="Cómo se juega">
        <h2>Cómo se juega</h2>
        <ComoSeJuega />
      </section>

      <fieldset>
        <legend>
          <span className="paso activo">1</span> Elige cuántos cursos llevas
        </legend>
        <div className="tarjetas">
          {CANTIDADES.map((n) => (
            <label key={n} className={`tarjeta ${cantidad === n ? 'elegida' : ''}`}>
              <input
                type="radio"
                name="cantidad"
                checked={cantidad === n}
                onChange={() => setCantidad(n)}
              />
              <strong>{n} cursos</strong>
              <span>{DIFICULTAD[n]}</span>
              <small>{NOMBRES_ASIGNATURAS.slice(0, n).join(', ')}</small>
            </label>
          ))}
        </div>
      </fieldset>

      <p className="llamada">
        <span className="paso activo">2</span>
        <button type="button" className="principal lista" onClick={() => nueva(cantidad)}>
          Empezar
        </button>
      </p>
    </main>
  )
}
