# UniversityLife — Plan de despliegue

Cómo publicar el juego en producción. Cubre qué se despliega, el estado actual del proyecto, las decisiones pendientes, las opciones de hosting con su configuración exacta, el CI/CD, la verificación y el rollback.

Complementa a [CONTEXTO.md](../CONTEXTO.md). No cambia ninguna regla ni ninguna fase del juego: es infraestructura.

## 1. Qué se despliega

UniversityLife es una **aplicación web estática de un solo jugador**. No hay backend, ni base de datos, ni cuentas, ni variables de entorno en tiempo de ejecución, ni enrutado de cliente (todo el flujo ocurre en memoria, sin cambiar de URL).

Consecuencia directa: **lo único que hay que publicar es la carpeta `dist/`** servida como ficheros estáticos. Cualquier host estático sirve; ninguno necesita configuración especial de servidor, base de datos ni funciones.

Contenido de `dist/` tras un build:

| Fichero | Tamaño | Gzip |
|---|---|---|
| `index.html` | 0.46 kB | 0.29 kB |
| `assets/index-*.js` | 267 kB | 83 kB |
| `assets/index-*.css` | 22 kB | 5.3 kB |
| `assets/inter-*-wght-normal-*.woff2` (7 subsets) | ~230 kB | — |
| `favicon.svg` | 9.5 kB | — |

Las fuentes **Inter** vienen de `@fontsource-variable/inter` y se empaquetan en el propio `dist/`, así que no se llama a ningún CDN externo en tiempo de ejecución (Google Fonts, etc.). Es un punto a favor para privacidad, para funcionar tras cortafuegos y para que no haya dependencias de terceros que puedan caerse.

## 2. Estado actual (diagnóstico)

- **El build de producción funciona.** Verificado con `npm ci && npm run build`: `tsc -b` pasa sin errores y Vite 8.3.2 genera `dist/` en ~0.3 s.
- **CI existente** (`.github/workflows/ci.yml`): en cada `push` y `pull_request` corre `npm ci`, `npm run lint`, `npm run typecheck` y `npm run coverage` sobre Node 24. **No hay job de build ni de deploy.**
- **No hay `base` en `vite.config.ts`.** Vite genera rutas absolutas (`/assets/...`, `/favicon.svg`). Esto sirve si el juego se publica en la **raíz de un dominio** (`https://juego.example/`), pero **obliga a cambiar `base` si se publica en una subruta** (caso de GitHub Pages de proyecto: `https://evurian.github.io/University-Life/`).
- **No hay guardado de partida** (está previsto para la Fase 3), así que no hay estado local que migrar ni versionar en el despliegue.
- **Repositorio:** <https://github.com/Evurian/University-Life>, rama `main`. `dist/` está en `.gitignore` (correcto: no se commitea el artefacto).
- **Node:** el CI usa Node 24 y la máquina de desarrollo tiene 24.17.0. Conviene fijarlo (ver §8).

## 3. Decisiones

**Decidido: Opción A — host estático con despliegue desde git (Cloudflare Pages o Netlify), publicado en la raíz del dominio.** No se toca `base` en `vite.config.ts` y no hace falta workflow de deploy en GitHub. Las Opciones B y C se conservan abajo como referencia.

| Decisión | Opciones | Estado |
|---|---|---|
| **Host** | Cloudflare Pages, Netlify, Vercel, GitHub Pages | **Decidido:** host estático con git. Preferido **Cloudflare Pages**; Netlify queda como alternativa con matices de coste (ver Anexo A). |
| **Ruta** | Raíz del dominio vs. subruta | **Decidido:** raíz (no requiere tocar `base`). |
| **Dominio** | Subdominio del proveedor (`universitylife.pages.dev`) vs. dominio propio | Empezar con el subdominio; dominio propio más adelante si se quiere compartir en serio. |
| **Disparador** | Automático en cada push a `main` vs. manual | Automático, pero solo cuando CI esté en verde (`main` verde = producción). |
| **Analítica** | Ninguna vs. básica | Fuera de alcance hoy (lo dice `CONTEXTO.md`). Si se quiere medir jugadores, decidirlo aparte. |

