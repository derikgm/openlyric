import './style.css';
import './app.css';

import {SetBackground, GetScreens, LoadBibleSongs, LoadBibleVersions, CreateSong, GetBackground} from '../wailsjs/go/main/App';

const appElement = document.querySelector('#app');

let songs = [];
let versions = [];
let selectedIndex = 0;
let verses = [];
let currentVerse = 0;
let listTitle = 'Canciones';
let autoAdvance = false;
let autoAdvanceTimer = null;

const i18n = {
    es: {
        loading: 'Cargando...',
        loadingSongs: 'Cargando canciones...',
        noSongs: 'No hay canciones disponibles.',
        addSongs: 'Añade archivos en la carpeta `songs/`.',
        noVersions: 'No se encontraron versiones de la Biblia.',
        errorLoading: 'Error al cargar las canciones.',
        errorLoadingVersion: 'Error al cargar la versión de la Biblia.',
        version: 'Versión:',
        backgroundUpdated: 'Fondo actualizado.',
        errorBackground: 'Error al seleccionar el fondo.',
        songCreated: 'Canción creada.',
        titleRequired: 'El título es obligatorio.',
        errorCreate: 'Error al crear la canción.',
        nextVerse: 'Siguiente verso',
        selectBackground: 'Seleccionar fondo',
        newSong: '+ Nueva',
        save: 'Guardar',
        cancel: 'Cancelar',
        autoAdvanceOn: '⏱ Avance automático: ON',
        autoAdvanceOff: '⏱ Avance automático: OFF',
        noScreens: 'No se detectaron monitores.',
        noSongsPanel: 'No hay canciones.',
        newSongTitle: 'Título',
        newSongArtist: 'Artista / Autor',
        newSongLyrics: 'Letra de la canción...',
    },
    en: {
        loading: 'Loading...',
        loadingSongs: 'Loading songs...',
        noSongs: 'No songs available.',
        addSongs: 'Add files to the `songs/` folder.',
        noVersions: 'No Bible versions found.',
        errorLoading: 'Error loading songs.',
        errorLoadingVersion: 'Error loading Bible version.',
        version: 'Version:',
        backgroundUpdated: 'Background updated.',
        errorBackground: 'Error selecting background.',
        songCreated: 'Song created.',
        titleRequired: 'Title is required.',
        errorCreate: 'Error creating song.',
        nextVerse: 'Next verse',
        selectBackground: 'Select background',
        newSong: '+ New',
        save: 'Save',
        cancel: 'Cancel',
        autoAdvanceOn: '⏱ Auto-advance: ON',
        autoAdvanceOff: '⏱ Auto-advance: OFF',
        noScreens: 'No monitors detected.',
        noSongsPanel: 'No songs.',
        newSongTitle: 'Title',
        newSongArtist: 'Artist / Author',
        newSongLyrics: 'Song lyrics...',
    },
};

let lang = localStorage.getItem('openlyric:lang') || 'es';

function t(key) {
    const dictionary = i18n[lang] || i18n.es;
    return dictionary[key] ?? i18n.es[key] ?? key;
}

function setLang(newLang) {
    lang = newLang;
    localStorage.setItem('openlyric:lang', lang);
}

function trVersion(version) {
    return `${t('version')} ${version.translation ?? version.abbreviation ?? ''}`;
}

function splitVerses(lyrics) {
    const blocks = String(lyrics ?? '')
        .split(/\r?\n\s*\r?\n/)
        .map((verse) => verse.trim())
        .filter((verse) => verse.length > 0);

    return blocks.length > 0 ? blocks : [String(lyrics ?? '')];
}

