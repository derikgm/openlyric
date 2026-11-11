# OpenLyric

Visor de letras y versículos para segundo monitor/proyector, ligero y enfocado en la comodidad durante el culto o evento. Construido con Wails (Go + frontend web), disponible para Linux y Windows.

## Funcionalidades implementadas

- **Ventana de presentación separada**: la interfaz de control se queda en el monitor principal y una segunda ventana fullscreen muestra solo la letra/versículo/fondo en el segundo monitor. La presentación se sincroniza automáticamente con lo que selecciones en el control.
- Detección de monitores disponibles (`runtime.ScreenGetAll`).
- Navegación por pestañas superiores: **Liricas**, **Biblia** y **Opciones**.
- **Liricas**: lista de canciones, bloques numerados de letra, cambio rápido de bloque al hacer clic (ideal para coros y repeticiones), teclado (← / →) y **catálogo** lateral para preparar la lista de canciones a proyectar.
- **Biblia**: cargar versiones JSON (p. ej. Reina-Valera 1909), seleccionar libro/capítulo y mostrar versículos en grande.
- **Opciones**: pantalla completa con tarjetas de fondo, idioma (ES/EN) y donaciones.
- Selección de fondo mediante imagen (`data URL`) con persistencia.
- Galería de fondos en Liricas: las fotos de `backgrounds/` se muestran como fondo real de proyección (convertidas a `data URL` por el backend).
- Carga de canciones desde `songs/` en formatos `.txt`, `.xml` y `.json`.
- Carga de versiones de la Biblia desde `bibles/` en formato JSON.
- Creación automática de las carpetas `songs/`, `bibles/` y `backgrounds/` si no existen.
- Validación de segundo monitor al arrancar: si no hay segundo monitor conectado, se muestra un cartel flotante sobre el área de proyección de Liricas y Biblia (sin achicar el sidebar ni bloquear el acceso a Opciones o a crear canciones), con botón "Reintentar detección" y apertura manual desde Opciones.
- Creación de canciones con letra desde la app.
- Catálogo de canciones (setlist): añadir/quitar, reordenar, autoguardado local e importar/exportar como archivo `.json` portátil.
- Diseño responsive para tablets y móviles.
- Persistencia: fondo, última versión e idioma guardados automáticamente.
- Tests unitarios de parsers y cargador de Biblia.

> La ventana de presentación se ejecuta como un segundo proceso del mismo binario (`--presentation`) porque Wails v2 no incluye una API multiventana. Se comunica con el control mediante archivos de estado locales (`openlyric-presentation*.json/txt`).

## Estructura

- `songs/` - Coloca aquí tus archivos de canciones (`.txt`, `.xml`, `.json`). Compatible con formatos comunes de Holyric. En los `.txt`, las líneas en blanco separan bloques de proyección. Incluye `sublime-gracia.txt` como ejemplo.
- `bibles/` - Coloca aquí los JSON de versiones de la Biblia (formato tipo Reina-Valera / OSIS con libros, capítulos y versos). Cada archivo `.json` dentro se registra como una versión.
- `backgrounds/` - Coloca aquí tus imágenes de fondo (`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`). Cada imagen aparecerá en la galería de fondos dentro de Liricas para cambiar rápidamente.

## Uso

1. Añade canciones a `songs/` (o créalas desde la app en Liricas → "+ Nueva canción")
2. Añade fondos a `backgrounds/`
3. Añade versiones de la Biblia a `bibles/` (por ejemplo copia `valera.json` de Reina-Valera 1909)
4. Ejecuta `openlyric`
5. La interfaz de control se abre en el monitor principal y, si hay un segundo monitor, se abre automáticamente una ventana de presentación fullscreen en él
6. Desde la topbar elige **Liricas**, **Biblia** u **Opciones**
7. En Liricas: selecciona una canción y haz clic en el bloque que quieras mostrar en la pantalla de presentación
8. En Liricas → Catálogo (derecha): usa **+** para añadir canciones a la lista, reordénalas, impórtala/expórtala o haz clic en un elemento para proyectarla
9. En Liricas → Fondos: elige una foto de la galería para mostrarla como fondo mientras no hay letra
10. En Biblia: elige versión, libro y capítulo para mostrar los versículos
11. En Opciones: cambia fondo, idioma, abre la presentación manualmente o visita la sección de donaciones

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
