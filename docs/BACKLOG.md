# Backlog — Module Studio

Origen: revisión de la primera parte del libro de Wucius Wong (capítulos 1 a 12) contra los controles de la app, más las decisiones de Diego del 2026-10-04.

**Prioridades:** **P1** siguiente · **P2** backlog · **P3** al final / baja prioridad · **✖** descartado por ahora.

**Principio de trabajo:** primero dejar bien hechos los controles de modificación de cada capa (un módulo = una figura = una capa). Las funciones que dependen de relacionar capas entre sí van después.

---

## 1. Cola de trabajo

| # | Ítem | Estado |
| :-- | :--- | :--- |
| 1 | Fluctuating alterna la dirección entre celdas vecinas | ✅ Hecho (2026-10-04) |
| 2 | Gradation: *Range* aplica a Scale, Depth y Drift (180 = cantidad original) | ✅ Hecho (2026-10-04) |
| 3 | Gradation avanzada (G1 a G7) | P1 |
| 4 | Radiación: centrípeta y centro abierto (R1, R2, y lo que acompaña) | P1 |
| 5 | Resto de modificadores por capa (secciones 3 a 10) | P2 |
| 6 | Interrelaciones entre capas (sección 2) | P2, después del 5 |
| 7 | Supermódulos (RP6) | P3, al final de todo |

---

## 2. Interrelaciones entre capas (capítulo 2, Forma)

Las 8 interrelaciones del libro (distanciamiento, toque, superposición, penetración, unión, sustracción, intersección, coincidencia) se eliminaron junto con Form A / Form B. Sí encajan con capas: la relación se define **por capa, contra el resultado de las capas que tiene debajo**.

| ID | Ítem | Notas |
| :-- | :--- | :--- |
| INT1 | Selector "relación con la capa inferior" | Se dibuja con composición en lienzos auxiliares. Sustracción e intersección se resuelven con operaciones de composición (`destination-out`, `destination-in`). |
| INT2 | Modo trazo (contornos) | Unión, sustracción e intersección en trazo se resuelven recortando el contorno de cada capa con la silueta de la otra (cobertura de líneas ocultas). Penetración dibuja ambos contornos completos. |
| INT3 | Toque, distanciamiento y coincidencia | No son composición sino posición: toque calcula la distancia para que las siluetas se rocen, coincidencia alinea centros. |
| INT4 | Módulos mayores que la celda | El libro los usa con unión, penetración, etc. entre módulos vecinos (cap. 3 y 7). Depende de INT1. |

Estado: **P2**, después de cerrar los controles de modificación. Abre decisiones de interfaz que conviene diseñar en Figma antes de implementar.

---

## 3. Gradación (capítulo 6)

Ya cubierto: rotación en el plano (Rotate), progresión en el plano (Drift), rotación espacial (Depth), progresión espacial (Scale), caminos paralelo y concéntrico, reverse, ciclos.

| ID | Ítem | Notas | Prioridad |
| :-- | :--- | :--- | :-- |
| G1 | Camino en zigzag | Tercer modelo del libro (fig. 41) | P1 |
| G2 | Ida y vuelta (1-2-3-4-5-4-3-2-1) frente a reinicio (1-2-3-4-5-1-2-3-4-5) | Hoy solo reinicia | P1 |
| G3 | Gradación alternada | Filas pares e impares con sentidos opuestos (fig. 43) | P1 |
| G4 | Velocidad de gradación | Número de pasos y aceleración o frenado a mitad de secuencia (fig. 38). Hoy *Cycles* es otra cosa | P1 |
| G5 | Gradación de figura | Convertir una forma en otra por pasos (círculo a triángulo). Con las polilíneas de Texture, interpolar vértices es directo | P1 |
| G6 | Atributo *Texture* | Gradación de textura: la deformación aumenta a lo largo del camino. Une Gradation con Texture (cap. 11) | P1 |
| G7 | Gradación de estructura | Celdas que cambian de tamaño progresivamente (fig. 44). Se relaciona con E4 | P2 |

