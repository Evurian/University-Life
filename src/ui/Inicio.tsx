import { useState } from 'react'
import { BALANCE, type DificultadId } from '../data/balance.ts'
import { NOMBRES_ASIGNATURAS, useJuego } from '../store/juego.ts'
import { ComoSeJuega } from './ComoSeJuega.tsx'
import { DIFICULTADES } from './textos.ts'

const CANTIDADES = [3, 4].filter((n) => n >= BALANCE.asignaturasMin && n <= BALANCE.asignaturasMax)
const NIVELES = Object.keys(BALANCE.dificultades) as DificultadId[]

export function Inicio() {
  const nueva = useJuego((s) => s.nueva)
  const [cantidad, setCantidad] = useState<number>(BALANCE.asignaturasPorDefecto)
  const [dificultad, setDificultad] = useState<DificultadId>(BALANCE.dificultadPorDefecto)

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
              <span>Beca con rendimiento {BALANCE.beca.ovrMinPorCursos[n]}</span>
              <small>{NOMBRES_ASIGNATURAS.slice(0, n).join(', ')}</small>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>
          <span className="paso activo">2</span> Elige la dificultad
        </legend>
        <div className="tarjetas">
          {NIVELES.map((nivel) => (
            <label key={nivel} className={`tarjeta ${dificultad === nivel ? 'elegida' : ''}`}>
              <input
                type="radio"
                name="dificultad"
                checked={dificultad === nivel}
                onChange={() => setDificultad(nivel)}
              />
              <strong>{BALANCE.dificultades[nivel].nombre}</strong>
              <small>{DIFICULTADES[nivel]}</small>
            </label>
          ))}
        </div>
      </fieldset>

      <p className="llamada">
        <span className="paso activo">3</span>
        <button
          type="button"
          className="principal lista"
          onClick={() => nueva(cantidad, dificultad)}
        >
          Empezar
        </button>
      </p>
    </main>
  )
}