## 4. Requisitos previos

1. Node 24 disponible en el entorno de build (local y CI ya lo cumplen).
2. `npm ci` + `npm run build` reproducibles (hoy lo son).
3. Acceso de administrador al repo de GitHub para conectar el host y, en su caso, cambiar la fuente de Pages.
4. Decidir el host y la ruta (§3) antes de tocar `vite.config.ts`.

## 5. Opción A (elegida): Cloudflare Pages o Netlify

Publica `dist/` en la **raíz del dominio**. No hay que tocar `vite.config.ts`.

**Configuración (idéntica en ambos, salvo el matiz de coste de Netlify):**

> **Aviso (ver Anexo A).** Cloudflare Pages sirve los estáticos sin límite de banda ancha ni de peticiones y regala 500 builds/mes. Netlify, desde septiembre de 2025, cobra por **créditos**: el plan Free da 300 créditos/mes con **límite duro** (si se agotan, el sitio se pausa), y cada deploy de producción cuesta 15 créditos y cada GB de banda ancha 20. Para un proyecto que se despliega a menudo, Netlify Free se queda corto; Cloudflare Pages no.

| Ajuste | Valor |
|---|---|
| Repositorio | `Evurian/University-Life` |
| Rama de producción | `main` |
| Comando de build | `npm run build` |
| Directorio de salida | `dist` |
| Versión de Node | 24 (variable `NODE_VERSION=24` o `.nvmrc`, ver §8) |
| Variables de entorno | ninguna |

**Cabeceras de caché.** El repo ya incluye `public/_headers`, que se copia a `dist/` y que Cloudflare Pages y Netlify leen del directorio de publicación: los `assets/*` (con hash) se sirven como inmutables y `index.html` se revalida. Esto resuelve el punto débil de la caché de GitHub Pages (§12) sin tocar el panel.

**Matices entre los dos:**

- **Cloudflare Pages:** *Framework preset* "None", *Build command* `npm run build`, *Build output directory* `dist`. Lee `.nvmrc`, pero se puede forzar con la variable `NODE_VERSION=24`.
- **Netlify:** *Build command* `npm run build`, *Publish directory* `dist`, y en *Site settings → Environment* la variable `NODE_VERSION=24`. Opcional: un `netlify.toml` en la raíz con esos mismos valores para que la configuración viva en el repo.

**Qué se gana:**

- **Preview deploy por Pull Request** con URL propia, para revisar la Fase 3/2.5 antes de mezclar.
- **HTTPS y dominio** automáticos, sin configurar certificados.
- **Cabeceras de caché gestionables**: los `assets/*` llevan hash en el nombre y se pueden servir como inmutables; `index.html` como `no-cache`. Esto evita que un jugador se quede con una versión antigua.

**Pasos:**

1. Crear el proyecto en Cloudflare Pages / Netlify y conectar el repo de GitHub.
2. Rellenar la tabla de configuración de arriba.
3. Lanzar el primer deploy y comprobar la URL asignada.
4. Ejecutar el smoke test de §10.
5. (Opcional) Añadir dominio propio y, si se quiere, `www` → redirección.

## 6. Opción B: GitHub Pages (todo dentro de GitHub)

Ventaja: un único proveedor. Contrapartidas que hay que asumir:

- **Requiere publicar en subruta** (`https://evurian.github.io/University-Life/`) salvo que se use un dominio propio en la raíz.
- **No se pueden configurar cabeceras de caché** (limitación de GitHub Pages). Con `index.html` cacheado, un despliegue nuevo puede tardar en llegar a quien ya jugó. Sin Service Worker el impacto es menor, pero existe.
- La publicación de Pages en repos **privados** requiere plan de pago; asumo repo público.

**Cambio necesario en `vite.config.ts`** (solo en esta opción):

```ts
export default defineConfig({
  plugins: [react()],
  // Solo para GitHub Pages de proyecto. Quitar si se publica en la raíz.
  base: '/University-Life/',
  test: { /* ...igual que ahora... */ },
})
```

