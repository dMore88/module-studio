# Límites y valores por defecto de Module Studio

Estado a 6 oct 2026, leído del código (`index.html`, `js/studio/studio-engine.js`, `js/studio/studio-pro-app.js`). Sirve para revisar los límites de la app y decidir si subir o bajar alguno. Las unidades "px" son del **lienzo de dibujo** (por ejemplo 600 en un 1:1), no de la pantalla.

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

### 1.2 Fit to canvas: hasta dónde llega el módulo

En Fit, columnas y filas dividen el lienzo y el módulo **se escala con su celda**:

> tamaño dibujado = Width × (celda ÷ lienzo)

Por eso un módulo con **Width igual al lado del lienzo (600 en 1:1) llena exactamente su celda**. Con la retícula de 4 × 4 (celdas de 150 px) un Width de 100 se dibuja de 25 px, el 16,7 % de su celda. Dicho de otra forma, **el Width es el tamaño que tendría el módulo si la celda fuera todo el lienzo**.

| Qué | Valor | Equivale a (1:1) |
| :-- | :-- | :-- |
| Width / Height mínimo | 1 px | 0,17 % de la celda (un punto) |
| Width / Height que llena la celda | = lado del lienzo (600) | 100 % de la celda |
| Width / Height máximo | 2000 px | 333 % de la celda (el módulo se sale de ella y de sus vecinos) |
| Módulos máximos | 100 columnas × 100 filas | 10 000 |
| Radial | 4 a 36 rayos × 2 a 16 anillos | de 8 a 576 módulos |
| **Alcance del radial en Fit** | el último anillo termina al **50 % del lado menor** del lienzo (un círculo inscrito que toca el borde); en *Multi-center* al **37 %**, para que los focos (a 35 % del radio) queden dentro | Es una constante del código (`refR`), no un límite de los sliders. Cambió el 6 oct 2026: antes era 42 % y 32 %, con un margen de 8 % por lado. La retícula siempre llena el lienzo porque sus celdas lo cubren por completo |

**Topes internos, en porcentaje.** El "5 %" que aparece en varios sitios es un piso del código, no del slider:
- Cada columna o fila, con *Col ratio* y *Col gradation*, no puede ser menor que el **5 %** de su tamaño base ni mayor que **20 veces** (`0,05 a 20`).
- *Gradation › Scale* no baja del **5 %** del tamaño del módulo.
- Los módulos de las intersecciones nunca bajan del 5 % (hoy el slider empieza en 10 %, así que no se llega).

**Techo de escala combinada.** Contrast, Anomaly y Concentration multiplican la escala del módulo, y el producto se limita a **8 veces**. Lo mismo vale para el ritmo A:B en una celda.

### 1.3 Actual size: hasta dónde puede llegar

En Actual el módulo se dibuja a su tamaño real (1 px por unidad) y la **celda es el contenedor**, repetida columnas × filas veces en un bloque centrado en el lienzo.

| Qué | Valor | Nota |
| :-- | :-- | :-- |
| Módulo | 1 a 2000 px | 1:1, sin escalar |
| Contenedor (= celda) | 10 a 2000 px | 0 significa "todo el lienzo" |
| Celda mínima al dibujar | 10 px | coincide con el mínimo del contenedor |
| Bloque máximo | 100 × 2000 = **200 000 px** de ancho y de alto | solo se ve lo que cae en el lienzo |
| Lo que se ve | el centro del bloque, recortado al borde del lienzo | con 9 columnas de 200 px solo caben unas 3 |

### 1.4 Otras medidas relevantes

| Qué | Valor |
| :-- | :-- |
| Capas | 1 a 5 |
| Deshacer | 60 pasos |
| Trazo | 0,2 a 10 px |
| Desplazamiento del módulo (Offset X/Y) | −1000 a 1000 px |
| Rotación | 0° a 360° (pasos de 0,5°) |
| Líneas visibles | 0,5 a 10 px |
| Rendimiento (dibujo completo, medido) | 900 módulos 9 ms · 3 600 → 32 ms · 10 000 → 213 ms · con Texture 3 600 → 147 ms |

---

## 2. Los controles: mínimo, máximo y razón de ser

### Module
| Control | Mín. | Máx. | Paso | Razón |
| :-- | :-- | :-- | :-- | :-- |
| Stroke width | 0,2 | 10 | 0,1 | Del hilo casi invisible al trazo grueso, sin que el trazo se coma el módulo. |
| Width | 1 | 2000 | 1 | 1 permite el punto (concepto de punto de Wong); 2000 permite módulos tres veces mayores que el lienzo (fondos, recortes). |
| Height | 1 | 2000 | 1 | Igual que Width; la línea no usa Height. |
| Rotation | 0 | 360 | 0,5 | Vuelta completa; el medio grado afina la alineación. |
| Offset X / Y | −1000 | 1000 | 1 | Cubre el lienzo de un lado al otro con holgura (el lienzo mide 450 a 800). |
| Container width / height | 10 | 2000 | 1 | Marco en el que se compone el módulo; 10 evita celdas degeneradas. |

