# OpenLyric

Visor de letras y versículos para segundo monitor/proyector, ligero y enfocado en la comodidad durante el culto o evento. Construido con **Tauri 2** (Rust + frontend web), disponible para Linux y Windows.

## Funcionalidades implementadas

- Visor de letras fullscreen (con intento automático de abrirse en el segundo monitor cuando hay más de uno).
- Detección de monitores disponibles.
- Navegación por pestañas superiores: **Liricas**, **Biblia** y **Opciones**.
- **Liricas**: lista de canciones, bloques numerados de letra, cambio rápido de bloque al hacer clic (ideal para coros y repeticiones), avance automático, teclado (← / →).
- **Biblia**: cargar versiones JSON (p. ej. Reina-Valera 1909), seleccionar libro/capítulo y mostrar versículos en grande.
- **Opciones**: fondo, idioma (ES/EN) y donaciones.
- Selección de fondo mediante imagen (`data URL`) con persistencia.
- Carga de canciones desde `songs/` en formatos `.txt`, `.xml` y `.json`.
- Carga de versiones de la Biblia desde `bibles/` en formato JSON.
- Creación automática de las carpetas `songs/` y `bibles/` si no existen.
- Creación de canciones con letra desde la app.
- Diseño responsive para tablets y móviles.
- Persistencia: fondo guardado en `openlyric-config.json`.

## Estructura

- `songs/` - Coloca aquí tus archivos de canciones (`.txt`, `.xml`, `.json`).
- `bibles/` - Coloca aquí los JSON de versiones de la Biblia (por ejemplo `valera.json`).
- `backgrounds/` - Imágenes de fondo (opcional; la app permite seleccionar fondo desde Opciones).
- `frontend/` - Interfaz web (Vite + JS).
- `src-tauri/` - Backend y configuración de Tauri (Rust).

## Uso

1. Añade canciones a `songs/` (o créalas desde la app en Liricas → "+ Nueva canción")
2. Añade versiones de la Biblia a `bibles/`
3. Ejecuta la aplicación
4. Desde la topbar elige **Liricas**, **Biblia** u **Opciones**

## Desarrollo

Requisitos:
- Rust (estable) y Cargo
- Node.js y npm
- Dependencias del sistema para Tauri en Linux (WebKitGTK/GTK, p. ej. `libwebkit2gtk-4.1-dev`, `libgtk-3-dev`, etc.)

```bash
# Instalar dependencias del frontend
cd frontend && npm install

# Ejecutar en modo desarrollo
cd src-tauri && cargo tauri dev
# o, si tienes el CLI instalado:
# npx @tauri-apps/cli tauri dev
```

> Si no tienes `cargo-tauri` instalado, puedes usar el CLI vía `npx @tauri-apps/cli`.

## Build

```bash
cd frontend && npm install && npm run build
cd ../src-tauri && cargo build --release
```

(El flujo completo de empaquetado puede hacerse con `tauri build` cuando el CLI esté disponible.)

## Licencia

Distribuido bajo la Licencia MIT. Ver [LICENSE](LICENSE).

## Contribuir

Las contribuciones son bienvenidas. Abre un issue o un pull request.
