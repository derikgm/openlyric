import './style.css';
import './app.css';

import {
  LoadSongs,
  LoadBibleVersions,
  LoadBibleSongs,
  CreateSong,
  SetBackground,
  SetBackgroundFromFile,
  GetScreens,
  GetBackground,
  LoadBackgrounds,
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

// Biblia
let currentVersionIndex = 0;
let currentBookIndex = 0;
let currentChapterIndex = 0;
let bibleVerses = [];
let currentVerseIndex = 0;

// Opciones / UI
let autoAdvance = false;
let autoAdvanceTimer = null;
let lang = localStorage.getItem('openlyric:lang') || 'es';

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
    autoAdvanceOn: '⏱ Avance automático: ON',
    autoAdvanceOff: '⏱ Avance automático: OFF',
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
    errorBackground: 'Error al seleccionar el fondo.',
    language: 'Idioma',
    langEs: 'ES',
    langEn: 'EN',
    donations: 'Donaciones',
    donationsText: '¿Te gusta OpenLyric? Apoya el proyecto con una donación.',
    donateBtn: 'Donar',
    backgrounds: 'Fondos',
    noBackgrounds: 'Sin fondos.',
    screens: 'Monitores',
    noScreens: 'No se detectaron monitores.',
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
    autoAdvanceOn: '⏱ Auto-advance: ON',
    autoAdvanceOff: '⏱ Auto-advance: OFF',
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
    errorBackground: 'Error selecting background.',
    language: 'Language',
    langEs: 'ES',
    langEn: 'EN',
    donations: 'Donations',
    donationsText: 'Like OpenLyric? Support the project with a donation.',
    donateBtn: 'Donate',
    backgrounds: 'Backgrounds',
    noBackgrounds: 'No backgrounds.',
    screens: 'Monitors',
    noScreens: 'No monitors detected.',
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

// ---------- Utilidades ----------
function splitBlocks(lyrics) {
  const blocks = String(lyrics ?? '')
    .split(/\r?\n\s*\r?\n/)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);
  return blocks.length > 0 ? blocks : [String(lyrics ?? '')];
}

function clearAutoAdvance() {
  if (autoAdvanceTimer) {
    clearInterval(autoAdvanceTimer);
    autoAdvanceTimer = null;
  }
}

function startAutoAdvance() {
  clearAutoAdvance();
  const items = currentTab === 'biblia' ? bibleVerses : blocks;
  if (items.length === 0) return;
  autoAdvanceTimer = setInterval(() => {
    if (currentTab === 'biblia') {
      currentVerseIndex = (currentVerseIndex + 1) % bibleVerses.length;
    } else {
      currentBlockIndex = (currentBlockIndex + 1) % blocks.length;
    }
    render();
  }, 8000);
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
    const newBtn = document.createElement('button');
    newBtn.id = 'lyricas-new-song';
    newBtn.innerText = t('newSong');
    newBtn.addEventListener('click', () => {
      document.getElementById('lyricas-new-song-form').style.display = 'block';
    });
    songListEl.appendChild(newBtn);
  }

  // Bloques de la canción seleccionada
  blocksEl.innerHTML = '';
  if (song) {
    const hBlocks = document.createElement('h3');
    hBlocks.innerText = t('blocks');
    blocksEl.appendChild(hBlocks);

    blocks = splitBlocks(song.lyrics ?? '');

    if (blocks.length === 0) {
      const empty = document.createElement('div');
      empty.id = 'lyricas-no-blocks';
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
      displayEl.innerText = blocks[currentBlockIndex];
    } else {
      displayEl.innerText = '';
    }
  } else {
    blocks = [];
    titleEl.innerText = '';
    controlsEl.style.display = 'none';
    displayEl.innerText = '';
  }
}

function selectLyricasSong(index) {
  if (songs.length === 0) return;
  currentSongIndex = index;
  currentBlockIndex = 0;
  render();
}

function selectLyricasBlock(index) {
  if (blocks.length === 0) return;
  currentBlockIndex = index;
  render();
  if (autoAdvance) startAutoAdvance();
}

