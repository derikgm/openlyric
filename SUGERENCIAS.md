# Sugerencias para OpenLyric

Lista de ideas y mejoras posibles para el proyecto. No son compromisos ni están priorizadas; sirven como backlog de inspiración para decidir qué construir después.

## Catálogo y preparación del servicio

- **Múltiples catálogos / setlists**: guardar varios catálogos con nombre y fecha (p. ej. “Culto domingo 15 nov”, “Vigilia”) y poder cambiar entre ellos.
- **Renombrar catálogo**: editar el nombre del catálogo actual desde la interfaz.
- **Elementos mixtos en el catálogo**: permitir añadir no solo canciones, sino también capítulos/versículos de la Biblia, notas, imágenes o diapositivas en blanco dentro del mismo orden.
- **Guardar el bloque/verso inicial**: recordar desde qué bloque o versículo debe empezar cada elemento del catálogo.
- **Duplicados y orden inteligente**: opción para permitir o evitar duplicados, y atajos para mover al inicio/final.
- **Búsqueda y filtrado**: buscar canciones por título, artista o contenido; filtrar el catálogo mientras se prepara.
- **Etiquetas/categorías**: marcar canciones como adoración, júbilo, ofrenda, especial, etc., para encontrarlas rápido.
- **Historial reciente**: mostrar las últimas canciones o pasajes proyectados.

## Edición y gestión de canciones

- **Editar canción existente**: modificar título, artista y letra desde la app sin tocar el archivo manualmente.
- **Eliminar canción**: borrar una canción con confirmación.
- **Vista previa de bloques**: mostrar el texto de cada bloque en la lista (no solo “Bloque 1, 2, 3”) para identificar coros y repeticiones.
- **Detección/ayuda de bloques**: sugerir separaciones por estrofas o permitir marcar coros repetidos.
- **Soporte de acordes**: formato tipo ChordPro o una vista de acordes para el músico distinta de la vista proyectada.
- **Metadatos útiles**: tono, tempo, autor, CCLI/licencia, notas internas.
- **Importar/exportar biblioteca**: traer canciones desde otros formatos (Holyric, OpenLP, EasyWorship, texto plano) y exportar la biblioteca completa.

## Biblia

- **Búsqueda por texto o referencia**: ir directo a “Juan 3:16” o buscar palabras/frases dentro de la versión cargada.
- **Versículos en el catálogo**: arrastrar o añadir un pasaje concreto al orden del servicio.
- **Mostrar rango de versículos**: proyectar varios versículos juntos (p. ej. 16–18) en una sola pantalla.
- **Comparar versiones**: vista paralela de dos traducciones.
- **Más versiones incluidas/listas**: facilitar la descarga o instalación de traducciones comunes.
- **Marcadores y pasajes frecuentes**: accesos rápidos a lecturas habituales.

## Presentación y proyección

- **Pantalla en negro / limpiar texto / mostrar logo**: botones de emergencia para ocultar la letra sin cerrar la presentación.
- **Transiciones suaves**: fundido entre bloques, versos o cambios de fondo.
- **Personalización tipográfica**: tamaño de letra, fuente, alineación, sombra/contorno y márgenes para adaptarse al proyector.
- **Temas/plantillas**: presets visuales (oscuro, claro, alto contraste, texto abajo tipo subtítulo).
- **Fondo por canción o por bloque**: además del fondo global, permitir asociar una imagen a una canción.
- **Fondos animados o video**: soporte opcional para fondos en movimiento, cuidando el rendimiento en equipos modestos.
- **Cuenta regresiva y avisos**: temporizador antes de iniciar, o mensajes breves en pantalla.
- **Ajuste fino de posición del monitor**: configurar manualmente en qué lado/coordenadas está el segundo monitor (útil cuando no queda a la derecha).

## Control y acceso

- **Atajos de teclado configurables**: personalizar navegación, pantalla en negro, siguiente elemento del catálogo, etc.
- **Control remoto local**: controlar la proyección desde el celular o una tablet por navegador en la misma red (con QR para conectar).
- **Modo espectador en móvil**: que otros dispositivos vean la letra actual (útil para músicos o personas sin visibilidad del proyector).
- **Cola/siguiente elemento**: mostrar claramente qué canción o versículo viene después y pasar al siguiente con un clic.

## Experiencia de uso

- **Confirmaciones y deshacer**: evitar borrados accidentales y permitir deshacer cambios recientes.
- **Modo claro/oscuro de la interfaz de control**: independiente del fondo de proyección.
- **Accesibilidad**: mejor contraste, tamaños escalables y navegación completa por teclado.
- **Indicadores de estado**: mostrar si la ventana de presentación está abierta/conectada y qué se está proyectando.
- **Rendimiento en PCs viejas**: opciones de bajo consumo (sin animaciones, menor calidad de fondos, polling ajustable).

## Distribución y calidad

- **Instaladores y paquetes**: AppImage/Flatpak/deb/rpm para Linux y instalador portable para Windows.
- **Exportar/importar configuración**: respaldar idioma, fondo, catálogos y ajustes.
- **Pruebas automatizadas de UI**: complementar los tests de Go con pruebas básicas del flujo de control/presentación.
- **Integración continua y releases**: builds automáticos por plataforma y versiones publicadas (GitHub Releases).
- **Documentación para colaboradores**: guía de contribución, formato de archivos soportados y ejemplos.

## Ideas a evaluar con cuidado

- **Streaming/salida NDI o virtual camera**: útil para transmisiones, pero puede aumentar mucho la complejidad y los requisitos.
- **Sincronización en la nube**: compartir catálogos entre dispositivos; habría que definir privacidad y funcionamiento offline.
- **Plugins o scripts**: extensibilidad para necesidades específicas sin volver pesado el núcleo.
