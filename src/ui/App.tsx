import { useJuego } from '../store/juego.ts'
import { Dashboard } from './Dashboard.tsx'
import { Inicio } from './Inicio.tsx'
import { PantallaFinal } from './PantallaFinal.tsx'
import './estilos.css'

export function App() {
  const estado = useJuego((s) => s.estado)
  if (!estado) return <Inicio />
  if (estado.fase === 'fin') return <PantallaFinal estado={estado} />
  return <Dashboard estado={estado} />
}
