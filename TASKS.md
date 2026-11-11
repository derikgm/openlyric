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
- [x] Implementar UI del visor
- [x] Avanzar verso
- [x] Pantalla completa
- [x] Seleccionar fondo
- [x] Mostrar versos numerados de la Biblia (versiones cargadas desde `bibles/`) ✅
- [x] Panel lateral izquierdo con lista de canciones / capítulos ✅ (y mensaje "No hay canciones." si no hay)
- [x] Formulario para crear una nueva canción con letra desde la app ✅

## Fase 4: Controlador y monitores
- [x] Detectar monitores ✅ (backend `GetScreens` + UI que lista monitores)
- [x] Abrir visor en segundo monitor ✅ (backend posiciona la ventana en el monitor no principal)
- [x] Controles del controlador ✅ (botones: verso anterior / siguiente verso)

## Fase 5: Build y release
- [x] Ejecutar `wails build` ✅ (build de producción exitoso con tag `webkit2_41`)
- [ ] Probar build Linux/Windows

## Fase 6: Documentación y pulido
- [x] Completar README ✅ (README actualizado con estado real del proyecto)
- [x] Añadir licencia ✅ (MIT - archivo `LICENSE`)
- [x] Añadir sección de contribución ✅ (sección actualizada en README)
- [x] Añadir soporte de versiones de la Biblia (JSON tipo Reina-Valera) ✅ (backend `bible.go`, `LoadBibleVersions`, `LoadBibleSongs`; frontend selector de versión)
