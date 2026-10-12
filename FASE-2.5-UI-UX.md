# UniversityLife — Fase 2.5: sistema visual y cards de decisión

Especificación de la renovación visual y de experiencia. No cambia ninguna regla del juego. Parte de una propuesta inicial de UI/UX, corregida con lo aprendido en las pruebas con jugadores y con el estado real del código.

Si algo de este documento contradice a [REGLAS.md](REGLAS.md) o a [src/data/balance.ts](src/data/balance.ts), prevalecen esos archivos. El contexto general del proyecto está en [CONTEXTO.md](CONTEXTO.md).

## 1. Objetivo

Que UniversityLife deje de parecer un panel funcional y se sienta como un juego de decisiones con identidad académica, sin perder nada de lo que hoy se entiende y sin alargar la partida.

En concreto:

- Una dirección visual propia: paleta, tipografía, componentes.
- Las decisiones semanales presentadas como cards que explican la acción y su efecto.
- Las tres pantallas (inicio, semana, cierre) con el mismo sistema visual.

## 2. Qué no cambia

- **Reglas, balance y finales.** Ningún número ni condición.
- **Arquitectura.** `src/core` sigue sin importar React, Zustand, `src/ui` ni `src/store`; los números viven en `balance.ts`; la interfaz no recalcula reglas, se las pide al núcleo.
- **Una pantalla por semana.** Planificar, revisar y confirmar ocurren en la misma pantalla.
- **Duración.** Una partida sigue durando 10–15 minutos.
- **Lo ya validado con jugadores** (sección 6).

## 3. Dirección visual

### Concepto: campus moderno con claridad de simulador

Debe sentirse académica sin ser infantil, estratégica sin ser corporativa, y moderna con un punto lúdico. No depende de personajes ni de ilustraciones grandes; el único elemento ilustrado es el cerebro del indicador de estrés.

### Paleta

Hipótesis de partida para prototipar.

| Nombre | Hex | Uso |
|---|---|---|
| Marfil | `#F7F5EF` | Fondo principal |
| Blanco cálido | `#FFFFFF` | Superficie de las cards |
| Azul tinta | `#23354D` | Títulos, texto y navegación |
| Azul claro | `#DCE8F2` | Paneles informativos y selección suave |
| Verde salvia | `#78977B` | Relleno de zona verde y progreso favorable |
| Ámbar | `#D9A441` | Relleno de zona amarilla y avisos |
| Coral | `#D96C62` | Relleno de zona roja, crisis y peligro |

Los tres colores de zona tienen poco contraste sobre marfil (aproximadamente entre 2:1 y 3:1), así que **solo se usan como relleno**. Para texto e iconos de zona hacen falta variantes oscuras:

| Zona | Relleno | Texto (propuesta) |
|---|---|---|
| Verde | `#78977B` | `#3F6B45` |
| Amarilla | `#D9A441` | `#8A5A00` |
| Roja | `#D96C62` | `#B23B30` |

Los valores de texto son una propuesta calculada a mano; hay que comprobarlos con una herramienta de contraste (mínimo 4.5:1 sobre marfil y sobre blanco).

Reglas de uso:

- El significado de los colores de zona lo fija el juego: verde hasta 40 de estrés, amarilla de 41 a 75, roja desde 76. Ningún color decorativo puede contradecirlo.
- Nunca solo color: cada estado lleva además cifra, etiqueta o icono.
- Los tres rellenos tienen luminosidad parecida y se distinguen mal con daltonismo; por eso la etiqueta de zona es obligatoria.
- Bordes discretos y sombras moderadas. Sin gradientes decorativos.

### Tipografía

Una sola familia para todo: **Inter**, con pesos distintos para títulos, cifras y texto. Si en el prototipo los títulos quedan planos, se prueba Manrope solo para títulos y cifras, pero no como punto de partida: dos familias tan parecidas aportan poco y hay que cargar las dos.

Las fuentes se alojan en el proyecto; no se cargan de servicios externos.

### Referencias

