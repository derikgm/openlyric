# OpenLyric

Un clon minimalista de Holyric para Linux y Windows, enfocado en mostrar letras en un segundo monitor/proyector con fondos personalizables.

## Funcionalidades implementadas

- Visor de letras fullscreen (`Fullscreen: true` al arrancar).
- Apertura automática del visor en el segundo monitor (monitor no principal) cuando hay más de un monitor.
- Detección de monitores disponibles (`runtime.ScreenGetAll`).
- Avance de versos con controles: **←** (verso anterior) y **Siguiente verso**.
- Selección de fondo mediante imagen (`data URL`) con persistencia en el backend.
- Carga de canciones desde `songs/` en formatos `.txt`, `.xml` y `.json`.
- Carga de versiones de la Biblia desde `bibles/` en formato JSON (p. ej. Reina-Valera 1909) con selector de versión y avance de versos por capítulo (verso actual numerado).
- Panel lateral izquierdo con la lista de canciones/capítulos para escoger rápidamente (o el mensaje "No hay canciones." si no hay).
- Creación de canciones con letra desde la app (formulario "Nueva canción").
- Creación automática de las carpetas `songs/` y `bibles/` si no existen.

## Estructura

- `songs/` - Coloca aquí tus archivos de canciones (`.txt`, `.xml`, `.json`). Compatible con formatos comunes de Holyric.
- `bibles/` - Coloca aquí los JSON de versiones de la Biblia (formato tipo Reina-Valera / OSIS con libros, capítulos y versos). Cada archivo `.json` dentro se registra como una versión.
- `backgrounds/` - Coloca aquí tus imágenes de fondo (`.jpg`, `.jpeg`, `.png`, `.webp`).
- El **Controlador** gestiona las canciones y el **Visor** se abre en la segunda pantalla en modo pantalla completa.

## Uso

1. Añade canciones a `songs/` (o crea una nueva desde la app con el botón "+ Nueva")
2. Añade fondos a `backgrounds/`
3. Añade versiones de la Biblia a `bibles/` (por ejemplo copia `valera.json` de Reina-Valera 1909)
4. Ejecuta `openlyric`
5. Desde el controlador: detecta monitores y abre el visor en el segundo monitor
6. Selecciona fondo y avanza los versos con los controles
7. Usa el selector de versión para cambiar entre versiones de la Biblia cargadas en `bibles/`
8. Usa el panel lateral para ver y escoger la canción/capítulo actual

## Desarrollo

```bash
wails dev
```

## Build

```bash
wails build -tags webkit2_41
```

> En Linux con WebKitGTK 4.1 es necesario el tag `webkit2_41`. En versiones con WebKitGTK 4.0 el build se hace sin tag.

## Requisitos previos

- Go (1.22 o superior)
- Wails CLI: `go install github.com/wailsapp/wails/v2/cmd/wails@latest`
- Node.js y npm (para el frontend)
- Dependencias del sistema en Linux:
  - `libgtk-3-dev`
  - `libwebkit2gtk-4.1-dev` (o `libwebkit2gtk-4.0-dev` según la versión disponible)

## Licencia

Distribuido bajo la Licencia MIT. Ver [LICENSE](LICENSE).

## Contribuir

Las contribuciones son bienvenidas. Abre un issue o un pull request.

## Enlaces

- [Wails](https://wails.dev)
