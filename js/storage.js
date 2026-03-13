const Storage = {
  BOOKMARKS_KEY: 'minimal_tab_bookmarks',
  WALLPAPER_KEY: 'minimal_tab_wallpaper',
  GROUPS_KEY: 'minimal_tab_groups',
  STARRED_KEY: 'minimal_tab_starred',
  RECENT_KEY: 'minimal_tab_recent',
  CUSTOMIZE_KEY: 'minimal_tab_customize',
  TAGS_KEY: 'minimal_tab_tags',

  DEFAULT_TAGS: [
    'news', 'ui', 'robotics', 'open-media', 'research',
    'tools', 'ai', 'design', 'dev', 'productivity', 'social',
    'entertainment', 'education', 'business', 'health'
  ],

  DEFAULT_CUSTOMIZE: {
    fontSize: 13,
    fontColor: '#ffffff',
    fontWeight: 'bold',
    letterSpacing: 0.2,
    columnCount: 4,
    compactMode: false,
  },

  DEFAULT_BOOKMARKS: [
    { id: 1, title: 'GitHub', url: 'https://github.com', tags: ['dev', 'tools'], group: null },
    { id: 2, title: 'MDN', url: 'https://developer.mozilla.org', tags: ['dev', 'research'], group: null },
    { id: 3, title: 'Hacker News', url: 'https://news.ycombinator.com', tags: ['news'], group: null },
    { id: 4, title: 'Product Hunt', url: 'https://producthunt.com', tags: ['tools', 'design'], group: null },
    { id: 5, title: 'Dribbble', url: 'https://dribbble.com', tags: ['design', 'ui'], group: null },
  ],

  DEFAULT_WALLPAPER: {
    type: 'gradient',
    value: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
  },

  getBookmarks() {
    try {
      const stored = localStorage.getItem(this.BOOKMARKS_KEY);
      return stored ? JSON.parse(stored) : [...this.DEFAULT_BOOKMARKS];
    } catch {
      return [...this.DEFAULT_BOOKMARKS];
    }
  },

  saveBookmarks(bookmarks) {
    try {
      localStorage.setItem(this.BOOKMARKS_KEY, JSON.stringify(bookmarks));
      return true;
    } catch {
      return false;
    }
  },

  addBookmark(bookmark) {
    const bookmarks = this.getBookmarks();
    const id = bookmarks.length ? Math.max(...bookmarks.map(b => b.id)) + 1 : 1;
    const newBookmark = { id, ...bookmark, tags: bookmark.tags || [], group: bookmark.group || null };
    bookmarks.push(newBookmark);
    this.saveBookmarks(bookmarks);
    return newBookmark;
  },

  deleteBookmark(id) {
    this.saveBookmarks(this.getBookmarks().filter(b => b.id !== id));
    return true;
  },

  getGroups() {
    try {
      const stored = localStorage.getItem(this.GROUPS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  saveGroups(groups) {
    try {
      localStorage.setItem(this.GROUPS_KEY, JSON.stringify(groups));
      return true;
    } catch {
      return false;
    }
  },

  addGroup(name) {
    const groups = this.getGroups();
    const id = Date.now().toString();
    groups.push({ id, name });
    this.saveGroups(groups);
    return { id, name };
  },

  deleteGroup(id) {
    this.saveGroups(this.getGroups().filter(g => g.id !== id));
    this.saveBookmarks(this.getBookmarks().map(b => b.group === id ? { ...b, group: null } : b));
    return true;
  },

  getWallpaper() {
    try {
      const stored = localStorage.getItem(this.WALLPAPER_KEY);
      return stored ? JSON.parse(stored) : { ...this.DEFAULT_WALLPAPER };
    } catch {
      return { ...this.DEFAULT_WALLPAPER };
    }
  },

  saveWallpaper(wallpaper) {
    try {
      localStorage.setItem(this.WALLPAPER_KEY, JSON.stringify(wallpaper));
      return true;
    } catch {
      return false;
    }
  },

  exportData() {
    return {
      bookmarks: this.getBookmarks(),
      wallpaper: this.getWallpaper(),
      groups: this.getGroups(),
      exportedAt: new Date().toISOString(),
    };
  },

  importData(data) {
    try {
      if (data.bookmarks) this.saveBookmarks(data.bookmarks);
      if (data.wallpaper) this.saveWallpaper(data.wallpaper);
      if (data.groups) this.saveGroups(data.groups);
      return true;
    } catch {
      return false;
    }
  },

  clearAll() {
    localStorage.removeItem(this.BOOKMARKS_KEY);
    localStorage.removeItem(this.WALLPAPER_KEY);
    localStorage.removeItem(this.GROUPS_KEY);
    localStorage.removeItem(this.STARRED_KEY);
    localStorage.removeItem(this.RECENT_KEY);
    localStorage.removeItem(this.CUSTOMIZE_KEY);
    localStorage.removeItem(this.TAGS_KEY);
    return true;
  },

  getCustomize() {
    try {
      const stored = localStorage.getItem(this.CUSTOMIZE_KEY);
      return stored ? { ...this.DEFAULT_CUSTOMIZE, ...JSON.parse(stored) } : { ...this.DEFAULT_CUSTOMIZE };
    } catch {
      return { ...this.DEFAULT_CUSTOMIZE };
    }
  },

  saveCustomize(data) {
    try {
      localStorage.setItem(this.CUSTOMIZE_KEY, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  },

  getTags() {
    try {
      const stored = localStorage.getItem(this.TAGS_KEY);
      return stored ? JSON.parse(stored) : [...this.DEFAULT_TAGS];
    } catch {
      return [...this.DEFAULT_TAGS];
    }
  },

  saveTags(tags) {
    try {
      localStorage.setItem(this.TAGS_KEY, JSON.stringify(tags));
      return true;
    } catch {
      return false;
    }
  },

  addTag(name) {
    const tags = this.getTags();
    const normalized = name.trim().toLowerCase();
    if (!normalized || tags.includes(normalized) || tags.length >= 30 || normalized.length > 20) return false;
    tags.push(normalized);
    this.saveTags(tags);
    return true;
  },

  deleteTag(name) {
    const tags = this.getTags().filter(t => t !== name);
    this.saveTags(tags);
    // Strip tag from all bookmarks
    const bookmarks = this.getBookmarks().map(b => ({
      ...b,
      tags: (b.tags || []).filter(t => t !== name),
    }));
    this.saveBookmarks(bookmarks);
    return true;
  },

  getStarred() {
    try {
      const stored = localStorage.getItem(this.STARRED_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  saveStarred(ids) {
    try {
      localStorage.setItem(this.STARRED_KEY, JSON.stringify(ids));
      return true;
    } catch {
      return false;
    }
  },

  toggleStar(bookmarkId) {
    const starred = this.getStarred();
    const idx = starred.indexOf(bookmarkId);
    if (idx > -1) {
      starred.splice(idx, 1);
    } else {
      starred.push(bookmarkId);
    }
    this.saveStarred(starred);
  },

  isStarred(bookmarkId) {
    return this.getStarred().includes(bookmarkId);
  },

  getRecent() {
    try {
      const stored = localStorage.getItem(this.RECENT_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  saveRecent(visits) {
    try {
      localStorage.setItem(this.RECENT_KEY, JSON.stringify(visits));
      return true;
    } catch {
      return false;
    }
  },

  addVisit(url, title) {
    const recent = this.getRecent();
    const now = Date.now();
    const newVisit = { url, title, timestamp: now };
    
    // Remove duplicate URL if exists
    const filtered = recent.filter(v => v.url !== url);
    
    // Add new visit at front and keep last 10
    const updated = [newVisit, ...filtered].slice(0, 10);
    this.saveRecent(updated);
  },

  clearRecent() {
    localStorage.removeItem(this.RECENT_KEY);
  },
};