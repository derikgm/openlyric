# OpenLyric

Visor de letras y versículos para segundo monitor/proyector, ligero y enfocado en la comodidad durante el culto o evento. Construido con Wails (Go + frontend web), disponible para Linux y Windows.

## Funcionalidades implementadas

- Visor de letras fullscreen (`Fullscreen: true` al arrancar).
- Apertura automática del visor en el segundo monitor (monitor no principal) cuando hay más de un monitor.
- Detección de monitores disponibles (`runtime.ScreenGetAll`).
- Navegación por pestañas superiores: **Liricas**, **Biblia** y **Opciones**.
- **Liricas**: lista de canciones, bloques numerados de letra, cambio rápido de bloque al hacer clic (ideal para coros y repeticiones), avance automático, teclado (← / →).
- **Biblia**: cargar versiones JSON (p. ej. Reina-Valera 1909), seleccionar libro/capítulo y mostrar versículos en grande.
- **Opciones**: pantalla completa con tarjetas de fondo, idioma (ES/EN) y donaciones.
- Selección de fondo mediante imagen (`data URL`) con persistencia.
- Galería de fondos en Liricas: las fotos de `backgrounds/` se muestran como fondo real de proyección (convertidas a `data URL` por el backend).
- Carga de canciones desde `songs/` en formatos `.txt`, `.xml` y `.json`.
- Carga de versiones de la Biblia desde `bibles/` en formato JSON.
- Creación automática de las carpetas `songs/`, `bibles/` y `backgrounds/` si no existen.
- Validación de segundo monitor al arrancar: si no hay segundo monitor conectado, se muestra un cartel flotante sobre el área de proyección de Liricas y Biblia (sin achicar el sidebar ni bloquear el acceso a Opciones o a crear canciones), con botón "Reintentar detección"
- Creación de canciones con letra desde la app.
- Diseño responsive para tablets y móviles.
- Persistencia: fondo, última versión e idioma guardados automáticamente.
- Tests unitarios de parsers y cargador de Biblia.

## Estructura

- `songs/` - Coloca aquí tus archivos de canciones (`.txt`, `.xml`, `.json`). Compatible con formatos comunes de Holyric.
- `bibles/` - Coloca aquí los JSON de versiones de la Biblia (formato tipo Reina-Valera / OSIS con libros, capítulos y versos). Cada archivo `.json` dentro se registra como una versión.
- `backgrounds/` - Coloca aquí tus imágenes de fondo (`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`). Cada imagen aparecerá en la galería de fondos dentro de Liricas para cambiar rápidamente.

## Uso

1. Añade canciones a `songs/` (o créalas desde la app en Liricas → "+ Nueva canción")
2. Añade fondos a `backgrounds/`
3. Añade versiones de la Biblia a `bibles/` (por ejemplo copia `valera.json` de Reina-Valera 1909)
4. Ejecuta `openlyric`
5. Desde la topbar elige **Liricas**, **Biblia** u **Opciones**
6. En Liricas: selecciona una canción y haz clic en el bloque que quieras mostrar en pantalla
7. En Liricas → Fondos: elige una foto de la galería para mostrarla como fondo mientras no hay letra
8. En Biblia: elige versión, libro y capítulo para mostrar los versículos
9. En Opciones: cambia fondo, idioma o visita la sección de donaciones

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
