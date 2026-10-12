# UniversityLife — Reglas del MVP

Especificación de la Fase 0. Los tests de `src/core` se escriben contra este documento y los números viven en `src/data/balance.ts`. Si cambia una fórmula, se actualizan los dos.

Estado de cada regla: **Cerrada** (decidida), **Supuesto** (valor por defecto pendiente de confirmar) o **A calibrar** (se ajusta en la Fase 1 con el bot de balance).

## Nombres en pantalla

Este documento y el código usan términos internos; el jugador ve otros, más directos:

| Término interno | En pantalla |
|---|---|
| Asignatura | Curso |
| Entrega (ENT) | Trabajo entregado |
| Regularidad | Tener los 9 trabajos entregados |
| OVR | Rendimiento |
| Estudio Intensivo | Estudiar a fondo |
| Cursada Balanceada | Trabajo semanal |
| Priorizar Salud Mental | Descansar |

## Cómo se gana y cómo se pierde

El jugador cursa un cuatrimestre de 16 semanas con hasta 4 asignaturas. Cada semana elige, para cada asignatura, una de tres decisiones. Las decisiones mueven tres recursos: horas de estudio (HOR) y entregas (ENT), que son propias de cada asignatura, y el estrés, que es uno solo para el alumno. Las HOR suben la nota de los parciales, las ENT mantienen la regularidad y el estrés penaliza todo si se descontrola.

- **Se gana** aprobando todas las asignaturas; el mejor resultado es la beca.
- **Se pierde** desaprobando todas las asignaturas o abandonando en una crisis.

## 1. Alcance

| # | Regla | Valor | Estado |
|---|---|---|---|
| 1 | Duración de una partida | Un cuatrimestre | Cerrada |
| 2 | Asignaturas | 3 o 4 (ver regla 35) | Cerrada |
| 2a | Cantidad por partida | El jugador elige 3 o 4 al empezar; por defecto 4 | Cerrada |
| 2b | Diferencias entre asignaturas | Cada una exige distintas horas por parcial; ver tabla | Calibrada en Fase 2 |
| 3 | Finanzas como recurso | No | Cerrada |
| 4 | Eventos aleatorios | No | Cerrada |
| 5 | Duración objetivo | 10–15 minutos | Cerrada |

Asignaturas, en el orden en que se cursan (con 2 se cursan las dos primeras, etc.):

| Asignatura | Horas por parcial para la nota máxima | Exigencia |
|---|---|---|
| Cálculo | 46 | Exigente |
| Programación | 40 | Media |
| Física | 42 | Exigente |
| Redacción | 32 | Ligera |

## 2. Turno y calendario

| # | Regla | Valor | Estado |
|---|---|---|---|
| 6 | Semanas con decisión | 1 a 15; la 16 es solo cierre | Cerrada |
| 7 | Momento del parcial | Después de las decisiones de esa semana, con el estrés resultante | Cerrada |
| 8 | Entregas posibles por asignatura | 12: una por semana, salvo las semanas 5, 10 y 15 | Cerrada |
| 9 | Estrés inicial | 20 | A calibrar |

Parciales: semana 5 (Parcial 1), semana 10 (Parcial 2), semana 15 (Parcial 3). Todas las asignaturas rinden en las mismas semanas.

Orden de resolución de una semana:

1. El jugador asigna una decisión a cada asignatura y confirma.
2. Se aplican HOR y ENT de cada asignatura y se suma el estrés de todas.
3. Si el estrés cruza el umbral de crisis, se resuelve la crisis.
4. Si la semana es de parcial, se evalúa cada asignatura.
5. Se muestra el resumen y avanza la semana.

## 3. Recursos y decisiones

