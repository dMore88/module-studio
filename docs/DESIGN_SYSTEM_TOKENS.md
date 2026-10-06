# Module Studio — Design System

Fuente: archivo de Figma **Web apps**, con dos páginas:

- **Components pack** (nodo `108:7436`): librería de componentes y variables.
- **Abstract studio** (nodo `5763:1691`): el diseño de la aplicación.

Este documento describe los tokens y componentes **tal como están en Figma** y cómo se usan en el código. Los tokens viven en `css/tokens.css`.

> **Revisión del 5 oct 2026 (Figma actualizado):** la página *Components pack* cambió de forma (tamaños más chicos, otra tipografía, otros radios y paddings, más aspecto de software). La **sección 11** lista todo lo que cambió respecto a lo que describen las secciones 2 a 5, y las decisiones que quedan abiertas. **Pasos 1 a 5 aplicados (5 oct 2026):** `css/tokens.css` ya tiene los valores nuevos (tipografía, tamaños de texto, radios, sizing, colores `--inverted` y variables nuevas) y la fuente Be Vietnam Pro / DM Mono se carga en `css/studio-pro.css`. **Los componentes todavía no cambian de medida:** para que se vean igual que antes, el CSS usa los nombres nuevos que equivalen a los valores viejos (radio 8 = `--border-radius-2`, 16 = `-4`, 20 = `-5`; 40 px = `--sizing-9`, 48 = `-10`, 56 = `-11`). El paso 2 ya cambió los controles del panel (ver 12.5); el paso 3 cambió la cabecera, el riel y el relleno de la zona de trabajo (ver 12.5); los pasos 4 y 5 hicieron el panel de capas con el registro y las barras de scroll. Las tablas de las secciones 2 a 5 describen los valores anteriores salvo donde se indica.

> **Estado de la migración:** toda la interfaz usa estos tokens: los diez paneles del inspector, la barra superior, la barra del lienzo, el panel de capas, el riel de herramientas y la línea de estado. El tema antiguo (`css/design-system.css`, variables `--bs-*`) se eliminó.

---

## 1. Cómo se nombran los tokens

Las variables de Figma usan `/` como separador. En CSS se escribe con `-`:

| Figma | CSS |
| :--- | :--- |
| `neutral/text/main` | `var(--neutral-text-main)` |
| `spacing/5` | `var(--spacing-5)` |
| `border/radius/3` | `var(--border-radius-3)` |
| `elevation/3x` | `var(--elevation-3x)` |

**Regla:** en el CSS nuevo no se escriben colores ni medidas sueltas; se usa el token. Si falta, se pide en Figma antes de inventarlo.

---

## 2. Color

### 2.1 Primitivos (solo los que usan los frames)

| Token | Valor |
| :--- | :--- |
| `color-n-30` | `#63657b` |
| `color-n-50` | `#8689a5` |
| `color-n-99` | `#eeeef4` |
| `color-n-100` | `#ffffff` |
| `color-n-black` | `#000000` |
| `color-p-10` | `#0f2648` |
| `color-p-50` | `#2371e7` |
| `color-p-80` | `#97bcf5` |
| `color-p-90` | `#b8d1f8` |

La rampa completa de primitivos no se puede leer con la herramienta de Figma; solo se conocen los que aparecen en los frames.

### 2.2 Neutral

| Grupo | Token | Valor | Uso |
| :--- | :--- | :--- | :--- |
| **Texto** | `neutral/text/main` | `#282a36` | Texto principal |
| | `neutral/text/soft` | `#63657b` | Etiquetas (overline), ayudas |
| | `neutral/text/subtle` | `#787b94` | Títulos de tarjeta, textos secundarios |
| | `neutral/text/main-inverted` | `#eeeef4` | Texto sobre fondo oscuro |
| **Fondo** | `neutral/bg/light` | `#ffffff` | Tarjetas, campos |
| | `neutral/bg/main` | `#eeeef4` | Fondo de página |
| | `neutral/bg/strong` | `#e1e2eb` | Badge neutro |
| | `neutral/bg/muted` | `#cfd0dd` | Fondos apagados |
| **Borde** | `neutral/border/main` | `#cfd0dd` | Bordes generales |
| | `neutral/border/strong` | `#9ea1b8` | Bordes de controles (checkbox, interruptor) |
| | `neutral/border/muted` | `#b8bacc` | Controles deshabilitados |
| | `neutral/border/white` | `#ffffff` | |
| **Interactivo** | `neutral/interactive/default` | `#282a36` | Tinta de la interfaz: tag activo, interruptor encendido |
| | `neutral/interactive/hover` | `#4b4d5f` | |
| | `neutral/interactive/active` | `#282a36` | |
| | `neutral/interactive/disabled` | `#cfd0dd` | |
| | `neutral/interactive/default--inverted` | `#eeeef4` | Fondo de tags en reposo, pista del interruptor apagado (en el frame «Contorls layout» de Figma, `5787:3471`, vale `#eeeef4`; antes `#e1e2eb`) |
| | `neutral/interactive/hover--inverted` | `#cfd0dd` | Hover de tags, checkbox e interruptor |
| | `neutral/interactive/active--inverted` | `#eeeef4` | |
| **Icono** | `neutral/icon/main` | `#4b4d5f` | |
| | `neutral/icon/soft` | `#8689a5` | |
| | `neutral/icon/inverted` | `#eeeef4` | Marca del checkbox |
| | `neutral/icon/disabled` | `#787b94` | |

### 2.3 Primary

En la librería es azul. En la interfaz de la app, el "primario" visible es la tinta oscura `neutral/interactive/default`; el azul se reserva para estados y enlaces.

| Token | Valor |
| :--- | :--- |
| `primary/bg/main` · `soft` · `subtle` · `strong` | `#2371e7` · `#b8d1f8` · `#dae8fd` · `#0f2648` |
| `primary/border/main` · `soft` | `#2371e7` · `#b8d1f8` |
| `primary/text/main` · `soft` · `subtle` · `link` | `#2371e7` · `#71a4f0` · `#97bcf5` · `#1f63ca` |
| `primary/icon/main` · `subtle` | `#2371e7` · `#97bcf5` |
| `primary/interactive/hover` · `focus` | `#4385eb` · `#97bcf5` |

### 2.4 Estado (success, warning, danger, info)

| Estado | bg main | bg soft | border main | icon main | icon strong | text default |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **success** | `#17c84d` | `#b4f3c7` | `#17c84d` | `#17c84d` | `#158236` | `#165f2c` |
| **warning** | `#f2a624` | `#fce8c5` | `#f2a624` | `#f2a624` | `#986a1b` | `#614616` |
| **danger** | `#f41e1e` | `#fcc1c1` | `#f41e1e` | `#f41e1e` | `#8f1616` | `#651414` |
| **info** | `#17b9c8` | `#cbf2f5` | `#17b9c8` | `#17b9c8` | `#188994` | `#1b6d75` |

