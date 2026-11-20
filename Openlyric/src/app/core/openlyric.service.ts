import { Injectable } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';

import { BibleVersion, CatalogEntry, ScreenInfo, Song } from './models';

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

  getScreenSelection(): Promise<string> {
    return invoke<string>('get_screen_selection');
  }

  setScreenSelection(selection: string): Promise<void> {
    return invoke<void>('set_screen_selection', { selection });
  }

  getCatalogUrl(): Promise<string> {
    return invoke<string>('get_catalog_url');
  }

  setCatalogUrl(url: string): Promise<void> {
    return invoke<void>('set_catalog_url', { url });
  }

  fetchBibleCatalog(): Promise<CatalogEntry[]> {
    return invoke<CatalogEntry[]>('fetch_bible_catalog');
  }

  downloadBible(entry: CatalogEntry): Promise<string> {
    return invoke<string>('download_bible', { entry });
  }

  cancelBibleDownload(id: string): Promise<void> {
    return invoke<void>('cancel_bible_download', { id });
  }

  clearBackground(): Promise<void> {
    return invoke<void>('clear_background');
  }

  greet(name: string): Promise<string> {
    return invoke<string>('greet', { name });
  }
}