| # | Regla | Valor | Estado |
|---|---|---|---|
| 10 | Efecto de cada decisión | Ver tabla | Calibrada en Fase 2 |
| 10a | Rutina: la misma decisión en todas las asignaturas | −2 de estrés esa semana y horas ×0.80 | Calibrada en Fase 2 |
| 11 | HOR tras cada parcial | Se reinician a 0 en cada asignatura | Cerrada |
| 12 | Recuperación pasiva de estrés | 0 por semana | A calibrar |
| 13 | Zonas de estrés | Ver tabla | Cerrada |
| 14 | Multiplicador de HOR por zona | Ver tabla | A calibrar |

Efecto de una decisión sobre **una** asignatura:

| Decisión | HOR | ENT | Estrés |
|---|---|---|---|
| Estudio Intensivo | +14 | 0 | +5 |
| Cursada Balanceada | +6 | +1 | +2 |
| Priorizar Salud Mental | 0 | 0 | −6 |

- El estrés de la semana es la suma de las decisiones de todas las asignaturas. Con 4 asignaturas va de −24 (todas en salud) a +20 (todas en intensivo).
- Cursar menos asignaturas genera menos estrés: la cantidad funciona como nivel de dificultad.
- En semana de parcial no hay entrega: Cursada Balanceada da 0 ENT.
- **Rutina:** si todas las asignaturas reciben la misma decisión, la semana es más llevadera (−2 de estrés) pero se estudia en piloto automático (las horas de todas se multiplican por 0.80). No afecta a las entregas.

| Zona | Estrés | Multiplicador de HOR | Modificador en parcial |
|---|---|---|---|
| Verde | 0–40 | ×1.10 | +1 |
| Amarilla | 41–75 | ×0.85 | 0 |
| Roja | 76–100 | ×0.60 | −5 |

El multiplicador de HOR usa la zona en la que estaba el jugador **antes** de aplicar las decisiones de la semana, y es el mismo para todas las asignaturas. El estrés siempre se acota a 0–100.

## 4. Notas y resultado

| # | Regla | Valor | Estado |
|---|---|---|---|
| 15 | Fórmula de la nota | Ver abajo; se calcula por asignatura | A calibrar |
| 16 | Modificador por zona | +1 / 0 / −5 | A calibrar |
| 17 | Bloqueo mental | En zona roja, 20 % de probabilidad por asignatura; la nota se divide entre 2 | A calibrar |
| 18 | Ruido en la nota | Uniforme en ±1, con semilla, independiente por asignatura | Cerrada |
| 19 | Escala y nota de aprobación | Escala 0–20. Una asignatura se aprueba con promedio ≥ 10.5, que se redondea a 11 | Cerrada |
| 20 | Regularidad | 9 de 12 entregas (75 %), por asignatura | Cerrada |
| 21 | Sin regularidad | No se rinde el Parcial 3 de esa asignatura (cuenta como 0) y queda desaprobada | Cerrada |
| 22 | Pesos del promedio | 30 % / 30 % / 40 % | Cerrada |
| 23 | OVR | Escala 0–100, ver abajo | Cerrada |
| 24 | Recuperatorio | No | Cerrada |

Por asignatura:

```
nota     = clamp(4 + 16 · min(1, HOR_tramo / HOR_objetivo)^0.7 + mod_zona + ruido, 0, 20)
           si hay bloqueo mental: nota = nota / 2

promedio = 0.3 · P1 + 0.3 · P2 + 0.4 · P3     (escala 0–20, con decimales)
final    = redondear(promedio)                 (entero; 0.5 redondea hacia arriba)
aprobada = final ≥ 11 y regularidad
```

Del alumno:

```
promedio_general = media de los promedios de sus asignaturas   (sin redondear)
OVR = 5 · promedio_general − 5 · (asignaturas sin regularidad)  (escala 0–100, mínimo 0)
```

- `HOR_tramo` son las horas acumuladas en esa asignatura desde el parcial anterior, ya multiplicadas por zona y, si aplica, por rutina.
- `HOR_objetivo` es propio de cada asignatura (regla 2b).
- Las notas de los parciales se guardan con decimales; solo se redondea el promedio de cada asignatura. Un promedio de 10.5 da final 11 y aprueba; un 10.49 da final 10 y no aprueba.
- La regularidad se comprueba antes del Parcial 3: si al llegar a la semana 15 la asignatura tiene menos de 9 entregas, ese parcial no se rinde.