`danger/interactive`: default `#f41e1e`, hover `#f64949`, active `#c91919`.

---

## 3. Tipografía

**Familias:** `Inter` (cuerpo y títulos) y `DM Mono` (monoespaciada, estilo `Mono`).
**Pesos:** Regular 400, Medium 500, SemiBold 600.

**Tamaños (modo escritorio, desde 1200 px):** `xs` 12 · `sm` 14 · `md` 16 · `xl` 20 · `2xl` 24 · `3xl` 30 · `4xl` 36. Los tamaños grandes cambian por breakpoint en Figma; la app solo usa de `xs` a `md`.

**Estilos de texto usados por la app:**

| Estilo | Tamaño / peso | Interlineado | Uso en la app |
| :--- | :--- | :--- | :--- |
| **Overline** | 12 / 600, mayúsculas, espaciado 2 % | 1 | Etiquetas de campo (RANGE, CYCLES…) |
| **Caption** | 12 / 400 | 1.7 | Tags, ayudas |
| **Caption--Strong** | 12 / 600 | 1.7 | Badge de capa |
| **Body small** | 14 / 400 | 1.7 | Título de la tarjeta |
| **Body** | 16 / 400 | 1.5 | Texto de los interruptores |
| **Body--Strong** | 16 / 600 | 1.5 | |
| **Label** | 16 / 500 | 1 | Botones |
| **Mono** | 14 / 500 (DM Mono) | 1.5 | Valores numéricos (ver Pendientes) |

Otros estilos de la librería: Display, Heading 1 a 5 (normal y *Strong*), Subheading, Body small--Strong.

---

## 4. Espacio, tamaño, borde, elevación, layout

| Token | Valores |
| :--- | :--- |
| **spacing** | 0 = 0 · 1 = 2 · 2 = 4 · 3 = 8 · 4 = 12 · 5 = 16 · 6 = 24 · 7 = 40 · 8 = 48 · 9 = 68 · 10 = 80 · 11 = 96 |
| **sizing** | 1 = 4 · 2 = 8 · 3 = 12 · 4 = 16 · 5 = 20 · 6 = 24 · 7 = 40 · 8 = 48 · 9 = 56 · 10 = 64 · 11 = 68 · 12 = 80 · 13 = 96 · 14 = 128 · 15 = 144 · 16 = 224 · 17 = 256 · 18 = 288 |
| **border/weight** | 1 = 1 px · 2 = 2 px · 3 = 4 px · 4 = 8 px |
| **border/radius** | 1 = 8 · 2 = 16 · 3 = 20 · full = 99999 (pastilla) |
| **layout** | 12 columnas · gap 16 · margen 48 · breakpoint desde 1200 |

**Elevación** (sombras dobles):

| Token | Sombras |
| :--- | :--- |
| `elevation/1x` | `0 1 2 #0F26481F` + `0 1 3 #0F26483D` |
| `elevation/2x` | `0 2 4 #0F26481F` + `0 3 6 #0F264826` |
| `elevation/3x` | `0 3 6 #0F26481A` + `0 10 20 #0F264826` (tarjetas flotantes) |
| `elevation/4x` | `0 5 10 #0F26480D` + `0 15 25 #0F264826` |
| `elevation/5x` | `0 20 40 #0F264833` |

---

## 5. Componentes usados por la app

Cada componente indica su clase CSS y los tokens que usa.

### 5.0 Guía: qué control usar para cada tipo de dato

Fuente: frame «Contorls layout» de Figma (`5787:3471`), hecho con los componentes del sistema. Es la regla para cualquier control nuevo.

| Tipo de dato | Control | Detalle |
| :--- | :--- | :--- |
| Un bloque que se enciende o apaga | Cabecera de tarjeta: título, badge y interruptor (5.2 a 5.4) | Una por sección |
| Un modo excluyente de 2 opciones (Repetition / Radiation) | Grupo de botones (5.11) | |
| Una forma entre las 15 | Rejilla de botones de icono de 40 px, separación 8 px (5.9) | 6 por fila |
| Un número continuo | Deslizante con caja de valor (5.6), etiqueta encima en mayúsculas | Ancho 224 + 12 + 56 |
| Un color | Muestra de 24 px y texto hex que coinciden (5.12), etiqueta encima | |
| 2 a 5 variantes de una misma estructura | Tags (5.5) | Separación 8 px |
| Más de 5 opciones, o listas largas | Desplegable (5.17, comportamiento en la página de componentes de Figma) | |
| Opción de sí o no | Fila con casilla (5.8) | Altura 40 |
| Un punto sobre el lienzo (epicentro, atractor) | Marcador de línea punteada sobre el lienzo; sin diseño propio, a revisar | Estilo actual de `drawAnomalyReticle` y `drawAttractorGuide` |

Todas las tarjetas: fondo blanco, radio `border/radius/3` (20), relleno `spacing/6` (24), separación entre grupos `spacing/5` (16), elevación `elevation/3x`.

---

**Orden dentro de un panel:** los controles de jerarquía alta, los que definen qué subcontroles se muestran (tipo, modo, esquema, camino, secuencia), van **arriba** y son **chips** (tags). Debajo van los sliders y, al final, las casillas. Si un subcontrol necesita elegir entre opciones, también son chips. El grupo de botones se reserva para los dos selectores del Figma (Stroke / Fill y Repetition / Radiation). Los subcontroles que solo existen con un modo van justo debajo del chip que los activa (por ejemplo *Becomes* bajo *Attribute*). `tests/smoke.html` comprueba que ningún selector aparezca después de un slider.

**Regla:** los controles nuevos se arman con este catálogo, eligiendo el que mejor encaje. Solo si ninguno sirve se pide un diseño nuevo en Figma.

### 5.1 Tarjeta flotante del inspector (`.inspector-flyout-card` + `.ds-card`)
Ancho **340 px** (angosto a propósito: no debe tapar el lienzo mientras se edita), relleno `spacing/5` (16), radio `border/radius/3` (20), separación interna `spacing/5` (16), sombra `elevation/3x`, fondo `neutral/bg/light`. Flota sobre el borde derecho del espacio de trabajo, a 66 px del borde (a la izquierda del riel), alineada con la parte superior de la barra del lienzo. Se abre y cierra con el riel y con su botón de cierre.

