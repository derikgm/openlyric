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
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

import { Lang, translate } from './core/i18n';
import {
  BibleDownload,
  BibleVersion,
  CatalogEntry,
  DownloadCancelledEvent,
  DownloadDoneEvent,
  DownloadErrorEvent,
  DownloadProgressEvent,
  ScreenInfo,
  Song,
} from './core/models';
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

  // Catálogo remoto de Biblias
  readonly catalogUrl = signal('');
  readonly catalog = signal<CatalogEntry[]>([]);
  readonly catalogLoading = signal(false);
  readonly catalogLoaded = signal(false);
  readonly catalogError = signal('');
  readonly catalogStatus = signal('');
  readonly downloads = signal<BibleDownload[]>([]);

  // Pantalla de salida
  readonly screens = signal<ScreenInfo[]>([]);
  readonly screenSelection = signal('auto');
  readonly screenStatus = signal('');

  private savedCatalogUrl = '';
  private unlisteners: UnlistenFn[] = [];
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

    await this.refreshScreens();

    await this.setupDownloadListeners();

    try {
      const url = (await this.api.getCatalogUrl()) ?? '';
      this.catalogUrl.set(url);
      this.savedCatalogUrl = url;
      if (url.trim()) {
        void this.loadCatalog();
      }
    } catch {
      // sin catálogo configurado
    }
  }

  ngOnDestroy(): void {
    this.clearAutoAdvance();
    for (const unlisten of this.unlisteners) {
      unlisten();
    }
    this.unlisteners = [];
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

  async clearBackground(): Promise<void> {
    try {
      await this.api.clearBackground();
      this.background.set('');
      localStorage.removeItem('openlyric:background');
      this.backgroundStatus.set(this.tr('backgroundCleared'));
    } catch {
      this.backgroundStatus.set(this.tr('errorBackground'));
    }
  }

  // ---------- Pantalla ----------
  async refreshScreens(): Promise<void> {
    try {
      const screens = (await this.api.getScreens()) ?? [];
      this.screens.set(screens);

      const selection = (await this.api.getScreenSelection()) ?? 'auto';
      this.screenSelection.set(this.validScreenSelection(selection));
    } catch {
      this.screens.set([]);
      this.screenSelection.set('auto');
    }
  }

  async onScreenSelected(value: string): Promise<void> {
    const selection = value === '' ? 'auto' : value;
    this.screenSelection.set(selection);
    this.screenStatus.set('');

    try {
      await this.api.setScreenSelection(selection);
      this.screenStatus.set(this.tr('optScreenUpdated'));
    } catch {
      this.screenStatus.set(this.tr('optScreenFailed'));
    }
  }

  screenLabel(screen: ScreenInfo, index: number): string {
    const base = `${this.tr('optScreenMonitor')} ${index + 1} · ${
      screen.width
    }×${screen.height}`;
    return screen.isPrimary ? `${base} · ${this.tr('optScreenPrimary')}` : base;
  }

  private validScreenSelection(selection: string): string {
    if (selection === 'auto') {
      return 'auto';
    }
    const index = Number(selection);
    return Number.isInteger(index) &&
      index >= 0 &&
      index < this.screens().length
      ? String(index)
      : 'auto';
  }

  // ---------- Catálogo y descargas ----------
  async loadCatalog(): Promise<void> {
    if (this.catalogLoading()) {
      return;
    }

    this.catalogLoading.set(true);
    this.catalogError.set('');
    this.catalogStatus.set('');

    try {
      const url = this.catalogUrl().trim();
      if (!url) {
        this.catalogError.set(this.tr('optCatalogRequired'));
        return;
      }
      if (url !== this.savedCatalogUrl) {
        await this.api.setCatalogUrl(url);
        this.savedCatalogUrl = url;
      }

      const entries = (await this.api.fetchBibleCatalog()) ?? [];
      this.catalog.set(entries);
      this.catalogLoaded.set(true);
      if (entries.length === 0) {
        this.catalogStatus.set(this.tr('optCatalogEmpty'));
      }
    } catch (error) {
      this.catalogError.set(this.describeError(error));
    } finally {
      this.catalogLoading.set(false);
    }
  }

  async startDownload(entry: CatalogEntry): Promise<void> {
    if (this.isEntryDownloading(entry)) {
      return;
    }

    const id = entry.id || entry.url;
    const download: BibleDownload = {
      id,
      url: entry.url,
      name: entry.name || entry.abbreviation,
      filename: entry.filename,
      downloaded: 0,
      total: entry.size ?? 0,
      status: 'downloading',
    };

    this.catalogError.set('');
    this.catalogStatus.set('');
    this.downloads.update((items) => [
      download,
      ...items.filter((item) => item.id !== id),
    ]);

    try {
      const returnedId = await this.api.downloadBible(entry);
      if (returnedId && returnedId !== id) {
        this.downloads.update((items) =>
          items.map((item) => (item.id === id ? { ...item, id: returnedId } : item)),
        );
      }
    } catch (error) {
      this.downloads.update((items) =>
        items.map((item) =>
          item.id === id
            ? { ...item, status: 'error', message: this.describeError(error) }
            : item,
        ),
      );
    }
  }

  async cancelDownload(download: BibleDownload): Promise<void> {
    if (download.status !== 'downloading') {
      return;
    }

    this.downloads.update((items) =>
      items.map((item) =>
        item.id === download.id ? { ...item, status: 'cancelling' } : item,
      ),
    );

    try {
      await this.api.cancelBibleDownload(download.id);
    } catch {
      this.downloads.update((items) =>
        items.map((item) =>
          item.id === download.id ? { ...item, status: 'error' } : item,
        ),
      );
    }
  }

  dismissDownload(download: BibleDownload): void {
    if (download.status === 'downloading' || download.status === 'cancelling') {
      return;
    }
    this.downloads.update((items) => items.filter((item) => item.id !== download.id));
  }

  isEntryDownloading(entry: CatalogEntry): boolean {
    return this.downloads().some(
      (item) =>
        (item.status === 'downloading' || item.status === 'cancelling') &&
        (item.id === entry.id || item.url === entry.url),
    );
  }

  isInstalled(entry: CatalogEntry): boolean {
    const abbreviation = (entry.abbreviation || entry.name || '').trim().toLowerCase();
    const filename = (entry.filename || '').trim().toLowerCase();
    return this.versions().some((version) => {
      const versionAbbr = (version.abbreviation || '').toLowerCase();
      const translation = (version.translation || '').toLowerCase();
      const id = (version.id || '').toLowerCase();
      return (
        (abbreviation.length > 0 &&
          (versionAbbr === abbreviation || translation === abbreviation)) ||
        (filename.length > 0 && id === filename)
      );
    });
  }

  progressPercent(download: BibleDownload): number {
    if (download.total <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((download.downloaded / download.total) * 100));
  }

  formatBytes(bytes: number): string {
    const value = Number(bytes) || 0;
    if (value < 1024) {
      return `${value} B`;
    }
    const units = ['KB', 'MB', 'GB'];
    let size = value / 1024;
    let unit = 0;
    while (size >= 1024 && unit < units.length - 1) {
      size /= 1024;
      unit += 1;
    }
    return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unit]}`;
  }

  downloadLabel(download: BibleDownload): string {
    switch (download.status) {
      case 'downloading':
        return this.tr('optStatusDownloading');
      case 'cancelling':
        return this.tr('optStatusCancelling');
      case 'done':
        return this.tr('optStatusDone');
      case 'cancelled':
        return this.tr('optStatusCancelled');
      default:
        return this.tr('optStatusError');
    }
  }

  private describeError(error: unknown): string {
    const message = typeof error === 'string' ? error : String(error);
    if (message === 'catalog-empty') {
      return this.tr('optCatalogRequired');
    }
    return message;
  }

  private async refreshVersions(): Promise<void> {
    try {
      this.versions.set((await this.api.loadBibleVersions()) ?? []);
    } catch {
      // mantener la lista actual
    }
  }

  private async setupDownloadListeners(): Promise<void> {
    try {
      const progress = await listen<DownloadProgressEvent>(
        'bible-download-progress',
        ({ payload }) => {
          this.downloads.update((items) =>
            items.map((item) =>
              item.id === payload.id
                ? {
                    ...item,
                    filename: payload.filename || item.filename,
                    downloaded: payload.downloaded,
                    total: payload.total || item.total,
                  }
                : item,
            ),
          );
        },
      );

      const done = await listen<DownloadDoneEvent>('bible-download-done', ({ payload }) => {
        this.downloads.update((items) =>
          items.map((item) =>
            item.id === payload.id
              ? {
                  ...item,
                  status: 'done',
                  filename: payload.filename || item.filename,
                  downloaded: item.total || item.downloaded,
                }
              : item,
          ),
        );
        this.catalogStatus.set(this.tr('optDownloadDone'));
        void this.refreshVersions();
      });

      const cancelled = await listen<DownloadCancelledEvent>(
        'bible-download-cancelled',
        ({ payload }) => {
          this.downloads.update((items) =>
            items.map((item) =>
              item.id === payload.id ? { ...item, status: 'cancelled' } : item,
            ),
          );
          this.catalogStatus.set(this.tr('optDownloadCancelled'));
        },
      );

      const failed = await listen<DownloadErrorEvent>(
        'bible-download-error',
        ({ payload }) => {
          this.downloads.update((items) =>
            items.map((item) =>
              item.id === payload.id
                ? { ...item, status: 'error', message: payload.message }
                : item,
            ),
          );
        },
      );

      this.unlisteners.push(progress, done, cancelled, failed);
    } catch {
      // fuera de Tauri (por ejemplo, `ng serve` en el navegador)
    }
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