// ---------- Fondos (galería de imágenes) ----------
async function loadBackgrounds() {
  const loaded = await LoadBackgrounds();
  backgrounds = loaded ?? [];
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
    empty.innerText = t('noBackgrounds');
    bgEl.appendChild(empty);
    return;
  }

  for (let i = 0; i < backgrounds.length; i++) {
    const item = document.createElement('div');
    item.className = 'lyricas-bg-item' + (i === currentBackgroundIndex ? ' active' : '');
    item.innerText = backgrounds[i];
    item.dataset.index = String(i);
    item.addEventListener('click', async () => {
      await selectBackground(Number(item.dataset.index));
    });
    bgEl.appendChild(item);
  }
}

async function selectBackground(index) {
  if (backgrounds.length === 0) return;
  currentBackgroundIndex = index;
  const filename = backgrounds[currentBackgroundIndex];

  try {
    await SetBackgroundFromFile(filename);
    localStorage.setItem('openlyric:background', filename);
    const viewer = document.getElementById('viewer');
    if (viewer) {
      viewer.style.backgroundImage = `url('backgrounds/${filename}')`;
    }
    renderBackgrounds();
    document.getElementById('lyricas-status').innerText = 'Fondo: ' + filename;
  } catch (err) {
    document.getElementById('lyricas-status').innerText = t('errorBackground');
  }
}

function prevLyricasBlock() {
  if (blocks.length === 0) return;
  currentBlockIndex = (currentBlockIndex - 1 + blocks.length) % blocks.length;
  render();
  if (autoAdvance) startAutoAdvance();
}

