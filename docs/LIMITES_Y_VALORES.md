# Límites y valores por defecto de Module Studio

Estado a 7 oct 2026, leído del código (`index.html`, `js/studio/studio-engine.js`, `js/studio/studio-pro-app.js`). Sirve para revisar los límites de la app y decidir si subir o bajar alguno. Las unidades "px" son del **lienzo de dibujo** (por ejemplo 600 en un 1:1), no de la pantalla.

---

## 1. El lienzo

### 1.1 Tamaño de dibujo y de pantalla

| Proporción | Tamaño de dibujo (y del SVG) | Nota |
| :-- | :-- | :-- |
| 1:1 | 600 × 600 | |
| 9:16 | 450 × 800 | |
| 4:3 | 800 × 600 | |
| 3:4 | 600 × 800 | |
| 16:9 | 800 × 450 | |

- **El SVG exportado** sale con ese tamaño y es vectorial, así que se escala sin pérdida. El PNG se exporta al doble.
- **En pantalla** el lienzo se ajusta al alto libre de la ventana (marco blanco de 20 px alrededor) y su ancho sale de la proporción; el ancho tiene un tope para no pasar bajo el panel de controles (300 px + 24 de aire). El lienzo nunca baja de 120 px de alto interior (160 de ancho exterior). Pantalla y dibujo son lo mismo, a otra escala.
- **No hay margen de seguridad:** el margen del lienzo vale 0, y todo lo que queda fuera del borde se corta.

### 1.2 Fit to canvas: el módulo y su celda

**Vocabulario:** el **módulo** es la pieza de papel que se repite (*Module width / height*, con sus shapes dibujadas encima y cortadas en su borde); la **celda** es el espacio de la retícula que lo recibe; el **composition container** es la hoja donde se reparten las celdas.

En Fit, columnas y filas dividen el composition container (por defecto, todo el lienzo). Hay dos formas de tratar el módulo (*Module scale*, en *Advanced*):

- **Base size** (por defecto): el módulo **conserva su tamaño en px**. Un módulo de 100 px en celdas de 150 px se ve de 100 px; si es mayor que la celda, se solapa con los vecinos o, con *Clip cell*, se corta en la celda.
- **Shrink with cell:** el módulo **se escala con su celda**: tamaño dibujado = ancho del módulo × (celda ÷ lienzo). Con 4 × 4 celdas de 150 px, un módulo de 100 se dibuja de 25 px. Es lo que hacía la app antes de *Base size*; los proyectos antiguos se abren así.

| Qué | Valor | Nota |
| :-- | :-- | :-- |
| Módulo (ancho y alto) | 10 a 1000 px | 100 × 100 por defecto; 10 evita celdas degeneradas |
| Módulos máximos | 100 columnas × 100 filas | 10 000 |
| Radial | 3 a 60 rayos × 2 a 20 anillos | de 6 a 1 200 módulos |
| **Alcance del radial en Fit** | el último anillo termina al **50 % del lado menor** del composition container (un círculo inscrito que toca el borde); en *Multi-center* al **37 %**, para que los focos (a 35 % del radio) queden dentro | Es una constante del código (`refR`), no un límite de los sliders |

**Topes internos, en porcentaje.** El "5 %" que aparece en varios sitios es un piso del código, no del slider:
- Cada columna o fila, con *Col ratio* y *Col gradation*, no puede ser menor que el **5 %** de su tamaño base ni mayor que **20 veces** (`0,05 a 20`).
- *Gradation › Scale* no baja del **5 %** del tamaño del módulo.
- Los módulos de las intersecciones nunca bajan del 5 % (hoy el slider empieza en 10 %, así que no se llega).

**Techo de escala combinada.** Contrast, Anomaly y Concentration multiplican la escala del módulo, y el producto se limita a **8 veces**. Lo mismo vale para el ritmo A:B en una celda.

### 1.3 Actual size: hasta dónde puede llegar

En Actual el módulo se dibuja a su tamaño real (1 px por unidad) y la **celda es el módulo**, repetida columnas × filas veces en una cuadrícula centrada en el composition container, que **corta** lo que sobresale de su borde.

