# OpenLyric

Un clon minimalista de Holyric para Linux y Windows, enfocado en mostrar letras en un segundo monitor/proyector con fondos personalizables.

## Estructura

- `songs/` - Coloca aquí tus archivos de canciones (`.txt`, `.xml`, `.json`). Compatible con formatos comunes de Holyric.
- `backgrounds/` - Coloca aquí tus imágenes de fondo (`.jpg`, `.jpeg`, `.png`, `.webp`).
- El **Controlador** gestiona las canciones y el **Visor** se abre en la segunda pantalla en modo pantalla completa.

## Uso

1. Añade canciones a `songs/`
2. Añade fondos a `backgrounds/`
3. Ejecuta `openlyric`
4. Desde el controlador: detecta monitores y pulsa "Abrir visor en segundo monitor"
5. Selecciona canción, elige fondo y avanza los versos

## Desarrollo

```bash
wails dev
```

## Build

```bash
wails build
```
# openlyric
# openlyric
