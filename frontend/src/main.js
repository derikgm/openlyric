import './style.css';
import './app.css';

import {
  LoadSongs,
  LoadBibleVersions,
  LoadBibleSongs,
  CreateSong,
  SetBackground,
  SetBackgroundFromFile,
  EnsurePresentation,
  GetBackground,
  LoadBackgrounds,
  OpenDonationPage,
  GetPresentationMode,
  GetPresentationState,
  GetPresentationBackground,
  UpdatePresentation,
  UpdatePresentationBackground,
} from '../wailsjs/go/main/App';

const appElement = document.querySelector('#app');

// ---------- Estado ----------
let songs = [];
let versions = [];
let currentTab = 'lyricas'; // 'lyricas' | 'biblia' | 'opciones'

// Liricas
let currentSongIndex = 0;
let currentBlockIndex = 0;
let blocks = [];

// Fondos (galería de imágenes)
let backgrounds = [];
let currentBackgroundIndex = -1;

// Validación de monitores
let hasSecondMonitor = false;

// Biblia
let currentVersionIndex = 0;
let currentBookIndex = 0;
let currentChapterIndex = 0;
let currentVerseIndex = 0;
let bibleVerses = [];
let bibleVerseNumbers = [];
let bibleSongs = [];
let bibleBooksMap = {};
let bibleBookNames = [];
let currentBookName = '';
let currentChapterSongs = [];
let bibleVersionLoaded = '';
let bibleLoading = false;

// Opciones / UI
let lang = localStorage.getItem('openlyric:lang') || 'es';

// Presentación separada
let presentationMode = false;
let presentationBackground = '';
let lastPresentationTitle = '';
let lastPresentationText = '';

// ---------- i18n ----------
const i18n = {
  es: {
    appName: 'OpenLyric',
    tabLyricas: 'Liricas',
    tabBiblia: 'Biblia',
    tabOpciones: 'Opciones',
    songs: 'Canciones',
    noSongs: 'No hay canciones.',
    newSong: '+ Nueva canción',
    save: 'Guardar',
    cancel: 'Cancelar',
    title: 'Título',
    artist: 'Artista / Autor',
    lyrics: 'Letra (bloques separados por línea en blanco)',
    songCreated: 'Canción creada.',
    titleRequired: 'El título es obligatorio.',
    errorCreate: 'Error al crear la canción.',
    blocks: 'Bloques',
    noBlocks: 'Sin bloques.',
    blockShort: 'Bloque',
    prevBlock: '← Bloque anterior',
    nextBlock: 'Siguiente bloque →',
    versions: 'Versiones de la Biblia',
    noVersions: 'No se encontraron versiones de la Biblia.',
    version: 'Versión:',
    books: 'Libros',
    chapters: 'Capítulos',
    verse: 'Verso',
    noVerses: 'Sin versículos.',
    background: 'Fondo',
    selectBackground: 'Seleccionar fondo',
    backgroundUpdated: 'Fondo actualizado.',
    backgroundHelp: 'Elige una imagen de tu equipo para mostrarla como fondo de proyección. También puedes elegir una foto de la galería en la pestaña Liricas.',
    errorBackground: 'Error al seleccionar el fondo.',
    language: 'Idioma',
    languageHelp: 'Idioma de la interfaz y de los textos de la aplicación.',
    langEs: 'ES',
    langEn: 'EN',
    donations: 'Donaciones',
    donationsText: '¿Te gusta OpenLyric? Apoya el proyecto con una donación.',
    donateBtn: 'Donar',
    backgrounds: 'Fondos',
    noBackgrounds: 'Sin fondos.',
    screens: 'Monitores',
    noScreens: 'No se detectaron monitores.',
    noSecondMonitorTitle: 'No tienes segundo monitor para proyectar',
    noSecondMonitorMsg: 'OpenLyric necesita un segundo monitor o proyector para mostrar las letras. Puedes seguir usando la app para preparar canciones y opciones.',
    noSecondMonitorHint: 'Conecta un segundo monitor y pulsa «Reintentar detección».',
    retryDetection: 'Reintentar detección',
    presentationSection: 'Presentación',
    presentationHelp: 'Abre la ventana de presentación en el segundo monitor. Úsalo si cerraste la ventana o si conectaste el monitor después de iniciar la app.',
    openPresentation: 'Abrir presentación',
    monitorDetected: 'Segundo monitor detectado.',
    monitorNotDetected: 'Aún no se detecta un segundo monitor.',
    monitorError: 'Error al detectar monitores.',
    errorLoading: 'Error al cargar.',
    errorLoadingVersion: 'Error al cargar la versión de la Biblia.',
  },
  en: {
    appName: 'OpenLyric',
    tabLyricas: 'Lyrics',
    tabBiblia: 'Bible',
    tabOpciones: 'Options',
    songs: 'Songs',
    noSongs: 'No songs.',
    newSong: '+ New song',
    save: 'Save',
    cancel: 'Cancel',
    title: 'Title',
    artist: 'Artist / Author',
    lyrics: 'Lyrics (blocks separated by blank line)',
    songCreated: 'Song created.',
    titleRequired: 'Title is required.',
    errorCreate: 'Error creating song.',
    blocks: 'Blocks',
    noBlocks: 'No blocks.',
    blockShort: 'Block',
    prevBlock: '← Previous block',
    nextBlock: 'Next block →',
    versions: 'Bible versions',
    noVersions: 'No Bible versions found.',
    version: 'Version:',
    books: 'Books',
    chapters: 'Chapters',
    verse: 'Verse',
    noVerses: 'No verses.',
    background: 'Background',
    selectBackground: 'Select background',
    backgroundUpdated: 'Background updated.',
    backgroundHelp: 'Choose an image from your computer to use as the projection background. You can also pick a photo from the gallery in the Lyrics tab.',
    errorBackground: 'Error selecting background.',
    language: 'Language',
    languageHelp: 'Language used by the interface and app texts.',
    langEs: 'ES',
    langEn: 'EN',
    donations: 'Donations',
    donationsText: 'Like OpenLyric? Support the project with a donation.',
    donateBtn: 'Donate',
    backgrounds: 'Backgrounds',
    noBackgrounds: 'No backgrounds.',
    screens: 'Monitors',
    noScreens: 'No monitors detected.',
    noSecondMonitorTitle: 'No second monitor to project',
    noSecondMonitorMsg: 'OpenLyric needs a second monitor or projector to display lyrics. You can still use the app to prepare songs and options.',
    noSecondMonitorHint: 'Connect a second monitor and press "Retry detection".',
    retryDetection: 'Retry detection',
    presentationSection: 'Presentation',
    presentationHelp: 'Opens the presentation window on the second monitor. Use it if you closed the window or connected the monitor after starting the app.',
    openPresentation: 'Open presentation',
    monitorDetected: 'Second monitor detected.',
    monitorNotDetected: 'No second monitor detected yet.',
    monitorError: 'Error detecting monitors.',
    errorLoading: 'Error loading.',
    errorLoadingVersion: 'Error loading Bible version.',
  },
};

