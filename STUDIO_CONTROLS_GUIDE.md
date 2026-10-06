# Guía Técnica de Controles del Panel de Studio e Interrelaciones
### Wucius Wong: Principles of Two-Dimensional Design

> **DOCUMENTO DE ESPECIFICACIÓN TÉCNICA Y PORTABILIDAD**
> Este documento detalla cada parámetro, control, fórmula geométrica e interrelación del panel de **Studio** (en la interfaz, *Module Studio*). Su objetivo es servir como referencia canónica y manual de implementación para trasladar estas capacidades a otros entornos de diseño generativo (como [Abstract Studio](https://github.com/dMore88/abstract-studio)).
>
> Para ver **qué concepto de Wong cubre cada control**, y qué conceptos faltan o se descartaron, mira [`docs/design-concepts-in-app.md`](docs/design-concepts-in-app.md). Las prioridades pendientes están en [`docs/BACKLOG.md`](docs/BACKLOG.md). Las decisiones de usabilidad (qué va visible y qué va en *Advanced*) están en [`docs/AUDITORIA_CONTROLES.md`](docs/AUDITORIA_CONTROLES.md).

---

## 📑 Índice
1. [Arquitectura y Jerarquía](#1-arquitectura-y-jerarquía)
2. [Canvas, Guías y Display](#2-canvas-guías-y-display)
3. [Capas y Módulo Base](#3-capas-y-módulo-base)
4. [Modifiers Stack: Especificación Detallada](#4-modifiers-stack-especificación-detallada)
   - [4.1 Layout › Repetition (Retícula Cartesiana)](#41-layout--repetition-retícula-cartesiana)
   - [4.2 Ritmo y gradación de estructura (antes panel Structure)](#42-ritmo-y-gradación-de-estructura-antes-panel-structure)
   - [4.3 Layout › Radiation (Estructura Polar)](#43-layout--radiation-estructura-polar)
   - [4.4 Similarity](#44-similarity-parentesco-y-variación-morfológica)
   - [4.5 Gradation](#45-gradation-transición-progresiva-sistemática)
   - [4.6 Anomaly](#46-anomaly-ruptura-focal-y-fractura)
   - [4.7 Contrast](#47-contrast-tensión-y-dominancia-de-minorías)
   - [4.8 Concentration](#48-concentration-campos-gravitatorios-y-densidad)
   - [4.9 Texture](#49-texture-deformación-de-geometría-como-efecto-de-textura)
   - [4.10 Space](#410-space-ilusión-tridimensional-y-extrusión-isométrica)
5. [Reglas de Interfaz (chips, dropdowns, Advanced, guías, teclado)](#5-reglas-de-interfaz)
6. [Matriz de Interrelaciones, Reglas Mecánicas y Precedencias](#6-matriz-de-interrelaciones-reglas-mecánicas-y-precedencias)
7. [Guía de Portabilidad para Abstract Studio](#7-guía-de-portabilidad-para-abstract-studio)

---

## 1. Arquitectura y Jerarquía

El panel estructura la generación gráfica en tres niveles. Cada **capa** (hasta 5) es un módulo independiente con su propio estado de modificadores:

```
┌────────────────────────────────────────────────────────┐
│               1. CANVAS, GUÍAS Y DISPLAY               │
│    (Aspect ratio, guías, color de guías, figura/fondo)  │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│         2. CAPAS (hasta 5) · MÓDULO BASE POR CAPA       │
│   (Forma, tamaño, rotación, offset, color, contenedor)  │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│    3. MODIFIERS STACK (por capa, un panel cada uno)     │
│ Layout · Similarity · Gradation · Anomaly · Contrast ·  │
│            Concentration · Texture · Space              │
└────────────────────────────────────────────────────────┘
```

**Paneles del riel** (de arriba abajo): Module, Layout, Similarity, Gradation, Anomaly, Contrast, Concentration, Texture, Space. El antiguo panel *Structure* ya no existe: sus proporciones viven en *Layout › Advanced* (sección 4.2).

### Jerarquía espacial: celda → contenedor → módulo

* La **celda** es el espacio de la retícula (columna × fila). Sobre ella actúa el ritmo A:B y la gradación de estructura.
* El **contenedor** es un marco (*Container width / height*, panel Module › Advanced) dentro de la celda. Por defecto coincide con ella. En *Fit to canvas* se escala con la celda; en *Actual size* **manda**: la celda toma el tamaño del contenedor.
* El **módulo** vive dentro del contenedor y se escala con él, **en proporción** (sin deformarse): según Wong, una figura repetida no se deforma; deformar es cosa de Similarity.

> **Nota:** el antiguo par *Form A / Form B* y sus 8 interrelaciones (detachment, touching, overlapping, penetration, union, subtraction, intersection, coincidence) fueron reemplazados por el sistema de capas. Las interrelaciones entre capas están **pendientes de rediseño** (backlog INT2, INT5 a INT9, al final de todo).

---

## 2. Canvas, Guías y Display

Controla el soporte físico y las ayudas de pantalla. Los botones están encima del lienzo.

| Parámetro / Control | Selector / Tipo | Rango / Valores | Función & Comportamiento Gráfico |
| :--- | :--- | :--- | :--- |
| `aspectRatio` | Dropdown | `1:1`, `9:16`, `4:3`, `3:4`, `16:9` | Modifica las dimensiones del canvas (sin margen de seguridad). Determina el tamaño de celda en retículas y el radio máximo en esquemas polares. |
| `showSafeBounds` | Botón de icono (rejilla) | `boolean` | Muestra u oculta las guías del lienzo: retícula de coordenadas de fondo, límites y marcos de contenedor. |
| `invertFigureGround` | Botón de icono (círculo mitad) | `boolean` | Invierte ópticamente figura y fondo: la figura asume el tono del papel y el fondo el de la tinta. |
| `guideColor` | Botón de icono (paleta) que abre el selector | color hex, por defecto `#F24822` | **Un solo color para todas las guías de pantalla** de los controles: marco del contenedor, punto focal de Anomaly, guía del atractor de Concentration y retícula isométrica de Space. Se guarda con el proyecto. La retícula de coordenadas de fondo y los límites del lienzo siguen en gris neutro. |
| Margen de seguridad | — | — | Retirado: vale 0. Las estructuras llegan al borde del lienzo. |
| `zoomLevel` | — | — | Retirado: el lienzo se ajusta solo al alto libre de la pantalla. |

**Ninguna guía se exporta.** Ni la retícula de fondo, ni los límites, ni el marco del contenedor, ni el punto focal, ni la guía del atractor, ni la retícula isométrica salen en el SVG ni en el PNG. Lo que sí se exporta es todo lo que es diseño, incluidas las **líneas visibles** de Layout (ver 4.1).

---

## 3. Capas y Módulo Base

Cada capa es un módulo independiente. Se pueden tener hasta 5 capas con visibilidad, orden (arrastrar y soltar), forma, color y pipeline de modificadores propios.

### 3.1 Controles de capa (panel Module)
* **`shape`**: una de las 22 formas del selector (`STUDIO_SHAPE_KEYS` en `js/studio/shapes.js`, en el orden de la rejilla, una familia por fila): básicas `circle`, `square`, `triangle`, `line`, `cross`, `ring`; curvas y direccionales `semicircle`, `quarter`, `crescent`, `wave`, `spiral`, `arrow`; polígonos `pentagon`, `hexagon`, `octagon`, `star`; caracteres `letterA`, `letterS`, `letterR`, `digit1`, `digit5`, `digit9`. Los botones y las tarjetas de capa usan iconos Phosphor en peso *regular* (campo `phIcon`; lista en `docs/DESIGN_SYSTEM_TOKENS.md`, sección 6); el anillo se muestra con su propio dibujo y las letras con su glifo. Los caracteres son vectoriales (no dependen de ninguna fuente) y `line` es una línea real. En Gradation › *Becomes*, Contrast › *Minority Shape* y Anomaly › *Focal Intruder Shape* la misma lista se ofrece como **dropdown** con icono y nombre.
* **`drawMode`**: *Stroke* (contorno) o *Fill* (relleno). **`color`**: color de la forma (hex). **`strokeWidth`**: grosor del trazo. En una figura estirada (ancho distinto del alto) el trazo **conserva un grosor uniforme**: se estira el contorno, no el lápiz.
* **`width` / `height`**: tamaño del módulo **exactamente en píxeles** del lienzo, de 1 a 2000 para todas las formas (base 50). Un círculo sigue siendo círculo con valores iguales. La línea solo tiene largo (*Width*): su *Height* se oculta. Con *Fit to canvas* ese tamaño se reparte entre las celdas (con 4 columnas, un módulo de 100 ocupa 25 px); en *Actual size* mantiene sus píxeles.
* **`rotation`**: ángulo de orientación (0 a 360º).
* **`offsetX / offsetY`**: desplazamiento relativo al centro, de −1000 a 1000 px.
* **`visible`**: visibilidad de la capa (icono del ojo en la tarjeta).
* **Advanced** (sección plegable al final del panel):
  * **`containerW` / `containerH`** (*Container width* y *Container height*, 10 a 2000 px, por defecto el lienzo entero): el **contenedor**, un marco centrado en el lienzo (como un frame de Figma) dentro del que se compone el módulo. Es la celda de *Actual size* y el recorte de *Clip container*.
  * **`showContainer`** (*Show container*, encendido por defecto): muestra u oculta el marco punteado del contenedor en el lienzo (usa el color de guías). El contenedor funciona igual aunque esté oculto.
* **`clipContainer`** (*Clip container*, casilla en *Advanced*, debajo de *Show container*, apagada por defecto): recorta el módulo al borde de su **contenedor**. En *Fit to canvas* el contenedor conserva sus proporciones y se reduce con la misma escala que el módulo (como un frame dentro de otro frame de Figma), también en una retícula con ritmo A:B; en *Actual size* es la celda; sin retícula es el marco centrado del lienzo; en radial acompaña al módulo en su anillo. Se puede usar a la vez que *Clip cell*: el módulo se recorta por los dos. Jerarquía: celda → contenedor → módulo.
* **Hide modifiers** (casilla en *Advanced*, debajo de *Show container* porque son del mismo grupo: ver el contenedor del módulo; apagada por defecto): ayuda de edición solo de pantalla. Mientras el panel *Module* está abierto, la capa activa se dibuja **sola, sin su Layout structure y sin sus siete modificadores** (Similarity, Gradation, Anomaly, Contrast, Concentration, Texture y Space): solo el módulo dentro de su contenedor. Para ajustarlo con los vecinos, se desmarca la casilla o se enciende la retícula a mano. Al abrir otro panel o cerrar el flyout, todo vuelve solo. No cambia el proyecto, no se guarda y **nunca afecta a una exportación**. Mientras actúa, el registro *Art log* muestra `Modifiers: hidden`.

---

## 4. Modifiers Stack: Especificación Detallada

### 4.1 Layout › Repetition (Retícula Cartesiana)
Multiplica el módulo en una retícula ortogonal sobre el plano cartesiano $X, Y$. El panel *Layout* tiene un interruptor general y un selector *Structure mode* (Repetition / Radiation, excluyentes).

**Visible al abrir:**
* **`gridType`** (*Grid structure variation*, dropdown con un icono por retícula):
  * `basic` (*Grid*): retícula ortogonal $M_{i,j}$.
  * `sliding` (*Brick*): desfase alternado de filas. Parámetro **Row offset** (`slideOffset`, 0 a 100 %).
  * `sheared` (*Diagonal*): cizallamiento diagonal. Parámetro **Shear angle** (`shearAngle`, 0 a 45º).
  * `curved` (*Curved*): deformación sinusoidal de las filas. Parámetro **Wave amount** (`curveAmount`, 0 % a 100 % del ancho de la celda, por defecto 10 %: con 100 % las líneas se desplazan una celda entera y nunca se cruzan). Los proyectos antiguos guardados en píxeles (`curveIntensity`) se siguen leyendo en píxeles hasta que se mueve el slider.
  * `zigzag` (*Zigzag*): deformación angular de las filas. Mismo parámetro *Wave amount*.
  * `triangular` (*Triangular*): filas impares desplazadas media celda.
  * `alternating` (*Alternating*): las celdas impares giran 180º.
  * `free` (*Free*): **distribución libre**, sin retícula. *Columns* × *Rows* dan la cantidad de módulos; se reparten dejando un espacio parecido alrededor de cada uno (reparto uniforme tipo ruido azul) y el parámetro **Seed** (`freeSeed`, 1 a 99) cambia la disposición. Los módulos se ordenan por filas para que Gradation, Contrast y los demás sigan teniendo un recorrido. No tiene líneas visibles, ni ritmo, ni Module placement ni Cell mix. En *Actual size* ocupa el bloque centrado de *Columns* × *Rows* contenedores.
  * `hexagonal` (*Hexagonal*): panal; las filas encajan (paso vertical de 0,866 del ancho de celda). El recorte de celda y las líneas visibles usan hexágonos.
* **Parámetro de la variación**, justo debajo del dropdown y solo con Brick, Diagonal, Curved y Zigzag.
* **`cols` / `rows`** (*Columns* y *Rows*, 1 a 50).
* **`sizeMode`** (*Module size*, `fit` por defecto):
  * `fit` (*Fit to canvas*): *Columns* y *Rows* dividen el lienzo y todo lo compuesto (el módulo dentro de su contenedor) se reduce **en proporción al lienzo**.
  * `actual` (*Actual size*): se repite **el contenedor del módulo tal cual**, *Columns* × *Rows* veces. Cada celda mide lo que mide el contenedor y el bloque queda centrado; si es mayor que el lienzo se sale por los bordes. Al activarlo con el contenedor por defecto, este arranca del tamaño de una celda de *Fit* para conservar el ritmo.
* **`placement`** (*Module placement*, chips Centers / Intersections / Both): dónde se colocan los módulos: en el centro de cada celda, en los cruces de las líneas, o los dos a la vez (dos clases de módulo entretejidas, fig. 23). **`interScale`** (*Intersection size*, 10 a 100 %, por defecto 50) es el tamaño de los módulos de los cruces. No aplica al panal.
* **`cellMix`** (*Cell mix*, chips None / Merged / Divided): `merge` convierte bloques alternos de 2×2 celdas en un módulo grande; `divide` parte esos bloques en módulos más pequeños (fig. 22f y 22g). Solo en retícula básica y alternada.

**En *Advanced* (plegable):**
* **`reflection`** (*Reflection*, dropdown): espeja el módulo en las columnas impares (`columns`), en las filas impares (`rows`) o en ambas (`both`). No invierte las rotaciones de Gradation ni los campos de Concentration.
* **`direction`** (*Direction*, dropdown, `repeated`): hacia dónde mira cada módulo. `repeated` todos igual; `alternated` las celdas alternas giran 180º; `undefined` cada módulo mira hacia un lado distinto, siempre el mismo para el mismo estado.
* **Ritmo y gradación de estructura** (sección 4.2).
* **`activeClipping`** (*Clip cell*): recorta cada módulo al borde de su **celda**, con la forma real de la celda en cada variación de retícula. No tiene que ver con el contenedor: para eso está *Clip container* en el panel Module.
* **`checkerInvert`** (*Checkerboard inversion*): en casillas alternadas la celda se rellena con el color del módulo y el módulo se dibuja con el color del fondo (inversión figura-fondo, con cualquier color de módulo).
* **`showGridLines`** (*Visible lines*): dibuja las líneas de la retícula. **Son parte del diseño (Wong)**: llevan color y grosor y **se exportan**. Opciones:
  * **`lineColor`** (*Line color*, vacío = el color de la capa). Para una línea que corte los módulos basta elegir el color del fondo (fig. 20b y 20c).
  * **`gridLineWidth`** (*Line width*, 0,5 a 6 px).
  * **`lineDirection`** (*Line direction*, dropdown): `both`, `horizontal` o `vertical` (fig. 20d).
  * **`lineSpacing`** (*Line spacing*, dropdown): `all` o `alternate` (una línea de cada dos).
  En el panal se dibuja cada hexágono y dirección y espaciado no aplican.
* `spacing` (separación entre celdas) existe en el estado con valor 0 y no tiene control en la interfaz.

---

### 4.2 Ritmo y gradación de estructura (antes panel Structure)
Viven en *Layout › Repetition › Advanced* y escalan **el espacio** de la retícula. Requieren retícula cartesiana; no aplican al panal. Estado en `layer.structure.formalStructure`.

* **Ritmo A:B** — **`colRatio`** y **`rowRatio`** (*Col B size [% of A]* y *Row B size [% of A]*, **10 % a 100 %**, por defecto 100 %; el valor guardado sigue siendo el factor 1 a 10, p. ej. 40 % = 2,5): alternan columnas (o filas) A y B; el slider muestra el tamaño de B como porcentaje de A (100 % = iguales, 10 % = B mide una décima parte de A). La **A es la base** y conserva el tamaño del módulo; la **B mide A ÷ ratio** y el módulo **se encoge en proporción**, con la escala del lado más pequeño de su celda. En *Fit* el lienzo se reparte A:B; en *Actual size* la A es el contenedor y la B es más angosta, y el conjunto queda centrado. Con ratio 1 no cambia nada.
* **Gradación de estructura** — **`colGrade`** y **`rowGrade`** (*Col gradation* y *Row gradation*, −30 a 30 %, por defecto 0; fig. 44): cada columna (o fila) es ese porcentaje más ancha (o más angosta, con valores negativos) que la anterior. Se combina con el ritmo (los efectos se multiplican). En *Fit* el lienzo se reparte con esos pesos; en *Actual size* la primera columna es el contenedor y las siguientes crecen o decrecen a partir de ella. El módulo sigue a su celda en proporción, con la misma regla del ritmo.
* Mover cualquiera de estos sliders enciende la estructura rítmica automáticamente. Al verse con módulos centrados, el ritmo se aprecia mejor con *Visible lines*, *Checkerboard inversion* o *Clip cell*.
* Existen también `mode`, `bandThickness` y `showBands` (líneas estructurales dibujadas con grosor propio) como estado heredado, sin control propio en la interfaz.

---

### 4.3 Layout › Radiation (Estructura Polar)
Genera el espacio desde uno o varios centros focales con coordenadas polares $(r, \theta)$.

**Visible al abrir:**
* **`scheme`** (*Radiation scheme*, dropdown):
  * `centrifugal`: rayos rectos que nacen del foco y se proyectan hacia fuera.
  * `centripetal` (fig. 50): los ángulos de las líneas estructurales apuntan hacia el centro. Orientación automática hacia dentro; las guías son chevrones anidados.
  * `concentric`: anillos que se expanden desde el epicentro.
  * `spiral`: rayos curvos continuos con torsión angular acumulada.
  * `multi_center` (*Multi-center*): de 2 a 6 focos concurrentes con interferencia mutua. Con 2 los focos quedan a izquierda y derecha; con más se reparten parejos en un círculo pequeño.
* **`rays`** (*Angular rays*, 4 a 36) y **`rings`** (*Concentric rings*, 2 a 16).
* **`centerCount`** (*Centers*, 2 a 6, por defecto 2): solo con *Multi-center*.
* **`spiralTwist`** (*Spiral twist*, −180º a 180º): torsión acumulada.
* **`sizeMode`** (*Module size*): `actual` hace lo mismo que en la cuadrícula: el módulo conserva su tamaño real y cada anillo tiene de grosor la *Container height*.

**En *Advanced*:**
* **`orientation`** (*Module orientation*, dropdown, `auto`): `auto` depende del esquema; `outward`, `inward`, `tangent` o `fixed` (sin giro).
* **`direction`** (*Direction*, `repeated`): igual que en la cuadrícula, encima de la orientación.
* **`ringShape`** (*Ring shape*, dropdown, `circle`; fig. 49b y 49g): la forma de cada anillo: `circle`, `triangle` y `pentagon` (punta arriba), `square`, `hexagon` u `octagon` (lado plano arriba). Los módulos, las líneas visibles, los sectores del recorte y la inversión figura-fondo siguen al polígono; *Ring rotation* gira cada polígono. No aplica a `spiral` ni `centripetal`.
* **`centerOpen`** (*Open center*, 0 a 70 %): radio del agujero central; anillos y rayos empiezan en su borde (fig. 48d).
* **`ringRotation`** (*Ring rotation*, −90º a 90º): grados que cada anillo gira más que el interior (fig. 49g).
* *Clip cell*, *Checkerboard inversion* y **Visible lines** (`showRays` / `showRings`, con **`lineColor`** y **`lineWidth`**, 0,5 a 6 px): igual que en la cuadrícula; son diseño y se exportan.
* `centerX / centerY`: foco excéntrico (en el estado).

---

### 4.4 Similarity (Parentesco y Variación Morfológica)
Rompe la rigidez de la repetición pura con variaciones de parentesco entre módulos. Requiere retícula.

**Visible:** **`kinshipType`** (*Visual kinship type*, dropdown) y **`intensity`** (*Fluctuation intensity*, 0 a 100 %).
* `distortion` (*Elastic*): estiramiento anamórfico pseudoaleatorio. `foreshortening` (*3D tilt*): pérdida de escala en un sentido. `rotation_wobble` (*Wobble*): oscilaciones del ángulo. `scale_kinship` (*Scale*): fluctuación de tamaño. `hybrid`: todas a la vez.

**En *Advanced*:**
* **`association`** (*Association*, dropdown): mezcla formas de **una misma familia visual** (`round`, `angular`, `lines`, `characters`: letras A, S, R y los números); **`assocMix`** (*Association mix*, 0 a 100 %, por defecto 50) es el porcentaje de módulos que cambian. Anomaly y Contrast mandan sobre la asociación en forma.
* **`imperfection`** (*Imperfection*, dropdown): `cut` corta una porción con una recta; `broken` parte el módulo y desliza las mitades. **`imperfAmount`** (*Imperfect modules*, 0 a 100 %, por defecto 30).
* **`cellJitter`** (*Spatial cell jitter*, 0 a 30 px): desplazamiento orgánico del centro de cada celda.
* `seed`: semilla generativa (en el estado).

---

### 4.5 Gradation (Transición Progresiva Sistemática)
Genera una ilusión de movimiento, velocidad o dimensión mediante una progresión sistemática de módulos. Requiere retícula.

**Visible:**
* **`type`** (*Attribute*, dropdown): `rotation`, `scale`, `depth`, `drift` (desplazamiento acumulado), `shape` (la forma se convierte paso a paso en `targetShape`, *Becomes*, la lista de 22 formas en dropdown, interpolando contornos) `texture` (la deformación de Texture crece a lo largo del recorrido) y `color` (el color del módulo viaja hacia *End color* a lo largo del recorrido; *Range* controla cuánto avanza; los módulos de acento de Anomaly o Contrast conservan su color).
* **`pathway`** (*Pathway direction*, dropdown): `diagonal`, `horizontal`, `vertical`, `concentric` y `zigzag` (camino en serpiente, fig. 41).
* **`range`** (*Range*, 15º a 360º): magnitud total de la transición. **`steps`** (*Cycles*, 1 a 4).

**En *Advanced*:**
* **`sequence`** (*Sequence*, dropdown): `restart` (1-2-3-1-2-3) o `pingpong` (1-2-3-2-1).
* **`easing`** (*Acceleration*, −100 a 100): positivo arranca lento y acelera; negativo arranca rápido y frena (fig. 38).
* **`alternate`** (*Alternate rows*): las filas impares corren en sentido contrario (fig. 43). Con *Ping-pong*, que va y vuelve igual, las filas impares quedan desfasadas medio ciclo. Se oculta en el recorrido *Zigzag*, que ya corre de ida y vuelta.
* **`reverse`** (*Reverse Gradient Direction*): invierte el sentido. Con *Ping-pong* la onda empieza por el otro extremo (arranca en lo alto en vez de en lo bajo).

En esquema polar, `drift` desplaza el módulo sobre su eje local hasta cerca de un anillo. Estado por capa en `layer.structure.gradation`. (No confundir con la *gradación de estructura* de la sección 4.2, que gradúa el tamaño de las celdas.)

---

### 4.6 Anomaly (Ruptura Focal y Fractura)
Introduce una zona de irregularidad donde prevalece una estructura regular previa. Requiere retícula. Estado en `layer.structure.anomaly`.

* **`type`** (*Type*, chips): `focal` (epicentro circular que transforma los módulos inscritos), `fracture` (*Rupture*: falla transversal que desfasa los módulos a ambos lados), `swell` (deformación que expande y empuja), `tear` (*Void*: vacío de módulos) y `regrid` (*Another grid*: dentro de la zona la retícula cambia a otra variación).
* **`distribution`** (*Distribution*): `single` (un epicentro), `regular` (`count` anomalías en retícula escalonada) o `random` (al azar sin tocarse, fig. 56b). Con varias, aparecen **`count`** (2 a 12) y, solo en `random`, **`seed`** (1 a 99).
* **`attrs`** (*Deviates in*, chips múltiples): en qué atributos se desvía (forma, escala, rotación, posición). **`anomalousShape`** (*Focal Intruder Shape*, la lista de 22 formas, en dropdown).
* **`zoneGrid`** (*Grid inside the zone*, solo con `regrid`): Brick, Diagonal, Curved, Zigzag, Triangular o Alternating; las celdas cuyo centro cae dentro de la zona (radio *Radius*, alrededor de cada epicentro) siguen esa variación y el resto la retícula de Layout. Solo aplica a la retícula, no al radial; con `regrid` se ocultan *Deviates in* y *Severity*. La casilla de acento tiñe los módulos de la zona.
* **`radius`** (*Radius*, 50 a 350 px) e **`intensity`** (*Severity*, 10 a 100 %).
* **Punto focal.** Ya no hay sliders X / Y: el punto está **visible por defecto** al activar el control y se mueve con un **clic en el lienzo** con la pestaña Anomaly abierta (`epicenterX / epicenterY`). La casilla **`showReticle`** (*Show focal point*) lo oculta. Se dibuja con el color de guías y no se exporta.
* **Color de acento:** la fila *Accent color* (`accentColor`) resalta los módulos anómalos. Elegir un color enciende el resaltado (`highlightColor`); el botón **×** lo quita (la fila muestra *None*).

---

### 4.7 Contrast (Tensión y Dominancia de Minorías)
Establece disparidad formal entre una **mayoría dominante** y una **minoría discordante**. Requiere retícula. Estado en `layer.structure.contrast`.

* **`dimension`** (*Dimension*, dropdown con siete opciones):
  * `scale`: minoría monumental (`scaleFactor`, *Contrast Scale Multiplier*, 0,2 a 3x, por defecto 2,2).
  * `shape`: minoría con glifo discordante (`contrastShape`, *Minority Shape*, la lista de 22 formas, en dropdown).
  * `direction` (*Angle*): minoría rotada (`angle`, *Clash Angle*, 15º a 90º).
  * `position` (*Position*): la minoría se desplaza dentro de su celda: **`positionShift`** (*Shift*, 5 a 50 % del lado menor de la celda, por defecto 25) en la dirección **`positionAngle`** (*Shift direction*, 0 a 360º). La mayoría queda centrada.
  * `tone` (*Tone*): la minoría se dibuja en otro **tono del color del propio módulo**, más claro, hacia el color del fondo. **`toneAmount`** (*Tone*, 10 a 90 %, por defecto 50). Sirve igual en relleno que en contorno.
  * `texture`: solo la minoría recibe la deformación de Texture.
  * `space`: la minoría se dibuja con figura y fondo invertidos. Con *Checkerboard inversion* se combinan por exclusión.
* **`dominanceRatio`** (*Dominance ratio*, 50 a 95 %, por defecto 80).
* **`spread`** (*Minority spread*, dropdown): dónde cae la minoría. `scattered` (al azar, por defecto), `balanced` (repartida con parejo, sin racimos ni huecos), `edge` (se acumula hacia los bordes) o `center` (hacia el centro). Funciona en retícula y en radial.
* **Color de acento:** la fila *Accent color* (`accentColor`) destaca la minoría; elegir un color enciende el acento (`highlightContrast`) y el **×** lo quita. Manda sobre el tono.
* Cada dimensión muestra solo sus controles. Contrast no tiene puntero en el lienzo.

---

### 4.8 Concentration (Campos Gravitatorios y Densidad)
Agrupa o dispersa los módulos según campos de fuerza invisibles. Requiere retícula. Estado en `layer.structure.concentration`.

* **`mode`** (*Structure*, chips): `point`, `void`, `line`, `line_void` (*Away from line*), `free` (*Hotspots*, de 2 a 6 focos), `dense` (todo el diseño se comprime hacia el atractor) y `sparse` (todo se dispersa).
* **`method`** (*Method*): `move` desplaza los módulos; `absence` no mueve nada y hace desaparecer módulos según la densidad (el mecanismo que el libro usa en estructuras formales). No se muestra en `dense` ni `sparse`.
* **`lineAxis`** (*Line axis*): solo en `line` y `line_void`.
* **`focusCount`** (*Foci*, 2 a 6, por defecto 2): solo en `free`. El atractor y sus copias girando alrededor del centro del lienzo; con 2 son el atractor y su simétrico. Cada módulo se dirige al foco más cercano, y *Absence* usa todos los focos.
* **Field style** (chips que se pueden **mezclar**): **`edgeFade`** (*Soft edge*, solo en `dense` y `sparse`: el efecto se debilita hacia los bordes), **`alignToField`** (*Flowing*: los módulos giran tangentes al campo) y **`densityScale`** (*Dynamic density*: la escala depende de la cercanía al polo).
* **`attractorX / attractorY`** (*X / Y position*, 5 a 95 %): también se fija con un clic en el lienzo.
* **`power`** (*Gathering pull*, 20 a 100 %) y **`radius`** (*Field radius*, 80 a 450 px; no en `dense` ni `sparse`).
* **`showAttractor`** (*Display Attractor Guide*, casilla): dibuja el campo y el punto atractor con el color de guías; no se exporta.

---

### 4.9 Texture (Deformación de Geometría como Efecto de Textura)
No es una textura de píxeles: son deformaciones de la geometría de cada módulo que producen un efecto artesanal (trazo a mano, deshilachado, ruptura de línea). Cada forma se convierte en una polilínea y se alteran sus vértices con un ruido determinista (estable por capa y celda). Estado en `layer.structure.texture`. Modificador autónomo: funciona en módulo único y sobre cualquier retícula. Se aplica antes de Space.

* **`jitter`** (*Jitter*, 0 a 8 px, por defecto 1): temblor de cada vértice.
* **`skipChance`** (*Line skipping*, 0 a 60 %, por defecto 10): omite vértices y rompe el trazo (solo en modo trazo).
* **`crossing`** (*Strand crossing*, 0 a 60 %, por defecto 10): intercambia vértices cercanos (solo en modo trazo).
* **`undulation`** (*Perimeter undulation*, 0 a 30 px, por defecto 10): onda senoidal sobre la normal del contorno.

Los px de `jitter` y `undulation` están expresados para un módulo de 100 px y se escalan al tamaño real (la forma `line` usa 450 px como referencia). Las formas de trazo abierto (`line`, `wave`, `spiral`, `letterA`, `letterS`, `letterR`, `digit1`, `digit5`, `digit9`) son rutas abiertas: en modo trazo se ven como línea fina y en relleno como trazo grueso; no usan extrusión de Space.

---

### 4.10 Space (Ilusión Tridimensional y Extrusión Isométrica)
Transforma el espacio plano en una experiencia volumétrica. Estado en `layer.structure.space`. Modificador autónomo.

* **`mode`** (*Mode*, chips): `isometric` (proyección a 30º con facetas de luz y sombra), `foreshortening` (*3D tilt*), `fluctuating` (planos que avanzan y retroceden; celdas vecinas alternan la extrusión) y `conflicting` (*Paradox*: figuras imposibles).
* **`depth`** (*Extrusion depth*, 10 a 80 px), **`angle`** (*Projection angle*, −60º a 60º, por defecto 30) y **`shading`** (*Facet shading contrast*, 20 a 100 %, por defecto 50).
* **`showIsoGuides`** (*Display 30º Isometric Grid Lines*, casilla): trama isométrica de apoyo, con el color de guías; no se exporta.

---

## 5. Reglas de Interfaz

* **Chips o dropdown.** Chips para 2 o 3 opciones de uso frecuente. Dropdown (`.ds-dropdown`) para 4 o más, o para lo que se toca poco. Los elementos del dropdown son los mismos botones con `data-*` que antes eran chips; el menú solo se abre y se cierra, y el botón muestra el activo. Los chips que se pueden mezclar son selección múltiple (cada uno se enciende y apaga solo).
* **Lo esencial arriba, el resto en *Advanced*.** Cada panel muestra de entrada lo que define el resultado y deja lo secundario en una sección plegable *Advanced* (Module, Layout, Similarity, Gradation).
* **Orden dentro de un panel:** selectores (chips, dropdowns, rejilla de formas), después sliders, después casillas. Excepción deliberada en *Layout*: *Columns* y *Rows* van justo debajo del selector de retícula.
* **Una columna.** Todos los controles del panel de 340 px van en una columna, con 24 px entre sliders. Los grupos de botones solo se usan para Stroke/Fill y Repetition/Radiation.
* **Las líneas visibles son diseño** (color y grosor, se exportan); **las guías no** (un color global, no se exportan).
* **Color de acento = encendido.** En Anomaly y Contrast no hay casilla "highlight": elegir un color enciende el acento y el **×** lo apaga.
* **Teclado en las cajas de valor.** Con el cursor en una caja de valor, **↑** sube y **↓** baja el número en pasos iguales a los del slider; **Shift** avanza diez pasos y **Alt** una décima de paso. Respeta los límites y conserva la unidad (px, %, º).
* **Iconos.** Phosphor 2.1.1, peso *regular* en toda la app.
* **Sin diseño inventado.** Los controles nuevos salen del catálogo de componentes; si ninguno encaja, pasan al backlog de diseño.

---

## 6. Matriz de Interrelaciones, Reglas Mecánicas y Precedencias

El motor implementa el modelo de **Contrato Asistido (Opción B)**, aplicado por capa:

```
                           ┌─────────────────────────┐
                           │     CAPA (MÓDULO)       │  (Autónomo: siempre activo)
                           └────────────┬────────────┘
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 ▼                                             ▼
       ┌───────────────────┐                         ┌───────────────────┐
       │    REPETITION     │ ◄─── EXCLUSIÓN MUTUA ──► │     RADIATION     │
       │   (Cartesiano)    │                         │      (Polar)      │
       └───────────────────┘                         └───────────────────┘
        (el ritmo y la gradación de estructura viven aquí, en Advanced)
```

### Regla 1: Exclusión Mutua Topológica (Cartesiano vs. Polar)
* Las coordenadas cartesianas ($X, Y$) de `Repetition` y las polares ($r, \theta$) de `Radiation` son geometrías excluyentes: *Structure mode* elige una u otra.

### Regla 2: Estructura rítmica solo en retícula cartesiana
* El ritmo A:B y la gradación de estructura son propiedades de la retícula cartesiana: solo existen en *Repetition* y no aplican al panal. Mover cualquiera de sus sliders enciende la estructura rítmica de la capa.

### Regla 3: Modificadores Colectivos Asistidos
* `Similarity`, `Gradation`, `Anomaly`, `Contrast` y `Concentration` operan sobre una **población de módulos**.
* En módulo único (sin `Repetition` ni `Radiation`) se pueden encender y calibrar, y la interfaz muestra un aviso no intrusivo mientras la retícula esté apagada, aunque el modificador no esté encendido: *Turn on Layout structure (Repetition or Radiation) to see this effect across many modules.* El aviso desaparece al encender Layout.
* Si se apaga temporalmente la retícula, los modificadores **no pierden su calibración**.

### Regla 3b: Precedencia cuando varios modificadores tocan lo mismo
Sobre un mismo módulo, los efectos se aplican en este orden: Concentration (posición y densidad), Gradation, Similarity, Anomaly y Contrast. Cuando coinciden:
* **Escala:** se **multiplican** (Concentration, Anomaly y Contrast); el producto se limita a 8x. Gradation escala aparte, sobre el lienzo.
* **Giros:** se **suman** (Gradation, Similarity, Anomaly y el ángulo de Contrast).
* **Forma y color de acento:** **gana Anomaly** sobre Contrast. Fuera de la zona de la anomalía, Contrast actúa con normalidad. El color de acento de Contrast también manda sobre su tono.

### Regla 4: Modificadores Autónomos Omnipresentes
* `Texture` y `Space` operan tanto en módulo único como sobre cientos de instancias, en retícula o en radial.

---

## 7. Guía de Portabilidad para Abstract Studio

Para incorporar estos conceptos dentro de [Abstract Studio](https://github.com/dMore88/abstract-studio):

1. **Enriquecer las Difference Layers:** reutilizar las operaciones booleanas entre figuras (union, subtraction, intersection) cuando se rediseñen las interrelaciones entre capas.
2. **Curvas de Gradación en la Trama Lineal:** en lugar de una separación lineal idéntica entre líneas, aplicar la lógica de `Gradation` (`steps`, `pathway`, `rotation`, `scale`) para modular densidad y grosor de trazo en forma de onda.
3. **Campos Atractores en el Esculpido Automático:** la lógica de `Concentration` (`mode: point`, `mode: void`, `radius`, `power`) puede integrarse como un modo generativo previo o complementario al pincel de esculpido manual.
4. **Arquetipos Radiales Avanzados:** expandir los generadores radiales con los esquemas de `Radiation`: `centrifugal`, `concentric`, `spiral` con torsión continua (`spiralTwist`), centros múltiples (`multi_center`) y anillos poligonales (`ringShape`).
