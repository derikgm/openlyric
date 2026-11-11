# OpenLyric - Lista de Tareas

## Fase 0: Configuración del entorno
- [x] Verificar instalación de Go ✅ (go1.27.1)
- [x] Instalar Wails CLI ✅ (v2.17.1)
- [x] Instalar dependencias del sistema para Linux ✅ (libwebkit2gtk-4.1-dev instalado)
- [x] Resolver dependencias faltantes del doctor ⚠️ (doctor aún reporta `libwebkit`; probable bug/naming de Wails v2.17.1)

## Fase 1: Scaffold inicial del proyecto
- [x] Inicializar proyecto Wails (`wails init`) ✅ (scaffold creado en /tmp y copiado al proyecto)
- [x] Ajustar estructura de carpetas ✅ (app.go, main.go, frontend/, build/, wails.json, go.mod, go.sum)
- [x] Instalar dependencias del frontend (`npm install`) ✅
- [x] Confirmar que `wails dev` compila ✅ (build de producción exitoso con tag `webkit2_41`)

## Fase 2: Modelo y carga de canciones
- [x] Definir estructura del modelo `Song`
- [x] Implementar parser de canciones (`.txt`, `.xml`, `.json`)
- [x] Crear carpeta `songs/` y cargar canciones
- [x] Listar canciones en el controlador
- [x] Soporte de versiones de la Biblia (`bibles/`) ✅ (formato JSON tipo Reina-Valera, p. ej. `valera.json`)
- [x] Crear carpeta `songs/` y `bibles/` automáticamente si no existen ✅
- [x] Crear canciones con letra desde la app (`CreateSong`) ✅

## Fase 3: Visor de letras
- [x] Topbar de navegación: Liricas | Biblia | Opciones ✅
- [x] Liricas: lista de canciones y bloques numerados, cambio rápido de bloque al hacer clic ✅
- [x] Biblia: selector de versión, libros, capítulos y versículos en grande ✅
- [x] Opciones: fondo, idioma (ES/EN) y donaciones ✅
- [x] Auto-avance de versos/bloques ⚠️ (eliminado: se prefirió navegación manual)
- [x] Navegación con teclado (← / →) ✅
- [x] Pantalla completa ✅
- [x] Seleccionar fondo ✅
- [x] Mostrar versos numerados de la Biblia ✅
- [x] Panel lateral con lista de canciones/libros/capítulos ✅
- [x] Formulario para crear una nueva canción desde la app ✅
- [x] Catálogo de canciones (setlist): sidebar derecho, añadir/quitar, reordenar, autoguardado e importar/exportar ✅
- [x] Transición de fade entre bloques/versos ✅
- [x] Contador de verso actual ✅
- [x] Overlay semitransparente para legibilidad ✅
- [x] Diseño responsive (tablet y móvil) ✅
- [x] Internacionalización español/inglés ✅
- [x] Persistencia (fondo, última versión, idioma) ✅
- [x] Tests unitarios Go ✅

## Fase 4: Controlador y monitores
- [x] Detectar monitores ✅ (backend `GetScreens` + UI que lista monitores)
- [x] Abrir visor en segundo monitor ✅ (proceso de presentación independiente, fullscreen en el monitor no principal)
- [x] Ventana de presentación separada del control ✅ (la UI de control permanece en el monitor principal)
- [x] Controles del controlador ✅ (botones: verso anterior / siguiente verso)

## Fase 5: Build y release
- [x] Ejecutar `wails build` ✅ (build de producción exitoso con tag `webkit2_41`)
- [ ] Probar build Linux/Windows

## Fase 6: Documentación y pulido
- [x] Completar README ✅ (README actualizado con estado real del proyecto)
- [x] Añadir licencia ✅ (MIT - archivo `LICENSE`)
- [x] Añadir sección de contribución ✅ (sección actualizada en README)
- [x] Añadir soporte de versiones de la Biblia (JSON tipo Reina-Valera) ✅ (backend `bible.go`, `LoadBibleVersions`, `LoadBibleSongs`; frontend selector de versión)
- [x] Fondos / galería de imágenes (carpeta `backgrounds/`) ✅ (selección rápida de fotos desde la sección Liricas)
- [x] Validación de segundo monitor al arranque ✅ (mensaje de advertencia si no hay segundo monitor conectado, sin bloquear acceso a la app)
- [x] Botón "Reintentar detección" en el cartel de advertencia ✅
- [x] Análisis y corrección de bugs de UI ✅ (Biblia, fondos, opciones a pantalla completa, doble listener de teclado, i18n dinámica)
- [x] Ventana de presentación separada ✅ (control en monitor principal; proyección fullscreen en segundo monitor)
- [x] Persistencia, responsive e i18n ES/EN ✅
- [x] Tests unitarios Go ✅