function t(key) {
  const dict = i18n[lang] || i18n.es;
  return dict[key] ?? i18n.es[key] ?? key;
}

function setLang(newLang) {
  lang = newLang;
  localStorage.setItem('openlyric:lang', lang);
}

// Actualiza todos los textos estáticos (los que no se reconstruyen en cada render).
function applyI18n() {
  document.getElementById('tab-lyricas').innerText = t('tabLyricas');
  document.getElementById('tab-biblia').innerText = t('tabBiblia');
  document.getElementById('tab-opciones').innerText = t('tabOpciones');

  // Liricas
  document.getElementById('lyricas-new-title').placeholder = t('title');
  document.getElementById('lyricas-new-artist').placeholder = t('artist');
  document.getElementById('lyricas-new-lyrics').placeholder = t('lyrics');
  document.getElementById('lyricas-new-save').innerText = t('save');
  document.getElementById('lyricas-new-cancel').innerText = t('cancel');
  document.getElementById('lyricas-prev-block').innerText = t('prevBlock');
  document.getElementById('lyricas-next-block').innerText = t('nextBlock');

  // Biblia
  document.getElementById('biblia-version-label').innerText = t('version');
  document.getElementById('biblia-prev-verse').innerText = t('prevBlock');
  document.getElementById('biblia-next-verse').innerText = t('nextBlock');

  // Opciones
  document.getElementById('opciones-title').innerText = t('tabOpciones');
  document.getElementById('opciones-bg-title').innerText = t('background');
  document.getElementById('opciones-bg-help').innerText = t('backgroundHelp');
  document.getElementById('opciones-lang-title').innerText = t('language');
  document.getElementById('opciones-lang-help').innerText = t('languageHelp');
  document.getElementById('opciones-presentation-title').innerText = t('presentationSection');
  document.getElementById('opciones-presentation-help').innerText = t('presentationHelp');
  document.getElementById('opciones-presentation-open').innerText = t('openPresentation');
  document.getElementById('opciones-donations-title').innerText = t('donations');
  document.getElementById('opciones-donations-text').innerText = t('donationsText');
  document.getElementById('opciones-donate').innerText = t('donateBtn');

  // Cartel de segundo monitor
  document.getElementById('monitor-warning-title').innerText = t('noSecondMonitorTitle');
  document.getElementById('monitor-warning-msg').innerText = t('noSecondMonitorMsg');
  document.getElementById('monitor-warning-hint').innerText = t('noSecondMonitorHint');
  document.getElementById('retry-monitor').innerText = t('retryDetection');
}

