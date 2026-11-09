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

export type StorageChangeKey =
  | 'bookmarks'
  | 'groups'
  | 'wallpaper'
  | 'tags'
  | 'customize'
  | 'starred'
  | 'recent';

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
  private listeners: Set<(keys: ReadonlySet<StorageChangeKey>) => void> = new Set();

  constructor() {
    this.listenForChanges();
  }

  public async init(): Promise<void> {
    if (this.initialized) return;

    try {
      const stored = (await browser.storage.local.get([
        STORAGE_KEYS.BOOKMARKS,
        STORAGE_KEYS.WALLPAPER,
        STORAGE_KEYS.GROUPS,
        STORAGE_KEYS.STARRED,
        STORAGE_KEYS.RECENT,
        STORAGE_KEYS.CUSTOMIZE,
        STORAGE_KEYS.TAGS,
      ])) as Record<string, any>;

      const isFirstRun = !Array.isArray(stored[STORAGE_KEYS.BOOKMARKS]);
      const keysToSeed: Record<string, any> = {};

      if (!isFirstRun) {
        this.cache.bookmarks = stored[STORAGE_KEYS.BOOKMARKS] as Bookmark[];
      } else {
        const migrated = this.checkAndMigrateLocalStorage();
        if (migrated.bookmarks) {
          this.cache.bookmarks = migrated.bookmarks;
        }
        keysToSeed[STORAGE_KEYS.BOOKMARKS] = this.cache.bookmarks;
      }

      if (Array.isArray(stored[STORAGE_KEYS.GROUPS])) {
        this.cache.groups = stored[STORAGE_KEYS.GROUPS] as Group[];
      } else if (isFirstRun) {
        keysToSeed[STORAGE_KEYS.GROUPS] = this.cache.groups;
      }

      if (stored[STORAGE_KEYS.WALLPAPER] && typeof stored[STORAGE_KEYS.WALLPAPER] === 'object') {
        this.cache.wallpaper = stored[STORAGE_KEYS.WALLPAPER] as Wallpaper;
      } else if (isFirstRun) {
        keysToSeed[STORAGE_KEYS.WALLPAPER] = this.cache.wallpaper;
      }

      if (Array.isArray(stored[STORAGE_KEYS.TAGS])) {
        this.cache.tags = stored[STORAGE_KEYS.TAGS] as string[];
      } else if (isFirstRun) {
        keysToSeed[STORAGE_KEYS.TAGS] = this.cache.tags;
      }

      if (stored[STORAGE_KEYS.CUSTOMIZE] && typeof stored[STORAGE_KEYS.CUSTOMIZE] === 'object') {
        this.cache.customize = {
          ...DEFAULT_CUSTOMIZE,
          ...(stored[STORAGE_KEYS.CUSTOMIZE] as Partial<CustomizeConfig>),
        };
      } else if (isFirstRun) {
        keysToSeed[STORAGE_KEYS.CUSTOMIZE] = this.cache.customize;
      }

      if (Array.isArray(stored[STORAGE_KEYS.STARRED])) {
        this.cache.starred = stored[STORAGE_KEYS.STARRED] as number[];
      } else if (isFirstRun) {
        keysToSeed[STORAGE_KEYS.STARRED] = this.cache.starred;
      }

      if (Array.isArray(stored[STORAGE_KEYS.RECENT])) {
        this.cache.recent = stored[STORAGE_KEYS.RECENT] as RecentVisit[];
      } else if (isFirstRun) {
        keysToSeed[STORAGE_KEYS.RECENT] = this.cache.recent;
      }

      // Batch seed all missing keys in a single IPC call if needed
      if (Object.keys(keysToSeed).length > 0) {
        await browser.storage.local.set(keysToSeed);
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

      // Clean up legacy localStorage keys to free memory & quota
      localStorage.clear();
    } catch {
      // ignore
    }
    return result;
  }

  private listenForChanges() {
    if (typeof browser !== 'undefined' && browser.storage?.onChanged) {
      browser.storage.onChanged.addListener((changes: Record<string, any>, areaName: string) => {
        if (areaName !== 'local') return;
        const changed = new Set<StorageChangeKey>();

        if (changes[STORAGE_KEYS.BOOKMARKS]) {
          const val = (changes[STORAGE_KEYS.BOOKMARKS].newValue as Bookmark[]) || [];
          if (val !== this.cache.bookmarks) {
            this.cache.bookmarks = val;
            changed.add('bookmarks');
          }
        }
        if (changes[STORAGE_KEYS.GROUPS]) {
          const val = (changes[STORAGE_KEYS.GROUPS].newValue as Group[]) || [];
          if (val !== this.cache.groups) {
            this.cache.groups = val;
            changed.add('groups');
          }
        }
        if (changes[STORAGE_KEYS.WALLPAPER]) {
          const val = changes[STORAGE_KEYS.WALLPAPER].newValue as Wallpaper;
          if (val && (val.type !== this.cache.wallpaper.type || val.value !== this.cache.wallpaper.value)) {
            this.cache.wallpaper = val;
            changed.add('wallpaper');
          }
        }
        if (changes[STORAGE_KEYS.TAGS]) {
          const val = (changes[STORAGE_KEYS.TAGS].newValue as string[]) || [];
          if (val !== this.cache.tags) {
            this.cache.tags = val;
            changed.add('tags');
          }
        }
        if (changes[STORAGE_KEYS.CUSTOMIZE]) {
          const val = changes[STORAGE_KEYS.CUSTOMIZE].newValue as Partial<CustomizeConfig>;
          if (val) {
            this.cache.customize = { ...DEFAULT_CUSTOMIZE, ...val };
            changed.add('customize');
          }
        }
        if (changes[STORAGE_KEYS.STARRED]) {
          const val = (changes[STORAGE_KEYS.STARRED].newValue as number[]) || [];
          if (val !== this.cache.starred) {
            this.cache.starred = val;
            changed.add('starred');
          }
        }
        if (changes[STORAGE_KEYS.RECENT]) {
          const val = (changes[STORAGE_KEYS.RECENT].newValue as RecentVisit[]) || [];
          if (val !== this.cache.recent) {
            this.cache.recent = val;
            changed.add('recent');
          }
        }

        if (changed.size > 0) {
          this.notifyListeners(changed);
        }
      });
    }
  }

  public onChange(listener: (keys: ReadonlySet<StorageChangeKey>) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(changedKeys: ReadonlySet<StorageChangeKey>) {
    this.listeners.forEach((fn) => {
      try {
        fn(changedKeys);
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
    this.notifyListeners(new Set(['bookmarks']));
    try {
      await browser.storage.local.set({ [STORAGE_KEYS.BOOKMARKS]: bookmarks });
      return true;
    } catch {
      return false;
    }
  }

  public async addBookmark(bookmark: Omit<Bookmark, 'id'>): Promise<Bookmark> {
    const bookmarks = this.cache.bookmarks;
    let maxId = 0;
    for (const b of bookmarks) {
      if (b.id > maxId) maxId = b.id;
    }
    const newBookmark: Bookmark = {
      id: maxId + 1,
      title: bookmark.title.trim(),
      url: bookmark.url.trim(),
      tags: bookmark.tags || [],
      group: bookmark.group || null,
    };
    const updated = [...bookmarks, newBookmark];
    await this.saveBookmarks(updated);
    return newBookmark;
  }

  public async deleteBookmark(id: number): Promise<boolean> {
    const updated = this.cache.bookmarks.filter((b) => b.id !== id);
    const starred = this.cache.starred.filter((sId) => sId !== id);

    if (starred.length !== this.cache.starred.length) {
      this.cache.bookmarks = updated;
      this.cache.starred = starred;
      this.notifyListeners(new Set(['bookmarks', 'starred']));
      try {
        await browser.storage.local.set({
          [STORAGE_KEYS.BOOKMARKS]: updated,
          [STORAGE_KEYS.STARRED]: starred,
        });
        return true;
      } catch {
        return false;
      }
    }

    return this.saveBookmarks(updated);
  }

  // ── Groups ─────────────────────────────────────────────────
  public getGroups(): Group[] {
    return this.cache.groups;
  }

  public async saveGroups(groups: Group[]): Promise<boolean> {
    this.cache.groups = groups;
    this.notifyListeners(new Set(['groups']));
    try {
      await browser.storage.local.set({ [STORAGE_KEYS.GROUPS]: groups });
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
    let bookmarksChanged = false;
    const bookmarks = this.cache.bookmarks.map((b) => {
      if (b.group === id) {
        bookmarksChanged = true;
        return { ...b, group: null };
      }
      return b;
    });

    this.cache.groups = groups;
    const payload: Record<string, any> = { [STORAGE_KEYS.GROUPS]: groups };
    const changed = new Set<StorageChangeKey>(['groups']);

    if (bookmarksChanged) {
      this.cache.bookmarks = bookmarks;
      payload[STORAGE_KEYS.BOOKMARKS] = bookmarks;
      changed.add('bookmarks');
    }

    this.notifyListeners(changed);
    try {
      await browser.storage.local.set(payload);
      return true;
    } catch {
      return false;
    }
  }

  // ── Wallpaper ──────────────────────────────────────────────
  public getWallpaper(): Wallpaper {
    return this.cache.wallpaper;
  }

  public async saveWallpaper(wallpaper: Wallpaper): Promise<boolean> {
    this.cache.wallpaper = wallpaper;
    this.notifyListeners(new Set(['wallpaper']));
    try {
      await browser.storage.local.set({ [STORAGE_KEYS.WALLPAPER]: wallpaper });
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
    this.notifyListeners(new Set(['tags']));
    try {
      await browser.storage.local.set({ [STORAGE_KEYS.TAGS]: tags });
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
    let bookmarksChanged = false;
    const bookmarks = this.cache.bookmarks.map((b) => {
      if (b.tags && b.tags.includes(name)) {
        bookmarksChanged = true;
        return { ...b, tags: b.tags.filter((t) => t !== name) };
      }
      return b;
    });

    this.cache.tags = tags;
    const payload: Record<string, any> = { [STORAGE_KEYS.TAGS]: tags };
    const changed = new Set<StorageChangeKey>(['tags']);

    if (bookmarksChanged) {
      this.cache.bookmarks = bookmarks;
      payload[STORAGE_KEYS.BOOKMARKS] = bookmarks;
      changed.add('bookmarks');
    }

    this.notifyListeners(changed);
    try {
      await browser.storage.local.set(payload);
      return true;
    } catch {
      return false;
    }
  }

  // ── Customize ──────────────────────────────────────────────
  public getCustomize(): CustomizeConfig {
    return this.cache.customize;
  }

  public async saveCustomize(config: Partial<CustomizeConfig>): Promise<boolean> {
    const merged = { ...this.cache.customize, ...config };
    this.cache.customize = merged;
    this.notifyListeners(new Set(['customize']));
    try {
      await browser.storage.local.set({ [STORAGE_KEYS.CUSTOMIZE]: merged });
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
    this.notifyListeners(new Set(['starred']));
    try {
      await browser.storage.local.set({ [STORAGE_KEYS.STARRED]: ids });
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
    this.notifyListeners(new Set(['recent']));
    try {
      await browser.storage.local.set({ [STORAGE_KEYS.RECENT]: visits });
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
      const payload: Record<string, any> = {};
      const changed = new Set<StorageChangeKey>();

      if (data.bookmarks && Array.isArray(data.bookmarks)) {
        this.cache.bookmarks = data.bookmarks;
        payload[STORAGE_KEYS.BOOKMARKS] = data.bookmarks;
        changed.add('bookmarks');
      }
      if (data.wallpaper && typeof data.wallpaper === 'object') {
        this.cache.wallpaper = data.wallpaper;
        payload[STORAGE_KEYS.WALLPAPER] = data.wallpaper;
        changed.add('wallpaper');
      }
      if (data.groups && Array.isArray(data.groups)) {
        this.cache.groups = data.groups;
        payload[STORAGE_KEYS.GROUPS] = data.groups;
        changed.add('groups');
      }
      if (data.tags && Array.isArray(data.tags)) {
        this.cache.tags = data.tags;
        payload[STORAGE_KEYS.TAGS] = data.tags;
        changed.add('tags');
      }
      if (data.customize && typeof data.customize === 'object') {
        const merged = { ...DEFAULT_CUSTOMIZE, ...data.customize };
        this.cache.customize = merged;
        payload[STORAGE_KEYS.CUSTOMIZE] = merged;
        changed.add('customize');
      }
      if (data.starred && Array.isArray(data.starred)) {
        this.cache.starred = data.starred;
        payload[STORAGE_KEYS.STARRED] = data.starred;
        changed.add('starred');
      }
      if (data.recent && Array.isArray(data.recent)) {
        this.cache.recent = data.recent;
        payload[STORAGE_KEYS.RECENT] = data.recent;
        changed.add('recent');
      }

      if (Object.keys(payload).length > 0) {
        this.notifyListeners(changed);
        await browser.storage.local.set(payload);
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

    this.notifyListeners(
      new Set(['bookmarks', 'groups', 'wallpaper', 'tags', 'customize', 'starred', 'recent'])
    );

    try {
      await browser.storage.local.clear();
      return true;
    } catch {
      return false;
    }
  }
}

export const Storage = new ExtensionStorage();
