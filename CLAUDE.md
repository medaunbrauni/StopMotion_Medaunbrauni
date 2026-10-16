# StopMo

App web de stop motion para PC y Android, en una sola página, sin paso de build.
Publicada en https://medaunbrauni.github.io/StopMotion_Medaunbrauni/ (GitHub Pages desde `main` /).
Publicar = commit + push a `main`; Pages tarda ~1 min.

Nació de analizar Cloud Stop Motion (app.cloudstopmotion.com) con REA: de ahí salen el papel cebolla
como capa translúcida, el guardado en IndexedDB y la exportación en el navegador.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | Toda la app: CSS, HTML y un `<script type="module">`. |
| `timing.js` | Lógica pura de reproducción: `passes()` (normal/loop/boomerang), `exportTicks()`, `frameAt()`. |
| `check.mjs` | Prueba de `timing.js`: `node check.mjs` → `ok`. |
| `manifest.webmanifest`, `icon.svg` | PWA instalable. |

Librerías: solo por CDN (jsdelivr, versión fija) y cargadas con `import()` cuando se usan:
gifenc 1.0.3 (GIF), fflate 0.8.2 (ZIP), peerjs 1.5.4 (celular remoto), qrcode-generator 1.4.4 (QR).

## Modelo de datos

- Unidad de tiempo: **tick** = 1/fps. Cada cuadro tiene `hold` (cuántos ticks dura).
- Proyecto `P`: `{ id, name, w, h, fps, mode, bg, onion, onionOp, camId, burstN, burstS, expFmt, gifW, expBy, expReps, expSecs, frames: [{key, hold}], layers: [...] }`.
- Capas (`P.layers`, índice 0 = abajo): `frames` (la de cuadros, siempre existe), `image`
  (`x, y, scale, rot, crop[4], opacity, blend, start, end` en ticks) y `audio` (clip: suena
  `[trimIn, trimIn+dur)` del buffer en `[offset, offset+dur)` segundos de la línea de tiempo).
- IndexedDB `stopmo2`: store `blobs` (imágenes y audio, clave autoincremental, compartidos entre
  proyectos y cuadros duplicados) y store `meta` (un registro por proyecto con clave = id, más
  `'current'`). `gc()` borra blobs que ningún proyecto usa.
- La base `stopmo` (v1) quedó en desuso; no se migra.

## Piezas clave de `index.html`

- `drawScene(g, tick, {live, onion, sel})` compone todo en un canvas; preview y exportación usan la
  misma función. Modos de mezcla = `globalCompositeOperation`; "Restar" se hace por CPU con `getImageData`.
- `play({mode, from, total, actx, out, onTick, onEnd})` reproduce por pasadas de `passes()` con el
  reloj de `AudioContext`; programa el audio (al revés en el regreso del boomerang). Lo usan el play y
  la exportación de video.
- Exportación: MP4/WebM con `MediaRecorder` en tiempo real (`exportVideo`); GIF y secuencias PNG/JPG
  cuadro por cuadro (`exportFrames`).
- Línea de tiempo: el cursor queda fijo al centro y el scroll nativo es la posición (`tl.onscroll` →
  `curTick` + `scrub()`). Los clips de audio se arrastran y recortan con pointer events (`clipDrag`).
- UI: pestañas Cámara/Cuadro/Capas/Exportar renderizadas con plantillas (`renderPanel`); eventos
  delegados con `data-act` (→ objeto `acts`), `data-p` (campo de `P`), `data-lp` (campo de la capa
  seleccionada), `data-file` (inputs de archivo). El menú Archivo es un `popover` nativo que comparte
  esos handlers.
- Celular (`@media (max-width: 760px), (max-height: 500px)`): cámara a pantalla completa con `#quick`,
  y el resto (`#dock`) en un panel inferior que abre `body.dock`.
- Cámara remota: la PC crea un `Peer` y muestra un QR a `PUBLIC_URL?remote=<id>`; con `?remote=` la
  misma página corre `runRemote()` (visor del celular). El celular manda `{t:'frame', img}`; la PC
  responde `{t:'onion', img, info}`.
- Teclado: ←/→ cuadro, ↑/↓ un segundo, Espacio play.

## Cómo probar

1. `npx serve -l 4321 .` y abrir http://localhost:4321 (el 3000 suele estar ocupado).
2. Tras editar el script: extraer el módulo y `node --check`, y correr `node check.mjs`.
3. Pruebas reales en Edge sin ventana, manejado por CDP:
   `msedge --headless=new --remote-debugging-port=9223 --user-data-dir=<temporal> --disable-sync --disable-extensions --no-first-run --use-fake-device-for-media-stream --use-fake-ui-for-media-stream --autoplay-policy=no-user-gesture-required`
   - Sin `--disable-sync` el perfil temporal se sincroniza con la cuenta Microsoft y abre pestañas ajenas.
   - Elegir el target por URL (`localhost:4321`), nunca "la primera pestaña".
   - Poner la pestaña al frente (`Page.bringToFront`): en segundo plano las imágenes no cargan a tiempo.
   - No borrar IndexedDB con la app abierta (se bloquea); prepararla desde otra URL del mismo origen.
   - Celular: `Emulation.setDeviceMetricsOverride` (390×844, mobile) + `setTouchEmulationEnabled`.
   - Al terminar: cerrar el navegador y borrar el perfil temporal.

## Pendientes

Sin probar todavía:
- [ ] **Probar en un celular Android real**: modo celular, permisos de cámara y la cámara remota (QR).
      La última vez el usuario no vio la cámara en el celular; se agregaron mensajes de error y el
      botón "Activar cámara", falta que confirme qué mensaje aparece.
- [ ] Rendimiento de "Restar" y de la exportación en celular con video Full HD.

Ideas que quedaron abiertas:
- [ ] Ver en la PC la imagen en vivo del celular durante la cámara remota (hoy solo llegan las fotos).
- [ ] Mostrar las capas de imagen en el visor del celular (hoy solo el papel cebolla).
- [ ] Opción para que el papel cebolla al reemplazar muestre el cuadro anterior en vez del que se reemplaza.
- [ ] Exportación de video cuadro por cuadro con WebCodecs + Mediabunny (más rápida y exacta que `MediaRecorder`).
- [ ] AVI (Motion JPEG), solo si algún programa del usuario lo necesita.
- [ ] Guardar/abrir proyecto y secuencias arman el ZIP en memoria; usar streaming si los proyectos crecen mucho.
- [ ] Un proyecto abierto desde archivo conserva su nombre y puede quedar duplicado en la lista.
- [ ] En iPhone el botón ⛶ no funciona (Safari no permite pantalla completa en páginas).