| Qué | Valor | Nota |
| :-- | :-- | :-- |
| Módulo (= celda) | 10 a 1000 px | 100 × 100 por defecto: al pasar a Actual size **conserva su tamaño** (así los módulos del mismo tamaño no se solapan) |
| Celda mínima al dibujar | 10 px | coincide con el mínimo del módulo |
| Cuadrícula máxima | 100 × 1000 = **100 000 px** de ancho y de alto | solo se ve lo que cae dentro del composition container y del lienzo |
| Lo que se ve | el centro de la cuadrícula, recortado al borde del composition container (y del lienzo) | con 9 columnas de 200 px solo caben unas 3 |

### 1.4 Otras medidas relevantes

| Qué | Valor |
| :-- | :-- |
| Capas | 1 a 5 |
| Deshacer | 60 pasos |
| Trazo | 0,2 a 10 px |
| Rotación del módulo | 0º a 360º (pasos de 0,5º) |
| Rotación de una shape | −180º a 180º (pasos de 1º) |
| Shapes por módulo | 1 a 4 |
| Líneas visibles | 0,5 a 10 px |
| Rendimiento (dibujo completo, medido) | 900 módulos 9 ms · 3 600 → 32 ms · 10 000 → 213 ms · con Texture 3 600 → 147 ms |

---

## 2. Los controles: mínimo, máximo, valor por defecto y razón de ser

El **valor por defecto** es el que tiene el control al abrir la app o al encender su panel. Las unidades (px, %, º, ×) son las que muestra la caja de valor.

### Module (el editor: shapes y módulo)
**Shapes** (de 1 a 4; ancho, alto y posición en px, desde el centro del módulo):
| Control | Mín. | Máx. | Paso | Por defecto | Razón |
| :-- | :-- | :-- | :-- | :-- | :-- |
| Shape width | 1 px | 2000 px | 1 px | 100 px (la primera); la mitad del módulo (las nuevas) | 1 permite el punto (concepto de punto de Wong); 2000 permite una shape mucho mayor que el módulo, que el borde corta. |
| Shape height | 1 px | 2000 px | 1 px | 100 px (la primera); la mitad del módulo (las nuevas) | Igual que Width; la línea no usa Height. |
| Shape position X / Y | −1000 px | 1000 px | 1 px | 0 px | Desde el centro del módulo; permite sacar la shape del módulo para que el borde la corte (módulo excéntrico y recortado). |
| Shape rotation | −180º | 180º | 1º | 0º | Gira la shape sobre su centro. |
| Relation › Direction | 0º | 360º | 1º | 0º | Hacia dónde se coloca la shape respecto a la anterior (0º derecha, 90º abajo). Solo con la relación *Distance*. |
| Relation › Gap | −500 px | 500 px | 1 px | 0 px (se tocan) | Separación entre los contornos: negativa solapa (penetración), positiva separa. Cubre de una shape bien dentro de la otra a bien lejos. |

**Módulo** (la pieza de papel):
| Control | Mín. | Máx. | Paso | Por defecto | Razón |
| :-- | :-- | :-- | :-- | :-- | :-- |
| Module width / height | 10 px | 1000 px | 1 px | 100 px | El tamaño de la pieza que se repite; 10 evita celdas degeneradas y 1000 supera cualquier canvas (máximo 800 px). |
| Module rotation | 0º | 360º | 0,5º | 0º | Gira la pieza entera; el medio grado afina la alineación. |
| Stroke width | 0,2 px | 10 px | 0,1 px | 1 px | Del hilo casi invisible al trazo grueso, sin que el trazo se coma la shape. |

### Layout › Composition container
Vale para Repetition y Radiation; es la hoja de papel del canvas donde vive el layout de la capa, justo debajo del diseño del modo activo, y **corta** lo que sobresale de su borde (también en Actual size). Se muestra en px del lienzo (600 × 600 en 1:1) y por dentro se guarda en %.

| Control | Mín. | Máx. | Paso | Por defecto | Razón |
| :-- | :-- | :-- | :-- | :-- | :-- |
| Composition container width / height | 10 px | 2000 px | 1 px | tamaño del lienzo (600 px en 1:1) | Tamaño de la hoja; más grande que el lienzo da fondos sangrados. |
| Composition container offset X / Y | −1000 px | 1000 px | 1 px | 0 px | Desfase del centro de la hoja respecto al centro del lienzo. |

