import './style.css';
import './app.css';

import {SetBackground, GetScreens, LoadBibleSongs, LoadBibleVersions, CreateSong} from '../wailsjs/go/main/App';

const appElement = document.querySelector('#app');

let songs = [];
let versions = [];
let selectedIndex = 0;
let verses = [];
let currentVerse = 0;
let listTitle = 'Canciones';
let autoAdvance = false;
let autoAdvanceTimer = null;

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
        songInfoElement.innerText = 'No hay canciones disponibles.';
        lyricsElement.innerText = 'Añade archivos en la carpeta `songs/`.';
        return;
    }

    songTitleElement.innerText = song.title;
    songInfoElement.innerText = song.artist;

    const verseText = verses[currentVerse] ?? song.lyrics;
    const verseNumbers = Array.isArray(song.verseNumbers) ? song.verseNumbers : [];
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
        emptyElement.innerText = 'No hay canciones.';
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
        screensElement.innerText = 'No se detectaron monitores.';
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
    statusElement.innerText = 'Cargando canciones...';

    try {
        const loadedVersions = await LoadBibleVersions();
        versions = loadedVersions ?? [];

        renderVersionSelect(versions);

        if (versions.length === 0) {
            render();
            renderSongList();
            statusElement.innerText = 'No se encontraron versiones de la Biblia.';
            return;
        }

        const versionSelectElement = document.getElementById('version-select');
        versionSelectElement.addEventListener('change', async (event) => {
            const version = versions.find((item) => item.abbreviation === event.target.value);
            if (!version) {
                return;
            }

            try {
                await loadVersionSongs(version);
                statusElement.innerText = `Versión: ${version.translation}`;
            } catch (error) {
                statusElement.innerText = 'Error al cargar la versión de la Biblia.';
            }
        });

        const firstVersion = versions[0];
        await loadVersionSongs(firstVersion);
        statusElement.innerText = `Versión: ${firstVersion.translation}`;
    } catch (error) {
        statusElement.innerText = 'Error al cargar las canciones.';
        return;
    }

    try {
        const screens = await GetScreens();
        renderScreens(screens ?? []);
    } catch (error) {
        renderScreens([]);
    }
}

appElement.innerHTML = `
    <div id="viewer">
        <div id="lyrics-overlay"></div>
        <aside id="song-list">
            <div id="song-list-header">
                <span id="song-list-title">Canciones</span>
                <button id="new-song-button">+ Nueva</button>
            </div>
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
    autoAdvanceButton.innerText = autoAdvance ? '⏱ Avance automático: ON' : '⏱ Avance automático: OFF';
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
        statusElement.innerText = 'El título es obligatorio.';
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
        statusElement.innerText = 'Canción creada.';
    } catch (error) {
        statusElement.innerText = 'Error al crear la canción.';
    }
});

backgroundInput.addEventListener('change', async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    try {
        const dataUrl = await readFileAsDataURL(file);
        await SetBackground(dataUrl);
        viewerElement.style.backgroundImage = dataUrl;
        statusElement.innerText = 'Fondo actualizado.';
    } catch (error) {
        statusElement.innerText = 'Error al seleccionar el fondo.';
    }
});

init();
