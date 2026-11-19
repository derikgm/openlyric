import { Injectable } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';

import { BibleVersion, ScreenInfo, Song } from './models';

/**
 * Envoltorio tipado de los comandos Rust expuestos por Tauri.
 * Mantiene los mismos nombres/contratos que la app clásica de Wails.
 */
@Injectable({ providedIn: 'root' })
export class OpenlyricService {
  loadSongs(): Promise<Song[]> {
    return invoke<Song[]>('load_songs');
  }

  loadBibleVersions(): Promise<BibleVersion[]> {
    return invoke<BibleVersion[]>('load_bible_versions');
  }

  loadBibleSongs(abbreviation: string): Promise<Song[]> {
    return invoke<Song[]>('load_bible_songs', { abbreviation });
  }

  createSong(title: string, artist: string, lyrics: string): Promise<Song> {
    return invoke<Song>('create_song', { title, artist, lyrics });
  }

  setBackground(background: string): Promise<void> {
    return invoke<void>('set_background', { background });
  }

  getBackground(): Promise<string> {
    return invoke<string>('get_background');
  }

  getScreens(): Promise<ScreenInfo[]> {
    return invoke<ScreenInfo[]>('get_screens');
  }

  greet(name: string): Promise<string> {
    return invoke<string>('greet', { name });
  }
}