Para estudiar patrones, no para copiar:

- **Reigns y Yes, Your Grace:** una acción, su coste y su consecuencia, dichos en pocas palabras.
- **Two Point Campus:** identidad universitaria con tono lúdico y claro.
- **Plantillas de estudiante de Notion:** cursos, trabajos y fechas ordenados.

## 4. Modelo de interacción: cards de decisión

Cada acción disponible se presenta como una card que dice qué es, para qué sirve y qué efecto tiene esta semana.

### Contenido de una card

- Icono y nombre de la acción.
- Una línea sobre la intención ("muchas horas para subir la nota").
- Efectos con unidades: horas de estudio, trabajo entregado, estrés.
- Estado seleccionado claramente distinto.
- Selección por clic o teclado, con foco visible.

Los efectos se obtienen de `efectoDecision` del núcleo, que ya aplica la zona de estrés, la semana de parcial y la rutina. Ningún componente escribe `+14 h` o `−6 estrés` como constante.

### La decisión abierta: cuántos cursos se ven a la vez

Es la decisión de diseño más importante de la fase y se resuelve prototipando dos variantes de la pantalla semanal con la misma información:

| | Variante A — todos los cursos visibles | Variante B — un curso cada vez |
|---|---|---|
| Qué se ve | Una fila por curso con sus tres cards compactas | Un curso en grande con tres cards amplias, y navegación "Curso 2 de 4" |
| A favor | Se comparan los cursos entre sí; la rutina y el estrés total se ven al instante; menos pasos | Menos elementos en pantalla; cada decisión tiene más protagonismo |
| En contra | Hasta 12 cards a la vez con 4 cursos | Oculta la comparación entre cursos; la rutina no se ve hasta el final; más clics por semana |

**Punto de partida recomendado:** variante A en escritorio y variante B solo en pantallas estrechas.

El motivo es que las decisiones de los cursos no son independientes. El estrés es uno solo, la rutina depende de que todas las decisiones coincidan, y lo que el jugador decide de verdad es cómo repartir el esfuerzo entre cursos. Un flujo de una decisión cada vez funciona en Reigns porque allí cada decisión se resuelve sola.

Las dos variantes se comparan con estas medidas:

- Clics y segundos por semana.
- Si el jugador detecta la rutina antes de confirmar.
- Si sabe decir qué curso va peor sin navegar.
- Duración total de la partida.

### Lo que debe cumplir cualquiera de las dos

- Elegir una card no resuelve la semana.
- Las elecciones se pueden cambiar hasta confirmar.
- El atajo para aplicar la misma acción a todos los cursos se mantiene, con el coste de la rutina a la vista.
- No se puede confirmar hasta haber decidido todos los cursos.
- Un doble clic en confirmar avanza una sola semana.
- No hay decisiones posibles durante una crisis ni al terminar la partida.
- Todo es operable con teclado.

## 5. Flujo de una semana

Todo ocurre en la pantalla semanal, en este orden de lectura:

1. **Situación:** semana, próximo parcial, calendario y estrés actual.
2. **Planificar:** una card de acción por curso.
3. **Revisar:** un resumen que se actualiza al elegir, sin cambiar de pantalla, con el estrés previsto y su zona, la nota estimada y los trabajos de cada curso, y los avisos que correspondan (rutina, crisis, riesgo de colapso, semana de parcial).
4. **Confirmar:** un botón principal que resuelve la semana.

Al confirmar se ejecuta el núcleo y la pantalla pasa a la semana siguiente con una transición breve. Los indicadores que cambiaron lo hacen de forma visible.

**Resultados aparte solo cuando hay algo que contar.** En una semana normal no aparece ningún panel de resultados: el indicador de estrés, las cards y el calendario ya lo muestran. El aviso de lo ocurrido aparece únicamente tras un parcial, una crisis o una semana perdida. La primera ronda de pruebas se quejó de exceso de información y esa fue la corrección; no se revierte.