---

## 4. Radiación (capítulo 7)

Ya cubierto: centrífuga, concéntrica, espiral y doble centro, con rayos, anillos, torsión y centro excéntrico.

| ID | Ítem | Notas | Prioridad |
| :-- | :--- | :--- | :-- |
| R1 | Estructura **centrípeta** | Falta entera: ángulos que apuntan al centro (fig. 50) | P1 |
| R2 | Centro abierto | Agujero central con líneas tangentes (fig. 48d) | P1 |
| R3 | Anillos rotados entre sí | Para que las subdivisiones de un anillo no se alineen con las del vecino | P1 |
| R4 | Anillos poligonales | Cuadrados, polígonos en lugar de círculos (fig. 49b, g) | P2 |
| R5 | Orientación del módulo | Radial, tangente o ángulo fijo. Hoy es automática | P1 |
| R6 | Separación de anillos en gradación | Hoy es lineal | P2 |
| R7 | Más de dos centros | Hoy doble centro simétrico | P2 |

---

## 5. Contraste (capítulo 9)

Ya cubierto: dominancia de la mayoría y énfasis de la minoría, dimensiones Scale, Shape y Angle, color de acento elegible.

| ID | Ítem | Notas | Prioridad |
| :-- | :--- | :--- | :-- |
| C1 | Dimensión posición | Arriba/abajo, céntrico/excéntrico | P2 |
| C2 | Dimensión espacio | Ocupado/vacío, positivo/negativo (figura y fondo invertidos en la minoría) | P2 |
| C3 | Dimensión gravedad | Estable/inestable, ligero/pesado | P2 |
| C4 | Dimensión textura | Aplicar Texture solo a la minoría | P2 |
| C5 | Dimensión color | Más allá del acento | P2 |
| C6 | Minoría por zonas y equilibrio | El libro reparte la mayoría sobre una zona mayor y la minoría tira desde el borde (fig. 61b) | P2 |
| C7 | Revisar "Tone" | Hoy es trazo contra relleno, más cercano a contraste de espacio que de color | P2 |
| **C8** | **Revisar la interacción con otros modificadores** | **Pedido explícito.** Orden de aplicación y multiplicadores con Gradation, Concentration y Anomaly (todos tocan escala, dirección o color). Definir qué manda cuando coinciden | **P2** |

---

## 6. Concentración (capítulo 10)

Ya cubierto: hacia un punto (Point), desde un punto (Void), hacia una línea (Line), libre (Hotspots, 2 focos).

| ID | Ítem | Notas | Prioridad |
| :-- | :--- | :--- | :-- |
| K1 | Desde una línea | Inverso de Line | P2 |
| K2 | Superconcentración y desconcentración | Densidad alta o baja en todo el diseño, con o sin transición a los bordes | P2 |
| K3 | Más de dos focos | Hoy Hotspots son dos focos simétricos | P2 |
| K4 | Concentrar por ausencias | Módulos que desaparecen según un campo de densidad; es el mecanismo que el libro usa dentro de estructuras formales | P2 |
| K5 | Varios módulos por celda | Cambios cuantitativos reales | P2 |

---

## 7. Anomalía (capítulo 8)

Ya cubierto: focal, rupture, swell, void, radio, severidad, resaltado con color elegible, reticle.

| ID | Ítem | Notas | Prioridad |
| :-- | :--- | :--- | :-- |
| A1 | Anomalías esparcidas | Aliviar la monotonía: distribuir anomalías por todo el diseño, de forma regular o aleatoria (fig. 56b) | P2 |
| A2 | Zona con otra regularidad | "Transformar la regularidad" (fig. 56c) | P2 |
| A3 | Elegir qué atributos se desvían | El libro: una anomalía puede desviarse en uno o dos elementos y respetar los demás | P2 |
| A4 | Deformar las líneas de estructura visibles | Hoy solo se deforman los módulos | P2 |

