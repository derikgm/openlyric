export interface Song {
  id: string;
  title: string;
  artist: string;
  lyrics: string;
  background?: string;
  verseNumbers?: number[];
}

export interface BibleVerse {
  chapter: number;
  verse: number;
  name?: string;
  text: string;
}

export interface BibleChapter {
  chapter: number;
  name: string;
  verses: BibleVerse[];
}

export interface BibleBook {
  nr: number;
  name: string;
  chapters: BibleChapter[];
}

export interface BibleVersion {
  id: string;
  translation: string;
  abbreviation: string;
  description?: string;
  language?: string;
  direction?: string;
  encoding?: string;
  distribution_version?: string;
  distribution_abbreviation?: string;
  books: BibleBook[];
}

export interface ScreenInfo {
  isPrimary: boolean;
  width: number;
  height: number;
  x: number;
  y: number;
}

/** Entrada del catálogo remoto de Biblias. */
export interface CatalogEntry {
  id: string;
  name: string;
  abbreviation: string;
  language: string;
  description: string;
  url: string;
  size: number;
  filename: string;
}

export type DownloadStatus =
  | 'downloading'
  | 'cancelling'
  | 'done'
  | 'cancelled'
  | 'error';

export interface BibleDownload {
  id: string;
  url: string;
  name: string;
  filename: string;
  downloaded: number;
  total: number;
  status: DownloadStatus;
  message?: string;
}

export interface DownloadProgressEvent {
  id: string;
  filename: string;
  downloaded: number;
  total: number;
}

export interface DownloadDoneEvent {
  id: string;
  filename: string;
  abbreviation: string;
}

export interface DownloadErrorEvent {
  id: string;
  message: string;
}

export interface DownloadCancelledEvent {
  id: string;
}
