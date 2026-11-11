import './style.css';
import './app.css';

import {SetBackground, GetScreens, LoadBibleSongs, LoadBibleVersions} from '../wailsjs/go/main/App';

const appElement = document.querySelector('#app');

let songs = [];
let versions = [];
let selectedIndex = 0;
let verses = [];
let currentVerse = 0;

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
    if (Array.isArray(song.verseNumbers) && song.verseNumbers[currentVerse] != null) {
        lyricsElement.innerText = `Verso ${song.verseNumbers[currentVerse]}\n\n${verseText}`;
    } else {
        lyricsElement.innerText = verseText;
    }
}

function selectSong(index) {
    selectedIndex = index;
    verses = splitVerses(songs[index]?.lyrics ?? '');
    currentVerse = 0;
    render();
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

nextVerseButton.addEventListener('click', () => {
    if (verses.length === 0) return;

    currentVerse = (currentVerse + 1) % verses.length;
    render();
});

prevVerseButton.addEventListener('click', () => {
    if (verses.length === 0) return;

    currentVerse = (currentVerse - 1 + verses.length) % verses.length;
    render();
});

backgroundButton.addEventListener('click', () => backgroundInput.click());

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
