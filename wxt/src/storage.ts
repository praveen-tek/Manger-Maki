import { browser } from 'wxt/browser';
import type {
  Bookmark,
  CustomizeConfig,
  ExportData,
  Group,
  RecentVisit,
  Wallpaper,
} from './types';

const STORAGE_KEYS = {
  BOOKMARKS: 'minimal_tab_bookmarks',
  WALLPAPER: 'minimal_tab_wallpaper',
  GROUPS: 'minimal_tab_groups',
  STARRED: 'minimal_tab_starred',
  RECENT: 'minimal_tab_recent',
  CUSTOMIZE: 'minimal_tab_customize',
  TAGS: 'minimal_tab_tags',
} as const;

export const DEFAULT_TAGS: string[] = [
  'news',
  'ui',
  'robotics',
  'open-media',
  'research',
  'tools',
  'ai',
  'design',
  'dev',
  'productivity',
  'social',
  'entertainment',
  'education',
  'business',
  'health',
];

export const DEFAULT_CUSTOMIZE: CustomizeConfig = {
  fontSize: 13,
  fontColor: '#ffffff',
  fontWeight: 'bold',
  letterSpacing: 0.2,
  columnCount: 4,
  compactMode: false,
  textTransform: 'uppercase',
  showFavicons: false,
};

export const DEFAULT_BOOKMARKS: Bookmark[] = [
  { id: 1, title: 'GitHub', url: 'https://github.com', tags: ['dev', 'tools'], group: null },
  { id: 2, title: 'MDN', url: 'https://developer.mozilla.org', tags: ['dev', 'research'], group: null },
  { id: 3, title: 'Hacker News', url: 'https://news.ycombinator.com', tags: ['news'], group: null },
  { id: 4, title: 'Product Hunt', url: 'https://producthunt.com', tags: ['tools', 'design'], group: null },
  { id: 5, title: 'Dribbble', url: 'https://dribbble.com', tags: ['design', 'ui'], group: null },
];

export const DEFAULT_WALLPAPER: Wallpaper = {
  type: 'gradient',
  value: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
};

class ExtensionStorage {
  private cache: {
    bookmarks: Bookmark[];
    groups: Group[];
    wallpaper: Wallpaper;
    tags: string[];
    customize: CustomizeConfig;
    starred: number[];
    recent: RecentVisit[];
  } = {
    bookmarks: [...DEFAULT_BOOKMARKS],
    groups: [],
    wallpaper: { ...DEFAULT_WALLPAPER },
    tags: [...DEFAULT_TAGS],
    customize: { ...DEFAULT_CUSTOMIZE },
    starred: [],
    recent: [],
  };