Vite reescribe entonces `/assets/...` y `/favicon.svg` a `/University-Life/assets/...` automáticamente.

**Pasos:**

1. Aplicar el `base` de arriba.
2. En GitHub: **Settings → Pages → Source: GitHub Actions**.
3. Añadir el job de deploy de §8 al workflow.
4. Push a `main` y comprobar la URL que reporta el job.

Alternativa sin Actions: publicar `dist/` a la rama `gh-pages` con el paquete `gh-pages` (`npm run deploy`). Más simple de configurar, pero se pierde el encadenado con CI y se ensucia el historial con una rama de artefactos. Se prefiere Actions.

## 7. Opción C: Vercel

Equivalente a la Opción A (raíz del dominio, previews, cabeceras): framework preset "Vite", build `npm run build`, output `dist`, Node 24. Se incluye solo por completitud; no aporta nada que no den A sobre este proyecto.

## 8. Ajustes en el repositorio (resumen)

Todos son aditivos y no tocan reglas del juego:

1. **Fijar Node 24.** Hecho: `.nvmrc` con `24` y `"engines": { "node": ">=24" }` en `package.json`, para que local, CI y host coincidan.
2. **`base` en `vite.config.ts`.** No se aplica: solo hace falta en la Opción B (subruta).
3. **Job de build en CI.** Hecho: `.github/workflows/ci.yml` ejecuta `npm run build` después de `npm run coverage`, para que el build sea parte del "verde".
4. **Job de deploy.** No se aplica en la Opción A: el host observa `main` y construye por su cuenta (§5). Solo sería necesario en la Opción B (§9).
5. **`public/_headers`.** Hecho: cabeceras de caché para Cloudflare Pages y Netlify (§5).
6. **Opcional: `public/404.html`** copia de `index.html`. Hoy no hace falta (no hay rutas de cliente), pero si la Fase 3+ añade enrutado con URLs, GitHub Pages lo necesitará para no dar 404 en recargas. Omitirlo hasta que exista enrutado.
7. **No commitear `dist/`** (ya está ignorado; no cambiar).

## 9. CI/CD: workflow de deploy para GitHub Pages

Sustituye el workflow actual por uno con dos jobs encadenados. Nombres y versiones de actions actuales a fecha del plan; conviene revisarlos al aplicarlo.