function nextLyricasBlock() {
  if (blocks.length === 0) return;
  currentBlockIndex = (currentBlockIndex + 1) % blocks.length;
  render();
  if (autoAdvance) startAutoAdvance();
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

async function selectBibleVersion(abbrev) {
  const v = versions.find((x) => x.abbreviation === abbrev);
  if (!v) return;
  currentVersionIndex = versions.findIndex((x) => x.abbreviation === abbrev);
  localStorage.setItem('openlyric:version', abbrev);

  const loadedSongs = await LoadBibleSongs(abbrev);
  renderBibliaBooks(loadedSongs ?? []);
}

function renderBibliaBooks(songsList) {
  const booksEl = document.getElementById('biblia-books');
  const chaptersEl = document.getElementById('biblia-chapters');
  const versesEl = document.getElementById('biblia-verses');
  const displayEl = document.getElementById('biblia-block-display');
  const titleEl = document.getElementById('biblia-song-title');
  const controlsEl = document.getElementById('biblia-controls');

  booksEl.innerHTML = '';
  chaptersEl.innerHTML = '';
  versesEl.innerHTML = '';
  displayEl.innerText = '';
  titleEl.innerText = '';
  controlsEl.style.display = 'none';

  const hBooks = document.createElement('h3');
  hBooks.innerText = t('books');
  booksEl.appendChild(hBooks);

  if (songsList.length === 0) {
    const empty = document.createElement('div');
    empty.innerText = t('noVersions');
    booksEl.appendChild(empty);
    return;
  }

  // Agrupar por libro
  const booksMap = {};
  for (const s of songsList) {
    const bookName = s.title?.split(' ').slice(0, -1).join(' ') || s.title;
    if (!booksMap[bookName]) booksMap[bookName] = [];
    booksMap[bookName].push(s);
  }

  const bookNames = Object.keys(booksMap);
  for (const name of bookNames) {
    const item = document.createElement('div');
    item.className = 'lyricas-item' + (currentBookIndex === bookNames.indexOf(name) ? ' active' : '');
    item.innerText = name;
    item.dataset.book = name;
    item.addEventListener('click', () => {
      currentBookIndex = bookNames.indexOf(name);
      renderBibliaChapters(booksMap[name]);
    });
    booksEl.appendChild(item);
  }

  if (bookNames.length > 0) {
    renderBibliaChapters(booksMap[bookNames[0]]);
  }
}

function renderBibliaChapters(chapterSongs) {
  const chaptersEl = document.getElementById('biblia-chapters');
  const versesEl = document.getElementById('biblia-verses');
  const displayEl = document.getElementById('biblia-block-display');
  const titleEl = document.getElementById('biblia-song-title');
  const controlsEl = document.getElementById('biblia-controls');

  chaptersEl.innerHTML = '';
  versesEl.innerHTML = '';
  displayEl.innerText = '';
  titleEl.innerText = '';
  controlsEl.style.display = 'none';

  const hChapters = document.createElement('h3');
  hChapters.innerText = t('chapters');
  chaptersEl.appendChild(hChapters);

  for (let i = 0; i < chapterSongs.length; i++) {
    const item = document.createElement('div');
    item.className = 'lyricas-item' + (currentChapterIndex === i ? ' active' : '');
    item.innerText = chapterSongs[i].title ?? '';
    item.dataset.index = String(i);
    item.addEventListener('click', () => {
      currentChapterIndex = Number(item.dataset.index);
      renderBibliaVerses(chapterSongs[currentChapterIndex]);
    });
    chaptersEl.appendChild(item);
  }

  if (chapterSongs.length > 0) {
    renderBibliaVerses(chapterSongs[0]);
  }
}

function renderBibliaVerses(song) {
  const versesEl = document.getElementById('biblia-verses');
  const displayEl = document.getElementById('biblia-block-display');
  const titleEl = document.getElementById('biblia-song-title');
  const controlsEl = document.getElementById('biblia-controls');

  versesEl.innerHTML = '';
  displayEl.innerText = '';
  titleEl.innerText = song.title ?? '';
  controlsEl.style.display = 'flex';

  bibleVerses = splitBlocks(song.lyrics ?? '');
  currentVerseIndex = 0;

  if (bibleVerses.length === 0) {
    const empty = document.createElement('div');
    empty.innerText = t('noVerses');
    versesEl.appendChild(empty);
    return;
  }

  for (let i = 0; i < bibleVerses.length; i++) {
    const item = document.createElement('div');
    item.className = 'lyricas-block' + (i === currentVerseIndex ? ' active' : '');
    item.innerText = `${t('verse')} ${i + 1}`;
    item.dataset.index = String(i);
    item.addEventListener('click', () => {
      currentVerseIndex = Number(item.dataset.index);
      render();
    });
    versesEl.appendChild(item);
  }

  displayEl.innerText = bibleVerses[0];
}

function renderBiblia() {
  const noVersionsEl = document.getElementById('biblia-no-versions');
  const versionSelect = document.getElementById('biblia-version-select');
  const saved = localStorage.getItem('openlyric:version');
  if (saved && versions.length > 0) {
    const found = versions.find((v) => v.abbreviation === saved);
    if (found) {
      versionSelect.value = saved;
      currentVersionIndex = versions.findIndex((v) => v.abbreviation === saved);
    }
  }
  if (versions.length > 0) {
    selectBibleVersion(versions[currentVersionIndex]?.abbreviation || versions[0].abbreviation);
  }
}

function prevBibliaVerse() {
  if (bibleVerses.length === 0) return;
  currentVerseIndex = (currentVerseIndex - 1 + bibleVerses.length) % bibleVerses.length;
  render();
  if (autoAdvance) startAutoAdvance();
}

function nextBibliaVerse() {
  if (bibleVerses.length === 0) return;
  currentVerseIndex = (currentVerseIndex + 1) % bibleVerses.length;
  render();
  if (autoAdvance) startAutoAdvance();
}

// ---------- Opciones ----------
function renderOpciones() {
  const savedBg = localStorage.getItem('openlyric:background');
  const bgInput = document.getElementById('opciones-background');
  if (savedBg) {
    document.getElementById('viewer').style.backgroundImage = savedBg;
  }
  const langSel = document.getElementById('opciones-lang');
  langSel.value = lang;
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
  document.getElementById(`view-${tab}`).style.display = 'block';
  clearAutoAdvance();
  render();
}

// ---------- Inicialización ----------
async function init() {
  // Topbar
  document.getElementById('tab-lyricas').innerText = t('tabLyricas');
  document.getElementById('tab-biblia').innerText = t('tabBiblia');
  document.getElementById('tab-opciones').innerText = t('tabOpciones');

  document.getElementById('tab-lyricas').addEventListener('click', () => showTab('lyricas'));
  document.getElementById('tab-biblia').addEventListener('click', () => showTab('biblia'));
  document.getElementById('tab-opciones').addEventListener('click', () => showTab('opciones'));

  // Cargar canciones
  try {
    const loaded = await LoadSongs();
    songs = loaded ?? [];
  } catch (e) {
    songs = [];
  }

  // Cargar fondos (galería de imágenes)
  try {
    await loadBackgrounds();
  } catch (e) {
    backgrounds = [];
  }

  // Cargar versiones
  try {
    await loadBibleVersions();
  } catch (e) {
    versions = [];
  }

  // Opciones UI
  document.getElementById('opciones-lang').value = lang;
  document.getElementById('opciones-lang').addEventListener('change', (e) => {
    setLang(e.target.value);
    document.getElementById('tab-lyricas').innerText = t('tabLyricas');
    document.getElementById('tab-biblia').innerText = t('tabBiblia');
    document.getElementById('tab-opciones').innerText = t('tabOpciones');
    render();
  });

  // Fondo
  document.getElementById('opciones-background').addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result;
        await SetBackground(dataUrl);
        localStorage.setItem('openlyric:background', dataUrl);
        document.getElementById('viewer').style.backgroundImage = dataUrl;
        document.getElementById('opciones-status').innerText = t('backgroundUpdated');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      document.getElementById('opciones-status').innerText = t('errorBackground');
    }
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
    if (!title) {
      document.getElementById('lyricas-status').innerText = t('titleRequired');
      return;
    }
    try {
      const created = await CreateSong(title, artist, lyrics);
      songs = [created];
      currentSongIndex = 0;
      currentBlockIndex = 0;
      document.getElementById('lyricas-new-song-form').style.display = 'none';
      document.getElementById('lyricas-new-title').value = '';
      document.getElementById('lyricas-new-artist').value = '';
      document.getElementById('lyricas-new-lyrics').value = '';
      document.getElementById('lyricas-status').innerText = t('songCreated');
      showTab('lyricas');
    } catch (err) {
      document.getElementById('lyricas-status').innerText = t('errorCreate');
    }
  });

  // Controles Liricas
  document.getElementById('lyricas-prev-block').addEventListener('click', prevLyricasBlock);
  document.getElementById('lyricas-next-block').addEventListener('click', nextLyricasBlock);

  // Controles Biblia
  document.getElementById('biblia-prev-verse').addEventListener('click', prevBibliaVerse);
  document.getElementById('biblia-next-verse').addEventListener('click', nextBibliaVerse);
  document.getElementById('biblia-version-select').addEventListener('change', (e) => {
    selectBibleVersion(e.target.value);
  });

  // Auto-avance (global)
  document.getElementById('auto-advance-button').addEventListener('click', () => {
    autoAdvance = !autoAdvance;
    document.getElementById('auto-advance-button').innerText = autoAdvance
      ? t('autoAdvanceOn')
      : t('autoAdvanceOff');
    if (autoAdvance) startAutoAdvance(); else clearAutoAdvance();
  });

  // Teclado
  document.addEventListener('keydown', (e) => {
    const target = e.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
    if (e.key === 'ArrowRight') {
      if (currentTab === 'biblia') nextBibliaVerse(); else nextLyricasBlock();
    }
    if (e.key === 'ArrowLeft') {
      if (currentTab === 'biblia') prevBibliaVerse(); else prevLyricasBlock();
    }
  });

  showTab(currentTab);
}