  private initialized = false;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.listenForChanges();
  }

  public async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // 1. Check browser.storage.local
      const stored = (await browser.storage.local.get([
        STORAGE_KEYS.BOOKMARKS,
        STORAGE_KEYS.WALLPAPER,
        STORAGE_KEYS.GROUPS,
        STORAGE_KEYS.STARRED,
        STORAGE_KEYS.RECENT,
        STORAGE_KEYS.CUSTOMIZE,
        STORAGE_KEYS.TAGS,
      ])) as Record<string, any>;

      // Check if migration from localStorage is needed
      const migrated = this.checkAndMigrateLocalStorage();

      if (Array.isArray(stored[STORAGE_KEYS.BOOKMARKS])) {
        this.cache.bookmarks = stored[STORAGE_KEYS.BOOKMARKS] as Bookmark[];
      } else if (migrated.bookmarks) {
        this.cache.bookmarks = migrated.bookmarks;
        await browser.storage.local.set({ [STORAGE_KEYS.BOOKMARKS]: this.cache.bookmarks });
      } else {
        await browser.storage.local.set({ [STORAGE_KEYS.BOOKMARKS]: this.cache.bookmarks });
      }

      if (Array.isArray(stored[STORAGE_KEYS.GROUPS])) {
        this.cache.groups = stored[STORAGE_KEYS.GROUPS] as Group[];
      } else if (migrated.groups) {
        this.cache.groups = migrated.groups;
        await browser.storage.local.set({ [STORAGE_KEYS.GROUPS]: this.cache.groups });
      }

      if (stored[STORAGE_KEYS.WALLPAPER] && typeof stored[STORAGE_KEYS.WALLPAPER] === 'object') {
        this.cache.wallpaper = stored[STORAGE_KEYS.WALLPAPER] as Wallpaper;
      } else if (migrated.wallpaper) {
        this.cache.wallpaper = migrated.wallpaper;
        await browser.storage.local.set({ [STORAGE_KEYS.WALLPAPER]: this.cache.wallpaper });
      }

      if (Array.isArray(stored[STORAGE_KEYS.TAGS])) {
        this.cache.tags = stored[STORAGE_KEYS.TAGS] as string[];
      } else if (migrated.tags) {
        this.cache.tags = migrated.tags;
        await browser.storage.local.set({ [STORAGE_KEYS.TAGS]: this.cache.tags });
      }

      if (stored[STORAGE_KEYS.CUSTOMIZE] && typeof stored[STORAGE_KEYS.CUSTOMIZE] === 'object') {
        this.cache.customize = {
          ...DEFAULT_CUSTOMIZE,
          ...(stored[STORAGE_KEYS.CUSTOMIZE] as Partial<CustomizeConfig>),
        };
      } else if (migrated.customize) {
        this.cache.customize = { ...DEFAULT_CUSTOMIZE, ...migrated.customize };
        await browser.storage.local.set({ [STORAGE_KEYS.CUSTOMIZE]: this.cache.customize });
      }

      if (Array.isArray(stored[STORAGE_KEYS.STARRED])) {
        this.cache.starred = stored[STORAGE_KEYS.STARRED] as number[];
      } else if (migrated.starred) {
        this.cache.starred = migrated.starred;
        await browser.storage.local.set({ [STORAGE_KEYS.STARRED]: this.cache.starred });
      }

      if (Array.isArray(stored[STORAGE_KEYS.RECENT])) {
        this.cache.recent = stored[STORAGE_KEYS.RECENT] as RecentVisit[];
      } else if (migrated.recent) {
        this.cache.recent = migrated.recent;
        await browser.storage.local.set({ [STORAGE_KEYS.RECENT]: this.cache.recent });
      }
    } catch {
      // Fallback if browser.storage fails
      this.checkAndMigrateLocalStorage();
    }

    this.initialized = true;
  }

  private checkAndMigrateLocalStorage(): Partial<typeof this.cache> {
    if (typeof localStorage === 'undefined') return {};
    const result: Partial<typeof this.cache> = {};
    try {
      const b = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      if (b) result.bookmarks = JSON.parse(b);

      const g = localStorage.getItem(STORAGE_KEYS.GROUPS);
      if (g) result.groups = JSON.parse(g);

      const w = localStorage.getItem(STORAGE_KEYS.WALLPAPER);
      if (w) result.wallpaper = JSON.parse(w);

      const t = localStorage.getItem(STORAGE_KEYS.TAGS);
      if (t) result.tags = JSON.parse(t);

      const c = localStorage.getItem(STORAGE_KEYS.CUSTOMIZE);
      if (c) result.customize = JSON.parse(c);

      const s = localStorage.getItem(STORAGE_KEYS.STARRED);
      if (s) result.starred = JSON.parse(s);

      const r = localStorage.getItem(STORAGE_KEYS.RECENT);
      if (r) result.recent = JSON.parse(r);
    } catch {
      // ignore
    }
    return result;
  }

  private listenForChanges() {
    if (typeof browser !== 'undefined' && browser.storage?.onChanged) {
      browser.storage.onChanged.addListener((changes: Record<string, any>, areaName: string) => {
        if (areaName !== 'local') return;

        if (changes[STORAGE_KEYS.BOOKMARKS]?.newValue) {
          this.cache.bookmarks = changes[STORAGE_KEYS.BOOKMARKS].newValue as Bookmark[];
        }
        if (changes[STORAGE_KEYS.GROUPS]?.newValue) {
          this.cache.groups = changes[STORAGE_KEYS.GROUPS].newValue as Group[];
        }
        if (changes[STORAGE_KEYS.WALLPAPER]?.newValue) {
          this.cache.wallpaper = changes[STORAGE_KEYS.WALLPAPER].newValue as Wallpaper;
        }
        if (changes[STORAGE_KEYS.TAGS]?.newValue) {
          this.cache.tags = changes[STORAGE_KEYS.TAGS].newValue as string[];
        }
        if (changes[STORAGE_KEYS.CUSTOMIZE]?.newValue) {
          this.cache.customize = {
            ...DEFAULT_CUSTOMIZE,
            ...(changes[STORAGE_KEYS.CUSTOMIZE].newValue as Partial<CustomizeConfig>),
          };
        }
        if (changes[STORAGE_KEYS.STARRED]?.newValue) {
          this.cache.starred = changes[STORAGE_KEYS.STARRED].newValue as number[];
        }
        if (changes[STORAGE_KEYS.RECENT]?.newValue) {
          this.cache.recent = changes[STORAGE_KEYS.RECENT].newValue as RecentVisit[];
        }

        this.notifyListeners();
      });
    }
  }

  public onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('Error in storage listener', err);
      }
    });
  }

  // ── Bookmarks ──────────────────────────────────────────────
  public getBookmarks(): Bookmark[] {
    return this.cache.bookmarks;
  }

  public async saveBookmarks(bookmarks: Bookmark[]): Promise<boolean> {
    this.cache.bookmarks = bookmarks;
    try {
      await browser.storage.local.set({ [STORAGE_KEYS.BOOKMARKS]: bookmarks });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
      }
      this.notifyListeners();
      return true;
    } catch {
      return false;
    }
  }

  public async addBookmark(bookmark: Omit<Bookmark, 'id'>): Promise<Bookmark> {
    const bookmarks = [...this.cache.bookmarks];
    const id = bookmarks.length ? Math.max(...bookmarks.map((b) => b.id)) + 1 : 1;
    const newBookmark: Bookmark = {
      id,
      title: bookmark.title.trim(),
      url: bookmark.url.trim(),
      tags: bookmark.tags || [],
      group: bookmark.group || null,
    };
    bookmarks.push(newBookmark);
    await this.saveBookmarks(bookmarks);
    return newBookmark;
  }

  public async deleteBookmark(id: number): Promise<boolean> {
    const updated = this.cache.bookmarks.filter((b) => b.id !== id);
    const starred = this.cache.starred.filter((sId) => sId !== id);
    if (starred.length !== this.cache.starred.length) {
      await this.saveStarred(starred);
    }
    return this.saveBookmarks(updated);
  }

  // ── Groups ─────────────────────────────────────────────────
  public getGroups(): Group[] {
    return this.cache.groups;
  }

  public async saveGroups(groups: Group[]): Promise<boolean> {
    this.cache.groups = groups;
    try {
      await browser.storage.local.set({ [STORAGE_KEYS.GROUPS]: groups });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
      }
      this.notifyListeners();
      return true;
    } catch {
      return false;
    }
  }

  public async addGroup(name: string): Promise<Group> {
    const groups = [...this.cache.groups];
    const newGroup: Group = { id: Date.now().toString(), name: name.trim() };
    groups.push(newGroup);
    await this.saveGroups(groups);
    return newGroup;
  }

  public async deleteGroup(id: string): Promise<boolean> {
    const groups = this.cache.groups.filter((g) => g.id !== id);
    await this.saveGroups(groups);
    const bookmarks = this.cache.bookmarks.map((b) =>
      b.group === id ? { ...b, group: null } : b
    );
    await this.saveBookmarks(bookmarks);
    return true;
  }

  // ── Wallpaper ──────────────────────────────────────────────
  public getWallpaper(): Wallpaper {
    return this.cache.wallpaper;
  }

  public async saveWallpaper(wallpaper: Wallpaper): Promise<boolean> {
    this.cache.wallpaper = wallpaper;
    try {
      await browser.storage.local.set({ [STORAGE_KEYS.WALLPAPER]: wallpaper });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.WALLPAPER, JSON.stringify(wallpaper));
      }
      this.notifyListeners();
      return true;
    } catch {
      return false;
    }
  }

  // ── Tags ───────────────────────────────────────────────────
  public getTags(): string[] {
    return this.cache.tags;
  }

  public async saveTags(tags: string[]): Promise<boolean> {
    this.cache.tags = tags;
    try {
      await browser.storage.local.set({ [STORAGE_KEYS.TAGS]: tags });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags));
      }
      this.notifyListeners();
      return true;
    } catch {
      return false;
    }
  }

  public async addTag(name: string): Promise<boolean> {
    const normalized = name.trim().toLowerCase();
    if (
      !normalized ||
      this.cache.tags.includes(normalized) ||
      this.cache.tags.length >= 30 ||
      normalized.length > 20
    ) {
      return false;
    }
    const tags = [...this.cache.tags, normalized];
    return this.saveTags(tags);
  }

  public async deleteTag(name: string): Promise<boolean> {
    const tags = this.cache.tags.filter((t) => t !== name);
    await this.saveTags(tags);
    const bookmarks = this.cache.bookmarks.map((b) => ({
      ...b,
      tags: (b.tags || []).filter((t) => t !== name),
    }));
    await this.saveBookmarks(bookmarks);
    return true;
  }

  // ── Customize ──────────────────────────────────────────────
  public getCustomize(): CustomizeConfig {
    return this.cache.customize;
  }

  public async saveCustomize(config: Partial<CustomizeConfig>): Promise<boolean> {
    const merged = { ...this.cache.customize, ...config };
    this.cache.customize = merged;
    try {
      await browser.storage.local.set({ [STORAGE_KEYS.CUSTOMIZE]: merged });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.CUSTOMIZE, JSON.stringify(merged));
      }
      this.notifyListeners();
      return true;
    } catch {
      return false;
    }
  }

  // ── Starred ────────────────────────────────────────────────
  public getStarred(): number[] {
    return this.cache.starred;
  }

  public async saveStarred(ids: number[]): Promise<boolean> {
    this.cache.starred = ids;
    try {
      await browser.storage.local.set({ [STORAGE_KEYS.STARRED]: ids });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.STARRED, JSON.stringify(ids));
      }
      this.notifyListeners();
      return true;
    } catch {
      return false;
    }
  }

  public async toggleStar(id: number): Promise<boolean> {
    const starred = [...this.cache.starred];
    const idx = starred.indexOf(id);
    let isNowStarred = false;
    if (idx > -1) {
      starred.splice(idx, 1);
    } else {
      starred.push(id);
      isNowStarred = true;
    }
    await this.saveStarred(starred);
    return isNowStarred;
  }

  public isStarred(id: number): boolean {
    return this.cache.starred.includes(id);
  }

  // ── Recent ─────────────────────────────────────────────────
  public getRecent(): RecentVisit[] {
    return this.cache.recent;
  }

  public async saveRecent(visits: RecentVisit[]): Promise<boolean> {
    this.cache.recent = visits;
    try {
      await browser.storage.local.set({ [STORAGE_KEYS.RECENT]: visits });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.RECENT, JSON.stringify(visits));
      }
      this.notifyListeners();
      return true;
    } catch {
      return false;
    }
  }

  public async addVisit(url: string, title: string): Promise<void> {
    const now = Date.now();
    const filtered = this.cache.recent.filter((v) => v.url !== url);
    const updated = [{ url, title, timestamp: now }, ...filtered].slice(0, 10);
    await this.saveRecent(updated);
  }

  public async clearRecent(): Promise<void> {
    await this.saveRecent([]);
  }

  // ── Import / Export / Clear ────────────────────────────────
  public exportData(): ExportData {
    return {
      bookmarks: this.cache.bookmarks,
      wallpaper: this.cache.wallpaper,
      groups: this.cache.groups,
      tags: this.cache.tags,
      customize: this.cache.customize,
      starred: this.cache.starred,
      recent: this.cache.recent,
      exportedAt: new Date().toISOString(),
    };
  }

  public async importData(data: Partial<ExportData>): Promise<boolean> {
    try {
      if (data.bookmarks && Array.isArray(data.bookmarks)) {
        await this.saveBookmarks(data.bookmarks);
      }
      if (data.wallpaper && typeof data.wallpaper === 'object') {
        await this.saveWallpaper(data.wallpaper);
      }
      if (data.groups && Array.isArray(data.groups)) {
        await this.saveGroups(data.groups);
      }
      if (data.tags && Array.isArray(data.tags)) {
        await this.saveTags(data.tags);
      }
      if (data.customize && typeof data.customize === 'object') {
        await this.saveCustomize(data.customize);
      }
      if (data.starred && Array.isArray(data.starred)) {
        await this.saveStarred(data.starred);
      }
      if (data.recent && Array.isArray(data.recent)) {
        await this.saveRecent(data.recent);
      }
      return true;
    } catch {
      return false;
    }
  }

  public async clearAll(): Promise<boolean> {
    this.cache.bookmarks = [];
    this.cache.groups = [];
    this.cache.wallpaper = { ...DEFAULT_WALLPAPER };
    this.cache.tags = [...DEFAULT_TAGS];
    this.cache.customize = { ...DEFAULT_CUSTOMIZE };
    this.cache.starred = [];
    this.cache.recent = [];

    try {
      await browser.storage.local.clear();
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
      this.notifyListeners();
      return true;
    } catch {
      return false;
    }
  }
}

export const Storage = new ExtensionStorage();