### Layout › Repetition
| Control | Mín. | Máx. | Paso | Razón |
| :-- | :-- | :-- | :-- | :-- |
| Columns / Rows | 1 | 100 | 1 | Hasta 10 000 módulos; el motor los dibuja en ~213 ms (mejor con pocas capas y sin Texture). |
| Variation param (Row offset) | 0 % | 100 % | 1 | Desplazamiento de las filas impares, de ninguno a una celda entera. |
| Variation param (Shear angle) | 0° | 45° | 1 | Más de 45° deja de leerse como retícula. |
| Variation param (Wave amount) | 0 px | 60 px | 1 | Amplitud de la onda de Curved y Zigzag. |
| Free seed | 1 | 99 | 1 | Distribución de Free; la semilla elige cuál sale. |
| Intersection size | 10 % | 100 % | 5 | Tamaño de los módulos en los cruces respecto a los de los centros. |
| Col / Row B size [% of A] | 25 % | 100 % | 5 | Tamaño de B respecto a A: 100 % = iguales, 25 % = B mide un cuarto de A (límite elegido para que B no sea una raya). Internamente se guarda como factor 4 a 1. |
| Col / Row gradation | −30 % | 30 % | 1 | Cada columna o fila crece o se achica ese % respecto a la anterior; más de ±30 % explota en pocos pasos. |
| Line width | 0,5 px | 10 px | 0,5 | Grosor de las líneas visibles (son parte del diseño). |

### Layout › Radiation
| Control | Mín. | Máx. | Paso | Razón |
| :-- | :-- | :-- | :-- | :-- |
| Angular rays | 4 | 36 | 1 | Con menos de 4 no se lee como radial; 36 ya es muy denso. |
| Concentric rings | 2 | 16 | 1 | Hasta 16 anillos por legibilidad y rendimiento. |
| Centers (multi-center) | 2 | 6 | 1 | De dos centros a seis focos. |
| Spiral twist | −180° | 180° | 1 | Sentido y cantidad del giro de la espiral. |
| Open center | 0 % | 70 % | 1 | Hueco central; 70 % deja aún espacio para los anillos. |
| Ring rotation | −90° | 90° | 1 | Giro acumulativo de cada anillo respecto al anterior. |
| Line width | 0,5 px | 10 px | 0,5 | Rayos y anillos visibles. |

### Similarity
| Control | Mín. | Máx. | Paso | Razón |
| :-- | :-- | :-- | :-- | :-- |
| Fluctuation intensity | 0 % | 100 % | 1 | De módulos idénticos a la máxima variación del parentesco. |
| Spatial cell jitter | 0 | 30 px | 1 | Cuánto se corre cada módulo de su sitio. |
| Association mix | 0 % | 100 % | 1 | % de módulos que cambian a otra figura de la familia. |
| Imperfect modules | 0 % | 100 % | 1 | % de módulos cortados o rotos. |

### Gradation
| Control | Mín. | Máx. | Paso | Razón |
| :-- | :-- | :-- | :-- | :-- |
| Range | 15 | 360 | 5 | Alcance del efecto: 360° de giro, o hasta el máximo en los otros atributos; 15 es el mínimo apreciable. |
| Cycles | 1 | 4 | 1 | Repeticiones de la rampa; más ciclos dejan de leerse como gradación. |
| Acceleration | −100 | 100 | 5 | Curva del reparto: arranca rápido o lento. |

### Anomaly
| Control | Mín. | Máx. | Paso | Razón |
| :-- | :-- | :-- | :-- | :-- |
| Count | 2 | 12 | 1 | Cantidad de zonas dispersas. |
| Seed | 1 | 99 | 1 | Qué disposición al azar sale. |
| Radius | 50 | 350 px | 5 | Tamaño de la zona; 350 cubre más de la mitad del lienzo. |
| Severity | 10 | 100 | 1 | Cuánto se desvía; por debajo de 10 no se nota. |
| Epicentro (clic en el lienzo) | 10 % | 90 % | continuo | Mantiene la zona dentro del lienzo. |

### Contrast
| Control | Mín. | Máx. | Paso | Razón |
| :-- | :-- | :-- | :-- | :-- |
| Dominance ratio | 50 % | 95 % | 1 | % de la mayoría regular; por debajo de 50 la minoría sería mayoría. |
| Contrast Scale Multiplier | 0,2× | 3× | 0,1 | De muy pequeño a triple. |
| Tone | 10 % | 90 % | 5 | Qué tanto se acerca al fondo; 0 no se vería diferente y 100 desaparece. |
| Shift | 5 % | 50 % | 1 | Desplazamiento dentro de la celda; 50 % la llega al borde. |
| Shift direction | 0° | 360° | 5 | Dirección del desplazamiento. |
| Clash Angle | 15° | 90° | 5 | Ángulo de choque; menos de 15 apenas se aprecia. |