## 5. Crisis

| # | Regla | Valor | Estado |
|---|---|---|---|
| 25 | Disparo y rearme | Se dispara al cruzar 80 hacia arriba; se rearma al bajar de 60 | Cerrada |
| 26 | Opciones | Forzar, Reposo forzado, Abandono | Cerrada |
| 27 | Coste de forzar | Cada semana que empieza con estrés ≥ 80 hay 25 % de colapso | A calibrar |
| 28 | Coste del reposo forzado | −20 de estrés; la semana en curso se anula | Calibrada en Fase 2 |
| 29 | Crisis en semana de parcial | Los parciales se rinden igual, tras resolver la crisis | Cerrada |

- **Colapso:** la semana se pierde en todas las asignaturas. No hay decisiones, no se suman HOR ni ENT y el estrés no cambia.
- **Reposo forzado:** se anulan las decisiones de la semana en curso (se pierden las HOR y entregas que acababan de sumarse) y el estrés baja 20. Como una crisis empieza en 80 o más, tras el reposo el estrés queda en 60 o más y la crisis no se rearma: para volver a tener ese aviso hay que descansar por decisión propia.
- Si una semana perdida o anulada es de parcial, el parcial se rinde igual con las horas acumuladas hasta entonces.
- **Abandono:** termina la partida con el final Abandono. Requiere confirmación.
- Mientras la crisis no se rearme, no vuelve a dispararse aunque el estrés siga por encima de 80.
- El retiro de una asignatura y el semestre sabático quedan fuera del MVP y entran en la Fase 3.

## 6. Finales y persistencia

| # | Regla | Valor | Estado |
|---|---|---|---|
| 30 | Finales | Beca, Aprobado, Aprobado parcial, Desaprobado, Abandono | Cerrada |
| 31 | Beca | Cursar 4 asignaturas, aprobarlas todas, OVR ≥ 85 (promedio general ≥ 17) y ningún parcial por debajo de 10.5 | A calibrar |
| 32 | Aprobado | Todas las asignaturas aprobadas | Cerrada |
| 32a | Aprobado parcial | Al menos una asignatura aprobada, pero no todas | Cerrada |
| 32b | Desaprobado | Ninguna asignatura aprobada | Cerrada |
| 33 | Guardado de partida | No | Cerrada |
| 34 | Semilla | Visible en la pantalla final; no elegible | Cerrada |

Prioridad al evaluar el final: Abandono, Beca, Aprobado, Aprobado parcial y, en cualquier otro caso, Desaprobado.

## Criterios de balance para la Fase 1

Con 10 000 partidas simuladas por estrategia y 4 asignaturas (`npm run sim`):

- Ninguna estrategia de un solo botón (la misma decisión en todas las asignaturas, todas las semanas) obtiene Beca.
- La estrategia aleatoria termina en Aprobado o Beca menos de la mitad de las veces.
- Existe al menos una estrategia mixta que llega a Beca.

Los tres se cumplen con los valores actuales. Cambios hechos durante la calibración:

- **Regla 10:** el estrés por decisión pasó de +4 / +1 / −5 a +5 / +2 / −6. Con los valores originales, Cursada Balanceada todas las semanas aprobaba siempre y sin crisis hasta la semana 15.
- **Regla 28:** el reposo anulaba la semana siguiente; ahora anula la semana en curso. Antes, un reposo en la semana 15 era gratis porque no quedaba semana que perder.

Cambios hechos en la Fase 2, tras las primeras partidas:

- **Regla 10:** Estudio Intensivo pasó de +12 a +14 horas. Con +12 rendía menos horas por punto de estrés que Cursada Balanceada y además no daba entrega, así que casi nunca convenía.
- **Regla 2b:** las asignaturas dejaron de ser idénticas. En las pruebas, los jugadores usaban casi siempre el atajo "en todas" porque nada distinguía una asignatura de otra y las notas salían iguales.
- **Regla 10a:** se añadió la rutina, para que elegir lo mismo en todas tenga un premio (menos estrés) y un castigo (menos horas). Con −3 de estrés el atajo se volvía la mejor estrategia; con −2 queda como opción cómoda que aprueba pero no alcanza la beca.
- **Regla 28:** el reposo pasó de −40 a −20 de estrés. Con −40 aliviaba más que una semana entera de descanso voluntario (−24 con 4 asignaturas), de modo que provocar la crisis salía a cuenta.

## 7. Dificultad y eventos (Fase 3)

Implementado. Los valores de dificultad están en `src/data/balance.ts` y el catálogo de eventos en `src/data/eventos.ts`. Los marcados "A calibrar" pasaron una primera calibración con el bot y siguen abiertos a ajuste con jugadores.

### Qué elige el jugador al empezar

| # | Regla | Valor | Estado |
|---|---|---|---|
| 35 | Cursos | 3 o 4; desaparece la opción de 2 | Cerrada |
| 36 | Dificultad | Relajado, Normal o Exigente, independiente del número de cursos | Cerrada |
| 37 | Qué cambia la dificultad | Solo los eventos: frecuencia, proporción de buenos y malos, y peso. Las fórmulas son las mismas en los tres niveles | Cerrada |
| 38 | Beca | Se puede obtener con 3 o con 4 cursos; con 4 el rendimiento exigido es menor | Cerrada |

Umbral de la beca (sustituye a la regla 31):

| Cursos | Rendimiento mínimo | Estado |
|---|---|---|
| 3 | 85 | Calibrada en Fase 3 |
| 4 | 84 | Calibrada en Fase 3 |

Las demás condiciones de la beca no cambian: todos los cursos aprobados y ningún parcial por debajo de 10.5.

El valor inicial para 4 cursos era 80, pero con él el bot obtenía la beca en todas las partidas: su rendimiento con 4 cursos se concentra en torno a 84. Con 84 la beca queda igual de exigente con 3 que con 4 cursos.

### Niveles

| Nivel | Probabilidad de evento por semana | Probabilidad de que sea bueno | Peso de los buenos | Peso de los malos |
|---|---|---|---|---|
| Relajado | 45 % | 65 % | ×1.25 | ×0.75 |
| Normal | 50 % | 50 % | ×1 | ×1 |
| Exigente | 60 % | 35 % | ×0.75 | ×1.25 |

Todos los valores de la tabla están a calibrar.

### Cómo aparecen los eventos

| # | Regla | Valor | Estado |
|---|---|---|---|
| 39 | Sorteo | Al empezar cada semana se tira si hay evento, con la probabilidad del nivel; si lo hay, se tira si es bueno o malo y se elige uno al azar de ese tipo | Cerrada |
| 40 | Repetición | Un evento no se repite dentro de la misma partida | Cerrada |
| 41 | Límites por partida | Entre 4 y 9 eventos; nunca más de 2 malos seguidos | A calibrar |
| 42 | Semanas sin evento | La semana 1; y en semana de parcial no salen eventos malos | Cerrada |
| 43 | Crisis | Un evento no puede provocar una crisis por sí solo: el estrés que suma se detiene en 79 | Cerrada |
| 44 | Semilla | El sorteo usa el generador de la partida: misma semilla y mismas decisiones dan los mismos eventos | Cerrada |
| 45 | Catálogo | 20 eventos: 10 buenos y 10 malos | Cerrada |
| 45a | Curso afectado | Si el evento menciona un curso, se sortea cuál al aparecer; el jugador no lo elige | Cerrada |
| 45b | Semana perdida | Una semana perdida por colapso no trae evento | Cerrada |

