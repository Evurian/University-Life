# UniversityLife — Contexto del proyecto

Resumen para retomar el proyecto sin haber seguido su historia: qué es el juego, cómo está construido, en qué punto está y qué decisiones siguen abiertas. Las reglas exactas están en [REGLAS.md](REGLAS.md) y sus números en [src/data/balance.ts](src/data/balance.ts); este documento no las repite, las resume.

Estado a octubre de 2026: **Fases 0, 1 y 2 cerradas.** Lo siguiente está por decidir (ver "Próximos pasos").

## Qué es

Un juego de gestión por turnos, para navegador, en el que el jugador es un estudiante universitario durante un cuatrimestre de 16 semanas. Cada semana decide, curso por curso, si estudia a fondo, hace el trabajo semanal o descansa. Tiene que equilibrar tres cosas: la nota de los parciales, los trabajos entregados y el estrés.

- **Partida:** un cuatrimestre, 10–15 minutos, un solo jugador, sin guardado.
- **Objetivo:** aprobar todos los cursos; el mejor final es la beca.
- **Tono:** interfaz de panel, sin personajes ni narrativa por ahora.

### Origen

La idea nació como un proyecto en Godot 4 con una interfaz densa al estilo Football Manager. Una auditoría inicial mostró que el prototipo no tenía juego: una sola variable (estrés), nota fija y una estrategia que ganaba siempre. Se decidió migrar a web (React + TypeScript), porque el juego es todo interfaz y turnos, y rehacer el diseño desde las reglas.

## Cómo se juega

1. Al empezar se elige cursar 2, 3 o 4 cursos. Menos cursos generan menos estrés; la beca exige 4.
2. Cada semana (de la 1 a la 15) se elige una decisión por curso:

   | Decisión | Horas de estudio | Trabajo | Estrés |
   |---|---|---|---|
   | Estudiar a fondo | +14 | no | +5 |
   | Trabajo semanal | +6 | entrega 1 | +2 |
   | Descansar | 0 | no | −6 |

3. En las semanas 5, 10 y 15 se rinde un parcial en cada curso. La nota (0–20) depende de las horas acumuladas desde el parcial anterior, de lo exigente que sea el curso y de la zona de estrés en ese momento.
4. Un curso se aprueba con promedio de 10.5 o más (redondea a 11) **y** 9 trabajos entregados de 12 posibles.
5. La semana 16 es el cierre: se calcula el resultado.

Reglas que dan forma a las decisiones:

- **El estrés es uno solo** para todos los cursos y va de 0 a 100. Tiene tres zonas: verde (hasta 40) mejora el estudio y la nota; amarilla (41–75) lo empeora algo; roja (76 o más) lo empeora mucho y puede causar bloqueo mental en el parcial.
- **Crisis:** al cruzar 80 de estrés el juego se detiene y hay que elegir entre forzar la semana (riesgo de colapso del 25 % cada semana con estrés alto), reposo forzado (−20 de estrés, pero la semana se anula) o abandonar la carrera.
- **Cursos de distinta exigencia:** Cálculo y Física piden más horas que Programación, y Redacción menos, para la misma nota.
- **Rutina:** elegir lo mismo en todos los cursos baja 2 de estrés pero reduce un 20 % las horas de esa semana.
- **Finales:** Beca, Aprobado, Aprobado parcial, Desaprobado y Abandono.

## Nombres: internos y en pantalla

El código y `REGLAS.md` conservan los términos originales; el jugador ve otros, elegidos tras las pruebas porque los primeros no se entendían.

| En el código y las reglas | En pantalla |
|---|---|
| Asignatura | Curso |
| Entrega (`ent`) | Trabajo entregado |
| Regularidad | Tener los 9 trabajos |
| OVR | Rendimiento |
| `intensivo` | Estudiar a fondo |
| `balanceada` | Trabajo semanal |
| `salud` | Descansar |

Todos los textos visibles están en [src/ui/textos.ts](src/ui/textos.ts) y en los componentes; "Trabajo semanal" es un nombre provisional pendiente de confirmar.

## Tecnología

- **Aplicación:** React 19, TypeScript estricto, Vite. Estado con Zustand. Sin backend ni base de datos.
- **Calidad:** Vitest con Testing Library y jsdom, oxlint, Prettier, y un workflow de CI en GitHub Actions que ejecuta lint, tipos y tests con cobertura en cada push.
- **Repositorio:** <https://github.com/Evurian/University-Life>, rama `main`.
- **Dependencia sin usar:** `zod` está instalado pero todavía no se usa; estaba previsto para validar datos de eventos y partidas guardadas.

### Comandos

Desde la carpeta del proyecto:

| Comando | Qué hace |
|---|---|
| `npm run dev` | Arranca el juego en `http://localhost:5173` |
| `npm run test` | Ejecuta los tests |
| `npm run coverage` | Tests con cobertura (umbral del 90 % en `src/core`) |
| `npm run lint` / `npm run typecheck` | Lint y comprobación de tipos |
| `npm run sim` | Bot de balance: 10 000 partidas por estrategia |
| `npm run build` | Build de producción |

## Estructura

```
src/
├── core/     Reglas del juego como funciones puras, sin React
│   ├── simulacion.ts   Estado, decisiones, parciales, crisis, resultado
│   └── rng.ts          Generador aleatorio con semilla
├── data/
│   └── balance.ts      Todos los números del juego
├── store/
│   └── juego.ts        Estado de la partida en curso (Zustand)
├── ui/       Componentes y estilos
└── tests/    Tests del núcleo, de invariantes y de interfaz
scripts/
└── sim.ts              Bot de balance
REGLAS.md               Especificación de las reglas
```

