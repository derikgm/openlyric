# OpenLyric (Tauri + Angular)

Visor de letras y versículos para segundo monitor/proyector, ligero y pensado para el culto o eventos. Esta es la versión **Tauri 2 + Angular 22** del proyecto clásico (Wails + JS vanilla).

## Funcionalidades

- Visor fullscreen; intenta abrirse en el segundo monitor cuando existe.
- Navegación por pestañas: **Líricas**, **Biblia** y **Opciones**.
- **Líricas**: lista de canciones, bloques de letra numerados, cambio rápido de bloque, avance automático (8 s) y teclado (← / →).
- **Biblia**: versiones JSON (p. ej. Reina-Valera 1909), selección de libro/capítulo y versículos en grande.
- **Opciones**: fondo personalizado (imagen → data URL persistida), idioma ES/EN y donaciones.
- **Canciones**: carga desde `songs/` (`.txt`, `.xml`, `.json`) y creación desde la app (`.txt`).
- Persistencia del fondo en `openlyric-config.json`; idioma y última versión de Biblia en `localStorage`.

## Estructura

- `src/app/core/models.ts` — tipos de canciones, Biblia y monitores.
- `src/app/core/openlyric.service.ts` — envoltorio tipado de los comandos Tauri (`invoke`).
- `src/app/core/i18n.ts` — diccionarios ES/EN.
- `src/app/app.component.*` — interfaz principal (pestañas y vistas).
- `src-tauri/src/lib.rs` — backend Rust: parsers, persistencia y comandos.
- `bibles/` — versiones de la Biblia en JSON (incluye `valera.json`).
- `songs/` — canciones del usuario (`.txt`/`.xml`/`.json`).

La app busca sus datos en el directorio actual, sus ancestros o junto al ejecutable; también se puede forzar con la variable `OPENLYRIC_DATA_DIR`.

## Desarrollo

Requisitos: Rust estable + Cargo, Node.js 20+ y dependencias de Tauri en Linux (GTK3/WebKitGTK, p. ej. `libwebkit2gtk-4.1-dev`, `libgtk-3-dev`).

```bash
npm install
npm run tauri dev
```

## Build

```bash
npm install
npm run tauri build
```

Salidas por defecto:
- Frontend Angular: `dist/openlyric/browser`
- Binario Tauri (sin empaquetar): `src-tauri/target/release/openlyric`

## Comandos Tauri expuestos

`load_songs`, `load_bible_versions`, `load_bible_songs`, `create_song`, `set_background`, `get_background`, `get_screens`, `greet`.

## Licencia

MIT. Ver `../LICENSE`.
