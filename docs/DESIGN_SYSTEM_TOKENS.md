# Module Studio — Design System

Fuente: archivo de Figma **Web apps**, con dos páginas:

- **Components pack** (nodo `108:7436`): librería de componentes y variables.
- **Abstract studio** (nodo `5763:1691`): el diseño de la aplicación.

Este documento describe los tokens y componentes **tal como están en Figma** y cómo se usan en el código. Los tokens viven en `css/tokens.css`.

> **Estado de la migración:** los paneles de **Gradation, Anomaly, Contrast, Concentration, Texture y Space** ya usan estos tokens (clases `.ds-*` en `css/studio-pro.css`). Los paneles **Module, Layout, Structure y Similarity** y la barra superior todavía usan el tema antiguo (`css/design-system.css`, variables `--bs-*`, ver el apartado 7). Su migración está en el backlog (Q3b).

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
| | `neutral/interactive/default--inverted` | `#e1e2eb` | Pista del interruptor apagado |
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

### 5.1 Tarjeta flotante del inspector (`.inspector-flyout-card` + `.ds-card`)
Ancho 400 px, relleno `spacing/6` (24), radio `border/radius/3` (20), separación interna `spacing/5` (16), sombra `elevation/3x`, fondo `neutral/bg/light`. Se sitúa a la izquierda del riel de herramientas.

### 5.2 Cabecera de tarjeta (`.ds-card-header`)
Título en *Body small* con `neutral/text/subtle`, seguido de un **badge** con el nombre de la capa y, a la derecha, el **interruptor** y el botón de cierre. Separación 18 px.

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
Altura 24 (`sizing/6`), relleno horizontal `spacing/4` (12), radio completo, borde `border/weight/1` en `neutral/interactive/default`, texto *Caption*.

| Estado | Fondo | Texto |
| :--- | :--- | :--- |
| Normal | `neutral/bg/light` | `neutral/text/main` |
| Hover | `neutral/interactive/hover--inverted` | `neutral/text/main` |
| Activo | `neutral/interactive/default` | `neutral/text/main-inverted` |

La librería define además un tag con icono y botón de cierre y estado deshabilitado (`neutral/interactive/disabled`, borde `neutral/border/muted`, texto `neutral/text/subtle`).

### 5.6 Control deslizante (`.ds-slider`) y caja de valor (`.ds-value`)
Pista de 2 px, tirador de 16 px (`assets/slider-thumb.svg`), separación 10 px; caja de valor de 62×31, radio 7, fuente monoespaciada 15 px. La caja de valor y la pista están **dibujadas en Figma con colores sueltos**, no con variables (ver Pendientes); en el código viven como tokens locales `--ds-*`.

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

### 5.10 Aviso (`.warning-alert-box`, `.render-error`)
En la librería, el *snackbar* y el *toast-notification* usan fondos `…/bg/soft`, texto `…/text/default` e iconos `…/icon/main`. El aviso de dependencias (ámbar) sigue el estilo `warning`; el aviso de error de dibujo usa la tinta oscura con `elevation/3x`.

### 5.11 Componentes de la librería que la app aún no usa
Breadcrumbs, paginación, loaders, ribbon alert, modal, card, input de texto, búsqueda, select, textarea, input numérico, lista, tabla, botón, enlace, grupo de botones, grupo de botones de alternancia, tabs, acordeón y tooltip.

---

## 6. Iconografía

[Phosphor Icons](https://github.com/phosphor-icons/homepage), 2.1.1. Peso **regular** (`ph ph-*`) para botones y controles; peso **fill** (`ph-fill ph-*`) para las formas que se colocan en el lienzo. Tamaños habituales: 12, 14, 16 y 20 px.

---

## 7. Tema antiguo (`css/design-system.css`)

Variables `--bs-*` (por ejemplo `--bs-accent-primary: #18181f`, `--bs-radius-card: 14px`), con una paleta propia que **no coincide con Figma** (la tinta antigua es `#18181f`, no `#282a36`). Siguen en uso en los paneles Module, Layout, Structure y Similarity, la barra superior, las tarjetas de capas y el riel. Se retirarán al migrar esos paneles al diseño de Figma (backlog **Q3b**).

---

## 8. Diferencias entre Figma y la app, y decisiones pendientes

| # | Qué | Detalle | Decisión |
| :-- | :--- | :--- | :--- |
| 1 | **Caja de valor y pista del slider** | En el diseño de la app usan colores sueltos (`#f0f0f2`, `#292932`, `#1d1d25`), no variables | Definir variables en Figma o mantener los tokens locales `--ds-*` |
| 2 | **Fuente monoespaciada** | Figma define `DM Mono` (estilo `Mono`), pero el diseño de la caja de valor usa Roboto Mono. La app no carga ninguna de las dos y cae a JetBrains Mono | Elegir una, cargarla y aplicarla |
| 3 | **Interruptor encendido** | La librería lo muestra con pista clara y borde oscuro; el diseño de la app, con pista oscura e indicador blanco | Unificar la librería con el diseño |
| 4 | **Checkbox apagado** | La librería usa fondo `neutral/interactive/default--inverted`; el diseño de la app, fondo blanco | Unificar |
| 5 | **Anillo de foco** | La librería usa `primary/interactive/focus` (`#97bcf5`), de poco contraste sobre blanco | La app usa un contorno de 2 px en la tinta; confirmar que se mantiene |
| 6 | **Controles sin mockup** | Selector de forma y ángulo en Contrast, eje de línea en Concentration, color de acento en Anomaly y Contrast | Diseñarlos en Figma |
| 7 | **Rampa de primitivos** | No se puede leer completa con las herramientas disponibles | Exportar la lista de variables desde Figma si se quiere documentar entera |

---

## 9. Cómo añadir un componente nuevo

1. Dibujarlo en Figma usando las variables de la sección 2 a 4.
2. Pasar el enlace del nodo.
3. Implementarlo con clases `.ds-*` y tokens de `css/tokens.css`; sin colores ni medidas sueltas.
4. Comprobarlo en `tests/smoke.html` y comparar los estilos calculados antes y después si se toca un componente ya existente.