---

## 8. Similitud (capítulo 5)

Ya cubierto: Elastic (tensión/compresión), 3D tilt (distorsión espacial), Wobble, Scale, Hibrid, intensidad, jitter de celda.

| ID | Ítem | Notas | Prioridad |
| :-- | :--- | :--- | :-- |
| S1 | Asociación | Formas de una misma familia mezcladas | P2 |
| S2 | Imperfección | Formas cortadas o quebradas. Puede apoyarse en Line skipping de Texture | P2 |
| S3 | Retícula de celdas irregulares | "Subdivisiones estructurales similares" (fig. 33) | P2 |
| S4 | Distribución visual libre | Sin retícula, con espacio similar para cada módulo | P2 |

---

## 9. Estructura y Repetición (capítulos 3 y 4)

Ya cubierto: retícula básica, sliding, sheared, curved, zigzag, triangular; estructura activa (recorte), visible (líneas) y alternancia positivo/negativo; proporción rítmica.

| ID | Ítem | Notas | Prioridad |
| :-- | :--- | :--- | :-- |
| E1 | Líneas visibles positivas o negativas | Fig. 20b y 20c | P2 |
| E2 | Grosor de las líneas | | P2 |
| E3 | Horizontales y verticales por separado | Visibles o invisibles, alternadas (fig. 20d) | P2 |
| E4 | Estructura de múltiple repetición | Dos clases de subdivisión entretejidas (fig. 23) | P2 |
| RP1 | Retícula hexagonal | | P2 |
| RP2 | Subdivisión y combinación de celdas | | P2 |
| RP3 | Reflexión | Espejar el módulo en celdas alternas | P2 |
| RP4 | Selector de dirección | Repetida, alternada o indefinida | P2 |
| RP5 | Superposición de estructuras | Ya posible con capas | ✅ |
| RP6 | **Supermódulos** | Un grupo de módulos que se repite como unidad. La app trabaja un módulo = una capa, así que hay que decidir cómo (por ejemplo, grupos de capas que comparten retícula) | **P3, al final de todo** |

---

## 10. Espacio (capítulo 12)

Ya cubierto: isométrico, 3D tilt, fluctuante, paradójico; profundidad, ángulo, contraste de facetas, guías isométricas; figura y fondo invertibles.

Se considera complejo; entero en backlog.

| ID | Ítem | Prioridad |
| :-- | :--- | :-- |
| SP1 | Perspectiva con disminución de tamaño | P2 |
| SP2 | Sombra unida o separada | P2 |
| SP3 | Pistas de profundidad: tamaño, tono y textura | P2 |
| SP4 | Planos transparentes (marcos espaciales) | P2 |
| SP5 | Profundidad por capa | P2, depende de INT |

---

## 11. Textura (capítulo 11)

Ya cubierto: textura espontánea mediante deformación de geometría (Jitter, Line skipping, Strand crossing, Perimeter undulation).

| ID | Ítem | Estado |
| :-- | :--- | :--- |
| T1 | Texturas decorativa y mecánica (grano, semitono, estriado, tipografía) | ✖ Descartadas por ahora; se eliminaron al reemplazar el control. Reabrir solo si aparece un uso claro |
| T2 | Gradación de textura | Ver G6 |

---

## 12. Otros

| ID | Ítem | Notas | Prioridad |
| :-- | :--- | :--- | :-- |
| O1 | Exportar SVG vectorial real | Hoy incrusta un PNG. Ya no hay texturas de píxeles, así que es posible, pero requiere reescribir el export | P2, por decidir |
| O2 | Controles de Contrast sin diseño en Figma | Minority Shape y Clash Angle se añadieron sin mockup | Pendiente de diseño |
| O3 | Controles extra sin diseño en Figma | Eje de línea en Concentration; selector de color de acento en Anomaly y Contrast | Pendiente de diseño |
