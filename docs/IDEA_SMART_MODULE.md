# Módulo "smart" — estado de la rama `smart-module`

> **Estado: prueba de concepto funcionando en la rama `smart-module`; todavía no está en `main`.** El código vive en la rama; este documento recoge el modelo y las decisiones. Última puesta al día: 7 oct 2026.

## La idea

Tratar el módulo como un **smart object de Photoshop**: un pequeño diseño dentro del diseño, que se edita en su propio ambiente y se repite en las celdas de la retícula. Se edita una vez y todas las copias se actualizan. Enlaza con el **supermódulo / submódulo** de Wong (RP8, RP9) y con las **interrelaciones de formas** (INT).

Analogía: *una pieza de papel de 2 cm × 2 cm sobre la que se dibuja un punto de 0,5 cm en el centro. Esa pieza es el módulo; se repite sobre una hoja más grande.*

## Glosario (acordado)

| Término | Qué es | Dónde está en la app |
| :-- | :-- | :-- |
| **Canvas** | La mesa de trabajo: aspect ratio y tamaño en px; lo que se sale queda cortado. El editor del módulo tiene un canvas propio, del tamaño del módulo | Aspect ratio, encima del lienzo |
| **Composition container** | La hoja de papel donde se repiten los módulos. Ancho, alto y desfase en px; **corta** lo que sobresale. Uno por capa (una capa = una composición) | Layout › Composition container (antes *Block*) |
| **Module** | La pieza de papel que se repite. Es su propio canvas: solo **ancho y alto** (10 a 1000 px, 100 × 100 por defecto) y **rotación**. **Siempre corta** en su borde | Panel Module › Module width / height / rotation (antes *Container*) |
| **Shape** | Una figura dibujada sobre el módulo (hasta 4): su forma, ancho, alto, posición y giro, en px desde el centro del módulo | Panel Module › Shapes |

Jerarquía: **canvas → composition container → celda → module → shapes**.

Con Wong: su **módulo** es la unidad que se repite (aquí, la pieza entera con sus shapes; con varias shapes sería un submódulo o supermódulo), las shapes son sus **formas** (y su colocación relativa son las **interrelaciones de formas**, INT), la **celda** es la **subdivisión** de la estructura, y el canvas es el **plano de la imagen** y el **marco**.

## Decisiones tomadas

1. **Sustituye al módulo antiguo.** Un módulo con una sola shape es el caso simple. Un módulo que nunca se abre en el editor sigue dibujándose como antes (una shape, sin cortar); al abrirlo y guardarlo pasa al modelo nuevo.
2. **Simple, sin recursión:** el módulo solo contiene shapes. Sin capas ni retículas dentro, y sin efectos dentro: los modificadores actúan desde fuera, sobre el módulo entero.
3. **El módulo es una sola forma compuesta** para la retícula y los modificadores: Gradation lo gira entero, Texture lo deforma como una pieza, Space le da profundidad al bloque, y Morph, la forma de Similarity y Contrast › *Shape* lo sustituyen entero. Se construye componiendo las shapes en una forma sintética (no como imagen), porque Texture y Space necesitan los contornos.
4. **El módulo es su propio canvas.** Solo ancho, alto y rotación. Se quitaron *Clip container*, *Show container*, el container «0 = todo el canvas», *Module offset* (mover la shape hace lo mismo) y *Hide modifiers* (el editor muestra el módulo siempre solo).
5. **El borde del módulo corta la geometría, no los efectos.** Lo que sobresale se corta *antes* de aplicar Texture y Space, así que sus efectos pueden salirse del borde. Con *Stroke* quedan solo los arcos de dentro; con *Fill*, un polígono pegado al borde.
6. **Editor 1:1.** Abrir el panel Module cambia el canvas por uno del tamaño del módulo (cualquier proporción), escalado a la pantalla y dibujado nítido. Un px del editor es un px del diseño. Sin reglas de escala.
7. **Save y Cancel.** Se edita en vivo; *Cancel* vuelve al inicio de la sesión (shapes y controles del módulo); *Save* deja un solo paso en el historial. Dentro del editor, Cmd+Z va paso a paso.
8. **Estilo por shape** (hecho): *Stroke / Fill*, color y grosor de trazo son de cada shape; las que no los fijan usan los del módulo. Se dibujan en el orden de la lista por tandas del mismo estilo. Con *Combine*, la figura toma el estilo de la **base** (la de abajo de la lista, que se muestra como las capas: arriba lo de delante). Los modificadores de color mezclan el color de cada shape.
9. **Relaciones entre shapes, fase 1** (hecha): cada shape, desde la segunda, puede ser *Free*, *Coincident* o *Distance* (dirección + gap: 0 = se tocan, positivo separa, negativo solapa). Se coloca sola y sigue a la anterior.
10. **Combine, fase 2 de las relaciones** (hecha): un selector para todo el módulo (*None*, *Union*, *Subtract*, *Intersect*, *Exclude*) que junta las shapes con área en una sola figura, no destructivo. El cálculo está en `js/studio/booleans.js` (sin librerías), con pruebas de áreas, huecos, bordes compartidos y velocidad.
11. **Marco de la shape seleccionada** en el canvas del editor (guía de pantalla, no se exporta).
12. **La lista de shapes, como la de capas** (hecho): icono y nombre, ojo para ocultar, papelera, asa para arrastrar, y *Add shape* / *Duplicate*.
13. **El composition container corta,** también en Actual size, donde los módulos conservan su tamaño real y la cuadrícula se centra en la hoja.

## Pendiente (fases futuras)

- **Tamaño de shape** (hoy cada shape tiene ancho y alto, pero el módulo no tiene control de escala conjunta de las shapes).
- **Editar el módulo viendo a sus vecinos** (lo hacía *Hide modifiers*): un modo «editar sobre el diseño».
- **Desplazamiento fijo del módulo en su celda desde Layout**, si se echa de menos el offset (la rotación ya vive en Layout).
- **Integración con `main`:** la rama cambia el panel Module, el recorte del módulo y el container de Layout. Antes de integrarla, comprobar que los proyectos antiguos se abren igual.

## Cosas a vigilar

- Una **línea, onda o espiral** dentro de un módulo con shapes rellenas no se ve en *Fill* (no tiene área para rellenar); en *Stroke* sí. No entran en *Combine*. Las letras y los números ya son siluetas con área y sí entran.
- Con *Combine* las shapes comparten el estilo de la base: el estilo propio de las demás no se ve mientras estén combinadas.

- Las curvas de una shape cortada se aproximan con segmentos finos cuando hay Texture o Space (en shapes muy grandes podría notarse un facetado).
- En Actual size, el módulo mayor que su celda se solapa con los vecinos; *Clip cell* lo corta en la celda.
- Un proyecto antiguo con un container mayor que su shape se dibuja como siempre hasta abrirlo en el editor; al guardarlo, el módulo pasa a medir lo que medía el container.