function render() {
    const song = songs[selectedIndex];
    const songTitleElement = document.getElementById('song-title');
    const songInfoElement = document.getElementById('song-info');
    const lyricsElement = document.getElementById('lyrics');

    if (!song) {
        songTitleElement.innerText = 'OpenLyric';
        songInfoElement.innerText = t('noSongs');
        lyricsElement.innerText = t('addSongs');
        return;
    }

    songTitleElement.innerText = song.title;
    songInfoElement.innerText = song.artist;

    const verseText = verses[currentVerse] ?? song.lyrics;
    const verseNumbers = Array.isArray(song.verseNumbers) ? song.verseNumbers : [];
    lyricsElement.classList.remove('verse-fade');
    void lyricsElement.offsetWidth;
    lyricsElement.classList.add('verse-fade');
    if (verseNumbers[currentVerse] != null) {
        lyricsElement.innerText = `Verso ${verseNumbers[currentVerse]}\n${currentVerse + 1} de ${verseNumbers.length}\n\n${verseText}`;
    } else {
        lyricsElement.innerText = verseText;
    }
}

function clearAutoAdvance() {
    if (autoAdvanceTimer) {
        clearInterval(autoAdvanceTimer);
        autoAdvanceTimer = null;
    }
}

function startAutoAdvance() {
    clearAutoAdvance();
    autoAdvanceTimer = setInterval(() => {
        if (verses.length === 0) {
            clearAutoAdvance();
            return;
        }

        currentVerse = (currentVerse + 1) % verses.length;
        render();
    }, 8000);
}

function selectSong(index) {
    selectedIndex = index;
    verses = splitVerses(songs[index]?.lyrics ?? '');
    currentVerse = 0;
    render();
    renderSongList();
}

function renderSongList() {
    const songListTitleElement = document.getElementById('song-list-title');
    const songListItemsElement = document.getElementById('song-list-items');

    songListTitleElement.innerText = listTitle;

    songListItemsElement.innerHTML = '';

    if (songs.length === 0) {
        const emptyElement = document.createElement('div');
        emptyElement.id = 'song-list-empty';
        emptyElement.innerText = t('noSongsPanel');
        songListItemsElement.appendChild(emptyElement);
        return;
    }

    for (let i = 0; i < songs.length; i++) {
        const song = songs[i];
        const itemElement = document.createElement('div');
        itemElement.className = 'song-list-item' + (i === selectedIndex ? ' active' : '');
        itemElement.innerText = song.title ?? '';
        itemElement.dataset.index = String(i);
        itemElement.addEventListener('click', () => selectSong(Number(itemElement.dataset.index)));
        songListItemsElement.appendChild(itemElement);
    }
}