// ---------- Utilidades ----------
function splitBlocks(lyrics) {
  const blocks = String(lyrics ?? '')
    .split(/\r?\n\s*\r?\n/)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);
  return blocks.length > 0 ? blocks : [String(lyrics ?? '')];
}

// ---------- Presentación ----------
let lastSentBackground = null;

function setBackgroundImage(value) {
  const root = document.getElementById('app');
  if (!root) return;

  if (!value) {
    root.style.backgroundImage = '';
    return;
  }

  const url = value.startsWith('data:') ? value : `backgrounds/${value}`;
  root.style.backgroundImage = `url("${url}")`;
}

async function pushPresentationState() {
  if (presentationMode) return;
  try {
    await UpdatePresentation(lastPresentationTitle, lastPresentationText);
  } catch (e) {
    // La ventana de presentación puede no estar abierta.
  }
}

function updatePresentationState(title, text) {
  lastPresentationTitle = title ?? '';
  lastPresentationText = text ?? '';
  pushPresentationState();
}

// ---------- Fondos ----------
function applyBackground(value) {
  presentationBackground = value || '';
  setBackgroundImage(presentationBackground);

  if (presentationBackground !== lastSentBackground) {
    lastSentBackground = presentationBackground;
    UpdatePresentationBackground(presentationBackground).catch(() => {});
  }

  pushPresentationState();
}

// ---------- Render ----------
function render() {
  if (currentTab === 'lyricas') {
    renderLyricas();
  } else if (currentTab === 'biblia') {
    renderBiblia();
  } else {
    renderOpciones();
  }
}

function renderLyricas() {
  const songListEl = document.getElementById('lyricas-song-list');
  const blocksEl = document.getElementById('lyricas-blocks');
  const displayEl = document.getElementById('lyricas-block-display');
  const titleEl = document.getElementById('lyricas-song-title');
  const controlsEl = document.getElementById('lyricas-controls');

  const song = songs[currentSongIndex];

  // Lista de canciones
  songListEl.innerHTML = '';
  const hSongs = document.createElement('h3');
  hSongs.innerText = t('songs');
  songListEl.appendChild(hSongs);

  if (songs.length === 0) {
    const empty = document.createElement('div');
    empty.id = 'lyricas-empty';
    empty.className = 'empty-hint';
    empty.innerText = t('noSongs');
    songListEl.appendChild(empty);
  } else {
    for (let i = 0; i < songs.length; i++) {
      const item = document.createElement('div');
      item.className = 'lyricas-item' + (i === currentSongIndex ? ' active' : '');
      item.innerText = songs[i].title ?? '';
      item.dataset.index = String(i);
      item.addEventListener('click', () => selectLyricasSong(Number(item.dataset.index)));
      songListEl.appendChild(item);
    }
  }

  // El botón de nueva canción debe existir siempre, aunque no haya canciones.
  const newBtn = document.createElement('button');
  newBtn.id = 'lyricas-new-song';
  newBtn.className = 'secondary-button';
  newBtn.innerText = t('newSong');
  newBtn.addEventListener('click', () => {
    document.getElementById('lyricas-new-song-form').style.display = 'block';
  });
  songListEl.appendChild(newBtn);

  // Bloques de la canción seleccionada
  blocksEl.innerHTML = '';
  if (song) {
    const hBlocks = document.createElement('h3');
    hBlocks.innerText = t('blocks');
    blocksEl.appendChild(hBlocks);

    blocks = splitBlocks(song.lyrics ?? '');

    if (currentBlockIndex >= blocks.length) currentBlockIndex = 0;

    if (blocks.length === 0) {
      const empty = document.createElement('div');
      empty.id = 'lyricas-no-blocks';
      empty.className = 'empty-hint';
      empty.innerText = t('noBlocks');
      blocksEl.appendChild(empty);
    } else {
      for (let i = 0; i < blocks.length; i++) {
        const item = document.createElement('div');
        item.className = 'lyricas-block' + (i === currentBlockIndex ? ' active' : '');
        item.innerText = `${t('blockShort')} ${i + 1}`;
        item.dataset.index = String(i);
        item.addEventListener('click', () => selectLyricasBlock(Number(item.dataset.index)));
        blocksEl.appendChild(item);
      }
    }

    titleEl.innerText = song.title ?? '';
    controlsEl.style.display = 'flex';

    if (blocks.length > 0) {
      displayEl.innerText = blocks[currentBlockIndex] ?? '';
    } else {
      displayEl.innerText = '';
    }
  } else {
    blocks = [];
    titleEl.innerText = '';
    controlsEl.style.display = 'none';
    displayEl.innerText = '';
  }

  updatePresentationState(
    song ? song.title ?? '' : '',
    song && blocks.length > 0 ? blocks[currentBlockIndex] ?? '' : ''
  );
}