### Layout › Repetition
| Control | Mín. | Máx. | Paso | Por defecto | Razón |
| :-- | :-- | :-- | :-- | :-- | :-- |
| Columns / Rows | 1 | 100 | 1 | 4 | Hasta 10 000 módulos; el motor los dibuja en ~213 ms (mejor con pocas capas y sin Texture). |
| Variation param (Row offset) | 0 % | 100 % | 1 % | 50 % | Desplazamiento de las filas impares, de ninguno a una celda entera. |
| Variation param (Shear angle) | 0º | 45º | 1º | 15º | Más de 45º deja de leerse como retícula. |
| Variation param (Wave amount) | 0 % | 100 % | 1 % | 10 % | Amplitud de la onda de Curved y Zigzag, como % del ancho de la celda (100 % = una celda entera; las líneas se mueven juntas y no se cruzan). |
| Free seed | 1 | 99 | 1 | 7 | Semilla del azar de Free: cada número da una disposición distinta pero repetible. |
| Intersection size | 10 % | 100 % | 5 % | 50 % | Tamaño de los módulos en los cruces respecto a los de los centros. |
| Col / Row B size [% of A] | 10 % | 100 % | 5 % | 100 % | Tamaño de B respecto a A: 100 % = iguales, 10 % = B mide una décima parte de A. Límite elegido por criterio de diseño. Internamente se guarda como factor 10 a 1. |
| Col / Row gradation | −30 % | 30 % | 1 % | 0 % | Cada columna o fila crece o se achica ese % respecto a la anterior; más de ±30 % explota en pocos pasos. |
| Line width | 0,5 px | 10 px | 0,5 px | 1,5 px | Grosor de las líneas visibles (son parte del diseño). |

### Layout › Radiation
| Control | Mín. | Máx. | Paso | Por defecto | Razón |
| :-- | :-- | :-- | :-- | :-- | :-- |
| Angular rays | 3 | 60 | 1 | 12 | Los mismos rayos en todos los anillos; en Actual size, con *Rays follow container* encendida (apagada por defecto), cada anillo calcula los suyos según el ancho del contenedor y el slider se oculta. 3 es el reparto mínimo (triangular); 60 rayos con 20 anillos son 1 200 módulos, que el motor dibuja sin problema. |
| Concentric rings | 2 | 20 | 1 | 6 | Hasta 20 anillos; un valor redondo que el motor aguanta bien. |
| Centers (multi-center) | 2 | 8 | 1 | 2 | De dos a ocho focos, repartidos en círculo (ocho = un octágono). |
| Spiral twist | −180º | 180º | 1º | 45º | Sentido y cantidad del giro de la espiral. |
| Open center | 0 % | 90 % | 1 % | 0 % | Hueco central; con 100 % los anillos tendrían grosor cero y no se vería nada, 90 % deja una corona fina. |
| Ring rotation | −90º | 90º | 1º | 0º | Giro acumulativo de cada anillo respecto al anterior. |
| Line width | 0,5 px | 10 px | 0,5 px | 1 px | Rayos y anillos visibles. |
| Ring shape (dropdown) | círculo | octágono | — | círculo | Círculo, triángulo, cuadrado, pentágono, hexágono y octágono (el polígono más cercano al círculo). |

### Similarity
| Control | Mín. | Máx. | Paso | Por defecto | Razón |
| :-- | :-- | :-- | :-- | :-- | :-- |
| Fluctuation intensity | 0 % | 100 % | 1 % | 50 % | De módulos idénticos a la máxima variación del parentesco. |
| Spatial cell jitter | 0 % | 90 % | 1 % | 0 % | Cuánto se corre cada módulo de su sitio, como % de su celda (100 % = el centro llega al borde de la celda; 90 % lo deja dentro). |
| Association mix | 0 % | 100 % | 1 % | 50 % | % de módulos que cambian a otra figura de la familia. |
| Imperfect modules | 0 % | 100 % | 1 % | 30 % | % de módulos cortados o rotos. |

### Gradation
| Control | Mín. | Máx. | Paso | Por defecto | Razón |
| :-- | :-- | :-- | :-- | :-- | :-- |
| Range | 5º | 360º | 5º | 180º | Alcance del efecto: 360º de giro, o hasta el máximo en los otros atributos; 5º se nota en figuras con vértices. |
| Cycles | 1 | 10 | 1 | 1 | Repeticiones de la rampa; en retículas chicas muchos ciclos parecen ruido, pero eso lo juzga quien diseña. |
| Speed | −100 | 100 | 5 | 0 | Qué tan pronto llega el efecto a su máximo: +100 enseguida, −100 muy tarde, 0 parejo. (Se guarda como `easing` con el signo contrario.) |

