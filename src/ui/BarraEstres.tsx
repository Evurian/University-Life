import { zonaDe } from '../core/simulacion.ts'
import { BALANCE } from '../data/balance.ts'
import { conSigno, ZONAS } from './textos.ts'

interface Props {
  estres: number
  /** Estrés al cierre de la semana anterior, para mostrar cuánto cambió. */
  previo?: number
}

/** Termómetro vertical de estrés: el nivel sube con el estrés y toma el color de la zona. */
export function BarraEstres({ estres, previo }: Props) {
  const zona = zonaDe(estres)
  const { verde, amarilla } = BALANCE.zonas
  const crisis = BALANCE.crisis.umbralDisparo
  const cambio = previo === undefined ? 0 : estres - previo

  return (
    <div className="estres">
      <div className="termometro-marco">
        <span className="termometro-crisis" style={{ bottom: `${crisis}%` }} aria-hidden="true">
          Crisis {crisis}
        </span>
        <div
          className="termometro"
          role="progressbar"
          aria-label="Estrés"
          aria-orientation="vertical"
          aria-valuemin={BALANCE.estresMin}
          aria-valuemax={BALANCE.estresMax}
          aria-valuenow={estres}
          aria-valuetext={`${estres} %, zona ${ZONAS[zona]}`}
        >
          <span className="banda verde" style={{ bottom: 0, height: `${verde.hasta}%` }} />
          <span
            className="banda amarilla"
            style={{ bottom: `${verde.hasta}%`, height: `${amarilla.hasta - verde.hasta}%` }}
          />
          <span
            className="banda roja"
            style={{
              bottom: `${amarilla.hasta}%`,
              height: `${BALANCE.estresMax - amarilla.hasta}%`,
            }}
          />
          <span className={`mercurio ${zona}`} style={{ height: `${estres}%` }} />
          <span className="marca-crisis" style={{ bottom: `${crisis}%` }} />
        </div>
        <div className="termometro-escala" aria-hidden="true">
          {[BALANCE.estresMin, verde.hasta, amarilla.hasta, BALANCE.estresMax].map((valor) => (
            <span key={valor} style={{ bottom: `${valor}%` }}>
              {valor}
            </span>
          ))}
        </div>
      </div>

      <div className="estres-lectura">
        <span className="estres-titulo">Estrés</span>
        <strong className={`estres-valor zona ${zona}`}>{estres} %</strong>
        <span>
          Zona <span className={`zona ${zona}`}>{ZONAS[zona]}</span>
        </span>
        {cambio !== 0 && (
          <span className="estres-cambio">
            {cambio > 0 ? '▲' : '▼'} {conSigno(cambio)} esta semana
          </span>
        )}
      </div>
    </div>
  )
}
