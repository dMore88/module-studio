# Auditoría de controles (para decidir con Diego)

Estado: **propuesta, nada implementado**. Objetivo: que la app sea divertida y no compleja, sin quitar lo ya hecho sino ordenándolo.

## 1. Los números

Hoy hay unos **100 controles** repartidos en 10 paneles (contando cada chip-grupo, slider, casilla y color como uno):

| Panel | Controles | Visibles de golpe | Comentario |
| :-- | --: | --: | :-- |
| Module | ~10 | 10 | Forma, trazo/relleno, color, grosor, ancho, alto, giro, desplazamientos, contenedor. Es el panel más usado y está bien. |
| Layout > Repetition | 17 | 17 | **El más cargado.** 9 grupos de chips, 5 sliders, 3 casillas, bloque de líneas |
| Layout > Radiation | 12 | 12 | Repite casillas y bloque de líneas de Repetition |
| Structure | 3 | 3 | Proporciones A:B y líneas. Casi duplica a Layout |
| Similarity | 7 | 7 | Razonable |
| Gradation | 9 | 9 | Razonable, pero con mucho condicional |
| Anomaly | 13 | 13 | Muchos controles de posición y semilla |
| Contrast | 7 | 7 | Bien |
| Concentration | 11 | 11 | 4 casillas con efectos parecidos |
| Texture | 4 | 4 | Bien |
| Space | 5 | 5 | Bien |

**Meta propuesta:** que cada panel muestre de entrada **5 a 7 controles** (lo esencial) y deje el resto en una sección plegable **Advanced**.

## 2. Reglas propuestas (para el sistema de diseño)

1. **Chips solo si hay 2 o 3 opciones** que se cambian seguido. Con 4 o más opciones, **dropdown**.
2. **Iconos en vez de texto** únicamente cuando la opción tiene dibujo propio y claro (las 8 retículas, las 3 colocaciones). Lo abstracto sigue en texto o dropdown.
3. **Esencial arriba, Advanced plegado.** Esencial es lo que cambia el resultado de forma obvia. Advanced es el afinado.
4. **Una idea, un control.** Si dos controles cambian casi lo mismo, se fusionan.
5. **Lo que se repite en dos paneles se sube a global** (casillas y bloque de líneas de Repetition y Radiation).
6. **Orden jerárquico:** tipo → cantidades (Columns, Rows) → refinamientos.
7. **Un botón "Sorpréndeme"** por panel (combinación al azar de sus opciones) para jugar sin tocar nada.

## 3. Auditoría control por control

Leyenda: **E** esencial (visible) · **A** avanzado (plegado) · **F** fusionar · **G** global / compartir · **D** dropdown · **R** revisar (decidir contigo).

### Layout > Repetition (17 → 5 visibles + Advanced)
| Control | Propuesta | Motivo |
| :-- | :-: | :-- |
| Structure mode (Repetition / Radiation) | E | Es el interruptor principal |
| Grid structure variation (8 chips) | **E + D con iconos** | Mejor un selector con los 8 dibujos de retícula |
| **Columns, Rows** | **E, justo debajo de la variación** | Tu nota: son lo más importante después del tipo |
| Row offset / Shear / Wave (parámetro de la variación) | E (aparece solo con su variación) | Ya funciona así |
| Module size (Fit / Actual) | E | Cambia el modelo entero; solo 2 opciones |
| Reflection (4) | **A, dropdown** | Se toca poco |
| Direction (3) | **A, F con Reflection** → un solo dropdown "Orientación" | Los dos giran/espejan módulos |
| Module placement (3) | **A, F con Cell mix** → "Arreglo" | Los dos cambian dónde van los módulos |
| Cell mix (3) + Intersection size | A (dentro de "Arreglo") | |
| Clip cell | A | |
| Checkerboard inversion | A | |
| Visible Grid Lines + Line tone/direction/spacing/width/color (6) | **A, simplificar** (ver sección 4) | Hoy son 6 controles para algo secundario |

### Layout > Radiation (12 → 5 visibles + Advanced)
| Control | Propuesta | Motivo |
| :-- | :-: | :-- |
| Radiation scheme (5) | E, D con iconos | Cada esquema tiene dibujo |
| Angular rays, Concentric rings | E | Son las cantidades, como Columns y Rows |
| Spiral twist | E (solo en espiral) | |
| Module size (Fit / Actual) | E | |
| Module orientation, Direction | **A, F** → "Orientación" | Igual que en Repetition |
| Open center, Ring rotation | A | |
| Clip cell, Checkerboard, líneas | **G** | Mismo bloque que Repetition, compartido |

### Structure (3)
| Control | Propuesta | Motivo |
| :-- | :-: | :-- |
| Col ratio, Row ratio | **R: mover dentro de Layout > Repetition** como "Rhythm" en Advanced | Es una propiedad de la retícula, no un panel aparte |
| Visible Grid Lines | **G** (duplicada) | Ya existe en Layout |

Si Structure desaparece como panel, el rail pierde un icono.