function selectLyricasSong(index) {
  if (songs.length === 0) return;
  currentSongIndex = index;
  currentBlockIndex = 0;
  renderLyricas();
}

function selectLyricasBlock(index) {
  if (blocks.length === 0) return;
  currentBlockIndex = index;
  renderLyricas();
}

function prevLyricasBlock() {
  if (blocks.length === 0) return;
  currentBlockIndex = (currentBlockIndex - 1 + blocks.length) % blocks.length;
  renderLyricas();
}

function nextLyricasBlock() {
  if (blocks.length === 0) return;
  currentBlockIndex = (currentBlockIndex + 1) % blocks.length;
  renderLyricas();
}

// ---------- Fondos (galería de imágenes) ----------
async function loadBackgrounds() {
  const loaded = await LoadBackgrounds();
  backgrounds = loaded ?? [];

  const saved = localStorage.getItem('openlyric:bg-file');
  currentBackgroundIndex = saved ? backgrounds.indexOf(saved) : -1;

  renderBackgrounds();
}

function renderBackgrounds() {
  const bgEl = document.getElementById('lyricas-backgrounds');
  if (!bgEl) return;

  bgEl.innerHTML = '';
  const hBg = document.createElement('h3');
  hBg.innerText = t('backgrounds');
  bgEl.appendChild(hBg);

  if (backgrounds.length === 0) {
    const empty = document.createElement('div');
    empty.id = 'lyricas-no-backgrounds';
    empty.className = 'empty-hint';
    empty.innerText = t('noBackgrounds');
    bgEl.appendChild(empty);
    return;
  }

  for (let i = 0; i < backgrounds.length; i++) {
    const item = document.createElement('div');
    item.className = 'lyricas-bg-item' + (i === currentBackgroundIndex ? ' active' : '');
    item.innerText = backgrounds[i];
    item.dataset.index = String(i);
    item.title = backgrounds[i];
    item.addEventListener('click', () => selectBackground(Number(item.dataset.index)));
    bgEl.appendChild(item);
  }
}

async function selectBackground(index) {
  if (backgrounds.length === 0) return;

  const filename = backgrounds[index];
  if (!filename) return;

  currentBackgroundIndex = index;
  const statusEl = document.getElementById('lyricas-bg-status');

  try {
    const dataUrl = await SetBackgroundFromFile(filename);
    localStorage.setItem('openlyric:bg-file', filename);
    applyBackground(dataUrl || '');
    renderBackgrounds();
    if (statusEl) statusEl.innerText = `${t('background')}: ${filename}`;
  } catch (err) {
    if (statusEl) statusEl.innerText = t('errorBackground');
  }
}

// ---------- Biblia ----------
async function loadBibleVersions() {
  const loaded = await LoadBibleVersions();
  versions = loaded ?? [];

  const selectEl = document.getElementById('biblia-version-select');
  selectEl.innerHTML = '';

  if (versions.length === 0) {
    document.getElementById('biblia-no-versions').style.display = 'block';
    return;
  }

  document.getElementById('biblia-no-versions').style.display = 'none';

  for (const v of versions) {
    const o = document.createElement('option');
    o.value = v.abbreviation;
    o.innerText = v.translation ? `${v.translation} (${v.abbreviation})` : v.abbreviation;
    selectEl.appendChild(o);
  }
}

function buildBibleBooks() {
  bibleBooksMap = {};
  bibleBookNames = [];

  for (const song of bibleSongs) {
    const title = song.title ?? '';
    const bookName = title.replace(/\s*\d+\s*$/, '').trim() || title;

    if (!bibleBooksMap[bookName]) {
      bibleBooksMap[bookName] = [];
      bibleBookNames.push(bookName);
    }
    bibleBooksMap[bookName].push(song);
  }
}

function setChapterVerses() {
  const song = currentChapterSongs[currentChapterIndex];
  if (!song) {
    bibleVerses = [];
    bibleVerseNumbers = [];
    return;
  }

  bibleVerses = splitBlocks(song.lyrics ?? '');
  bibleVerseNumbers = Array.isArray(song.verseNumbers) ? song.verseNumbers : [];

  if (currentVerseIndex >= bibleVerses.length) currentVerseIndex = 0;
}

async function selectBibleVersion(abbrev) {
  const v = versions.find((x) => x.abbreviation === abbrev);
  if (!v) return;

  currentVersionIndex = versions.findIndex((x) => x.abbreviation === abbrev);
  localStorage.setItem('openlyric:version', abbrev);
  bibleVersionLoaded = abbrev;

  bibleSongs = (await LoadBibleSongs(abbrev)) ?? [];
  buildBibleBooks();

  currentBookIndex = 0;
  currentChapterIndex = 0;
  currentVerseIndex = 0;
  currentBookName = bibleBookNames[0] ?? '';
  currentChapterSongs = currentBookName ? bibleBooksMap[currentBookName] : [];
  setChapterVerses();

  renderBiblePane();
}