### Anomaly
| Control | Mín. | Máx. | Paso | Por defecto | Razón |
| :-- | :-- | :-- | :-- | :-- | :-- |
| Count | 1 | 10 | 1 | 5 | Cantidad de zonas dispersas; con más de 10 el patrón original cambia por completo. |
| Seed | 1 | 99 | 1 | 7 | Qué disposición al azar sale. |
| Radius | 10 px | 350 px | 5 px | 150 px | Tamaño de la zona; 10 px permite composiciones de módulos pequeños, 350 px cubre más de la mitad del lienzo. |
| Severity | 5 % | 100 % | 1 % | 60 % | Cuánto se desvía; 5 % sirve para anomalías muy sutiles. |
| Epicentro (clic en el lienzo) | 10 % | 90 % | continuo | 50 % / 50 % | Mantiene la zona dentro del lienzo. |

### Contrast
| Control | Mín. | Máx. | Paso | Por defecto | Razón |
| :-- | :-- | :-- | :-- | :-- | :-- |
| Dominance ratio | 50 % | 95 % | 1 % | 80 % | % de la mayoría regular; por debajo de 50 la minoría sería mayoría. |
| Contrast Scale Multiplier | 0,2× | 5× | 0,1× | 2× | De muy pequeño a cinco veces; el producto con otros multiplicadores sigue limitado a 8×. |
| Tone | 0 % | 100 % | 5 % | 50 % | Mezcla del color del módulo con el color de fondo del lienzo: 0 % = su color original (sin contraste), 100 % = igual al fondo (desaparece, como un vacío). |
| Shift | 0 % | 50 % | 1 % | 25 % | Cuánto se aleja el módulo de su centro, como % de la celda; 50 % lleva el centro al borde de la celda. |
| Shift direction | 0º | 360º | 5º | 45º | Dirección del desplazamiento; es la misma para todos los módulos de la minoría. |
| Clash Angle | 5º | 90º | 5º | 45º | Ángulo de choque; 5º se nota en figuras con vértices. |

### Concentration
| Control | Mín. | Máx. | Paso | Por defecto | Razón |
| :-- | :-- | :-- | :-- | :-- | :-- |
| Foci (Hotspots) | 2 | 8 | 1 | 2 | Focos de Hotspots; con 1 es el modo Point. |
| X / Y position | 0 % | 100 % | 1 % | 50 % / 50 % | El atractor puede ir hasta el borde o la esquina del lienzo. Con varios focos, estos mueven solo el primero. |
| Gathering pull | 10 % | 100 % | 1 % | 50 % | Fuerza de atracción; 10 % deja una atracción muy sutil. |
| Field radius | 10 px | 500 px | 5 px | 250 px | Alcance del campo; 10 px sirve para composiciones de módulos pequeños. |

### Texture
Jitter y Plane wave se muestran de 0 % a 100 %; por dentro se guardan en px para un módulo de 100 px y se escalan al tamaño real.

| Control | Mín. | Máx. | Paso | Por defecto | Razón |
| :-- | :-- | :-- | :-- | :-- | :-- |
| Jitter | 0 % | 100 % | 1 % | 10 % | Temblor fino de los vértices. 100 % = 10 px para un módulo de 100 px. |
| Line skipping | 0 % | 90 % | 1 % | 10 % | Probabilidad de que cada vértice se omita y el trazo se corte; a 90 % las figuras complejas quedan casi deshechas. Los pelos de Random lines tampoco crecen en los tramos omitidos. Solo en trazos. |
| Random lines | 0 % | 100 % | 1 % | 10 % | Probabilidad de que cada punto del trazo saque un pelo. Largo (1–50 % de un módulo de referencia de máx. 100 px), grosor (10–80 % del trazo, en cuatro niveles), curvatura (10–60 %) y ángulo son aleatorios y sin control. En trazo y en relleno (no bajo un volumen de Space). |
| Random lines opacity (Advanced) | 10 % | 100 % | 1 % | 85 % | Opacidad base de los pelos; los más finos son algo más tenues. |
| Plane wave | 0 % | 100 % | 1 % | 30 % | Cuánto se ondula el módulo entero, como una hoja. 100 % = 30 px para un módulo de 100 px (la onda desplaza los puntos hasta un 21 % del módulo). |
| Waves (Advanced) | 1 | 6 | 1 | 2 | Cuántas ondas cruzan el módulo. |
| Wave direction (Advanced) | 0º | 360º | 5º | 0º | Hacia dónde viaja la onda; los puntos se mueven de lado respecto a esa dirección. |