Las semanas de parcial (5, 10 y 15) sí merecen un tratamiento especial: aviso previo en la pantalla semanal y revelación de las notas al cerrar.

La nota estimada se presenta siempre como estimación. La nota real incluye una variación aleatoria y puede haber bloqueo mental en zona roja.

## 6. Elementos ya validados que se conservan

Cada uno salió de una ronda de pruebas. Se pueden rediseñar, no eliminar.

| Elemento | Qué hace | Dónde está |
|---|---|---|
| Pasos numerados | Indican por dónde empezar y cuándo confirmar | `PanelDecision`, `Inicio` |
| "Cómo se juega" antes de empezar | Explica las tres acciones, cómo se aprueba y los 9 trabajos | `ComoSeJuega`, `Inicio` |
| Indicador de estrés con forma de cerebro | Nivel, zona, cambio semanal y marca de crisis | `BarraEstres` |
| Indicador de trabajos por curso | Entregados frente a los 9 necesarios y cuántas semanas se pueden saltar | `PanelDecision` |
| Nota estimada por curso | Antes y después de la decisión elegida | `PanelDecision` |
| Exigencia de cada curso | Etiqueta y horas por parcial | `PanelDecision` |
| Aviso de rutina | Premio y castigo de elegir lo mismo en todos | `PanelDecision` |
| Avisos de crisis y de colapso | Antes de confirmar la semana | `PanelDecision` |
| Calendario navegable | Qué se hizo cada semana, zona al cierre y detalle al pulsar | `Calendario`, `ResumenSemana` |
| Cuenta atrás al parcial | "Parcial 2 en 4 semanas" | `Dashboard` |
| Modal de crisis | Bloquea la pantalla, explica el coste de cada opción y pide confirmar el abandono | `ModalCrisis` |
| Nombres en pantalla | Curso, trabajo, Estudiar a fondo, Trabajo semanal, Descansar | `textos.ts` |

## 7. Las tres pantallas

### Inicio

Parte de la pantalla actual, que ya tiene lo necesario:

- Título y una frase que sitúa el juego.
- "Cómo se juega", legible sin abrumar.
- Elección de cuántos cursos llevar (2, 3 o 4).
- Botón para empezar.

Objetivo de la fase: que se sienta como el inicio de un cuatrimestre y no como un formulario, y que "Cómo se juega" no empuje el botón de empezar fuera de la vista.

### Semana

Es la pantalla prioritaria y la primera que se prototipa. Contiene lo descrito en las secciones 4, 5 y 6.

### Cierre

Objetivo: que el resultado se entienda y se sienta merecido.

- Final obtenido, con presentación propia para cada uno de los cinco (Beca, Aprobado, Aprobado parcial, Desaprobado, Abandono).
- Nota de cada parcial, promedio, final y trabajos por curso.
- Evolución del estrés a lo largo de las semanas; los datos ya están en el historial de la partida.
- Por qué se obtuvo o no la beca. Requiere una función nueva en el núcleo que devuelva las condiciones cumplidas e incumplidas; la interfaz no debe deducirlas.
- Semilla de la partida y botón para jugar de nuevo.

## 8. Componentes

El proyecto usa nombres en español. Se adaptan los componentes existentes antes de crear otros.

| Componente | Estado | Trabajo en esta fase |
|---|---|---|
| `Inicio` | Existe | Rediseño |
| `ComoSeJuega` | Existe | Rediseño; reutiliza las cards de acción |
| `Dashboard` | Existe | Nueva composición de la pantalla semanal |
| `Calendario` | Existe | Restyling |
| `BarraEstres` | Existe | Restyling; conserva el cerebro |
| `PanelDecision` | Existe | Se divide: card de acción, fila o vista de curso, y resumen |
| `ResumenSemana` | Existe | Restyling; revelación de notas en parciales |
| `ModalCrisis` | Existe | Restyling |
| `PantallaFinal` | Existe | Rediseño; gráfico de estrés y razones de la beca |
| `CardDecision` | Nuevo | Acción, intención, efectos y selección |
| `ResumenDecisiones` | Nuevo | Estrés previsto, avisos y confirmación |