function renderBiblia() {
  // Evita recargas duplicadas si se llama varias veces seguidas.
  if (bibleLoading) return;

  const noVersionsEl = document.getElementById('biblia-no-versions');

  if (versions.length === 0) {
    if (noVersionsEl) noVersionsEl.style.display = 'block';
    return;
  }
  if (noVersionsEl) noVersionsEl.style.display = 'none';

  const saved = localStorage.getItem('openlyric:version');
  const preferred =
    versions.find((v) => v.abbreviation === saved) ||
    versions[currentVersionIndex] ||
    versions[0];

  const versionSelect = document.getElementById('biblia-version-select');
  if (versionSelect) versionSelect.value = preferred.abbreviation;

  if (bibleVersionLoaded !== preferred.abbreviation) {
    bibleLoading = true;
    selectBibleVersion(preferred.abbreviation)
      .catch((err) => {
        console.error(err);
        bibleVersionLoaded = '';
        bibleSongs = [];
        buildBibleBooks();
        const booksEl = document.getElementById('biblia-books');
        if (booksEl) booksEl.innerText = t('errorLoadingVersion');
      })
      .finally(() => {
        bibleLoading = false;
      });
    return;
  }

  renderBiblePane();
}

function renderBiblePane() {
  const booksEl = document.getElementById('biblia-books');
  const chaptersEl = document.getElementById('biblia-chapters');
  const versesEl = document.getElementById('biblia-verses');
  const displayEl = document.getElementById('biblia-block-display');
  const titleEl = document.getElementById('biblia-song-title');
  const controlsEl = document.getElementById('biblia-controls');

  // Libros
  booksEl.innerHTML = '';
  const hBooks = document.createElement('h3');
  hBooks.innerText = t('books');
  booksEl.appendChild(hBooks);

  if (bibleBookNames.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-hint';
    empty.innerText = t('noVerses');
    booksEl.appendChild(empty);
  } else {
    for (let i = 0; i < bibleBookNames.length; i++) {
      const name = bibleBookNames[i];
      const item = document.createElement('div');
      item.className = 'lyricas-item' + (name === currentBookName ? ' active' : '');
      item.innerText = name;
      item.dataset.book = name;
      item.addEventListener('click', () => selectBibleBook(name));
      booksEl.appendChild(item);
    }
  }

  // Capítulos del libro actual
  chaptersEl.innerHTML = '';
  const hChapters = document.createElement('h3');
  hChapters.innerText = t('chapters');
  chaptersEl.appendChild(hChapters);

  if (currentChapterSongs.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-hint';
    empty.innerText = t('noVerses');
    chaptersEl.appendChild(empty);
  } else {
    for (let i = 0; i < currentChapterSongs.length; i++) {
      const item = document.createElement('div');
      item.className = 'lyricas-item' + (i === currentChapterIndex ? ' active' : '');
      item.innerText = currentChapterSongs[i].title ?? '';
      item.dataset.index = String(i);
      item.addEventListener('click', () => selectBibleChapter(i));
      chaptersEl.appendChild(item);
    }
  }

  // Versículos del capítulo actual
  versesEl.innerHTML = '';
  displayEl.innerText = '';

  const song = currentChapterSongs[currentChapterIndex];

  if (!song) {
    titleEl.innerText = '';
    controlsEl.style.display = 'none';
    updatePresentationState('', '');
    return;
  }

  titleEl.innerText = song.title ?? '';

  if (bibleVerses.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-hint';
    empty.innerText = t('noVerses');
    versesEl.appendChild(empty);
    controlsEl.style.display = 'none';
    updatePresentationState(song.title ?? '', '');
    return;
  }

  for (let i = 0; i < bibleVerses.length; i++) {
    const item = document.createElement('div');
    item.className = 'lyricas-block' + (i === currentVerseIndex ? ' active' : '');
    const verseNumber = bibleVerseNumbers[i] ?? i + 1;
    item.innerText = `${t('verse')} ${verseNumber}`;
    item.dataset.index = String(i);
    item.addEventListener('click', () => {
      currentVerseIndex = Number(item.dataset.index);
      renderBiblePane();
    });
    versesEl.appendChild(item);
  }

  displayEl.innerText = bibleVerses[currentVerseIndex] ?? '';
  controlsEl.style.display = 'flex';

  updatePresentationState(song.title ?? '', bibleVerses[currentVerseIndex] ?? '');
}

function selectBibleBook(name) {
  currentBookIndex = bibleBookNames.indexOf(name);
  currentBookName = name;
  currentChapterSongs = bibleBooksMap[name] ?? [];
  currentChapterIndex = 0;
  currentVerseIndex = 0;
  setChapterVerses();
  renderBiblePane();
}

