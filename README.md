# Iluminación del auditorio H21

La [web del proyecto](https://lucesh21.landydrop.com/) reúne la maqueta, la planta acotada, la iluminación por escenas y los documentos para preparar el montaje.

## Revisión del 26 de noviembre de 2026

El salón mide 34,34 m de ancho y el altar 19,42 × 5,78 m. La cota de 12,14 m abarca el tramo desde el arranque lateral derecho hasta la línea transversal. Cada puente de danza mide 4,00 m de largo en diagonal. Su altura de 6,96 m en el visor es provisional. Las otras referencias verticales tomadas desde el piso son 7,60 m al empezar el altar y 6,95 m en el altar.

- **Danza.** Dos Fresnel y dos PAR LED RGBAW por tarima.
- **Escenario.** Ocho PAR RGBAW adicionales en el principal, ocho sobre el altar y ocho en el puente posterior.
- **Sala.** Cinco filas de nueve puntos del DUC de julio. Se alternan filas de PL-01 y LD-01, con 27 y 18 puntos respectivamente. La distribución base suma 77 puntos nuevos. Los 28 PAR nuevos son de tipo SlimPAR RGBAW. Las 10 luminarias decorativas siguen en la ampliación futura.
- **Cableado.** U0 conserva el parche existente. Los cuatro PAR P1 y las cuatro barras LED de piso tienen conexión DMX pendiente. U1 distribuye los cinco ramales de puentes y U2 los tres de sala. La [ficha de montaje](auditorio-3d/dist/recursos/puentes/ficha-montaje.pdf), el [parche preliminar](auditorio-3d/dist/recursos/puentes/patch-propuesto.csv) y la [hoja de tendido](auditorio-3d/dist/recursos/puentes/tendido-por-tramo.csv) permiten revisar rutas, equipos y modos en sitio.

## Abrir y usar

Desde la raíz, iniciar el servidor estático y abrir la [maqueta local](http://127.0.0.1:8000/).

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory auditorio-3d/dist
```

El visor compara existentes, nuevos, montaje base y ampliación futura. Ofrece ocho cámaras, tres calidades y edición de posición y enfoque con exportación GLB. Los equipos de danza se desplazan por su diagonal. La cobertura compara el diseño de 45 puntos con alternativas a distintas alturas. La óptica de ensayo es común a todos los puntos y el modelo de butacas es esquemático.

En **Cableado**, la hoja de metrado guarda las distancias de cada ramal en este navegador y exporta un CSV. La capa **Cableado DMX** muestra las rutas propuestas en 3D.

El altar tiene frente curvo, escaleras laterales y paneles negros de fondo. Las cuatro barras de piso están agrupadas al centro. La óptica de sala se ensaya a 7,20 m para separar sus cuerpos y suspensiones de los haces del escenario. La curva de cada pared se traza por separado sobre el ancho interior del CAD. Las tarimas se ubican hacia el exterior de los monitores. Las primeras filas rodean el altar y comparten sus coordenadas con el mapa fotométrico. La posición del mobiliario se estima a partir de las fotos. Las escenas musicales permiten comparar el montaje base y la ampliación con la misma cámara.

La geometría compartida está en [planta.js](auditorio-3d/dist/planta.js). Al cambiar los puentes o las filas, ejecutar `node auditorio-3d/scripts/ficha.cjs` para regenerar planos, tablas de campo y ficha imprimible. Imprimir `recursos/puentes/ficha.html` en A4 como `ficha-montaje.pdf`.


El plano usa símbolos de contorno para los equipos existentes y marcas rellenas para los nuevos. [Ver los dos montajes juntos](auditorio-3d/dist/recursos/puentes/planta-combinada.svg) · [Inventario por código y fase](auditorio-3d/dist/recursos/puentes/inventario-iluminacion.csv) · [Las tres plantas en A3](auditorio-3d/dist/recursos/puentes/planos-iluminacion.pdf).

Para regenerar los informes, ejecutar `node auditorio-3d/scripts/informes.cjs /tmp/h21-informes`. Imprimir los HTML a PDF con gráficos de fondo y tamaño de página CSS. Guardar informe, informe-tecnico y plan-iluminacion en `dist/recursos` y planos-iluminacion en `dist/recursos/puentes`. El informe completo reúne el resumen, las plantas, el informe técnico, la ficha y el presupuesto. La fotometría de los PDF se genera con el mismo cálculo que usa la web.

Con el servidor local iniciado y Playwright disponible, ejecutar `node auditorio-3d/scripts/vistas.cjs http://127.0.0.1:8000/` para regenerar imágenes y miniaturas. El script valida que cada captura tenga contenido de la maqueta antes de escribir las vistas.