**Regla para todos los controles: una sola columna.** Cada slider ocupa el ancho completo del panel; nunca se ponen dos controles lado a lado (por eso `.ds-row` es una columna). Entre dos sliders seguidos hay **24 px** (la separación normal de la tarjeta es 16, y entre sliders se suman 8). Las únicas filas horizontales son los grupos de botones, tags y formas, que se ajustan solos al ancho.

### 5.2 Cabecera de tarjeta (`.ds-card-header`)
Título en 16 / 600 con `neutral/text/main` (*Heading*), seguido de un **badge** con el nombre de la capa (el panel Module no lo lleva, como en el editor de Figma) y, a la derecha, el **interruptor** y el botón de cierre. El botón de cierre no está en el mockup del editor; se añadió a petición. Separación 18 px.

### 5.3 Badge (`.ds-badge`)
Variante neutral: fondo `neutral/bg/strong`, radio `border/radius/1`, relleno horizontal `spacing/2`, texto *Caption--Strong* en `neutral/text/main`. La librería define otras cinco variantes (primary, success, warning, danger, info) con fondo `…/bg/soft` y texto `…/text/default`.

### 5.4 Interruptor (`.ds-switch`)
40×24, radio completo, relleno `spacing/1`, indicador 20 px.

| Estado | Pista | Borde | Indicador |
| :--- | :--- | :--- | :--- |
| **Apagado** | `neutral/interactive/default--inverted` | `neutral/border/strong` | `neutral/interactive/default` (izquierda) |
| **Apagado, hover** | `neutral/interactive/hover--inverted` | igual | igual |
| **Encendido** | `neutral/interactive/default` | `neutral/interactive/default` | `neutral/bg/light` (derecha) |
| Deshabilitado (librería) | `neutral/interactive/disabled` | `neutral/border/muted` | `neutral/icon/disabled` |

El estado encendido sale del diseño de la aplicación; el apagado, de la librería. En la librería el estado encendido es una pista clara con borde oscuro; el diseño de la app usa la pista oscura (ver Pendientes).

### 5.5 Tag selector (`.ds-tag`)
Separación entre tags `spacing/3` (8). Altura 24 (`sizing/6`), relleno horizontal `spacing/4` (12), radio completo, borde `border/weight/1` en `neutral/interactive/default`, texto *Caption*.

| Estado | Fondo | Texto |
| :--- | :--- | :--- |
| Normal | `neutral/interactive/default--inverted` | `neutral/text/main` |
| Hover | `neutral/interactive/hover--inverted` | `neutral/text/main` |
| Activo | `neutral/interactive/default` | `neutral/text/main-inverted` |

La librería define además un tag con icono y botón de cierre y estado deshabilitado (`neutral/interactive/disabled`, borde `neutral/border/muted`, texto `neutral/text/subtle`).

### 5.6 Control deslizante (`.ds-slider`) y caja de valor (`.ds-value`)
Pista de 2 px, tirador de 16 px (`assets/slider-thumb.svg`). La etiqueta va encima de la pista y la **caja de valor (56×40) a la derecha, abarcando etiqueta y pista**, con separación `spacing/4` (12); radio 7, fuente monoespaciada 15 px. Los valores con unidad la muestran en la caja (`1.2px`, `50%`). La caja de valor y la pista están **dibujadas en Figma con colores sueltos**, no con variables (ver Pendientes); en el código viven como tokens locales `--ds-*`.

### 5.7 Campo con etiqueta (`.ds-field`, `.ds-row`, `.ds-label`)
Etiqueta *Overline* en `neutral/text/soft`, separación `spacing/3` (8) entre etiqueta y control; dos campos en fila con separación 13 px.

### 5.8 Fila con casilla (`.ds-toggle-item`, `.ds-checkbox`)
Texto *Body* a la izquierda, casilla 24×24 a la derecha, relleno vertical `spacing/3`, separación `spacing/5`.

| Estado | Fondo | Borde | Marca |
| :--- | :--- | :--- | :--- |
| Normal | `neutral/bg/light` | `neutral/border/strong` | — |
| Hover | `neutral/interactive/hover--inverted` | igual | — |
| Marcada | `neutral/interactive/default` | `neutral/interactive/default` | `neutral/icon/inverted` |
| Marcada, hover | `neutral/interactive/hover` | igual | igual |

### 5.9 Botón de icono con forma (`.shape-circle-btn`)
40×40, radio `border/radius/2` (16), borde 1 px en la tinta, icono de 16 px (Phosphor *fill*); activo con fondo `neutral/interactive/default`. Cuadrícula con separación 8 px (`.shape-grid`).

### 5.10 Snackbar (`.ds-snackbar`) y aviso de error (`.render-error`)
Snackbar de advertencia (nodo `5779:3233`): fondo `warning/bg/soft`, borde `border/weight/1` en `warning/border/main`, radio `border/radius/1`, relleno `spacing/5` vertical y `spacing/6` horizontal, separación `spacing/3`, icono de 20 px en `warning/icon/main` y texto *Body small* en `warning/text/default`. Lo usan los avisos de dependencia (Structure, Similarity, Gradation, Anomaly, Contrast y Concentration). El aviso de error de dibujo usa la tinta oscura con `elevation/3x`.

### 5.11 Grupo de botones (`.ds-btn-group`)
Altura 40 (`sizing/7`), borde `border/weight/1` en `neutral/border/strong`, radio `border/radius/2`, fondo `neutral/bg/light`. Botones de ancho igual (mínimo 80 px) con texto *Body small*, separados por una línea; el activo usa `neutral/interactive/active` con texto `neutral/text/main-inverted`. Se usa en *Structure mode* (Repetition / Radiation) y *Fill / Stroke*.

### 5.12 Selector de color (`.ds-color-picker`, `.ds-color-row`)
La muestra mide **24 px en todos los paneles** (Shape color, color de acento de Anomaly y Contrast), con el texto hex al lado.

Cuadro de color de 24×24 (`sizing/6`), radio `border/radius/1`, borde en `neutral/border/strong`, y el valor hexadecimal al lado en fuente monoespaciada.

### 5.13 Pila de campos (`.ds-stack`)
Contenedor vertical con separación `spacing/6` (24) para los sub-paneles de Layout structure y para el grupo de controles de Structure y Similarity.

### 5.14 Cabecera de la aplicación (`.ds-app-header`, nodo `5763:1693`)
Altura 68, relleno horizontal 26. A la izquierda la marca (icono de 40 px y el nombre en *Heading 5--Strong*: 24 / 600); a la derecha las acciones de exportación (Open, Config, Copy SVG, Download SVG) con separación de 10 px. Nombre de la aplicación: **Abstract Studio**, 20 / 600 (el repositorio sigue llamándose Module Studio).