function selectBibleChapter(index) {
  if (!currentChapterSongs[index]) return;
  currentChapterIndex = index;
  currentVerseIndex = 0;
  setChapterVerses();
  renderBiblePane();
}

function prevBibliaVerse() {
  if (bibleVerses.length === 0) return;
  currentVerseIndex = (currentVerseIndex - 1 + bibleVerses.length) % bibleVerses.length;
  renderBiblePane();
}

function nextBibliaVerse() {
  if (bibleVerses.length === 0) return;
  currentVerseIndex = (currentVerseIndex + 1) % bibleVerses.length;
  renderBiblePane();
}

// ---------- Opciones ----------
function renderOpciones() {
  const langSel = document.getElementById('opciones-lang');
  if (langSel) langSel.value = lang;
}

// ---------- Navegación ----------
function showTab(tab) {
  currentTab = tab;

  document.querySelectorAll('#topbar-tabs .tab').forEach((el) => {
    el.classList.toggle('active', el.dataset.tab === tab);
  });

  document.querySelectorAll('#content section.view').forEach((el) => {
    el.style.display = 'none';
  });
  document.getElementById(`view-${tab}`).style.display = 'flex';

  updateSecondMonitorWarning();
  render();
}

// Muestra u oculta la advertencia de segundo monitor según la pestaña activa.
// Solo impide la proyección (Liricas/Biblia), no bloquea el acceso a Opciones.
function updateSecondMonitorWarning() {
  const warningEl = document.getElementById('monitor-warning');
  if (!warningEl) return;

  const show = !hasSecondMonitor && (currentTab === 'lyricas' || currentTab === 'biblia');
  warningEl.style.display = show ? 'flex' : 'none';
  warningEl.classList.toggle('biblia', currentTab === 'biblia');
}

// ---------- Inicialización ----------
async function init() {
  // Topbar
  document.getElementById('tab-lyricas').addEventListener('click', () => showTab('lyricas'));
  document.getElementById('tab-biblia').addEventListener('click', () => showTab('biblia'));
  document.getElementById('tab-opciones').addEventListener('click', () => showTab('opciones'));

  // Validar que exista segundo monitor y arrancar la ventana de presentación
  try {
    hasSecondMonitor = !!(await EnsurePresentation());
  } catch (e) {
    hasSecondMonitor = false;
  }

  // Cargar canciones
  try {
    songs = (await LoadSongs()) ?? [];
  } catch (e) {
    songs = [];
  }

  // Cargar fondos (galería de imágenes)
  try {
    await loadBackgrounds();
  } catch (e) {
    backgrounds = [];
  }

  // Restaurar el fondo persistido por el backend
  try {
    const bg = await GetBackground();
    applyBackground(bg || '');
  } catch (e) {
    applyBackground('');
  }

  // Cargar versiones de la Biblia
  try {
    await loadBibleVersions();
  } catch (e) {
    versions = [];
  }

  // Idioma
  document.getElementById('opciones-lang').addEventListener('change', (e) => {
    setLang(e.target.value);
    applyI18n();
    render();
  });

  // Fondo (archivo local)
  document.getElementById('opciones-background').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const statusEl = document.getElementById('opciones-status');
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const dataUrl = String(reader.result ?? '');
        await SetBackground(dataUrl);
        applyBackground(dataUrl);
        if (statusEl) statusEl.innerText = t('backgroundUpdated');
      } catch (err) {
        if (statusEl) statusEl.innerText = t('errorBackground');
      } finally {
        // Permite volver a elegir el mismo archivo.
        e.target.value = '';
      }
    };
    reader.onerror = () => {
      if (statusEl) statusEl.innerText = t('errorBackground');
    };
    reader.readAsDataURL(file);
  });

  // Abrir la ventana de presentación manualmente
  document.getElementById('opciones-presentation-open').addEventListener('click', async () => {
    const statusEl = document.getElementById('opciones-presentation-status');

    try {
      hasSecondMonitor = !!(await EnsurePresentation());
      if (statusEl) {
        statusEl.innerText = hasSecondMonitor ? t('monitorDetected') : t('monitorNotDetected');
      }
      updateSecondMonitorWarning();
    } catch (e) {
      hasSecondMonitor = false;
      if (statusEl) statusEl.innerText = t('monitorError');
      updateSecondMonitorWarning();
    }
  });

  // Donaciones
  document.getElementById('opciones-donate').addEventListener('click', () => {
    OpenDonationPage();
  });

  // Nueva canción (Liricas)
  document.getElementById('lyricas-new-cancel').addEventListener('click', () => {
    document.getElementById('lyricas-new-song-form').style.display = 'none';
    document.getElementById('lyricas-new-title').value = '';
    document.getElementById('lyricas-new-artist').value = '';
    document.getElementById('lyricas-new-lyrics').value = '';
  });

  document.getElementById('lyricas-new-save').addEventListener('click', async () => {
    const title = document.getElementById('lyricas-new-title').value.trim();
    const artist = document.getElementById('lyricas-new-artist').value.trim();
    const lyrics = document.getElementById('lyricas-new-lyrics').value;
    const statusEl = document.getElementById('lyricas-status');

    if (!title) {
      if (statusEl) statusEl.innerText = t('titleRequired');
      return;
    }

    try {
      const created = await CreateSong(title, artist, lyrics);

      // Recargar todas las canciones: antes se reemplazaba la lista por la nueva.
      songs = (await LoadSongs()) ?? [];

      const createdIndex = songs.findIndex((s) => s.id === created.id);
      currentSongIndex = createdIndex >= 0 ? createdIndex : Math.max(0, songs.length - 1);
      currentBlockIndex = 0;

      document.getElementById('lyricas-new-song-form').style.display = 'none';
      document.getElementById('lyricas-new-title').value = '';
      document.getElementById('lyricas-new-artist').value = '';
      document.getElementById('lyricas-new-lyrics').value = '';

      if (statusEl) statusEl.innerText = t('songCreated');

      showTab('lyricas');
    } catch (err) {
      if (statusEl) statusEl.innerText = t('errorCreate');
    }
  });

  // Controles Liricas
  document.getElementById('lyricas-prev-block').addEventListener('click', prevLyricasBlock);
  document.getElementById('lyricas-next-block').addEventListener('click', nextLyricasBlock);

  // Controles Biblia
  document.getElementById('biblia-prev-verse').addEventListener('click', prevBibliaVerse);
  document.getElementById('biblia-next-verse').addEventListener('click', nextBibliaVerse);
  document.getElementById('biblia-version-select').addEventListener('change', async (e) => {
    if (bibleLoading) return;
    bibleLoading = true;
    try {
      await selectBibleVersion(e.target.value);
    } catch (err) {
      const booksEl = document.getElementById('biblia-books');
      if (booksEl) booksEl.innerText = t('errorLoadingVersion');
    } finally {
      bibleLoading = false;
    }
  });

  // Reintentar detección de segundo monitor (y abrir la presentación si aparece)
  document.getElementById('retry-monitor').addEventListener('click', async () => {
    const statusEl = document.getElementById('monitor-warning-status');

    try {
      hasSecondMonitor = !!(await EnsurePresentation());
      if (statusEl) {
        statusEl.innerText = hasSecondMonitor ? t('monitorDetected') : t('monitorNotDetected');
      }
      updateSecondMonitorWarning();
    } catch (e) {
      hasSecondMonitor = false;
      if (statusEl) statusEl.innerText = t('monitorError');
      updateSecondMonitorWarning();
    }
  });

  // Teclado (un único listener)
  document.addEventListener('keydown', (e) => {
    const target = e.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
      return;
    }
    if (currentTab === 'opciones') return;

    if (e.key === 'ArrowRight') {
      if (currentTab === 'biblia') nextBibliaVerse(); else nextLyricasBlock();
    } else if (e.key === 'ArrowLeft') {
      if (currentTab === 'biblia') prevBibliaVerse(); else prevLyricasBlock();
    }
  });

  applyI18n();
  showTab(currentTab);
}