### Principios que conviene respetar

- **El núcleo no conoce la interfaz.** `src/core` no puede importar React, Zustand ni nada de `ui/` o `store/`; una regla de oxlint lo impide. Así las reglas se prueban y se simulan sin navegador.
- **Las reglas son funciones puras.** Reciben un estado y devuelven otro, sin mutar. El estado es serializable a JSON, lo que deja preparado el guardado.
- **Los números viven en un solo sitio.** Ningún archivo fuera de `balance.ts` contiene valores de juego; la interfaz los lee de ahí, también para sus textos.
- **La interfaz no recalcula reglas.** Pide al núcleo el efecto de una decisión, el estrés previsto o la nota estimada.
- **Partidas reproducibles.** La misma semilla y las mismas decisiones dan el mismo resultado.
- **Si cambia una regla,** se actualizan `REGLAS.md`, `balance.ts` y los tests, y se vuelve a pasar el bot.

## Cómo se verifica

- **Tests:** 83, con cobertura del 100 % del núcleo. Incluyen los casos límite (crisis en semana de parcial, rearme, doble clic, decisión tras el final), un test de invariantes que juega 1 500 partidas al azar, y tests de los flujos de interfaz.
- **Bot de balance:** juega con una docena de estrategias y comprueba tres criterios: ninguna estrategia de un solo botón obtiene beca, la aleatoria aprueba menos de la mitad de las veces y alguna estrategia mixta llega a beca. Acepta ajustes de prueba sin tocar el archivo de balance, por ejemplo `npm run sim -- 10000 rutina.alivioEstres=3`.
- **Pruebas con personas:** cuatro en total, en tres rondas y sobre versiones distintas.

## Historia y estado de las fases

| Fase | Contenido | Estado |
|---|---|---|
| 0 | Reglas del MVP y configuración del proyecto | Cerrada |
| 1 | Núcleo de simulación, tests y bot de balance | Cerrada |
| 2 | Interfaz jugable y pruebas con jugadores | Cerrada |
| 2.5 | Sistema visual (propuesta, sin aprobar) | Por decidir |
| 3 | Sistemas completos | Pendiente |
| 4 | Contenido y balance | Pendiente |
| 5 | Acabado | Pendiente |
| 6 | Lanzamiento | Pendiente |

### Lo que cambió por el camino y por qué

- **Estrés por decisión y reposo (Fase 1).** Con los valores iniciales, hacer siempre lo mismo aprobaba sin esfuerzo y un reposo en la última semana era gratis.
- **Rediseño de la interfaz (Fase 2, primera ronda de pruebas).** Los jugadores no sabían por dónde empezar y veían demasiada información. Se añadieron pasos numerados, una tabla única de cursos, letra más grande y animaciones en los cambios.
- **Estudiar a fondo y reposo (Fase 2).** Estudiar a fondo rendía menos que el trabajo semanal, y caer en crisis salía a cuenta. Subió de 12 a 14 horas y el reposo bajó de −40 a −20.
- **Exigencia por curso y rutina (Fase 2).** Los jugadores usaban casi siempre el atajo "en todos" porque los cursos eran idénticos. Ahora cada curso exige distinto y repetir la decisión en todos tiene premio y castigo.
- **Nombres, calendario e indicadores (Fase 2, segunda ronda).** Se renombraron las decisiones, se añadió el indicador de trabajos por curso, el calendario pasó a ser navegable y la barra de estrés se convirtió en un cerebro.
- **Explicación previa (Fase 2, tercera ronda).** "Cómo se juega" se muestra antes de empezar e incluye la regla de los 9 trabajos.

## Dudas abiertas

- **La beca puede ser demasiado difícil.** El mejor bot la alcanza en el 4.5 % de las partidas; no hay dato de jugadores reales.
- **El premio de la rutina es muy sensible.** Con −3 de estrés en lugar de −2, el atajo se convierte en la mejor estrategia.
- **Los trabajos estrechan las decisiones.** Hacen falta 9 de 12 y solo una opción los da, así que muchas semanas quedan casi decididas.
- **Nadie ha jugado la versión final completa.** Los cuatro jugadores probaron versiones distintas; los últimos textos no los ha leído ninguno.
- **La lectura externa de `REGLAS.md`,** pendiente desde la Fase 0.

## Próximos pasos

### Decisión inmediata: dirección visual

El plan original no tenía una fase de mejora visual de fondo, y las pruebas pidieron una interfaz más atractiva. La propuesta es una Fase 2.5 que defina paleta, tipografía y componentes y rediseñe las tres pantallas, sin tocar reglas. Falta elegir la dirección:

1. Panel de datos sobrio y denso, como en la idea original.
2. Juego académico cercano, claro y con ilustración, que es hacia donde apuntan las pruebas.

### Fase 3: sistemas completos

Previsto en el plan:

- Guardado de partida.
- Retiro de un curso y semestre sabático como opciones de crisis.
- Eventos aleatorios semanales.
- Recuperatorio.

Pedido en las pruebas (requiere decisiones de diseño y calibración con el bot):

- Niveles de dificultad basados en el estrés, con el número de cursos como elección aparte.
- Ventajas por buen rendimiento tras cada parcial.
- Duración de la partida configurable.

Es mucho alcance para una sola fase; hay que ordenarlo y recortar antes de empezar.

### Fuera de alcance por ahora

Finanzas como recurso, varias carreras o cuatrimestres encadenados, cuentas de usuario, rankings y cualquier backend.