### Concentration
| Control | Mín. | Máx. | Paso | Razón |
| :-- | :-- | :-- | :-- | :-- |
| Foci | 2 | 6 | 1 | Focos de Hotspots; con 1 es el modo Point. |
| X / Y position | 5 % | 95 % | 1 | Mantiene el atractor dentro del lienzo. |
| Gathering pull | 20 % | 100 % | 1 | Fuerza de atracción; bajo 20 no se nota. |
| Field radius | 80 | 450 px | 5 | Alcance del campo. |

### Texture
| Control | Mín. | Máx. | Paso | Razón |
| :-- | :-- | :-- | :-- | :-- |
| Jitter | 0 | 8 px | 1 | Temblor de los vértices, **para un módulo de 100 px** (se escala al tamaño real). |
| Line skipping | 0 % | 60 % | 1 | % de trazo omitido; más de 60 deja el módulo irreconocible. Solo en trazos. |
| Strand crossing | 0 % | 60 % | 1 | % de hebras cruzadas. Solo en trazos. |
| Perimeter undulation | 0 | 30 px | 1 | Ondulación del contorno, también para 100 px. |

### Space
| Control | Mín. | Máx. | Paso | Razón |
| :-- | :-- | :-- | :-- | :-- |
| Extrusion depth | 10 | 80 px | 1 | Profundidad aparente; bajo 10 no se ve volumen. |
| Projection angle | −60° | 60° | 1 | Dirección del volumen. |
| Facet shading contrast | 20 % | 100 % | 1 | Diferencia de tono entre caras. |

---

## 3. Valores por defecto

### Al abrir la app
Una sola capa (**Layer 1**): círculo, trazo (no relleno), color `#18181f`, trazo 1 px, **Width 100 × Height 100**, rotación 0°, desplazamientos 0, contenedor "todo el lienzo", *Show container* encendido, *Clip container* apagado. Layout y los siete modificadores, apagados. Proporción 1:1, guías de cuadrícula encendidas, color de guías `#f24822`.

### Cuando se enciende cada control

**Layout › Repetition** (modo por defecto): variación Grid, 4 × 4, Fit to canvas, módulos en los centros, sin mezcla de celdas, dirección repetida, sin reflejo, *Clip cell* apagado, *Checkerboard* apagado, *Visible lines* apagado (grosor 1,5, color de la capa, ambas direcciones, todas las líneas). Variación: Row offset 50 %, Shear angle 15°, Wave amount 18 px. Tamaño de intersección 50 %. Free seed 7.
**Layout › Radiation:** esquema Centrifugal, orientación automática, 12 rayos × 5 anillos, Spiral twist 45°, centro cerrado, sin giro de anillos, 2 centros, anillos circulares, Fit to canvas, líneas apagadas (grosor 1).
**Ritmo A:B (Advanced):** Col y Row ratio 1, gradaciones 0 %.

| Panel | Por defecto al encenderlo |
| :-- | :-- |
| **Similarity** | Elastic, intensidad 50 %, jitter 0, asociación None (mix 50 %), imperfección None (cantidad 30 %), semilla 42 |
| **Gradation** | Rotate, Diagonal, Range 180, Cycles 1, Restart, Acceleration 0, filas alternas apagado, *Reverse* apagado, Becomes triangle, End color `#f43f5e` |
| **Anomaly** | Focal, un punto en el centro (50 %, 50 %), Radius 160, Severity 65, Single, Count 5, Seed 7, se desvía en forma, escala, rotación y posición, forma intrusa triángulo, zona Another grid = Brick, color de acento `#f43f5e` (apagado), punto visible |
| **Contrast** | Scale, Dominance 80 %, Scattered, Scale 2,2×, Tone 50 %, Shift 25 % a 45°, Clash angle 45°, forma de minoría cruz, color de acento `#f43f5e` (apagado) |
| **Concentration** | Point, Move, atractor en el centro (50 %, 50 %), Gathering pull 50 %, Field radius 240, 2 focos, eje horizontal, flujo y densidad apagados, guía del atractor apagada |
| **Texture** | Jitter 1, Line skipping 10 %, Strand crossing 10 %, Perimeter undulation 10 |
| **Space** | Isometric, Extrusion depth 10, Projection angle 30°, Shading 50 %, guías isométricas apagadas |
| **Hide modifiers** | apagado; solo actúa con el panel Module abierto |

### Una nota
El HTML conserva valores iniciales antiguos en los sliders de Module (Width 50, trazo 1,2, rotación 4,5), pero no se usan: al abrir, la app los reemplaza con los del estado de arriba.