### Similarity (7 → 4 + Advanced)
| Control | Propuesta |
| :-- | :-: |
| Visual kinship type | E, D |
| Fluctuation intensity | E |
| Association (family) + Association mix | A, F (el mix solo aparece con una familia) |
| Imperfection (chips) + Imperfect modules | A, F |
| Spatial cell jitter | A |

### Gradation (9 → 5 + Advanced)
| Control | Propuesta |
| :-- | :-: |
| Attribute | E, D |
| Becomes (solo con Shape) | E |
| Pathway direction | E, D |
| Range, Cycles | E |
| Sequence, Acceleration | A, F → "Ritmo" (un dropdown + intensidad) |
| Alternate rows, Reverse | A |

### Anomaly (13 → 6 + Advanced)
| Control | Propuesta |
| :-- | :-: |
| Type, Deviates in | E |
| Severity, Radius | E |
| Distribution + Count + Seed | A, F (Seed y Count solo con distribución distinta de "un punto") |
| X / Y position | **R:** ¿bastan con el punto en el lienzo y quitar los sliders? |
| Focal intruder shape | A |
| Highlight + Accent color | A, F → solo el color (encender = elegir color) |
| Epicenter reticle | A |

### Contrast (7 → 5)
Casi todo es esencial. **R:** unir "Accentuate minority" con el color de acento (como en Anomaly).

### Concentration (11 → 6 + Advanced)
| Control | Propuesta |
| :-- | :-: |
| Structure, Method | E, D |
| Line axis / X / Y | E (el que aplique) |
| Gathering pull, Field radius | E |
| Fade toward the edges, Orient to flow, Dynamic density | **R:** las tres ajustan cómo se siente el campo; podrían ser una sola opción "Estilo del campo" |
| Display attractor guide | G (es una ayuda visual, como las guías) |

### Texture (4) y Space (5)
Se quedan igual. Space: la casilla de la retícula isométrica pasa a las ayudas globales.

### Module (10)
Se queda igual (es el panel que más se usa). **R:** el contenedor (ancho/alto) podría ir en Advanced porque solo importa con Actual size.

## 4. Propuesta concreta para las líneas visibles

Hoy: casilla + Line tone (3 chips) + dirección (3) + espaciado (2) + grosor + color = **6 controles** ×2 (rejilla y radial).

Propuesta (un solo bloque compartido):
- Casilla **Visible lines**.
- **Color** (arriba, sin depender de nada).
- Interruptor **"Parte del diseño"**: apagado = guía de 1 px que no se exporta; encendido = línea con grosor que se exporta. Texto de ayuda debajo.
- **Grosor** (solo con "Parte del diseño").
- **Dirección y espaciado** (solo en rejilla) en un dropdown cada uno dentro de Advanced.

Pasa de 6+6 controles a 4+4, con todo explicado.

## 5. Ideas globales

- **"Sorpréndeme" por panel y global.** Un botón que sortea las opciones del panel dentro de rangos agradables.
- **Presets.** 6 a 10 composiciones de partida (tablero, mosaico, espiral, panal...). Hacen más que cien sliders para engancharse.
- **Ayudas globales** (guías, retícula isométrica, reticle, atractor): un solo menú "Guides", como en Figma.
- **Filtro para el backlog P3:** antes de añadir un control, preguntar si sirve para jugar o solo completa el libro. Lo que solo completa el libro va a Advanced o se descarta.

## 6. Orden de trabajo sugerido

1. Decidir las reglas de la sección 2 y marcar las filas **R**.
2. Rediseñar en Figma los casos tipo: un panel con Advanced plegable, un dropdown con iconos de retícula y el bloque de líneas.
3. Implementar en este orden: Layout (el más cargado) → líneas compartidas → fusiones de Anomaly/Gradation/Concentration → Sorpréndeme y presets.
4. Mantener las 35 pruebas y la comparación con los valores por defecto para no romper nada.

## 7. Decisiones de Diego (5 oct 2026)

- **Structure deja de ser un panel.** Sus proporciones A:B pasan a *Advanced* de Layout (*Rhythm*). Le gusta que jueguen con los tamaños de la retícula sin ser exactas.
- **Anomaly:** se quitan los sliders X/Y. El punto en el lienzo está **activo por defecto** al activar el control, con opción de ocultarlo.
- **Anomaly y Contrast:** elegir el color de acento reemplaza la casilla "Highlight" (si no, quedaría sin edición).
- **Módulo:** el contenedor (ancho y alto) va a *Advanced*, y hay que añadir una opción para **ocultarlo** en el lienzo (hoy solo se ve con el panel abierto, o siempre).
- **Concentration:** pendiente de definir (ver la pregunta del dropdown).
- **Regla general de líneas y guías:**
  - Las líneas de estructura visibles de **Layout** son **parte del diseño** (Wong): color, grosor, se exportan. No llevan modo "guía".
  - Las guías de los **demás controles** (retículo de Anomaly, atractor de Concentration, retícula isométrica de Space...) son solo guías: **un control global de color de guías**, no se exportan.
- **Sorpréndeme y presets:** prioridad **mínima**. Van al final de todo, cuando la herramienta esté afinada con todos los controles.
- **Filtro del backlog P3:** aprobado (¿sirve para jugar o solo completa el libro?).