function renderScreens(screens) {
    const screensElement = document.getElementById('screens');

    if (!screens || screens.length === 0) {
        screensElement.innerText = t('noScreens');
        return;
    }

    const lines = screens.map((screen, index) => {
        const label = screen.isPrimary ? 'Monitor principal' : `Monitor ${index + 1}`;
        const width = screen.size ? screen.size.width : screen.width;
        const height = screen.size ? screen.size.height : screen.height;
        const suffix = screen.isCurrent ? ' (en uso)' : '';
        return `${label}: ${width}x${height}${suffix}`;
    });

    screensElement.innerText = lines.join('  ·  ');
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

async function loadVersionSongs(version) {
    const loadedSongs = await LoadBibleSongs(version.abbreviation);
    songs = loadedSongs ?? [];

    if (songs.length === 0) {
        render();
        return;
    }

    listTitle = version.translation ?? version.abbreviation;
    selectSong(0);
}

function renderVersionSelect(versionsList) {
    const versionSelectElement = document.getElementById('version-select');
    versionSelectElement.innerHTML = '';

    for (const version of versionsList) {
        const option = document.createElement('option');
        option.value = version.abbreviation;
        option.innerText = version.translation
            ? `${version.translation} (${version.abbreviation})`
            : version.abbreviation;
        versionSelectElement.appendChild(option);
    }
}

async function init() {
    const statusElement = document.getElementById('status');
    statusElement.innerText = t('loadingSongs');

    try {
        const background = await GetBackground();
        if (background) {
            viewerElement.style.backgroundImage = background;
        }
    } catch (error) {
    }

    try {
        const loadedVersions = await LoadBibleVersions();
        versions = loadedVersions ?? [];

        renderVersionSelect(versions);

        if (versions.length === 0) {
            render();
            renderSongList();
            statusElement.innerText = t('noVersions');
            return;
        }

        const versionSelectElement = document.getElementById('version-select');
        versionSelectElement.addEventListener('change', async (event) => {
            const version = versions.find((item) => item.abbreviation === event.target.value);
            if (!version) {
                return;
            }

            localStorage.setItem('openlyric:version', version.abbreviation);

            try {
                await loadVersionSongs(version);
                statusElement.innerText = trVersion(version);
            } catch (error) {
                statusElement.innerText = t('errorLoadingVersion');
            }
        });

        const savedVersion = localStorage.getItem('openlyric:version');
        let versionToLoad = versions[0];
        if (savedVersion) {
            const saved = versions.find((item) => item.abbreviation === savedVersion);
            if (saved) {
                versionToLoad = saved;
            }
        }

        await loadVersionSongs(versionToLoad);
        listTitle = versionToLoad.translation ?? versionToLoad.abbreviation;
        statusElement.innerText = trVersion(versionToLoad);

        if (savedVersion !== versionToLoad.abbreviation) {
            localStorage.setItem('openlyric:version', versionToLoad.abbreviation);
        }
    } catch (error) {
        statusElement.innerText = t('errorLoading');
        return;
    }

    try {
        const screens = await GetScreens();
        renderScreens(screens ?? []);
    } catch (error) {
        renderScreens([]);
    }

    languageButton.innerText = lang === 'es' ? 'EN' : 'ES';
    nextVerseButton.innerText = t('nextVerse');
    backgroundButton.innerText = t('selectBackground');
    newSongButton.innerText = t('newSong');
    newSongSaveButton.innerText = t('save');
    newSongCancelButton.innerText = t('cancel');
    newSongTitleElement.placeholder = t('newSongTitle');
    newSongArtistElement.placeholder = t('newSongArtist');
    newSongLyricsElement.placeholder = t('newSongLyrics');
    autoAdvanceButton.innerText = autoAdvance ? t('autoAdvanceOn') : t('autoAdvanceOff');
    renderSongList();
}

appElement.innerHTML = `
    <div id="viewer">
        <div id="lyrics-overlay"></div>
        <aside id="song-list">
    <div id="song-list-header">
                <span id="song-list-title">Canciones</span>
                <button id="language-button">ES</button>
                <button id="new-song-button">+ Nueva</button>
            <div id="song-list-items"></div>
            <div id="new-song-form" style="display: none;">
                <input id="new-song-title" type="text" placeholder="Título" />
                <input id="new-song-artist" type="text" placeholder="Artista / Autor" />
                <textarea id="new-song-lyrics" placeholder="Letra de la canción..."></textarea>
                <div id="new-song-actions">
                    <button id="new-song-save">Guardar</button>
                    <button id="new-song-cancel">Cancelar</button>
                </div>
            </div>
        </aside>
        <header id="song-header">
            <h1 id="song-title">OpenLyric</h1>
            <div id="song-info">Cargando...</div>
        </header>
        <div id="version-controls">
            <select id="version-select"></select>
        </div>
        <main id="lyrics">Cargando...</main>
        <div id="verse-controls">
            <button id="prev-verse">←</button>
            <button id="next-verse">Siguiente verso</button>
            <button id="auto-advance-button">⏱ Avance automático: OFF</button>
        </div>
        <div id="screens"></div>
        <div id="background-controls">
            <input id="background-input" type="file" accept="image/*" />
            <button id="background-button">Seleccionar fondo</button>
        </div>
        <div id="status">...</div>
    </div>
`;

const songInfoElement = document.getElementById('song-info');
const lyricsElement = document.getElementById('lyrics');
const nextVerseButton = document.getElementById('next-verse');
const prevVerseButton = document.getElementById('prev-verse');
const backgroundButton = document.getElementById('background-button');
const backgroundInput = document.getElementById('background-input');
const statusElement = document.getElementById('status');
const screensElement = document.getElementById('screens');
const viewerElement = document.getElementById('viewer');
const lyricsOverlayElement = document.getElementById('lyrics-overlay');
const autoAdvanceButton = document.getElementById('auto-advance-button');
const songListElement = document.getElementById('song-list');
const songListTitleElement = document.getElementById('song-list-title');
const songListItemsElement = document.getElementById('song-list-items');
const newSongButton = document.getElementById('new-song-button');
const newSongForm = document.getElementById('new-song-form');
const newSongTitleElement = document.getElementById('new-song-title');
const newSongArtistElement = document.getElementById('new-song-artist');
const newSongLyricsElement = document.getElementById('new-song-lyrics');
const newSongSaveButton = document.getElementById('new-song-save');
const newSongCancelButton = document.getElementById('new-song-cancel');
const versionSelectElement = document.getElementById('version-select');
const languageButton = document.getElementById('language-button');

nextVerseButton.addEventListener('click', () => {
    if (verses.length === 0) return;

    currentVerse = (currentVerse + 1) % verses.length;
    render();
    if (autoAdvance) startAutoAdvance();
});

prevVerseButton.addEventListener('click', () => {
    if (verses.length === 0) return;

    currentVerse = (currentVerse - 1 + verses.length) % verses.length;
    render();
    if (autoAdvance) startAutoAdvance();
});

autoAdvanceButton.addEventListener('click', () => {
    autoAdvance = !autoAdvance;
    autoAdvanceButton.innerText = autoAdvance ? t('autoAdvanceOn') : t('autoAdvanceOff');
    if (autoAdvance) {
        startAutoAdvance();
    } else {
        clearAutoAdvance();
    }
});

document.addEventListener('keydown', (event) => {
    const target = event.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
    }

    if (event.key === 'ArrowRight') {
        if (verses.length === 0) return;
        currentVerse = (currentVerse + 1) % verses.length;
        render();
        if (autoAdvance) startAutoAdvance();
    }

    if (event.key === 'ArrowLeft') {
        if (verses.length === 0) return;
        currentVerse = (currentVerse - 1 + verses.length) % verses.length;
        render();
        if (autoAdvance) startAutoAdvance();
    }
});