### 5.15 Botón (`.ds-btn`)
Altura 40 (`sizing/7`), ancho mínimo 100, relleno horizontal `spacing/5`, radio `border/radius/2`, fondo `neutral/interactive/default--inverted`, texto *Label* (12 / 600, **mayúsculas**) en `neutral/text/main` e icono de 16 px a la derecha.

| Estado | Fondo |
| :--- | :--- |
| Normal | `neutral/interactive/default--inverted` |
| Hover | `neutral/interactive/hover--inverted` |
| Pulsado | `neutral/interactive/active--inverted` |
| Deshabilitado | `neutral/interactive/disabled` |

> El botón **Open** de la cabecera sirve para reabrir un proyecto guardado con Config no tiene mockup en Figma; reutiliza `.ds-btn` con el icono `ph-folder-open` (catálogo).

### 5.16 Botón de icono (`.ds-icon-btn`)
40×40, radio `border/radius/2`, icono de 16 px. Normal con `neutral/interactive/default--inverted`; **activo** (opciones de vista: guías de rejilla, inversión de tono) con `neutral/interactive/default` e icono `neutral/icon/inverted`.

### 5.17 Selector (`.ds-select`, nodo `5763:31782`)
212×40, borde `border/weight/1` en `neutral/border/strong`, radio `border/radius/2`, fondo `neutral/interactive/default--inverted`, texto de 16 px en `neutral/text/soft`, y a la derecha un botón oscuro de 40×40 (`neutral/interactive/default`) con un icono de 20 px. Es un `<select>` nativo con ese aspecto.

### 5.18 Barra del lienzo (`.ds-workspace-toolbar`)
Primera fila de la columna del lienzo: el selector de proporción a la izquierda y las dos opciones de vista (cuadrícula, invertir) a la derecha, con el **mismo ancho que el lienzo** (mínimo 330 px).

**Tamaño del lienzo (`fitArtboard()`):** el alto manda. El lienzo ocupa todo el alto libre de la columna y el ancho sale de la proporción (1:1, 9:16, 4:3, 3:4, 16:9). El ancho tiene un tope para no pasar por debajo del panel de controles (340 px + 24 px de aire), así que en 4:3 y 16:9 el alto baja. El marco blanco de 20 px, el radio 20 y la sombra `elevation/5x` rodean al lienzo, que queda alineado a la izquierda de su columna. No hay zoom ni desplazamiento; el tamaño se recalcula al cambiar la ventana, la proporción o el espacio.

### 5.19 Panel de capas (`.ds-layers-panel`, nodo `5763:32080`)
320 px de ancho. Barra superior de 40 px con el título *LAYERS* (12 / 600, espaciado 0,24), el contador (badge, solo el número) y el botón **ADD MODULE**. Lista con separación `spacing/3` (8) y relleno `spacing/5` (16) arriba, abajo y a la izquierda, sin relleno a la derecha (las tarjetas llegan al borde de la columna).

### 5.20 Tarjeta de capa (`.layer-card`)
72 de alto, radio `border/radius/1`, relleno izquierdo `spacing/3` y derecho `spacing/5`, separación `spacing/4`. Contiene una vista previa de 56×56 sin fondo ni borde, con el icono de la forma en trazo (`ph`, regular) de 40 px, el nombre en Inter 14 / 400 y una línea secundaria en Inter 12 / 400 con `neutral/text/subtle` (interlineado 1,7, separación 2 px; ya no usa la fuente monoespaciada), y las acciones (visibilidad, borrar, arrastrar) con separación `spacing/4`.

| Estado | Fondo | Borde | Texto |
| :--- | :--- | :--- | :--- |
| Inactiva | `neutral/interactive/default--inverted` | 1 px `neutral/interactive/default` | `neutral/text/main` |
| Activa | `neutral/interactive/active` | 2 px `neutral/interactive/default` | `neutral/text/main-inverted` |
| Oculta | igual, con opacidad 45 % | | |

### 5.21 Riel de herramientas (`.controls-rail`, `.rail-btn`)
**Tarjeta blanca propia del layout** (72 px de ancho, relleno `spacing/5`, radio `border/radius/2`, sombra `elevation/3x`), pegada al borde derecho con 16 px de margen y tan alta como el espacio de trabajo. Botones de 40×40 con radio `border/radius/2` (no circulares), separación `spacing/4` (12) e icono de 16 px.

| Estado | Aspecto | Significa |
| :--- | :--- | :--- |
| Normal | Botón secundario: fondo blanco, borde 1 px `neutral/interactive/default`, icono `neutral/icon/main` | El modificador está **apagado** en la capa activa |
| Activo | Fondo `neutral/interactive/default`, icono `neutral/icon/inverted` | El modificador está **encendido** en la capa activa (Module siempre) |
| Panel abierto | Anillo de 2 px alrededor del botón (se suma a cualquiera de los dos estados) | Es el panel que se ve a la izquierda del riel |

El estado «activo» se recalcula al cambiar de capa. Accesibilidad: el nombre del botón termina en «, on» u «, off» y `aria-expanded` indica si su panel está abierto. El panel de controles queda a 10 px del riel (`--flyout-right: 98px`).

### 5.22 Línea de estado (`.ds-status`)
Debajo del lienzo, a la izquierda: tamaño del lienzo **tal como se ve** (se calcula del espacio disponible) y número de capas, en mono 13 / 500 con `neutral/text/subtle`. Ya no muestra el zoom.

### 5.23 Componentes de la librería que la app aún no usa
Breadcrumbs, paginación, loaders, ribbon alert, modal, card, input de texto, búsqueda, select, textarea, input numérico, lista, tabla, botón, enlace, grupo de botones, grupo de botones de alternancia, tabs, acordeón y tooltip.

---

## 6. Iconografía