La probabilidad da variedad; los límites de la regla 41 evitan que una partida en Relajado salga peor que una en Exigente por pura suerte.

### Dilemas

| # | Regla | Valor | Estado |
|---|---|---|---|
| 46 | Forma del evento | Un dilema: una situación con dos opciones, cada una con su beneficio y su coste | Cerrada |
| 47 | Bueno o malo | En un evento bueno las dos opciones benefician y se elige cuál; en uno malo las dos cuestan y se elige cuál | Cerrada |
| 48 | Cuándo se resuelve | Antes de planificar la semana; el jugador no puede decidir los cursos hasta elegir | Cerrada |
| 49 | Qué puede tocar | Estrés, horas de estudio de un curso, trabajos de un curso, o un modificador que dura solo esa semana | Cerrada |
| 50 | Peso por dificultad | En un evento bueno el peso del nivel multiplica lo que beneficia; en uno malo, lo que perjudica. La otra parte no cambia, y los trabajos nunca se escalan | Cerrada |

Ejemplos del catálogo, con los valores del nivel Normal:

| Evento | Tipo | Opción A | Opción B |
|---|---|---|---|
| Feriado largo | Bueno | Desconectar: −10 de estrés | Adelantar un curso: +6 horas |
| Grupo de estudio | Bueno | Ir: +8 horas en un curso, +2 de estrés | Pedir los apuntes: +4 horas, sin estrés |
| El profesor perdona un trabajo | Bueno | Cuenta como entregado en un curso | Lo entregas igual: +3 horas en ese curso |
| Semana de mala salud | Malo | Reposar: esta semana las horas rinden un 30 % menos | Aguantar: +10 de estrés |
| Trabajo sorpresa | Malo | Hacerlo: +6 de estrés | No hacerlo: −1 trabajo en ese curso |
| Problemas de transporte | Malo | Madrugar: +5 de estrés | Faltar a clase: −5 horas en un curso |

### Cómo se muestra

- Tras cerrar una semana, si la siguiente trae evento, aparece una card con el título, la situación y las dos opciones con sus efectos.
- Al elegir, la card se cierra y deja un acceso en una esquina con el título del evento ("Ver evento: Feriado largo"), que la vuelve a abrir en modo de lectura con la opción elegida.
- El calendario marca las semanas que tuvieron evento, y el detalle de la semana lo incluye.
- Una semana sin evento no muestra nada.

### Cómo está hecho

- Una fase `evento` entre el cierre de una semana y la planificación de la siguiente, en la que la partida espera la elección del jugador.
- El estado guarda el evento de la semana en curso, la opción elegida y el modificador de horas activo.
- El historial registra el evento y la elección de cada semana.
- Una partida creada sin dificultad no tiene eventos; así se mantienen los tests del núcleo y la simulación base.

### Resultado del bot

Con la estrategia adaptativa variada, 3 000 partidas por casilla (`npm run sim`):

| | Sin eventos | Relajado | Normal | Exigente |
|---|---|---|---|---|
| 3 cursos: beca | 24 % | 72 % | 39 % | 8 % |
| 4 cursos: beca | 38 % | 76 % | 46 % | 13 % |
| 4 cursos: aprueba | 100 % | 100 % | 100 % | 98 % |

El rendimiento medio baja de Relajado a Exigente con 3 y con 4 cursos, que es el criterio que comprueba el bot. Un jugador que elige bien en los dilemas saca en Normal más provecho de los eventos buenos que daño de los malos; por eso Normal da algo más de beca que jugar sin eventos.

### Fuera de esta primera versión

- Eventos buenos ganados por buen rendimiento en un parcial.
- Eventos encadenados o con consecuencias varias semanas después.
- Duración de la partida configurable.

## Pendiente

- [ ] Que otra persona lea este documento y explique cómo se gana y cómo se pierde (puerta de salida de la Fase 0, aplazada).
- [ ] Probar con jugadores los tres niveles de dificultad y los textos de los eventos.
