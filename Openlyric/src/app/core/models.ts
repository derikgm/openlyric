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
