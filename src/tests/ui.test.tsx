// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { crearPartida } from '../core/simulacion.ts'
import { BALANCE } from '../data/balance.ts'
import { NOMBRES_ASIGNATURAS, useJuego } from '../store/juego.ts'
import { App } from '../ui/App.tsx'

const clic = (nombre: string | RegExp) =>
  fireEvent.click(screen.getByRole('button', { name: nombre }))
const titulo = () => screen.getByRole('heading', { level: 1 }).textContent
const confirmar = () => screen.getByRole('button', { name: 'Confirmar semana' })

/** Deja la partida a una semana balanceada de la crisis. */
function alBordeDeLaCrisis() {
  useJuego.setState({ estado: { ...crearPartida(1, BALANCE.asignaturas), estres: 79 } })
  render(<App />)
  clic('Trabajo semanal en todos')
}

beforeEach(() => useJuego.setState({ estado: null, resumen: [] }))
afterEach(cleanup)

describe('interfaz', () => {
  it('permite jugar una partida completa hasta la pantalla final', () => {
    render(<App />)
    clic('Empezar')
    expect(titulo()).toBe('Semana 1 de 16')

    let pasos = 0
    while (!screen.queryByText(/Fin del cuatrimestre/)) {
      if (screen.queryByRole('dialog')) clic('Reposo forzado')
      else {
        clic('Trabajo semanal en todos')
        fireEvent.click(confirmar())
      }
      expect(++pasos).toBeLessThan(40)
    }

    expect(screen.getByText(/Semilla: \d+/)).toBeTruthy()
    expect(screen.getAllByRole('row')).toHaveLength(1 + 4)
    clic('Jugar de nuevo')
    expect(titulo()).toBe('UniversityLife')
  })

  it('respeta la cantidad de asignaturas elegida al empezar', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('radio', { name: /^2/ }))
    clic('Empezar')
    expect(useJuego.getState().estado?.asignaturas).toHaveLength(2)
    expect(screen.queryByRole('group', { name: 'Física' })).toBeNull()
  })

  it('no deja confirmar hasta decidir todas las asignaturas', () => {
    useJuego.getState().nueva(4, 1)
    render(<App />)
    expect(confirmar()).toHaveProperty('disabled', true)

    for (const nombre of NOMBRES_ASIGNATURAS.slice(0, 3)) {
      const fila = screen.getByRole('group', { name: nombre })
      fireEvent.click(within(fila).getByRole('button', { name: 'Estudiar a fondo' }))
    }
    expect(confirmar()).toHaveProperty('disabled', true)
    expect(screen.getByText(/faltan cursos por decidir/)).toBeTruthy()

    const ultima = screen.getByRole('group', { name: 'Redacción' })
    fireEvent.click(within(ultima).getByRole('button', { name: 'Descansar' }))
    expect(confirmar()).toHaveProperty('disabled', false)
    // 20 + 5 + 5 + 5 − 6
    expect(screen.getByText(/Estrés: 20 % →/).textContent).toContain('29 %')
  })

  it('muestra cómo cambia la nota estimada al elegir una decisión', () => {
    useJuego.getState().nueva(4, 1)
    render(<App />)
    const fila = screen.getByRole('group', { name: 'Cálculo' })
    expect(fila.textContent).toContain('5.0')
    fireEvent.click(within(fila).getByRole('button', { name: 'Estudiar a fondo' }))
    // Cálculo exige 46 h: 15.4 h en zona verde dan 4 + 16 · (15.4 / 46)^0.7 + 1
    expect(fila.textContent).toContain('5.0 → 12.4')
    fireEvent.click(within(fila).getByRole('button', { name: 'Trabajo semanal' }))
    expect(fila.textContent).toContain('0 → 1 / 9')
    fireEvent.click(within(fila).getByRole('button', { name: 'Descansar' }))
    expect(fila.textContent).toContain('5.0 → 5.0')
  })

  it('avisa de la rutina al elegir lo mismo en todas y deja de avisar al variar', () => {
    useJuego.getState().nueva(4, 1)
    render(<App />)
    clic('Estudiar a fondo en todos')
    expect(screen.getByText(/Semana de rutina/)).toBeTruthy()
    // 20 + 4 · 5 − 2 de la rutina
    expect(screen.getByText(/Estrés: 20 % →/).textContent).toContain('38 %')
    const calculo = screen.getByRole('group', { name: 'Cálculo' })
    const conRutina = calculo.textContent

    const redaccion = screen.getByRole('group', { name: 'Redacción' })
    fireEvent.click(within(redaccion).getByRole('button', { name: 'Trabajo semanal' }))
    expect(screen.queryByText(/Semana de rutina/)).toBeNull()
    expect(screen.getByText(/Estrés: 20 % →/).textContent).toContain('37 %')
    expect(calculo.textContent).not.toBe(conRutina)
  })

  it('un doble clic en confirmar avanza una sola semana', () => {
    useJuego.getState().nueva(4, 1)
    render(<App />)
    clic('Descansar en todos')
    fireEvent.click(confirmar())
    fireEvent.click(confirmar())
    expect(titulo()).toBe('Semana 2 de 16')
    expect(useJuego.getState().estado?.historial).toHaveLength(1)
  })

  it('una semana normal no genera aviso; un parcial muestra sus notas', () => {
    useJuego.getState().nueva(4, 1)
    render(<App />)
    for (let semana = 1; semana <= 4; semana++) {
      clic('Trabajo semanal en todos')
      fireEvent.click(confirmar())
      expect(screen.queryByRole('region', { name: 'Qué pasó' })).toBeNull()
    }
    clic('Trabajo semanal en todos')
    fireEvent.click(confirmar())

    const resumen = screen.getByRole('region', { name: 'Qué pasó' })
    expect(resumen.textContent).toContain('Parcial 1')
    expect(within(resumen).getAllByRole('row')).toHaveLength(1 + 4)
    const fila = screen.getByRole('group', { name: 'Cálculo' })
    expect(fila.textContent).toContain('Parciales:')
  })

  it('el calendario marca la semana en curso y las ya cerradas', () => {
    useJuego.getState().nueva(4, 1)
    render(<App />)
    expect(screen.getByText('Parcial 1 en 4 semanas')).toBeTruthy()
    clic('Descansar en todos')
    fireEvent.click(confirmar())

    const calendario = screen.getByRole('list', { name: /Calendario/ })
    const semanas = within(calendario).getAllByRole('listitem')
    expect(semanas).toHaveLength(16)
    expect(within(semanas[0]!).getByRole('button').getAttribute('aria-label')).toContain(
      'cerró con estrés 0 %, zona Verde',
    )
    expect(semanas[1]?.getAttribute('aria-current')).toBe('step')
    expect(within(semanas[1]!).queryByRole('button')).toBeNull()
    expect(semanas[4]?.textContent).toContain('P1')
  })

  it('al pulsar una semana pasada muestra cómo fue', () => {
    useJuego.getState().nueva(4, 1)
    render(<App />)
    const redaccion = () => screen.getByRole('group', { name: 'Redacción' })
    clic('Estudiar a fondo en todos')
    fireEvent.click(within(redaccion()).getByRole('button', { name: 'Descansar' }))
    fireEvent.click(confirmar())
    clic('Trabajo semanal en todos')
    fireEvent.click(confirmar())

    clic(/^Semana 1,/)
    const detalle = screen.getByRole('region', { name: 'Semana 1' })
    expect(detalle.textContent).toContain('Cálculo: Estudiar a fondo')
    expect(detalle.textContent).toContain('Redacción: Descansar')
    expect(detalle.textContent).toContain('estrés 29 %')
    expect(detalle.textContent).not.toContain('rutina')

    clic(/^Semana 2,/)
    expect(screen.queryByRole('region', { name: 'Semana 1' })).toBeNull()
    expect(screen.getByRole('region', { name: 'Semana 2' }).textContent).toContain('rutina')
    clic('Cerrar')
    expect(screen.queryByRole('region', { name: 'Semana 2' })).toBeNull()
  })

  it('indica cuántos trabajos faltan y cuándo ya no se puede fallar', () => {
    const base = crearPartida(1, BALANCE.asignaturas)
    const asignaturas = base.asignaturas.map((a, i) => ({ ...a, ent: [9, 8, 7, 3][i]! }))
    useJuego.setState({ estado: { ...base, semana: 14, asignaturas } })
    render(<App />)
    const texto = (nombre: string) => screen.getByRole('group', { name: nombre }).textContent
    expect(texto('Cálculo')).toContain('Completos')
    expect(texto('Programación')).toContain('No puedes fallar ninguno más')
    expect(texto('Física')).toContain('Ya no alcanzas los 9')
    expect(texto('Redacción')).toContain('Ya no alcanzas los 9')
  })

  it('al empezar dice cuántas semanas con trabajo se pueden saltar', () => {
    useJuego.getState().nueva(4, 1)
    render(<App />)
    expect(screen.getByRole('group', { name: 'Cálculo' }).textContent).toContain(
      'Puedes saltarte 3 semanas',
    )
  })

  it('avisa antes de confirmar una semana que provoca crisis', () => {
    alBordeDeLaCrisis()
    expect(screen.getByRole('alert').textContent).toContain('entrarás en crisis')
  })

  it('avisa del riesgo de colapso cuando ya no habrá crisis que lo frene', () => {
    const estado = { ...crearPartida(1, BALANCE.asignaturas), estres: 79, crisisArmada: false }
    useJuego.setState({ estado })
    render(<App />)
    clic('Trabajo semanal en todos')
    expect(screen.getByRole('alert').textContent).toContain('colapsar')
    clic('Descansar en todos')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('la crisis abre un modal que bloquea las decisiones', () => {
    alBordeDeLaCrisis()
    fireEvent.click(confirmar())

    expect(screen.getByRole('dialog', { name: 'Crisis de estrés' })).toBeTruthy()
    expect(titulo()).toBe('Semana 1 de 16')
    expect(confirmar()).toHaveProperty('disabled', true)
    expect(screen.getByRole('button', { name: 'Descansar en todos' })).toHaveProperty(
      'disabled',
      true,
    )

    clic('Forzar la semana')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(useJuego.getState().estado?.historial[0]?.crisis).toBe('forzar')
  })

  it('el reposo anula la semana y lo explica en el resumen', () => {
    alBordeDeLaCrisis()
    fireEvent.click(confirmar())
    clic('Reposo forzado')
    expect(titulo()).toBe('Semana 2 de 16')
    expect(screen.getByRole('region', { name: 'Qué pasó' }).textContent).toContain(
      'la semana se anuló',
    )
    expect(useJuego.getState().estado?.asignaturas.every((a) => a.ent === 0)).toBe(true)
  })

  it('abandonar pide confirmación antes de terminar la partida', () => {
    alBordeDeLaCrisis()
    fireEvent.click(confirmar())

    clic('Abandonar la carrera')
    expect(useJuego.getState().estado?.fase).toBe('crisis')
    clic('Volver')
    expect(screen.getByRole('button', { name: 'Reposo forzado' })).toBeTruthy()

    clic('Abandonar la carrera')
    clic('Confirmar abandono')
    expect(titulo()).toBe('Abandono')
  })
})