### Space
| Control | Mín. | Máx. | Paso | Por defecto | Razón |
| :-- | :-- | :-- | :-- | :-- | :-- |
| Extrusion depth | 5 % | 100 % | 1 % | 20 % | Profundidad como % del tamaño del módulo (un módulo de 200 px con 50 % se extruye 100 px); bajo 5 % no se ve volumen. Los proyectos antiguos en px se convierten al abrirlos (85 px = 100 %). |
| Projection angle | −180º | 180º | 1º | 30º | Dirección del volumen; con ±180º se cubren todas las direcciones. La cara frontal no se mueve. |
| Facet shading contrast | 5 % | 100 % | 1 % | 50 % | Diferencia de tono entre la cara frontal y el costado: a más %, el costado es más claro. Ni 5 % ni 0 % dan caras idénticas, el costado conserva ~60 % de la tinta de la cara frontal. |

---

## 3. Valores por defecto

### Al abrir la app
Una sola capa (**Layer 1**): un módulo de **100 × 100 px** con un círculo, trazo (no relleno), color `#18181f`, trazo 1 px, rotación 0°. El módulo no corta hasta que se abre y se guarda en el editor (ver STUDIO_CONTROLS_GUIDE, 3.1). Layout y los siete modificadores, apagados. Proporción 1:1, guías de cuadrícula encendidas, color de guías `#f24822`.

### Cuando se enciende cada control

**Layout › Repetition** (modo por defecto): variación Grid, 4 × 4, Fit to canvas, módulos en los centros, sin mezcla de celdas, dirección repetida, sin reflejo, *Clip cell* apagado, *Checkerboard* apagado, *Visible lines* apagado (grosor 1,5, color de la capa, ambas direcciones, todas las líneas). Variación: Row offset 50 %, Shear angle 15°, Wave amount 10 %. Tamaño de intersección 50 %. Free seed 7.
**Layout › Radiation:** esquema Centrifugal, orientación automática, 12 rayos × 6 anillos, Spiral twist 45°, centro cerrado, sin giro de anillos, 2 centros, anillos circulares, Fit to canvas, líneas apagadas (grosor 1).
**Ritmo A:B (Advanced):** Col y Row ratio 1, gradaciones 0 %.

| Panel | Por defecto al encenderlo |
| :-- | :-- |
| **Similarity** | Elastic, intensidad 50 %, jitter 0, asociación None (mix 50 %), imperfección None (cantidad 30 %), semilla 42 |
| **Gradation** | Rotate, Diagonal, Range 180, Cycles 1, Restart, Speed 0, filas alternas apagado, *Reverse* apagado, Becomes triangle, End color `#f43f5e` |
| **Anomaly** | Focal, un punto en el centro (50 %, 50 %), Radius 150, Severity 60, Single, Count 5, Seed 7, se desvía en forma, escala, rotación y posición, forma intrusa triángulo, zona Another grid = Brick, color de acento `#f43f5e` (apagado), punto visible |
| **Contrast** | Scale, Dominance 80 %, Scattered, Scale 2×, Tone 50 %, Shift 25 % a 45°, Clash angle 45°, forma de minoría cruz, color de acento `#f43f5e` (apagado) |
| **Concentration** | Point, Move, atractor en el centro (50 %, 50 %), Gathering pull 50 %, Field radius 250, 2 focos, eje horizontal, flujo y densidad apagados, guía del atractor apagada |
| **Texture** | Jitter 10 %, Line skipping 10 %, Random lines 10 %, Plane wave 30 % (2 ondas, 0º) |
| **Space** | Isometric, Extrusion depth 20 %, Projection angle 30º, Shading 50 %, guías isométricas apagadas |
| **Module scale** (Layout, Fit) | Base size (los proyectos antiguos se abren con Shrink with cell) |