```yaml
name: CI

on:
  push:
  pull_request:

permissions:
  contents: read

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  verificar:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run coverage
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        if: github.ref == 'refs/heads/main'
        with:
          path: dist

  deploy:
    needs: verificar
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Puntos clave:

- El deploy **depende** de `verificar`: nunca se publica con lint, tipos, tests o build en rojo.
- Solo despliega en `main`; los PR solo corren comprobaciones.
- `concurrency` evita deploys solapados.

En las Opciones A/C no hace falta nada de esto: el host observa `main` y despliega por su cuenta (se puede además proteger la rama para exigir CI en verde antes de mezclar).

## 10. Verificación post-despliegue (smoke test)

Sobre la URL publicada, en escritorio y en móvil:

- [ ] Carga sin errores en la consola y sin peticiones a dominios externos (salvo el propio).
- [ ] Icono (`favicon.svg`) visible en la pestaña.
- [ ] Se puede empezar una partida con 2, 3 y 4 cursos.
- [ ] Se juega una semana normal y una de parcial (5, 10, 15) y se ve la revelación de notas.
- [ ] El modal de evento aparece y se resuelve; el modal de crisis bloquea y confirma abandono.
- [ ] Se llega a la pantalla de cierre con un final coherente.
- [ ] Navegación con teclado y foco visible; se respeta `prefers-reduced-motion`.
- [ ] Legible a 375 px (calendario en dos filas) y a 1440 px.
- [ ] Las fuentes Inter se sirven desde el propio dominio (dev tools → Network).

## 11. Rollback

- **Cloudflare Pages / Netlify / Vercel:** redeploy de la versión anterior desde el panel (un clic), o `git revert` del commit problemático en `main`.
- **GitHub Pages:** re-ejecutar el workflow de un commit anterior (Actions → Run workflow) o `git revert`. GitHub Pages conserva el histórico de deployments.

Como no hay backend ni migraciones de datos, el rollback es siempre instantáneo y sin efectos colaterales.

## 12. Riesgos y notas

- **Caché de `index.html` en GitHub Pages** (sin cabeceras configurables): un jugador recurrente puede ver una versión antigua hasta que caduque. Mitigación: preferir Opción A, o versionar el nombre del fichero. Hoy no hay datos que se corrompan por esto.
- **Sin analítica ni monitorización**: no habrá dato de uso ni de errores de jugadores reales. `CONTEXTO.md` ya señala que falta ese dato (p. ej. la dificultad de la beca). Incorporar telemetría es una decisión de producto aparte.
- **Peso de las fuentes**: se empaquetan 7 subsets (~230 kB) aunque el juego sea en español (basta `latin`/`latin-ext`, ~133 kB). Optimización opcional: cargar solo los subsets necesarios desde `@fontsource-variable/inter`. No es bloqueante.
- **Sin enrutado**: la URL siempre es la del juego; no se puede compartir una partida por enlace (la semilla se muestra al final). Si se quiere, es Fase 3.
- **Rama `main` como producción**: cualquier push a `main` publica. Conviene proteger `main` en GitHub y trabajar por PR con preview deploy.

## 13. Estimación

| Tarea | Tiempo |
|---|---|
| Opción A (Cloudflare Pages / Netlify), sin dominio propio | ~30 min |
| Opción B (GitHub Pages) con `base` y job de deploy | ~1 h |
| Ajustes de repo (`.nvmrc`/`engines`, build en CI) | ~15 min |
| Smoke test (§10) | ~20 min |

## 14. Próximo paso inmediato

Hecho en el repo: `.nvmrc` (Node 24), `engines` en `package.json`, `npm run build` en el CI y `public/_headers`.

Pendiente (requiere la cuenta del host, no el repo):

1. Conectar el repo `Evurian/University-Life` a Cloudflare Pages o Netlify con la configuración de §5 (build `npm run build`, salida `dist`, Node 24).
2. Desplegar y pasar el smoke test (§10).
3. Si va bien: proteger `main` en GitHub y, opcionalmente, añadir un dominio propio.

---

# Anexo A — Comparación de hosts: coste y características

Datos verificados en las páginas oficiales el **15 de octubre de 2026** (Cloudflare Pages limits/pricing, Netlify pricing + cómo funcionan los créditos, Vercel limits + fair use, GitHub Pages limits). Los precios y límites cambian a menudo: reconfirmar antes de decidir.

## A.1 Coste de los planes

| Host | Gratis | Primer plan de pago | Notas |
|---|---|---|---|
| **Cloudflare Pages** | $0, banda ancha y peticiones de estáticos ilimitadas | Workers Paid $5/mes (solo si se usan Functions; no aplica aquí) | Sin coste real para este proyecto |
| **Netlify** | $0 = **300 créditos/mes, límite duro** (al agotarse, el sitio se pausa) | Personal $9/mes (1.000 créditos); Pro $20/mes (3.000) | Cada deploy de producción cuesta 15 créditos; previsualizaciones gratis |
| **Vercel** | Hobby $0 (**solo uso personal no comercial**) | Pro $20/mes por usuario | 100 GB de transferencia incluidos en Hobby |
| **GitHub Pages** | $0 en repo **público** | Pro $4/mes (o Team) si el repo es privado | Sin coste en público |

## A.2 Límites incluidos

| | Cloudflare Pages | Netlify (Free) | Vercel (Hobby) | GitHub Pages |
|---|---|---|---|---|
| Banda ancha | Ilimitada | 20 créditos/GB → techo ~15 GB/mes | Primeros 100 GB | Blando 100 GB/mes |
| Peticiones | Ilimitadas | 2 créditos/10.000 | 1.000.000 invocaciones | Sin límite declarado |
| Deploys/builds | 500/mes (1 a la vez, 20 min máx.) | 15 créditos por deploy de producción | 100/día (1 a la vez, 45 min máx.) | Blando 10/hora¹ |
| Previsualización por PR | Ilimitadas | Ilimitadas (**0 créditos**) | Sí | No nativo (vía Actions) |
| Dominios propios | 100 por proyecto | Con SSL, gratis | 50 por proyecto | 1 por sitio |
| HTTPS/TLS | Gratis | Gratis | Gratis | Gratis (Let's Encrypt) |
| Cabeceras de caché | Sí (`_headers`) | Sí (`_headers`) | Sí (`vercel.json`) | **No** |
| Tamaño del sitio | 20.000 ficheros, 25 MiB/fichero | Sin límite declarado relevante | 100 MB por deploy (subida) | 1 GB |
| Rollback | Sí | Sí (gratis) | Sí | Sí (re-ejecutar workflow) |

¹ No aplica si se publica con un workflow propio de GitHub Actions.

## A.3 Restricciones de uso (licencia)

- **Vercel Hobby:** prohibido el **uso comercial**. Se considera comercial cualquier deploy que busque beneficio económico de cualquiera implicado en la producción, incluidos anuncios, cobros, enlaces de afiliado o haber cobrado por escribir el código. **Las donaciones sí se permiten.** Un juego gratuito sin monetización entra, pero conviene tenerlo presente.
- **GitHub Pages:** no puede usarse como hosting para un negocio, comercio electrónico o SaaS con fines comerciales. Un proyecto personal/académico gratuito, sí.
- **Netlify y Cloudflare Pages:** sin restricción de uso comercial relevante para este caso.

## A.4 Coste real para *este* proyecto

Una primera visita descarga ~0,25 MB (JS 83 kB gzip + CSS 5 kB + fuentes ~133 kB + icono); las siguientes apenas piden `index.html`, porque los assets llevan hash y se cachean.

| Visitas/mes | Banda ancha | Cloudflare Pages | Vercel Hobby | GitHub Pages | Netlify Free |
|---|---|---|---|---|---|
| 10.000 | ~2,5 GB | $0 | $0 | $0 | $0 (≈50 créditos) |
| 100.000 | ~25 GB | $0 | $0 (dentro de 100 GB) | $0 (blando) | **Excede** ~15 GB → Personal $9 |

El factor que rompe Netlify Free no es el tráfico, sino **los despliegues**: 300 créditos = 20 deploys de producción *o* 15 GB de banda ancha, y ambas cosas compiten. Publicando a menudo se agotan los créditos y el sitio se pausa. Truco: iterar con **previsualizaciones de PR (gratis)** y hacer deploy de producción solo al mezclar.

## A.5 Otras alternativas (para completitud)

| Opción | Coste | Cuándo tiene sentido |
|---|---|---|
| **Render** (static site) | Gratis; cuenta contra la banda ancha y los minutos de build incluidos del workspace | Alternativa sólida: CDN global, previews por PR, cabeceras propias, Brotli, HTTP/2, TLS gratis |
| **Azure Static Web Apps** | Free: 250 MB por app, 2 dominios, 3 entornos de staging; Standard de pago | Si ya se usa Azure; integración con GitHub y Azure DevOps |
| **Firebase Hosting** | Plan Spark (gratis) con cuota diaria | Si el proyecto crece hacia backend de Google |
| **GitLab Pages** | Gratis en repo público | Si se migra a GitLab |
| **VPS propio** (p. ej. Hetzner ~4 €/mes) + Caddy/Nginx | Desde ~4 €/mes | Control total, pero mantenimiento, parches y TLS a tu cargo. **Sobra para este proyecto.** |

## A.6 Recomendación

**Cloudflare Pages** es la mejor relación coste/características para UniversityLife: $0 con banda ancha y peticiones ilimitadas para estáticos, 500 builds al mes, previsualizaciones ilimitadas, cabeceras de caché, sin restricción de uso comercial y sin tocar `vite.config.ts`. Netlify vale como alternativa si se asume el modelo de créditos; Vercel Hobby es correcto salvo que el proyecto se vuelva comercial; GitHub Pages es el más simple pero publica en subruta y no permite cabeceras de caché.
