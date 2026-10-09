import { useId } from 'react'
import { zonaDe } from '../core/simulacion.ts'
import { BALANCE } from '../data/balance.ts'
import { conSigno, ZONAS } from './textos.ts'

interface Props {
  estres: number
  /** Estrés al cierre de la semana anterior, para mostrar cuánto cambió. */
  previo?: number
}

// Geometría del dibujo: el cerebro ocupa de y = 8 (100 % de estrés) a y = 92 (0 %).
const ARRIBA = 8
const ALTO = 84
const y = (estres: number) => ARRIBA + ALTO * (1 - estres / BALANCE.estresMax)

const CONTORNO =
  'M30 80 C12 80 6 64 14 54 C4 44 12 26 28 26 C32 10 52 6 62 16 C74 6 96 12 98 28 ' +
  'C112 32 116 50 106 60 C112 74 100 86 86 82 C80 92 62 92 58 82 C50 90 34 90 30 80 Z'
const SURCOS =
  'M60 17 C55 32 66 44 60 58 C56 68 62 74 58 82 M26 42 C36 37 44 45 39 54 ' +
  'M83 30 C76 40 87 47 80 57 M38 68 C46 62 53 67 49 74 M90 64 C83 67 85 74 78 74 ' +
  'M40 22 C44 28 40 34 46 38 M74 20 C70 26 76 30 72 36'

/** Cerebro que se llena de estrés: el nivel sube con el estrés y toma el color de la zona. */
export function BarraEstres({ estres, previo }: Props) {
  const recorte = useId()
  const zona = zonaDe(estres)
  const { verde, amarilla } = BALANCE.zonas
  const crisis = BALANCE.crisis.umbralDisparo
  const cambio = previo === undefined ? 0 : estres - previo

  return (
    <div className="estres">
      <svg
        className="cerebro"
        viewBox="0 0 120 100"
        role="progressbar"
        aria-label="Estrés"
        aria-valuemin={BALANCE.estresMin}
        aria-valuemax={BALANCE.estresMax}
        aria-valuenow={estres}
        aria-valuetext={`${estres} %, zona ${ZONAS[zona]}`}
      >
        <clipPath id={recorte}>
          <path d={CONTORNO} />
        </clipPath>
        <g clipPath={`url(#${recorte})`}>
          <rect className="banda verde" x="0" width="120" y={y(verde.hasta)} height={ALTO} />
          <rect
            className="banda amarilla"
            x="0"
            width="120"
            y={y(amarilla.hasta)}
            height={y(verde.hasta) - y(amarilla.hasta)}
          />
          <rect
            className="banda roja"
            x="0"
            width="120"
            y={ARRIBA}
            height={y(amarilla.hasta) - ARRIBA}
          />
          <rect
            className={`nivel ${zona}`}
            x="0"
            width="120"
            y={ARRIBA}
            height={ALTO + 10}
            style={{ transform: `translateY(${y(estres) - ARRIBA}px)` }}
          />
        </g>
        <path className="surcos" d={SURCOS} />
        <path className="contorno" d={CONTORNO} />
        <line className="linea-crisis" x1="2" x2="118" y1={y(crisis)} y2={y(crisis)} />
      </svg>

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
        <small>Línea punteada: crisis en {crisis} %</small>
      </div>
    </div>
  )
}
