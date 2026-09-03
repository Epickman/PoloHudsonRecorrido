# Polo Hudson — Recorrido

Proyecto de scrollytelling editorial sobre el Polo Hudson, Berazategui, Buenos Aires.

## Stack

- React + TypeScript + Vite
- Leaflet + react-leaflet
- GSAP + ScrollTrigger
- Tailwind CSS v4 para el pipeline CSS
- Tiles gratuitos de CartoDB Dark Matter; no requiere API key

## Ejecutar

```bash
pnpm install
pnpm dev
```

Comandos disponibles: `pnpm typecheck`, `pnpm build` y `pnpm preview`.

## Archivos importantes

- `src/App.tsx`: SPA, escenas editoriales, ScrollTrigger y mapa Leaflet.
- `src/data/points.js`: 13 puntos de interés con lat/lng y posiciones de referencia.
- `src/data/route.geojson`: entrada desde Peaje Hudson y circuito interno.
- `src/index.css`: sistema visual, responsive y estilos del mapa.
- `references/recorrido-google-maps.png`: captura original de referencia.

## Estado del mapa

La ruta y los puntos fueron reconstruidos visualmente desde la captura de Google Maps. Las coordenadas son aproximadas, no un relevamiento GPS definitivo. Si se reciben coordenadas exactas, actualizar ambos archivos de datos sin cambiar la lógica del scroll.

La ruta comienza fuera del predio, pasa por el acceso de Peaje Hudson y continúa por el circuito interior. El cierre hace zoom out con `fitBounds`.

## Notas para continuar

- No reemplazar Leaflet por Mapbox: la especificación actual requiere tiles gratuitos sin token.
- Mantener sincronizados el progreso de ScrollTrigger, la Polyline activa y la cámara.
- Conservar `invalidateSize` cuando el contenedor sticky cambie de tamaño.
- No agregar credenciales al código.
