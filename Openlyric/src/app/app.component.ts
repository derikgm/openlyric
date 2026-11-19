import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Lang, translate } from './core/i18n';
import { BibleVersion, Song } from './core/models';
import { OpenlyricService } from './core/openlyric.service';

type Tab = 'lyricas' | 'biblia' | 'opciones';

interface BookGroup {
  name: string;
  chapters: Song[];
}

function splitBlocks(lyrics: string | null | undefined): string[] {
  return String(lyrics ?? '')
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);
}

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly api = inject(OpenlyricService);

  // ---------- Estado general ----------
  readonly lang = signal<Lang>(this.readLang());
  readonly tab = signal<Tab>('lyricas');

  // ---------- Líricas ----------
  readonly songs = signal<Song[]>([]);
  readonly currentSongIndex = signal(0);
  readonly currentSong = computed<Song | null>(
    () => this.songs()[this.currentSongIndex()] ?? null,
  );
  readonly blocks = computed(() => splitBlocks(this.currentSong()?.lyrics));
  readonly currentBlockIndex = signal(0);
  readonly currentBlockText = computed(
    () => this.blocks()[this.currentBlockIndex()] ?? '',
  );

  readonly newSongOpen = signal(false);
  newTitle = '';
  newArtist = '';
  newLyrics = '';
  readonly songStatus = signal('');

  // ---------- Biblia ----------
  readonly versions = signal<BibleVersion[]>([]);
  readonly versionAbbr = signal('');
  readonly allChapters = signal<Song[]>([]);
  readonly selectedBook = signal<string | null>(null);
  readonly selectedChapterIndex = signal(0);
  readonly currentVerseIndex = signal(0);

  readonly books = computed<BookGroup[]>(() => {
    const map = new Map<string, Song[]>();
    for (const chapter of this.allChapters()) {
      const title = chapter.title ?? '';
      const bookName = title.split(' ').slice(0, -1).join(' ') || title;
      const list = map.get(bookName) ?? [];
      list.push(chapter);
      map.set(bookName, list);
    }
    return [...map.entries()].map(([name, chapters]) => ({ name, chapters }));
  });

  readonly chapters = computed<Song[]>(() => {
    const name = this.selectedBook();
    return this.books().find((book) => book.name === name)?.chapters ?? [];
  });

  readonly currentChapter = computed<Song | null>(
    () => this.chapters()[this.selectedChapterIndex()] ?? null,
  );

  readonly bibleVerses = computed(() => splitBlocks(this.currentChapter()?.lyrics));
  readonly bibleTitle = computed(() => this.currentChapter()?.title ?? '');
  readonly bibleBlockText = computed(
    () => this.bibleVerses()[this.currentVerseIndex()] ?? '',
  );

  // ---------- Opciones ----------
  readonly autoAdvance = signal(false);
  readonly background = signal('');
  readonly backgroundStyle = computed(() => {
    const background = this.background();
    return background ? `url("${background}")` : null;
  });
  readonly backgroundStatus = signal('');

  private autoAdvanceTimer: ReturnType<typeof setInterval> | null = null;

  // ---------- Ciclo de vida ----------
  async ngOnInit(): Promise<void> {
    try {
      this.songs.set((await this.api.loadSongs()) ?? []);
    } catch {
      this.songs.set([]);
    }

    try {
      this.versions.set((await this.api.loadBibleVersions()) ?? []);
    } catch {
      this.versions.set([]);
    }

    if (this.versions().length > 0) {
      const saved = localStorage.getItem('openlyric:version');
      const exists = this.versions().some((v) => v.abbreviation === saved);
      await this.changeVersion(exists && saved ? saved : this.versions()[0].abbreviation);
    }

    try {
      this.background.set((await this.api.getBackground()) ?? '');
    } catch {
      // sin fondo persistido
    }

    if (!this.background()) {
      const savedBackground = localStorage.getItem('openlyric:background');
      if (savedBackground) {
        this.background.set(savedBackground);
      }
    }
  }

  ngOnDestroy(): void {
    this.clearAutoAdvance();
  }

  // ---------- i18n ----------
  tr(key: string): string {
    return translate(this.lang(), key);
  }

  setLang(value: string): void {
    const lang: Lang = value === 'en' ? 'en' : 'es';
    this.lang.set(lang);
    localStorage.setItem('openlyric:lang', lang);
  }

  private readLang(): Lang {
    return localStorage.getItem('openlyric:lang') === 'en' ? 'en' : 'es';
  }

  // ---------- Navegación ----------
  showTab(tab: Tab): void {
    this.tab.set(tab);
    this.clearAutoAdvance();
  }

  // ---------- Líricas ----------
  selectSong(index: number): void {
    if (this.songs().length === 0) {
      return;
    }
    this.currentSongIndex.set(index);
    this.currentBlockIndex.set(0);
  }

  selectBlock(index: number): void {
    if (this.blocks().length === 0) {
      return;
    }
    this.currentBlockIndex.set(index);
    this.restartAutoAdvance();
  }

  prevBlock(): void {
    const count = this.blocks().length;
    if (count === 0) {
      return;
    }
    this.currentBlockIndex.update((index) => (index - 1 + count) % count);
    this.restartAutoAdvance();
  }

  nextBlock(): void {
    const count = this.blocks().length;
    if (count === 0) {
      return;
    }
    this.currentBlockIndex.update((index) => (index + 1) % count);
    this.restartAutoAdvance();
  }

  saveSong(): void {
    const title = this.newTitle.trim();
    if (!title) {
      this.songStatus.set(this.tr('titleRequired'));
      return;
    }

    this.api
      .createSong(title, this.newArtist.trim(), this.newLyrics)
      .then((created) => {
        this.songs.update((songs) => [created, ...songs]);
        this.currentSongIndex.set(0);
        this.currentBlockIndex.set(0);
        this.cancelNewSong();
        this.songStatus.set(this.tr('songCreated'));
        this.showTab('lyricas');
      })
      .catch(() => this.songStatus.set(this.tr('errorCreate')));
  }

  cancelNewSong(): void {
    this.newSongOpen.set(false);
    this.newTitle = '';
    this.newArtist = '';
    this.newLyrics = '';
  }

  // ---------- Biblia ----------
  onVersionSelected(abbreviation: string): void {
    void this.changeVersion(abbreviation);
  }

  async changeVersion(abbreviation: string): Promise<void> {
    if (!this.versions().some((version) => version.abbreviation === abbreviation)) {
      return;
    }

    this.versionAbbr.set(abbreviation);
    localStorage.setItem('openlyric:version', abbreviation);

    try {
      const chapters = await this.api.loadBibleSongs(abbreviation);
      this.allChapters.set(chapters ?? []);
      this.selectedBook.set(this.books()[0]?.name ?? null);
      this.selectedChapterIndex.set(0);
      this.currentVerseIndex.set(0);
    } catch {
      this.allChapters.set([]);
    }
  }

  selectBook(name: string): void {
    this.selectedBook.set(name);
    this.selectedChapterIndex.set(0);
    this.currentVerseIndex.set(0);
  }

  selectChapter(index: number): void {
    this.selectedChapterIndex.set(index);
    this.currentVerseIndex.set(0);
  }

  selectVerse(index: number): void {
    this.currentVerseIndex.set(index);
  }

  prevVerse(): void {
    const count = this.bibleVerses().length;
    if (count === 0) {
      return;
    }
    this.currentVerseIndex.update((index) => (index - 1 + count) % count);
    this.restartAutoAdvance();
  }

  nextVerse(): void {
    const count = this.bibleVerses().length;
    if (count === 0) {
      return;
    }
    this.currentVerseIndex.update((index) => (index + 1) % count);
    this.restartAutoAdvance();
  }

  // ---------- Opciones ----------
  toggleAutoAdvance(): void {
    this.autoAdvance.update((value) => !value);
    if (this.autoAdvance()) {
      this.startAutoAdvance();
    } else {
      this.clearAutoAdvance();
    }
  }

  onBackgroundSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '');
      this.api
        .setBackground(dataUrl)
        .then(() => {
          this.background.set(dataUrl);
          localStorage.setItem('openlyric:background', dataUrl);
          this.backgroundStatus.set(this.tr('backgroundUpdated'));
        })
        .catch(() => this.backgroundStatus.set(this.tr('errorBackground')));
    };
    reader.onerror = () => this.backgroundStatus.set(this.tr('errorBackground'));
    reader.readAsDataURL(file);
    input.value = '';
  }

  // ---------- Auto-avance ----------
  private startAutoAdvance(): void {
    this.clearAutoAdvance();
    const items = this.tab() === 'biblia' ? this.bibleVerses() : this.blocks();
    if (items.length === 0) {
      return;
    }

    this.autoAdvanceTimer = setInterval(() => {
      if (this.tab() === 'biblia') {
        const count = this.bibleVerses().length;
        if (count > 0) {
          this.currentVerseIndex.update((index) => (index + 1) % count);
        }
      } else {
        const count = this.blocks().length;
        if (count > 0) {
          this.currentBlockIndex.update((index) => (index + 1) % count);
        }
      }
    }, 8000);
  }

  private clearAutoAdvance(): void {
    if (this.autoAdvanceTimer) {
      clearInterval(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }
  }

  private restartAutoAdvance(): void {
    if (this.autoAdvance()) {
      this.startAutoAdvance();
    }
  }

  // ---------- Teclado ----------
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable)
    ) {
      return;
    }

    if (this.tab() === 'biblia') {
      if (event.key === 'ArrowRight') {
        this.nextVerse();
      } else if (event.key === 'ArrowLeft') {
        this.prevVerse();
      }
      return;
    }

    if (this.tab() === 'lyricas') {
      if (event.key === 'ArrowRight') {
        this.nextBlock();
      } else if (event.key === 'ArrowLeft') {
        this.prevBlock();
      }
    }
  }
}
