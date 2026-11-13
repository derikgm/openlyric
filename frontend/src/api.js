import { invoke } from '@tauri-apps/api/core';

export function LoadSongs() {
  return invoke('load_songs');
}

export function LoadBibleVersions() {
  return invoke('load_bible_versions');
}

export function LoadBibleSongs(abbreviation) {
  return invoke('load_bible_songs', { abbreviation });
}

export function CreateSong(title, artist, lyrics) {
  return invoke('create_song', { title, artist, lyrics });
}

export function SetBackground(background) {
  return invoke('set_background', { background });
}

export function GetBackground() {
  return invoke('get_background');
}

export function GetScreens() {
  return invoke('get_screens');
}

export function Greet(name) {
  return invoke('greet', { name });
}