function buildControlUI() {
  appElement.innerHTML = `
  <nav id="topbar">
    <div id="topbar-tabs">
      <button id="tab-lyricas" class="tab active" data-tab="lyricas">${t('tabLyricas')}</button>
      <button id="tab-biblia" class="tab" data-tab="biblia">${t('tabBiblia')}</button>
      <button id="tab-opciones" class="tab" data-tab="opciones">${t('tabOpciones')}</button>
    </div>
  </nav>
  <div id="content">
    <div id="monitor-warning">
      <div class="warning-card">
        <h2 id="monitor-warning-title" class="warning-title">${t('noSecondMonitorTitle')}</h2>
        <p id="monitor-warning-msg" class="warning-msg">${t('noSecondMonitorMsg')}</p>
        <p id="monitor-warning-hint" class="warning-hint">${t('noSecondMonitorHint')}</p>
        <div id="monitor-warning-status" class="status-line"></div>
        <button id="retry-monitor" class="warning-button">${t('retryDetection')}</button>
      </div>
    </div>

    <section id="view-lyricas" class="view">
      <aside id="lyricas-sidebar">
        <div id="lyricas-song-list"></div>
        <div id="lyricas-new-song-form">
          <input id="lyricas-new-title" type="text" placeholder="${t('title')}" />
          <input id="lyricas-new-artist" type="text" placeholder="${t('artist')}" />
          <textarea id="lyricas-new-lyrics" placeholder="${t('lyrics')}"></textarea>
          <div>
            <button id="lyricas-new-save">${t('save')}</button>
            <button id="lyricas-new-cancel">${t('cancel')}</button>
          </div>
        </div>
        <div id="lyricas-status" class="status-line"></div>
        <div id="lyricas-blocks"></div>
        <div id="lyricas-backgrounds"></div>
        <div id="lyricas-bg-status" class="status-line"></div>
      </aside>
      <main id="lyricas-main">
        <h1 id="lyricas-song-title"></h1>
        <div id="lyricas-block-display"></div>
        <div id="lyricas-controls">
          <button id="lyricas-prev-block">${t('prevBlock')}</button>
          <button id="lyricas-next-block">${t('nextBlock')}</button>
        </div>
      </main>
    </section>

    <section id="view-biblia" class="view" style="display:none;">
      <aside id="biblia-sidebar">
        <div class="field">
          <label id="biblia-version-label">${t('version')}</label>
          <select id="biblia-version-select"></select>
        </div>
        <div id="biblia-no-versions" class="empty-hint">${t('noVersions')}</div>
        <div id="biblia-books"></div>
        <div id="biblia-chapters"></div>
      </aside>
      <main id="biblia-main">
        <div id="biblia-song-title"></div>
        <div id="biblia-block-display"></div>
        <div id="biblia-verses"></div>
        <div id="biblia-controls">
          <button id="biblia-prev-verse">${t('prevBlock')}</button>
          <button id="biblia-next-verse">${t('nextBlock')}</button>
        </div>
      </main>
    </section>

    <section id="view-opciones" class="view" style="display:none;">
      <main id="opciones-main">
        <div id="opciones-container">
          <h1 id="opciones-title">${t('tabOpciones')}</h1>

          <section class="opciones-card">
            <h2 id="opciones-bg-title">${t('background')}</h2>
            <p id="opciones-bg-help" class="opciones-help">${t('backgroundHelp')}</p>
            <input id="opciones-background" type="file" accept="image/*" />
            <div id="opciones-status" class="status-line"></div>
          </section>

          <section class="opciones-card">
            <h2 id="opciones-lang-title">${t('language')}</h2>
            <p id="opciones-lang-help" class="opciones-help">${t('languageHelp')}</p>
            <select id="opciones-lang">
              <option value="es">${t('langEs')}</option>
              <option value="en">${t('langEn')}</option>
            </select>
          </section>

          <section class="opciones-card">
            <h2 id="opciones-presentation-title">${t('presentationSection')}</h2>
            <p id="opciones-presentation-help" class="opciones-help">${t('presentationHelp')}</p>
            <button id="opciones-presentation-open">${t('openPresentation')}</button>
            <div id="opciones-presentation-status" class="status-line"></div>
          </section>

          <section class="opciones-card">
            <h2 id="opciones-donations-title">${t('donations')}</h2>
            <p id="opciones-donations-text" class="opciones-help">${t('donationsText')}</p>
            <button id="opciones-donate">${t('donateBtn')}</button>
          </section>
        </div>
      </main>
    </section>
  </div>
`;
}