[Phosphor Icons](https://github.com/phosphor-icons/homepage), 2.1.1. Todo en peso **regular** (`ph ph-*`), como en Figma, incluidas las formas del selector y las tarjetas de capa (el peso *fill* solo se usa en el icono de aviso de los snackbars). Tamaños habituales: 12, 14, 16, 20 y 40 px.

Los iconos se identificaron comparando cada SVG del frame del editor (nodos `5763:31810` y `5763:1692`) con el catálogo de Phosphor 2.1.1; la coincidencia fue exacta. Equivalencias:

| Dónde | Icono |
| :--- | :--- |
| Marca | `gradient` (40 px) |
| Cabecera | Config `gear-six`, Copy SVG `copy`, Download SVG `download-simple` |
| Capas | Add module `plus-circle`; visibilidad `eye`; borrar `trash`; arrastrar `dots-six-vertical` |
| Barra del lienzo | cuadrícula `grid-nine`; invertir `circle-half` |
| Riel | Module `shapes`, Layout `circles-four`, Structure `grid-four`, Similarity `copy-simple`, Gradation `angle`, Anomaly `circles-three-plus`, Contrast `circle-half`, Concentration `radio-button`, Texture `drop-half-bottom`, Space `cube-transparent` |
| Formas (22, una familia por fila de 6) | circle `circle`, square `square`, triangle `triangle`, line `minus`, cross `plus`, ring (dibujo propio: dos círculos concéntricos), semicircle `circle-half`, quarter `chart-pie-slice`, crescent `subset-proper-of`, wave `tilde`, spiral `spiral`, arrow `arrow-fat-up`, pentagon `pentagon`, hexagon `hexagon`, octagon `octagon`, star `star`, letterA / letterS / letterR (glifo A, S, R en el botón), digit1 `number-one`, digit5 `number-five`, digit9 `number-nine`. Las listas de forma de Gradation, Contrast y Anomaly son dropdown con icono y nombre |

Excepción: la flecha del selector de proporción del Figma no es de Phosphor (es un chevron propio de la librería); la app usa `caret-down`, que se ve igual. El botón Open no está en el Figma y usa `folder-open`. `tests/smoke.html` vigila estas equivalencias.

---

## 7. Tema antiguo (retirado)

`css/design-system.css` (variables `--bs-*`, tinta `#18181f`) se eliminó al migrar toda la interfaz a los tokens de Figma. Cualquier referencia a `--bs-*` en el código nuevo es un error.

---

## 8. Diferencias entre Figma y la app, y decisiones pendientes

| # | Qué | Detalle | Decisión |
| :-- | :--- | :--- | :--- |
| 1 | **Caja de valor y pista del slider** | En el diseño de la app usan colores sueltos (`#f0f0f2`, `#292932`, `#1d1d25`), no variables | **Resuelto (5 oct 2026):** la caja de valor es el *input-text* de la librería (56×32, radio 4) y la pista del slider usa tokens (ver 11.3 y 12). Los `--ds-*` se retiran al aplicarlo |
| 2 | **Fuente monoespaciada** | Figma define `DM Mono` (estilo `Mono`), pero el diseño de la caja de valor usa Roboto Mono. La app no carga ninguna de las dos y cae a JetBrains Mono | **Resuelto (5 oct 2026):** `DM Mono` Medium (la usa el registro «Art log» del Figma). La app ya la importa |
| 3 | **Interruptor encendido** | La librería lo muestra con pista clara y borde oscuro; el diseño de la app, con pista oscura e indicador blanco | Unificar la librería con el diseño |
| 4 | **Checkbox apagado** | La librería usa fondo `neutral/interactive/default--inverted`; el diseño de la app, fondo blanco | Unificar |
| 5 | **Anillo de foco** | La librería usa `primary/interactive/focus` (`#97bcf5`), de poco contraste sobre blanco | La app usa un contorno de 2 px en la tinta; confirmar que se mantiene |
| 6 | **Controles sin mockup** | Selector de forma y ángulo en Contrast, eje de línea en Concentration, color de acento, variaciones de Layout, Radiation y Gradation | Resuelto (2026-10-04): se arman con el catálogo; solo van a diseño si ningún componente encaja |
| 7 | **Dos generaciones de mockups** | Los frames de Layout, Structure y Similarity usan los componentes tal como están en la librería: tags y casillas con fondo gris `#e1e2eb`, interruptor encendido con pista clara y bolita oscura. Los frames de Gradation a Space usan tags y casillas blancos (los tags ya se alinearon con el frame nuevo: fondo `#eeeef4`) y el interruptor encendido con pista oscura. La app aplica a todos los paneles el estilo de los frames recientes (blancos, interruptor oscuro) | Elegir uno y actualizar el otro en Figma. Cambiarlo en la app son unas pocas líneas de `css/studio-pro.css` |
| 8 | **Etiqueta "Relleno / Trazo" en Layout** | En el mockup del selector Repetition / Radiation sobra el texto "Relleno / Trazo" (parece de otro control). En la app se llama *Structure mode* | Confirmar |
| 9 | **Panel Module** | El mockup no muestra la etiqueta de capa (badge) ni el botón de cierre | Resuelto: sin badge; el botón de cierre se añadió a petición |
| 9b | **Barra del lienzo** | Selector y opciones de vista alineados con los bordes del lienzo | Resuelto (editor de Figma aplicado) |
| 9c | **Zoom** | El mockup incluye un grupo de botones de zoom bajo el lienzo; el zoom está desactivado en la app a petición tuya | Quitado por ahora (2026-10-04), junto con el desplazamiento y los atajos Espacio y Cmd+0. Confirmar si vuelve |
| 9d | **Línea de estado** | El mockup muestra "RETINA HiDPI"; la app muestra el tamaño del lienzo y el número de capas, como el frame actual | Resuelto: el texto sigue el frame del editor |
| 10 | **Rampa de primitivos** | No se puede leer completa con las herramientas disponibles | Exportar la lista de variables desde Figma si se quiere documentar entera |

---

## 9. Accesibilidad de los componentes

`setupAccessibility()` (en `js/studio/studio-pro-app.js`) aplica estas reglas a todos los componentes, también a los que se crean después:

- El texto *Overline* de un campo da nombre al deslizador, a su caja de valor y a los grupos de tags o botones (`aria-labelledby`).
- Los botones de solo icono toman su nombre del tooltip (`title`) y los de cierre se llaman "Close panel".
- Los interruptores se nombran por la tarjeta que activan.
- Tags, grupos de botones, botones de forma, botones de vista y riel exponen su estado con `aria-pressed`, sincronizado con la clase `active`.
- Las tarjetas de capa son botones alcanzables con teclado (Enter o Espacio) y marcan la activa con `aria-current`.
- Los avisos usan `role="status"` (snackbar) y `role="alert"` (error de dibujo).

`tests/smoke.html` comprueba que ningún control se quede sin nombre y que `aria-pressed` coincida con el estado visual.

---

## 10. Cómo añadir un componente nuevo

1. Dibujarlo en Figma usando las variables de la sección 2 a 4.
2. Pasar el enlace del nodo.
3. Implementarlo con clases `.ds-*` y tokens de `css/tokens.css`; sin colores ni medidas sueltas.
4. Comprobarlo en `tests/smoke.html` y comparar los estilos calculados antes y después si se toca un componente ya existente.

---

## 11. Cambios del Figma del 5 oct 2026 (pendientes de aplicar en el código)

Fuente: página *Components pack* (nodo `108:7436`), leída con las herramientas de Figma: variables, tamaños y estilos de cada componente. **No se revisó** la página *Abstract studio* (`5763:1691`); sus medidas (tarjetas del inspector, riel, capas) siguen como en las secciones 5.1 y 5.14 a 5.22 hasta que se confirme si cambió.

### 11.1 Tokens que cambiaron

| Grupo | Antes (código actual) | Ahora (Figma) |
| :--- | :--- | :--- |
| **Tipografía, familia** | Inter | **Be Vietnam Pro** (cuerpo y títulos) |
| **Tamaños de texto** | xs 12 · sm 14 · md 16 · xl 20 · 2xl 24 · 3xl 30 | **xs 10 · sm 12 · md 15** · xl 20 · 2xl 24 · 3xl 30 |
| **Radios** (`border/radius`) | 1 = 8 · 2 = 16 · 3 = 20 · full | **1 = 4 · 2 = 8 · 3 = 12 · 5 = 20** · full (el 4 no aparece en los componentes revisados; se supone 16) |
| **Sizing** | 7 = 40 · 8 = 48 · 9 = 56 · 10 = 64 · 11 = 68 · 12 = 80 · 13 = 96 · 14 = 128 · 15 = 144 · 16 = 224 · 17 = 256 · 18 = 288 | **7 = 32 · 8 = 36 · 9 = 40 · 10 = 48 · 11 = 56 · 12 = 64 · 13 = 68 · 14 = 72 · 15 = 80 · 16 = 96 · 17 = 128 · 18 = 168** (1 a 6 igual: 4 · 8 · 12 · 16 · 20 · 24) |
| **Spacing** | 0 a 11 | Igual |
| **`neutral/interactive/default--inverted`** | `#eeeef4` | **`#ffffff`** (fondo de tags, botones secundarios, campos) |
| **`neutral/interactive/hover--inverted`** | `#cfd0dd` | **`#e1e2eb`** |
| **`neutral/interactive/active--inverted`** | `#eeeef4` | Igual |

**Variables nuevas** (no están en `tokens.css`): `opacity/disabled` = 50 · `opacity/overlay` = 80 · `primary/interactive/default` `#2371e7` y `/active` `#194d9c` · `primary/border/strong` `#194d9c` · `primary/text/link-visited` `#0f2648` · `typography/color/n-default` `#282a36`, `n-soft` `#63657b`, `n-inverted` `#eeeef4` · familia de variables `scale-progression/*` (min = 1, x05 = 2, x1 = 4 … x72 = 288; la escala de 4 px de la que salen spacing y sizing).

**Cuidado con los nombres.** El archivo conserva variables antiguas con otro nombre y los valores viejos: `border-radius/1` = 8, `border-radius/2` = 16, `border-radius/3` = 20 (con guion) conviven con las nuevas `border/radius/1` = 4, `/2` = 8, `/3` = 12, `/5` = 20 (con barra). También hay variables `bbs-*` (por ejemplo `bbs-spacing/0`, `bbs-font-size/button` = 14 en Arial). Al pasarlo al código hay que usar solo las de `border/radius/*` y no copiar las antiguas. Y como el 20 ahora se llama `radius/5`, **las tarjetas del inspector (hoy `--border-radius-3` = 20) pasan a `--border-radius-5`**.

### 11.2 Estilos de texto nuevos

| Estilo | Ahora | Antes |
| :--- | :--- | :--- |
| **Caption** | 10 / 400, interlineado 1,7 | 12 / 400 |
| **Caption--Strong** | 10 / 600 | 12 / 600 |
| **Label** (botones, etiquetas de campo) | 10 / 500, espaciado 0,1 px, interlineado 1 | 12 / 600, mayúsculas |
| **Body small** | 12 / 400, interlineado 1,7 | 14 / 400 |
| **Body** | 15 / 400, interlineado 1,5 | 16 / 400 |
| **Body--Strong** | 15 / 600 | 16 / 600 |
| **Subheading** / **--Strong** | 20 / 400 · 20 / 600, interlineado 1,5 | igual |
| **Heading 5--Strong** | 24 / 600, interlineado 1,2 | igual |
| **Heading 4--Strong** | 30 / 600, interlineado 1,2 | igual |

En los componentes, la etiqueta de un campo ya no es el *Overline* en mayúsculas: es el estilo **Label** (10 / 500 en `neutral/text/soft`, sin mayúsculas). El estilo de código (`Code snippets`) existe en Figma pero no se pudo leer; la fuente mono de la caja de valor sigue sin decidirse (ver 8.2).

### 11.3 Componentes: medidas nuevas

| Componente | Antes | Ahora (Figma) |
| :--- | :--- | :--- |
| **Tag** (5.5) | 24 de alto, relleno 12, píldora, texto 12 | **24 de alto, relleno 4, radio 4**, separación icono-texto 2, texto 10 / 400, fondo blanco, borde 1 px en la tinta; icono de 16 y botón de cierre de 16 opcionales. Estados: normal, hover, activo, deshabilitado |
| **Botón** (5.15) | 40 de alto, relleno 16, radio 16, texto 12 / 600 en mayúsculas | **32 de alto, relleno 12, radio 12** (`border/radius/3`), separación 4, texto 10 / 500 con espaciado 0,1, icono de 16. Jerarquías: **primary** (fondo en la tinta, texto `main-inverted`), **secondary** (borde 1 px en la tinta), **tertiary** (sin borde ni fondo), **danger** (rojo). Cada una con variante *inverted* y estados normal, foco, hover, activo y deshabilitado |
| **Botón de icono** (5.16) | 40×40, radio 16 | **32×32, radio 12**, icono de 16 |
| **Interruptor** (5.4) | 40×24, indicador de 20 | **32×20**, relleno 2, indicador de 16, borde 1 px en la tinta, radio completo. En la librería el estado encendido es pista blanca con indicador oscuro a la derecha (ver 8.3) |
| **Casilla** (5.8) | 24×24 | **20×20, radio 4**, marca de 12; marcada: fondo en la tinta |
| **Botón de radio** | no se usa | 18×20 |
| **Deslizante** (5.6) | Pista 2 px, tirador 16 | **Pista de 4 px** en `neutral/bg/muted` (`#cfd0dd`), relleno de 4 px en la tinta, **tirador de 20** en la tinta con borde 1 px `neutral/border/strong` y sombra `elevation/1x`. Componente de 200×20 |
| **Campo de texto** (5.7) | Etiqueta *Overline* | Etiqueta *Label* encima (separación 4), caja de **32 de alto, radio 4**, borde 1 px `neutral/border/strong`, fondo blanco, relleno 12, separación 8, texto 12 / 400 en `neutral/text/main`; texto de ayuda 10 / 400 en `neutral/text/soft`. Estado activo: borde en la tinta; error: rojo |
| **Búsqueda** | no se usa | 32 de alto, radio 4, icono de 20 y botón de borrar de 24 |
| **Selector** (5.17) | 40 de alto, botón oscuro a la derecha | Misma caja que el campo de texto: 32 de alto, radio 4, icono de 16 a la derecha. El dropdown de la app (`.ds-dropdown`) debería seguir esa caja |
| **Grupo de botones** (5.11) | 40 de alto, radio 16 | Elementos de **32 de alto**, ancho mínimo 80, relleno 8, texto 12 centrado, fondo blanco |
| **Botón de alternancia** | | 32×32 |

Resumen del criterio: **todos los controles de la interfaz miden 32 de alto** (botones, campos, selectores, grupo de botones) y 20 los pequeños (casilla, interruptor, tirador); **las cajas de entrada y las etiquetas usan radio 4** y los botones radio 12.

### 11.4 Decisiones abiertas nuevas

| # | Qué | Observación |
| :-- | :--- | :--- |
| 11 | **Texto de 10 px** | Caption, Label, tags y botones bajan a 10. Es pequeño para una herramienta que se usa mucho tiempo; Body small (12) para los textos que se leen, y 10 solo para etiquetas cortas, parece un buen equilibrio. Revisar en pantalla antes de aplicarlo en todo |
| 12 | **Interruptor encendido** | **Resuelto (5 oct 2026):** el Figma ya lo muestra con pista oscura e indicador blanco; la app lo sigue |
| 13 | **Radios de botón y de campo** | Botones y tarjetas 12, campos, tags y casillas 4. Es coherente (cada tipo tiene el suyo) pero conviene confirmar que los botones de forma del selector (hoy 40×40, radio 16) y las tarjetas de capa (radio 8) siguen la misma regla |
| 14 | **Anillo de foco** | La librería lo define con `primary/interactive/focus` (`#97bcf5`), de contraste bajo sobre blanco (alrededor de 1,9:1). Para teclado conviene un anillo en la tinta o en `primary/border/strong` (`#194d9c`). Decisión 8.5 sigue abierta |
| 15 | **Variables antiguas en el archivo** | Algunos componentes del Figma pueden seguir usando `border-radius/*` o `bbs-*` por haberse editado a mano; en el código se usan solo las de `border/radius/*`. Limpiar en Figma cuando convenga |
| 16 | **Tamaños mayores a 3xl** | `font-size/4xl` ya no aparece en las variables usadas; no se sabe si se eliminó |

### 11.5 Cómo aplicarlo (cuando se decida)

1. ✅ **Hecho:** `css/tokens.css` actualizado (familia, tamaños, radios renombrados para que `--border-radius-3` valga 12 y el 20 sea `--border-radius-5`, sizing, `default--inverted`/`hover--inverted` y variables nuevas), y fuente cargada: **Be Vietnam Pro** en lugar de Inter (`@import` de `css/studio-pro.css`) y **DM Mono** para los valores. Los componentes usan los nombres nuevos que equivalen a sus medidas de antes.
2. (Pendiente, es el paso 2 de 12.5)  Ajustar los componentes `.ds-*` de la tabla 11.3 y los tamaños que dependen de `sizing/7` (que pasa de 40 a 32).
4. Comparar capturas antes y después de cada paso y correr `tests/smoke.html` (hay pruebas que miden alturas y fuentes).

---

## 12. Rediseño del editor (Figma del 5 oct 2026) y decisiones

Fuente: página *Abstract studio* (nodo `5763:1691`): el frame del editor (`5763:1692`, 1512×863) y el tablero **«Contols layout»** (`5787:3471`), que es el **inventario** de controles del panel. **El editor del Figma es una muestra de estilo, no de funcionalidad**: lo que ya está desarrollado manda (los 9 paneles del riel, el botón Open, etc.). **El panel de controles se arma siguiendo el inventario**, no el frame del editor. Nada de esto está aplicado en el código todavía.

### 12.1 Decisiones tomadas (5 oct 2026)

| Tema | Decisión |
| :--- | :--- |
| **Nombre de la aplicación** | **Module Studio** (vuelve a usarse en la cabecera; sustituye a «Abstract Studio» de la sección 5.14) |
| **Botón Open** | Se queda donde está. El mockup no lo muestra solo porque es una muestra |
| **Riel** | Se mantienen los 9 paneles actuales; el décimo icono del mockup no cuenta |
| **Ancho del panel de controles** | **300 px** con relleno 24, o sea **252 de contenido** (confirmado): el deslizante mide 184 + 12 + 56 |
| **Panel y lienzo** | Se mantiene la regla: **el panel nunca tapa el lienzo**. El ancho del lienzo tiene un tope que deja libre el panel; si hace falta, el lienzo baja de alto |
| **Registro «Art log»** | Sí. Muestra la capa activa más cabeceras globales (ver 12.3) |
| **Texto de 10 px** | Aceptado: es el estilo *Label* del Figma (10 / 500) |
| **Barras de scroll** | Discretas: color negro al 50 % de opacidad, finas, para que no dañen el diseño |

### 12.2 Estructura nueva

**Cabecera (68 de alto, relleno 16).** Izquierda: marca y nombre. **Centro: los controles del lienzo**, que salen de la barra del lienzo para no competir con su tamaño: selector de proporción (32 de alto), cuadrícula, invertir y **color de las guías** (botón con un punto del color elegido; en el mockup es un punto rojo). Derecha: acciones de exportación (Config, Copy SVG, Download SVG; **Open se mantiene**) como botones secundarios de 32.

**Zona de trabajo.** Relleno de 16 a los lados y 24 abajo, separación de 24 entre columnas:
- **Panel de capas, 320 de ancho, alto completo.** Fondo `neutral/bg/strong`, radio 4. **Dividido en dos:** arriba la barra (título *LAYERS*, contador y *Add module*) y la lista de capas; abajo el registro **Art log**, separado por una línea `neutral/border/main`.
- **Lienzo.** Ocupa todo el alto libre; el ancho sale de la proporción (regla de la sección 5.18) y está limitado para no pasar bajo el panel de 300. Fondo blanco, **radio 4**.
- **Panel de controles (300) y riel de herramientas** a la derecha, como hasta ahora.
- Desaparece la **línea de estado** de debajo del lienzo: su contenido (tamaño y número de capas) pasa al registro.

**Tarjeta de capa.** 64 de alto, miniatura de 40 con radio 4, separación 12, relleno izquierdo 8 y derecho 16; línea inferior `neutral/border/main`. La activa, en la tinta (`neutral/interactive/default`), con texto `main-inverted`.

### 12.3 Registro «Art log»

- **Texto en `DM Mono` Medium** (12). Título «Art log» en `neutral/text/main`; las líneas en `neutral/text/subtle` y la palabra que nombra cada línea (*Modules*, *Structure*…) en `neutral/text/main`.
- **Orden:** título en mayúsculas (*ART LOG*), luego `Canvas:` (tamaño y número de capas, por ejemplo `800 × 800 PX • 2 LAYERS`) y `Modules:` (las formas de todas las capas); una línea en blanco; el **nombre de la capa activa** con su `Module:` (su forma) y, debajo, una línea por cada control **encendido**, en el orden de los paneles y con los mismos nombres que muestran los controles (por ejemplo `Structure: Repetition / Grid / C4 - R4 / Fit to canvas / Centers / None`). Se va llenando al encender controles y se vacía al apagarlos.
- Se genera a partir del estado; no guarda nada propio.
- **Scroll:** si el texto no cabe, scroll interno con la barra descrita arriba. No es un aria-live (anunciaría cada cambio de slider); es una región estática con nombre.

### 12.4 Panel de controles según el inventario («Contols layout»)

Medidas del inventario (320 de ancho, relleno 24, contenido 272) adaptadas al ancho de **300**: con relleno 24 el contenido mide **252**, por lo que el deslizante queda en 184 + 12 + 56. *Confirmar que el relleno sigue siendo 24 al bajar a 300.*

| Elemento | Medida |
| :--- | :--- |
| **Separación entre grupos** | **24 en todos** (arriba, hoy 16 entre grupos y 24 entre deslizantes) |
| **Cabecera** | Título (Heading), badge de capa, interruptor 32×20 y cierre **solo con icono de 16**, sin botón |
| **Botones de forma** | 32×32, radio 12, borde en la tinta; separación 8; el activo, en la tinta. Etiqueta encima a 8 |
| **Grupo de botones** (Stroke / Fill, Repetition / Radiation) | 40 de alto: relleno 4, fondo `neutral/bg/main`, borde 1 px `neutral/border/main`, botones de 32 |
| **Selector (dropdown)** | Etiqueta Label encima (4) y caja de 32 con radio 4 (ver 11.3) |
| **Tags** | 24 de alto, separados 4, etiqueta encima |
| **Deslizante + caja de valor** | Etiqueta encima; pista de 4 px y tirador de 20; la caja de valor es el *input-text* de 56×32 a la derecha, con 12 de separación |
| **Color** | Etiqueta, muestra de 24 y texto hex al lado |
| **Casillas** | Filas de 36 con la casilla de 20 a la derecha |
| **Advanced** | Acordeón de 40 de alto, con título y flecha |

### 12.5 Cómo aplicarlo, en orden

1. Tokens y fuente (11.5).
2. ✅ **Hecho (5 oct 2026):** controles del panel con el ancho de 300 (252 de contenido) y las medidas de 12.4: tarjeta con radio 4 y sombra `elevation/5x`, separación de 24 entre todos los grupos, etiquetas con el estilo *Label*, botones de forma de 32 (radio 12), grupo de botones de 40, tags de 24 con radio 4, selector de 32, deslizante con pista de 4 px y tirador de 20, caja de valor de 56×32 en DM Mono, casillas de 20, interruptor de 32×20 (pista blanca, indicador oscuro a la derecha cuando está encendido; el apagado lleva borde `neutral/border/strong`), acordeón *Advanced* de 40 y cierre con icono de 16. **Ajuste del 5 oct 2026 tras la segunda versión del inventario:** el título del panel es más pequeño (*Body small--Strong*, 12 / 600) y puede envolver con el badge, por lo que vuelve a llamarse *Layout structure*; el interruptor encendido es **pista oscura con indicador blanco** (el Figma lo cambió a petición); la fila de color es una sola línea con la etiqueta *Overline* a la izquierda y muestra (borde `neutral/border/main`) más hex a la derecha; el acordeón *Advanced* usa texto de 12 y relleno horizontal de 2; el dropdown abierto es una lista blanca sin borde, radio 4, relleno 4, separación 2, sombra `elevation/3x`, elementos de 32 con texto de 10 y fondo `hover--inverted` al pasar, y la caja cerrada lleva borde en la tinta mientras está abierta. En los valores del deslizante el relleno interno es 4 (no 12) para que quepan textos como `240px`.
3. ✅ **Hecho (5 oct 2026):** cabecera con relleno 16 en tres zonas (marca a la izquierda, controles del lienzo al centro, exportación a la derecha). Los controles del lienzo son el selector de proporción (100×32, caja de la librería), cuadrícula, invertir y el botón de guías con **icono de regla y un punto del color elegido** en la esquina. La barra del lienzo desaparece y el lienzo gana ese alto. Los botones de la cabecera pasan a 32 de alto, radio 12 y estilo *Label* en minúsculas; los botones de icono, a 32×32. La zona de trabajo lleva relleno de 16 a los lados y 24 abajo. **El riel** pasa a 64 de ancho, radio 4 y botones de 32 con radio 12; el panel de controles queda a 10 px del riel (`--flyout-right` = 90). El nombre en la cabecera y en el título de la página es **Module Studio**. Al lienzo, el tope de ancho sigue contando con el panel de 300 + 24 de aire.
4. ✅ **Hecho (5 oct 2026):** panel de capas dividido en dos mitades iguales sobre fondo `neutral/bg/strong` (radio 4, relleno vertical 8, separación 12): arriba la barra (*LAYERS* con el contador y *Add module*) y las filas de capa; abajo el registro **Art log**. Las filas miden 64 con miniatura de 40 y una línea inferior; la activa va en la tinta. El registro (DM Mono Medium 12, relleno 24, línea superior) muestra, con el título *ART LOG* en mayúsculas, `Canvas:` (tamaño y número de capas), `Modules:` (los módulos de todas las capas) y, bajo el nombre de la capa activa, `Module:` (su forma) y una línea por cada control encendido: *Structure*, *Rhythm*, *Similarity*, *Gradation*, *Anomaly*, *Contrast*, *Concentration*, *Texture* y *Space*. Se genera del estado en cada dibujo; la línea de estado de debajo del lienzo desaparece (sus datos están en la primera línea del registro).
5. ✅ **Hecho (5 oct 2026):** barras de scroll finas (6 px) en negro al 50 %, sin pista, en toda la interfaz.