appElement.innerHTML = `
  <nav id="topbar">
    <div id="topbar-tabs">
      <button id="tab-lyricas" class="tab active" data-tab="lyricas">${t('tabLyricas')}</button>
      <button id="tab-biblia" class="tab" data-tab="biblia">${t('tabBiblia')}</button>
      <button id="tab-opciones" class="tab" data-tab="opciones">${t('tabOpciones')}</button>
    </div>
  </nav>
  <div id="content">
    <section id="view-lyricas" class="view">
      <aside id="lyricas-sidebar">
        <div id="lyricas-song-list"></div>
        <div id="lyricas-new-song-form" style="display:none; margin-top:1rem;">
          <input id="lyricas-new-title" type="text" placeholder="${t('title')}" />
          <input id="lyricas-new-artist" type="text" placeholder="${t('artist')}" />
          <textarea id="lyricas-new-lyrics" placeholder="${t('lyrics')}"></textarea>
          <div style="margin-top:0.5rem;">
            <button id="lyricas-new-save">${t('save')}</button>
            <button id="lyricas-new-cancel">${t('cancel')}</button>
          </div>
          <div id="lyricas-status" style="margin-top:0.5rem; font-size:0.85rem; opacity:0.9;"></div>
        </div>
        <div id="lyricas-blocks"></div>
        <div id="lyricas-backgrounds" style="margin-top:1rem;"></div>
      </aside>
      <main id="lyricas-main">
        <h1 id="lyricas-song-title"></h1>
        <div id="lyricas-block-display"></div>
        <div id="lyricas-controls" style="margin-top:1.5rem; display:flex; gap:0.75rem; justify-content:center;">
          <button id="lyricas-prev-block">${t('prevBlock')}</button>
          <button id="lyricas-next-block">${t('nextBlock')}</button>
        </div>
      </main>
    </section>

    <section id="view-biblia" class="view" style="display:none;">
      <aside id="biblia-sidebar">
        <div style="margin-bottom:0.75rem;">
          <label>${t('version')} </label>
          <select id="biblia-version-select"></select>
        </div>
        <div id="biblia-no-versions" style="display:none; font-size:0.9rem; opacity:0.8;">${t('noVersions')}</div>
        <div id="biblia-books"></div>
      </aside>
      <main id="biblia-main">
        <div id="biblia-chapters"></div>
        <div id="biblia-verses"></div>
        <div id="biblia-song-title" style="font-size:1.5rem; margin-bottom:0.5rem; opacity:0.9;"></div>
        <div id="biblia-block-display"></div>
        <div id="biblia-controls" style="margin-top:1.5rem; display:flex; gap:0.75rem; justify-content:center;">
          <button id="biblia-prev-verse">${t('prevBlock')}</button>
          <button id="biblia-next-verse">${t('nextBlock')}</button>
        </div>
      </main>
    </section>

    <section id="view-opciones" class="view" style="display:none;">
      <aside id="opciones-sidebar">
        <h3>${t('background')}</h3>
        <input id="opciones-background" type="file" accept="image/*" />
        <div id="opciones-status" style="margin-top:0.5rem; font-size:0.85rem; opacity:0.9;"></div>
        <hr style="margin:1rem 0; border:none; border-top:1px solid rgba(255,255,255,0.15);" />
        <h3>${t('language')}</h3>
        <select id="opciones-lang">
          <option value="es">${t('langEs')}</option>
          <option value="en">${t('langEn')}</option>
        </select>
        <hr style="margin:1rem 0; border:none; border-top:1px solid rgba(255,255,255,0.15);" />
        <h3>${t('donations')}</h3>
        <p style="font-size:0.9rem; opacity:0.9; margin-bottom:0.75rem;">${t('donationsText')}</p>
        <button id="opciones-donate">${t('donateBtn')}</button>
      </aside>
      <main id="opciones-main">
        <div id="opciones-block-display"></div>
      </main>
    </section>
  </div>
  <div id="lyricas-overlay"></div>
  <div id="global-controls">
    <button id="auto-advance-button">${t('autoAdvanceOff')}</button>
  </div>
`;

init();