// ---------- Modo presentación ----------
async function startPresentationMode() {
  document.body.classList.add('presentation-mode');
  appElement.innerHTML = `
    <div id="presentation">
      <div id="presentation-title"></div>
      <div id="presentation-text"></div>
    </div>
  `;

  let lastBackgroundVersion = null;
  let lastTitle = null;
  let lastText = null;

  const refresh = async () => {
    let state;
    try {
      state = await GetPresentationState();
    } catch (e) {
      return;
    }
    if (!state) return;

    const backgroundVersion = state.backgroundVersion ?? 0;
    if (backgroundVersion !== lastBackgroundVersion) {
      lastBackgroundVersion = backgroundVersion;
      try {
        const background = await GetPresentationBackground();
        setBackgroundImage(background || '');
      } catch (e) {
        // Mantiene el fondo anterior.
      }
    }

    const title = state.title ?? '';
    if (title !== lastTitle) {
      lastTitle = title;
      const titleEl = document.getElementById('presentation-title');
      if (titleEl) titleEl.innerText = title;
    }

    const text = state.text ?? '';
    if (text !== lastText) {
      lastText = text;
      const textEl = document.getElementById('presentation-text');
      const container = document.getElementById('presentation');
      if (textEl) textEl.innerText = text;
      if (container) container.classList.toggle('has-text', text.trim().length > 0);
    }
  };

  await refresh();
  // La ventana de presentación lee el estado compartido periódicamente.
  setInterval(refresh, 300);
}

async function bootstrap() {
  // Wails inyecta los bindings al cargar; reintentamos brevemente por si el
  // runtime aún no está listo (importante para no abrir la UI de control en la
  // ventana de presentación).
  for (let attempt = 0; attempt < 20; attempt++) {
    try {
      presentationMode = !!(await GetPresentationMode());
      break;
    } catch (e) {
      presentationMode = false;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  if (presentationMode) {
    await startPresentationMode();
    return;
  }

  buildControlUI();
  await init();
}

bootstrap();
