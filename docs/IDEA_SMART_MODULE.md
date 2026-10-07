# Idea de diseño — Módulo "smart" (rama aparte)

> **Estado: idea para discutir y probar en una rama (`smart-module`). No se toca `main` hasta validarla.** Este documento sí vive en `main` para que la idea no se pierda; el código, cuando exista, vive solo en la rama.
> Fecha de la conversación: 7 oct 2026.

## La idea

Tratar el módulo como un **smart object de Photoshop**: un pequeño diseño dentro del diseño, que se edita en su propio "ambiente" y se repite en las celdas de la retícula. Editas el módulo una vez y todas las copias se actualizan. Enlaza con el **supermódulo** de Wong y con las **interrelaciones de formas** (A8 y G9/S5 del backlog).

Analogía de Diego: *una hoja de papel que se corta en pedazos; dentro de cada pedazo se dibuja un círculo, un cuadrado y un triángulo. Ese pedazo es el módulo compuesto.*

## Decisiones tomadas

1. **Sustituye al módulo actual.** Un módulo de una sola figura es el caso simple, así que los proyectos guardados migran solos (la forma de cada capa pasa a ser la figura 1).
2. **Simple, sin recursión:** el módulo solo contiene **figuras** y sus **interrelaciones**. Sin capas, sin retículas internas, sin efectos dentro.
3. **Los modificadores (Texture, Space, Gradation, Similarity…) actúan sobre el módulo entero**, desde fuera, como hoy actúan sobre la forma.
4. **Un solo contenedor para todas las figuras** (la hoja de papel). Orden: celda → contenedor → figuras. El recorte (*Clip container*) corta el conjunto.
5. **Lista corta de figuras** (de 1 a 4), cada una con forma, tamaño, giro y offset. Desde la segunda, cada figura tiene una **relación con la anterior**.
6. **Fase 1 de relaciones (lo barato):** separadas, tocándose, solapadas, interpenetradas y coincidencia, con un slider de distancia cuando aplique.
7. **Fase 2:** unión, sustracción e intersección. Son booleanas y en el SVG exportado hay que resolverlas con máscaras o recortes, sin trazo limpio.
8. **Color y trazo/relleno heredados** del módulo en la prueba de concepto. Problema conocido: un triángulo sobre un cuadrado, ambos rellenos del mismo color, no se distinguen. Posible solución barata para más adelante: un selector por figura *Fill / Outline* (sin color propio).

## Cómo funciona: dos mundos

9. **El módulo smart es una forma compuesta.** En el lienzo del diseño (la retícula) se comporta como **una sola forma**, como un círculo o una estrella; las retículas y los modificadores no saben que tiene figuras dentro. Gradation lo gira entero, Texture deforma el conjunto, Space le da profundidad a todo el bloque, el color cambia el del conjunto.
10. **Se construye como una forma sintética**, no como una imagen ni un SVG incrustado: el motor ya compone formas al vuelo (el *Morph* mezcla dos formas en una nueva), y Texture y Space necesitan los **contornos**, que de una imagen no se pueden sacar. Dibujar la forma compuesta = recorrer sus figuras y dibujar cada una en su posición, tamaño y giro.
11. **Dentro del editor** (su espacio) se ven y se editan las figuras por separado: mover, girar, tamaño, relación entre ellas, contenedor, color y trazo. **Desde el lienzo del diseño no se puede mover una figura de dentro**; hay que entrar al módulo (como un smart object de Photoshop).
12. **Color y trazo son del módulo entero** y las figuras los heredan: se cambian una vez en el editor. Los modificadores de color (Gradation, Contrast, Anomaly) cambian el color del conjunto.

## Cosas que comprobar primero en la rama

- El grabado de contornos que usan Texture y Space (`flattenShape`) recoge los comandos de dibujo; hay que ver si admite giros y escalados, o si hay que transformar las coordenadas a mano al componer. Es lo primero.
- Exportar SVG: la forma compuesta tiene que escribir su propio trazado uniendo los de sus figuras con sus transformaciones.
- Dos figuras solapadas del mismo color no se distinguen (consecuencia de heredar el color); el selector *Fill / Outline* por figura sería la solución barata.
- Criterio de éxito de la primera entrega: las dos retículas y Gradation funcionan con el módulo compuesto; después se repasan los demás modificadores uno por uno.

## Interfaz

- **El botón *Module* del tool rail pasa a ser solo la entrada al editor del módulo** (no se reparten opciones entre dos paneles). Dentro del editor viven la lista de figuras, el contenedor, el trazo y el color.
- **Modo aislamiento** (como Illustrator): el lienzo muestra solo el módulo, grande y centrado; los paneles de modificadores se ocultan (como *Hide modifiers*).
- **Con *Save* y *Cancel*, no en vivo:** al entrar se guarda una copia; *Cancel* la restaura; *Save* confirma y deja un único paso de deshacer. La vista previa dentro del editor sí se actualiza mientras se edita.

## Dudas abiertas

- ¿Dónde quedan el **tamaño, giro y offset del módulo entero** dentro del diseño? (Propuesta: dentro del editor, con el resto.) Coste: cambiar el tamaño exige entrar y salir.
- Máximo de figuras por módulo (¿4?).
- ~~Si los modificadores ven las figuras por separado o el conjunto~~ → resuelto: ven el conjunto (forma compuesta, decisiones 9 y 10).
- ~~Rendimiento con un lienzo oculto~~ → descartado: no se usa imagen, se compone la forma.
- Exportar SVG: definir el módulo una vez como símbolo y usarlo en cada celda (archivo más ligero).
