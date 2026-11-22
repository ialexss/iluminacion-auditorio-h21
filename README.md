# Iluminación del auditorio

Maqueta 3D del escenario, las dos tarimas de danza y el sector de butacas. El visor permite comparar los equipos existentes con la propuesta, mover luminarias, cambiar su enfoque y descargar el montaje en formato GLB.

## Abrir la web

Desde la raíz del repositorio, inicia un servidor local con Python 3.

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory auditorio-3d/dist
```

Abre [la maqueta](http://127.0.0.1:8000/) en el navegador. La carpeta [auditorio-3d/dist](auditorio-3d/dist) contiene la web estática y sus recursos.

## Consultar el montaje

- **Comparar montaje** permite alternar entre los equipos existentes, los nuevos y el conjunto. Selecciona una escena y un ángulo para ver qué superficies ilumina cada grupo.
- **Contraluz de danza** permite comparar cada tarima con y sin el Fresnel posterior. Los dos perfiles delanteros conservan su enfoque.
- **Mover y orientar luces** muestra el soporte y el perfil de la luminaria seleccionada. Los cambios se aplican a la simulación. **Descargar 3D** exporta la configuración visible.
- **Cobertura en butacas** calcula la iluminancia directa para distintas alturas y distribuciones. El sector bajo el entrepiso requiere mediciones en el recinto.
- **Fotos y parche DMX** relaciona las imágenes del auditorio con las 16 luminarias identificadas en Lightkey.

El [informe técnico](auditorio-3d/dist/recursos/informe-tecnico.pdf) reúne las cantidades propuestas, los diagramas de montaje, la fotometría y el inventario existente. El [presupuesto preliminar](auditorio-3d/dist/recursos/plan-iluminacion.pdf) corresponde a la propuesta inicial de seis colgantes de sala.