El estado de la partida sigue en `src/store`; el estado de selección y de navegación entre cursos es local de la interfaz.

Los estilos pasan de un único CSS con valores sueltos a variables de diseño (color, tipografía, espaciado, radios, sombras, foco) usadas por todos los componentes. No se añade ninguna biblioteca de UI.

## 9. Animaciones

Cortas y con función:

- Seleccionar una card.
- Actualizar un indicador que cambió.
- Confirmar la semana y pasar a la siguiente.
- Revelar las notas de un parcial.
- Entrar en crisis.
- Presentar el final.

Se evita animar todo a la vez, las transiciones que ralenticen una partida de 10–15 minutos y cualquier estado que solo se entienda por el movimiento. Se respeta la preferencia de movimiento reducido del sistema, como ya hace el CSS actual.

## 10. Plan de trabajo

1. **Inspeccionar.** Leer `REGLAS.md`, `balance.ts`, `src/ui`, `src/store` y los tests de interfaz antes de tocar nada.
2. **Variables de diseño.** Definir paleta, tipografía, espaciado y foco como variables CSS y aplicarlas a la interfaz actual. Esto ya permite juzgar la dirección visual sin cambiar el flujo.
3. **Prototipar las dos variantes** de la pantalla semanal (sección 4) y compararlas con las medidas indicadas.
4. **Elegir variante** y construir `CardDecision` y `ResumenDecisiones`.
5. **Extender** el sistema a inicio, parciales, crisis y cierre.
6. **Verificar** (sección 11) y probar con jugadores nuevos.

Los tests de interfaz actuales están ligados al flujo de hoy: hay que reescribir los que cambien de interacción, sin debilitar lo que comprueban (confirmar deshabilitado, doble clic, bloqueo en crisis, confirmación de abandono, aviso de rutina).

## 11. Criterios de aceptación

- [ ] Hay una dirección visual coherente, definida con variables de diseño.
- [ ] Las decisiones semanales se presentan como cards con efectos reales del núcleo.
- [ ] Se eligió la variante de la pantalla semanal comparando las dos con datos.
- [ ] El jugador puede cambiar sus decisiones antes de confirmar y ve el resumen sin cambiar de pantalla.
- [ ] Se conservan todos los elementos de la sección 6.
- [ ] Los estados de estrés y los parciales se entienden sin depender del color; el texto de zona cumple 4.5:1 de contraste.
- [ ] Inicio, semana y cierre comparten el sistema visual.
- [ ] Funciona en escritorio y en pantallas estrechas, y con teclado.
- [ ] Una partida completa sigue durando entre 10 y 15 minutos, y una semana no exige más clics que hoy en la variante elegida para escritorio.
- [ ] No cambió ninguna regla: los tests del núcleo y el bot de balance dan los mismos resultados.
- [ ] Pasan lint, tipos, tests, cobertura y build.
- [ ] Al menos tres personas que no conocían el juego terminan una partida sin ayuda y explican sus notas.

## 12. Decisiones abiertas

- **Variante de la pantalla semanal,** que se decide con el prototipo.
- **"Semana 4 de 16" o "de 15".** Hoy se muestra 16 (15 con decisión más el cierre). Se mantiene 16 salvo que el prototipo demuestre que confunde.
- **El nombre "Trabajo semanal",** provisional desde la Fase 2.
- **Cuánto detalle dar en la estimación** antes de confirmar: solo la nota, o también las horas acumuladas frente a las que pide el curso.
- **Iconos:** qué conjunto usar y con qué licencia.

## 13. Fuera de alcance

- Cambios en fórmulas de notas, estrés, crisis, aprobación o beca.
- Niveles de dificultad, ventajas por rendimiento y duración configurable.
- Eventos aleatorios, recuperatorio, retiro de curso y semestre sabático.
- Guardado de partida, backend, cuentas y rankings.
- Monedas, experiencia, personajes, mascotas o narrativa.