backgroundButton.addEventListener('click', () => backgroundInput.click());

languageButton.addEventListener('click', () => {
    setLang(lang === 'es' ? 'en' : 'es');
    languageButton.innerText = lang === 'es' ? 'EN' : 'ES';
    nextVerseButton.innerText = t('nextVerse');
    backgroundButton.innerText = t('selectBackground');
    newSongButton.innerText = t('newSong');
    newSongSaveButton.innerText = t('save');
    newSongCancelButton.innerText = t('cancel');
    newSongTitleElement.placeholder = t('newSongTitle');
    newSongArtistElement.placeholder = t('newSongArtist');
    newSongLyricsElement.placeholder = t('newSongLyrics');
    autoAdvanceButton.innerText = autoAdvance ? t('autoAdvanceOn') : t('autoAdvanceOff');
    render();
    renderSongList();
});

newSongButton.addEventListener('click', () => {
    newSongForm.style.display = 'block';
});

newSongCancelButton.addEventListener('click', () => {
    newSongForm.style.display = 'none';
    newSongTitleElement.value = '';
    newSongArtistElement.value = '';
    newSongLyricsElement.value = '';
});

newSongSaveButton.addEventListener('click', async () => {
    const title = newSongTitleElement.value.trim();
    const artist = newSongArtistElement.value.trim();
    const lyrics = newSongLyricsElement.value;

    if (!title) {
        statusElement.innerText = t('titleRequired');
        return;
    }

    try {
        const createdSong = await CreateSong(title, artist, lyrics);
        songs = [createdSong];
        selectedIndex = 0;
        verses = splitVerses(createdSong.lyrics ?? '');
        currentVerse = 0;
        listTitle = 'Canción';
        render();
        renderSongList();
        newSongForm.style.display = 'none';
        newSongTitleElement.value = '';
        newSongArtistElement.value = '';
        newSongLyricsElement.value = '';
        statusElement.innerText = t('songCreated');
    } catch (error) {
        statusElement.innerText = t('errorCreate');
    }
});

backgroundInput.addEventListener('change', async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    try {
        const dataUrl = await readFileAsDataURL(file);
        await SetBackground(dataUrl);
        viewerElement.style.backgroundImage = dataUrl;
        statusElement.innerText = t('backgroundUpdated');
    } catch (error) {
        statusElement.innerText = t('errorBackground');
    }
});

init();
