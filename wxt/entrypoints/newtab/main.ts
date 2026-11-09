import '../../src/styles/newtab.css';
import { Bookmarks } from '../../src/bookmarks';
import { getIconNode, getIconSvg } from '../../src/icons';
import { Storage, type StorageChangeKey } from '../../src/storage';
import type { Bookmark, CustomizeConfig, RecentVisit } from '../../src/types';
import { Wallpaper } from '../../src/wallpaper';

// ── State ──────────────────────────────────────────────────────
let currentFilter = 'All';
const selectedTags = new Set<string>();
let selectedGroup: string | null = null;
const bookmarkMap = new Map<number, Bookmark>();

// ── DOM Helper ─────────────────────────────────────────────────
const $ = <T extends HTMLElement = HTMLElement>(id: string): T => {
  return document.getElementById(id) as T;
};

// ── Fast URL Hostname Parser ───────────────────────────────────
function getDomain(url: string): string {
  try {
    const idx = url.indexOf('://');
    const start = idx === -1 ? 0 : idx + 3;
    const slash = url.indexOf('/', start);
    const host = slash === -1 ? url.slice(start) : url.slice(start, slash);
    const colon = host.indexOf(':');
    return colon === -1 ? host : host.slice(0, colon);
  } catch {
    return '';
  }
}

// ── Notification Toast ─────────────────────────────────────────
let activeToast: HTMLElement | null = null;
let toastTimeout: ReturnType<typeof setTimeout> | null = null;

function showNotification(message: string, duration = 2500) {
  if (activeToast) {
    activeToast.remove();
    if (toastTimeout) clearTimeout(toastTimeout);
  }
  const toast = document.createElement('div');
  toast.className = 'notification';
  toast.innerHTML = `${getIconSvg('check', { size: 14 })} <span>${message}</span>`;
  document.body.appendChild(toast);
  activeToast = toast;

  toastTimeout = setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => {
      toast.remove();
      if (activeToast === toast) activeToast = null;
    }, 200);
  }, duration);
}

// ── Responsive Layout Helper ───────────────────────────────────
function getResponsiveColumnCount(): number {
  const c = Storage.getCustomize();
  const userCols = c.columnCount || 4;
  const width = window.innerWidth;
  if (width < 600) return 1;
  if (width < 960) return Math.min(2, userCols);
  if (width < 1300) return Math.min(3, userCols);
  return userCols;
}

// ── Customize Styles ───────────────────────────────────────────
function applyCustomize() {
  const c = Storage.getCustomize();
  const root = document.documentElement;
  const effectiveCols = getResponsiveColumnCount();

  root.style.setProperty('--bookmark-font-size', `${c.fontSize}px`);
  root.style.setProperty('--bookmark-color', c.fontColor);
  root.style.setProperty('--bookmark-weight', c.fontWeight);
  root.style.setProperty('--bookmark-spacing', `${c.letterSpacing}px`);
  root.style.setProperty('--column-count', String(c.columnCount));
  root.style.setProperty('--effective-columns', String(effectiveCols));
  root.style.setProperty('--bookmark-padding', c.compactMode ? '4px' : '7px');
  root.style.setProperty('--bookmark-transform', c.textTransform || 'uppercase');
  root.classList.toggle('show-favicons', !!c.showFavicons);
}

let debouncedCustomizeTimer: ReturnType<typeof setTimeout> | null = null;
function debouncedSaveCustomize(patch: Partial<CustomizeConfig>) {
  if (debouncedCustomizeTimer) clearTimeout(debouncedCustomizeTimer);
  debouncedCustomizeTimer = setTimeout(() => {
    Storage.saveCustomize(patch);
  }, 120);
}

// ── Filter Pills ───────────────────────────────────────────────
function renderFilters() {
  const container = $('filters');
  const tags = ['All', ...Bookmarks.getTags()];
  const frag = document.createDocumentFragment();

  for (const tag of tags) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `filter-pill${currentFilter === tag ? ' active' : ''}`;
    btn.textContent = tag;
    btn.dataset.tag = tag;
    frag.appendChild(btn);
  }

  container.replaceChildren(frag);
}

// ── Bookmark Element Builder ───────────────────────────────────
function createBookmarkElement(
  bookmark: Bookmark,
  isStarredView = false,
  showFavicons = false,
  isStarred = false
): HTMLElement {
  const a = document.createElement('a');
  a.href = bookmark.url;
  a.className = 'bookmark';
  a.title = `${bookmark.title} \u2014 ${bookmark.url}`;
  a.dataset.id = String(bookmark.id);
  a.dataset.url = bookmark.url;
  a.dataset.title = bookmark.title;

  if (showFavicons) {
    const hostname = getDomain(bookmark.url);
    if (hostname) {
      const favicon = document.createElement('img');
      favicon.className = 'bookmark-favicon';
      favicon.alt = '';
      favicon.loading = 'lazy';
      favicon.decoding = 'async';
      favicon.src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=32`;
      favicon.onerror = () => {
        favicon.style.display = 'none';
      };
      a.appendChild(favicon);
    }
  }

  const label = document.createElement('span');
  label.className = 'bookmark-label';
  label.textContent = bookmark.title;
  a.appendChild(label);

  if (isStarred && !isStarredView) {
    const starBadge = document.createElement('span');
    starBadge.className = 'bookmark-star-badge';
    starBadge.appendChild(getIconNode('starFill', 11));
    a.appendChild(starBadge);
  }

  // Kebab menu button (cloned from SVG node cache)
  const menuBtn = document.createElement('button');
  menuBtn.type = 'button';
  menuBtn.className = 'bookmark-menu-btn';
  menuBtn.title = 'Options';
  menuBtn.dataset.menu = 'true';
  menuBtn.appendChild(getIconNode('dotsThreeVertical', 14));
  a.appendChild(menuBtn);

  return a;
}

// ── Context Menu ───────────────────────────────────────────────
let activeMenuCleanup: (() => void) | null = null;

function closeContextMenu() {
  if (activeMenuCleanup) {
    activeMenuCleanup();
    activeMenuCleanup = null;
  }
}

function showBookmarkContextMenu(event: MouseEvent, bookmark: Bookmark, triggerEl?: HTMLElement) {
  closeContextMenu();

  const isStarred = Storage.isStarred(bookmark.id);
  const menu = document.createElement('div');
  menu.className = 'bookmark-context-menu';

  const starItem = document.createElement('button');
  starItem.type = 'button';
  starItem.className = 'context-menu-item';
  const starIcon = isStarred ? getIconSvg('star', { size: 13 }) : getIconSvg('starFill', { size: 13 });
  starItem.innerHTML = `${starIcon} <span>${isStarred ? 'Unstar' : 'Star'}</span>`;
  starItem.onclick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeContextMenu();
    await Storage.toggleStar(bookmark.id);
    renderBookmarks();
  };

  const deleteItem = document.createElement('button');
  deleteItem.type = 'button';
  deleteItem.className = 'context-menu-item danger';
  deleteItem.innerHTML = `${getIconSvg('trash', { size: 13 })} <span>Remove</span>`;
  deleteItem.onclick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeContextMenu();
    if (confirm(`Delete bookmark "${bookmark.title}"?`)) {
      await Bookmarks.delete(bookmark.id);
      renderBookmarks();
      refreshSettingsLists();
      showNotification('Bookmark removed');
    }
  };

  menu.appendChild(starItem);
  menu.appendChild(deleteItem);

  const target = (triggerEl || (event.currentTarget as HTMLElement) || document.body);
  const rect = target.getBoundingClientRect();
  const menuWidth = 140;
  const menuHeight = 78;

  const left = Math.min(window.innerWidth - menuWidth - 12, Math.max(12, rect.right - menuWidth));
  let top = rect.bottom + 4;
  if (top + menuHeight > window.innerHeight - 8) {
    top = Math.max(8, rect.top - menuHeight - 4);
  }

  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
  document.body.appendChild(menu);

  const handleOutsideClick = (e: MouseEvent) => {
    if (!menu.contains(e.target as Node)) {
      closeContextMenu();
    }
  };

  const handleScroll = () => {
    closeContextMenu();
  };

  const cleanup = () => {
    menu.remove();
    document.removeEventListener('click', handleOutsideClick);
    window.removeEventListener('scroll', handleScroll, true);
    window.removeEventListener('resize', handleScroll);
  };

  activeMenuCleanup = cleanup;

  setTimeout(() => {
    if (activeMenuCleanup === cleanup) {
      document.addEventListener('click', handleOutsideClick);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleScroll);
    }
  }, 0);
}

// ── Render Bookmarks ───────────────────────────────────────────
function renderBookmarks() {
  const container = $('bookmarksList');
  const emptyState = $('emptyState');

  const bookmarks = Bookmarks.getByTag(currentFilter);
  bookmarkMap.clear();
  for (const b of bookmarks) {
    bookmarkMap.set(b.id, b);
  }

  if (!bookmarks.length) {
    container.style.display = 'none';
    emptyState.style.display = 'flex';
    container.replaceChildren();
    return;
  }

  container.style.display = 'block';
  emptyState.style.display = 'none';

  const showFavicons = !!Storage.getCustomize().showFavicons;
  const starredSet = new Set(Storage.getStarred());

  // Single tag view
  if (currentFilter !== 'All') {
    const grid = document.createElement('div');
    grid.className = 'bookmarks-grid';
    const frag = document.createDocumentFragment();
    for (const b of bookmarks) {
      frag.appendChild(createBookmarkElement(b, false, showFavicons, starredSet.has(b.id)));
    }
    grid.appendChild(frag);
    container.replaceChildren(grid);
    return;
  }

  // Masonry layout for "All" view
  renderMasonryView(container, bookmarks, showFavicons, starredSet);
}

function getShortestColumnIndex(heights: number[]): number {
  let minIdx = 0;
  let minVal = heights[0] ?? 0;
  for (let i = 1; i < heights.length; i++) {
    const h = heights[i] ?? 0;
    if (h < minVal) {
      minVal = h;
      minIdx = i;
    }
  }
  return minIdx;
}

function renderMasonryView(
  container: HTMLElement,
  bookmarks: Bookmark[],
  showFavicons: boolean,
  starredSet: Set<number>
) {
  const numColumns = getResponsiveColumnCount();
  const masonry = document.createElement('div');
  masonry.className = 'masonry-container';

  type Section =
    | { type: 'recent'; items: RecentVisit[] }
    | { type: 'starred'; items: Bookmark[] }
    | { type: 'tag'; tag: string; items: Bookmark[] };

  const columns: Section[][] = Array.from({ length: numColumns }, () => []);
  const columnHeights = new Array(numColumns).fill(0);

  const recent = Storage.getRecent();

  // 1. RECENT section
  if (recent.length > 0 && columns[0]) {
    const height = 28 + recent.length * 20;
    columns[0].push({ type: 'recent', items: recent });
    columnHeights[0] += height;
  }

  // 2. STARRED section
  const starredBookmarks: Bookmark[] = [];
  for (const b of bookmarks) {
    if (starredSet.has(b.id)) {
      starredBookmarks.push(b);
    }
  }

  if (starredBookmarks.length > 0) {
    const height = 28 + starredBookmarks.length * 20;
    const targetCol = getShortestColumnIndex(columnHeights);
    const col = columns[targetCol];
    if (col) {
      col.push({ type: 'starred', items: starredBookmarks });
      columnHeights[targetCol] = (columnHeights[targetCol] ?? 0) + height;
    }
  }

  // 3. Tag groups for remaining bookmarks
  const tagOrder = Bookmarks.getTags();
  const byTag: Record<string, Bookmark[]> = {};

  for (const b of bookmarks) {
    if (starredSet.has(b.id)) continue;
    const tags = b.tags && b.tags.length ? b.tags : (b.group ? [`group:${b.group}`] : ['_none']);
    for (const t of tags) {
      let arr = byTag[t];
      if (!arr) {
        arr = [];
        byTag[t] = arr;
      }
      arr.push(b);
    }
  }

  const orderedTags: string[] = [];
  const tagSet = new Set(tagOrder);

  for (const t of tagOrder) {
    if (byTag[t]?.length) orderedTags.push(t);
  }
  for (const t in byTag) {
    if (t !== '_none' && !tagSet.has(t) && byTag[t]?.length) {
      orderedTags.push(t);
    }
  }
  if (byTag['_none']?.length) orderedTags.push('_none');

  for (const tag of orderedTags) {
    const items = byTag[tag];
    if (!items || !items.length) continue;

    const groupHeight = 28 + items.length * 20;
    const shortestIdx = getShortestColumnIndex(columnHeights);
    const col = columns[shortestIdx];
    if (col) {
      col.push({ type: 'tag', tag, items });
      columnHeights[shortestIdx] = (columnHeights[shortestIdx] ?? 0) + groupHeight;
    }
  }

  // Render columns into DOM fragment
  const frag = document.createDocumentFragment();
  for (const colSections of columns) {
    const colEl = document.createElement('div');
    colEl.className = 'masonry-column';

    for (const section of colSections) {
      if (section.type === 'recent') {
        colEl.appendChild(createRecentSection(section.items, showFavicons));
      } else if (section.type === 'starred') {
        colEl.appendChild(createStarredSection(section.items, showFavicons));
      } else if (section.type === 'tag') {
        colEl.appendChild(createTagSection(section.tag, section.items, showFavicons, starredSet));
      }
    }

    frag.appendChild(colEl);
  }

  masonry.appendChild(frag);
  container.replaceChildren(masonry);
}

function createRecentSection(items: RecentVisit[], showFavicons: boolean): HTMLElement {
  const section = document.createElement('div');
  section.className = 'group-section';

  const header = document.createElement('div');
  header.className = 'group-header';
  header.innerHTML = `
    <span class="group-name">${getIconSvg('arrowCounterClockwise', { size: 11 })} Recent</span>
    <button class="clear-text-btn" data-action="clear-recent" title="Clear recent visits">
      ${getIconSvg('trash', { size: 10 })} Clear
    </button>
  `;
  section.appendChild(header);

  const list = document.createElement('div');
  list.className = 'bookmark-list';
  const frag = document.createDocumentFragment();

  for (const item of items) {
    const a = document.createElement('a');
    a.href = item.url;
    a.className = 'bookmark';
    a.title = `${item.title} \u2014 ${item.url}`;
    a.dataset.url = item.url;
    a.dataset.title = item.title;

    if (showFavicons) {
      const hostname = getDomain(item.url);
      if (hostname) {
        const favicon = document.createElement('img');
        favicon.className = 'bookmark-favicon';
        favicon.alt = '';
        favicon.loading = 'lazy';
        favicon.decoding = 'async';
        favicon.src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=32`;
        favicon.onerror = () => {
          favicon.style.display = 'none';
        };
        a.appendChild(favicon);
      }
    }

    const label = document.createElement('span');
    label.className = 'bookmark-label';
    label.textContent = item.title;
    a.appendChild(label);
    frag.appendChild(a);
  }

  list.appendChild(frag);
  section.appendChild(list);
  return section;
}

function createStarredSection(items: Bookmark[], showFavicons: boolean): HTMLElement {
  const section = document.createElement('div');
  section.className = 'group-section';

  const header = document.createElement('div');
  header.className = 'group-header';
  header.innerHTML = `
    <span class="group-name" style="color:var(--color-gold);">
      ${getIconSvg('starFill', { size: 12 })} Starred
    </span>
  `;
  section.appendChild(header);

  const list = document.createElement('div');
  list.className = 'bookmark-list';
  const frag = document.createDocumentFragment();
  for (const b of items) {
    frag.appendChild(createBookmarkElement(b, true, showFavicons, true));
  }
  list.appendChild(frag);
  section.appendChild(list);

  return section;
}

function createTagSection(
  tag: string,
  items: Bookmark[],
  showFavicons: boolean,
  starredSet: Set<number>
): HTMLElement {
  const section = document.createElement('div');
  section.className = 'group-section';

  const header = document.createElement('div');
  header.className = 'group-header';

  let label = tag === '_none' ? 'Other' : tag;
  let iconName: 'tag' | 'folder' = 'tag';

  if (tag.startsWith('group:')) {
    const groupId = tag.slice(6);
    const g = Bookmarks.getGroups().find((group) => group.id === groupId);
    label = g ? g.name : 'Group';
    iconName = 'folder';
  }

  header.innerHTML = `
    <span class="group-name">
      ${getIconSvg(iconName, { size: 11 })} ${label}
    </span>
  `;
  section.appendChild(header);

  const list = document.createElement('div');
  list.className = 'bookmark-list';
  const frag = document.createDocumentFragment();
  for (const b of items) {
    frag.appendChild(createBookmarkElement(b, false, showFavicons, starredSet.has(b.id)));
  }
  list.appendChild(frag);
  section.appendChild(list);

  return section;
}

// ── Modals: Add Bookmark ───────────────────────────────────────
function openAddModal() {
  selectedTags.clear();
  selectedGroup = null;

  const urlInput = $<HTMLInputElement>('urlInput');
  const titleInput = $<HTMLInputElement>('titleInput');
  urlInput.value = '';
  titleInput.value = '';
  clearError('urlError');
  clearError('titleError');

  renderAddModalTags();
  renderAddModalGroups();

  $('addModal').classList.add('active');
  setTimeout(() => urlInput.focus(), 50);
}

function closeAddModal() {
  $('addModal').classList.remove('active');
}

function renderAddModalTags() {
  const container = $('tagList');
  const tags = Bookmarks.getTags();
  const frag = document.createDocumentFragment();

  for (const tag of tags) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `tag-option${selectedTags.has(tag) ? ' selected' : ''}`;
    btn.textContent = tag;
    btn.dataset.tag = tag;
    frag.appendChild(btn);
  }
  container.replaceChildren(frag);
}

function renderAddModalGroups() {
  const container = $('groupList');
  const groups = Bookmarks.getGroups();

  if (!groups.length) {
    container.innerHTML =
      '<div style="opacity:0.4;font-size:10px;font-family:var(--font-mono);padding:4px 0;">No groups defined yet</div>';
    return;
  }

  const frag = document.createDocumentFragment();
  const noneBtn = document.createElement('button');
  noneBtn.type = 'button';
  noneBtn.className = `tag-option${!selectedGroup ? ' selected' : ''}`;
  noneBtn.textContent = 'None';
  noneBtn.dataset.group = '';
  frag.appendChild(noneBtn);

  for (const group of groups) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `tag-option${selectedGroup === group.id ? ' selected' : ''}`;
    btn.textContent = group.name;
    btn.dataset.group = group.id;
    frag.appendChild(btn);
  }

  container.replaceChildren(frag);
}

async function saveBookmarkFromModal() {
  clearError('urlError');
  clearError('titleError');

  const urlInput = $<HTMLInputElement>('urlInput');
  const titleInput = $<HTMLInputElement>('titleInput');
  let url = urlInput.value.trim();
  const title = titleInput.value.trim();
  let hasError = false;

  if (!url) {
    showError('urlError', 'URL is required');
    hasError = true;
  }
  if (!title) {
    showError('titleError', 'Title is required');
    hasError = true;
  }
  if (hasError) return;

  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  try {
    await Bookmarks.add({
      url,
      title,
      tags: Array.from(selectedTags),
      group: selectedGroup,
    });
    closeAddModal();
    renderBookmarks();
    refreshSettingsLists();
    showNotification('Bookmark added');
  } catch (err) {
    showError('urlError', (err as Error).message);
  }
}

// ── Modals: Settings ───────────────────────────────────────────
function openSettingsModal() {
  updateWallpaperPreview();
  renderSettingsBookmarks();
  renderSettingsGroups();
  refreshCustomizePanel();
  $('settingsModal').classList.add('active');
}

function closeSettingsModal() {
  $('settingsModal').classList.remove('active');
}

function refreshSettingsLists() {
  if (!$('settingsModal').classList.contains('active')) return;
  renderSettingsBookmarks();
  renderSettingsGroups();
}

function renderSettingsBookmarks() {
  const container = $('settingsBookmarksList');
  const bookmarks = Bookmarks.getAll();

  if (!bookmarks.length) {
    container.innerHTML =
      '<div style="opacity:0.4;text-align:center;padding:18px;font-size:10px;text-transform:uppercase;letter-spacing:1px;">No bookmarks saved</div>';
    return;
  }

  const frag = document.createDocumentFragment();
  for (const b of bookmarks) {
    const row = document.createElement('div');
    row.className = 'bookmark-item';

    const info = document.createElement('div');
    info.className = 'bookmark-item-info';
    info.innerHTML = `
      <div class="bookmark-item-title">${b.title}</div>
      <div class="bookmark-item-url">${b.url}</div>
    `;

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'delete-btn-sm';
    delBtn.title = 'Delete bookmark';
    delBtn.dataset.id = String(b.id);
    delBtn.dataset.title = b.title;
    delBtn.appendChild(getIconNode('trash', 12));

    row.appendChild(info);
    row.appendChild(delBtn);
    frag.appendChild(row);
  }

  container.replaceChildren(frag);
}

function renderSettingsGroups() {
  const container = $('groupManager');
  const groups = Bookmarks.getGroups();

  if (!groups.length) {
    container.innerHTML =
      '<div style="opacity:0.4;font-size:10px;padding:8px 0;text-transform:uppercase;">No groups created yet</div>';
    return;
  }

  const frag = document.createDocumentFragment();
  for (const g of groups) {
    const row = document.createElement('div');
    row.className = 'group-row';

    const name = document.createElement('span');
    name.className = 'group-row-name';
    name.textContent = g.name;

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'delete-btn-sm';
    delBtn.title = 'Delete group';
    delBtn.dataset.id = g.id;
    delBtn.dataset.name = g.name;
    delBtn.appendChild(getIconNode('trash', 12));

    row.appendChild(name);
    row.appendChild(delBtn);
    frag.appendChild(row);
  }

  container.replaceChildren(frag);
}

async function addGroup() {
  const input = $<HTMLInputElement>('newGroupInput');
  const name = input.value.trim();
  if (!name) return;

  await Bookmarks.addGroup(name);
  input.value = '';
  refreshSettingsLists();
  showNotification('Group added');
}

// ── Wallpaper Settings ─────────────────────────────────────────
function updateWallpaperPreview() {
  const container = $('wallpaperPreview');
  const url = Wallpaper.getPreviewUrl();
  container.innerHTML = '';

  if (url) {
    const isVid = Wallpaper.isVideo(url);
    const media = document.createElement(isVid ? 'video' : 'img');
    media.src = url;
    if (isVid) {
      (media as HTMLVideoElement).autoplay = true;
      (media as HTMLVideoElement).loop = true;
      (media as HTMLVideoElement).muted = true;
    }
    container.appendChild(media);
  } else {
    container.style.background = Storage.getWallpaper().value;
  }
}

async function applyWallpaperUrl() {
  const input = $<HTMLInputElement>('wallpaperInput');
  const url = input.value.trim();
  if (!url) {
    showNotification('Please enter a valid URL');
    return;
  }

  const success = await Wallpaper.setFromUrl(url);
  if (success) {
    Wallpaper.apply($('wallpaperContainer'));
    updateWallpaperPreview();
    input.value = '';
    showNotification('Wallpaper updated');
  } else {
    showNotification('Invalid wallpaper URL');
  }
}

async function applyWallpaperFile(file?: File) {
  if (!file) return;
  const success = await Wallpaper.setFromFile(file);
  if (success) {
    Wallpaper.apply($('wallpaperContainer'));
    updateWallpaperPreview();
    $<HTMLInputElement>('wallpaperUpload').value = '';
    showNotification('Wallpaper uploaded');
  } else {
    showNotification('Upload failed');
  }
}

async function resetWallpaper() {
  await Wallpaper.reset();
  Wallpaper.apply($('wallpaperContainer'));
  updateWallpaperPreview();
  showNotification('Wallpaper reset to default');
}

// ── Customize Settings Panel ───────────────────────────────────
function refreshCustomizePanel() {
  const c = Storage.getCustomize();

  $<HTMLInputElement>('custFontSize').value = String(c.fontSize);
  $('custFontSizeVal').textContent = `${c.fontSize}px`;

  if (c.fontColor.startsWith('#')) {
    $<HTMLInputElement>('custFontColor').value = c.fontColor;
  }
  updateSwatchActive(c.fontColor);

  setToggleActive('custFontWeight', c.fontWeight);
  setToggleActive('custTextTransform', c.textTransform || 'uppercase');

  $<HTMLInputElement>('custSpacing').value = String(c.letterSpacing);
  $('custSpacingVal').textContent = `${Number(c.letterSpacing).toFixed(1)}px`;

  setToggleActive('custColumns', String(c.columnCount));
  setToggleActive('custCompact', String(c.compactMode));
  setToggleActive('custFavicons', String(!!c.showFavicons));

  renderCustTagPills();
}

function setToggleActive(groupId: string, val: string) {
  const group = $(groupId);
  const btns = group.querySelectorAll<HTMLButtonElement>('.cust-toggle-btn');
  for (const btn of btns) {
    btn.classList.toggle('active', btn.dataset.val === val);
  }
}

function updateSwatchActive(color: string) {
  const swatches = document.querySelectorAll<HTMLButtonElement>('.cust-swatch');
  for (const sw of swatches) {
    sw.classList.toggle('active', sw.dataset.color === color);
  }
}

function renderCustTagPills() {
  const container = $('custTagPills');
  const tags = Storage.getTags();
  const frag = document.createDocumentFragment();

  for (const tag of tags) {
    const pill = document.createElement('span');
    pill.className = 'cust-tag-pill';

    const span = document.createElement('span');
    span.textContent = tag;

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'cust-tag-pill-del';
    delBtn.title = 'Remove tag';
    delBtn.dataset.tag = tag;
    delBtn.appendChild(getIconNode('x', 10));

    pill.appendChild(span);
    pill.appendChild(delBtn);
    frag.appendChild(pill);
  }

  container.replaceChildren(frag);
}

async function addCustomTag() {
  const input = $<HTMLInputElement>('custNewTagInput');
  const val = input.value.trim().toLowerCase();
  clearError('custTagError');

  if (!val) {
    showError('custTagError', 'Tag name is required');
    return;
  }
  if (val.length > 20) {
    showError('custTagError', 'Max 20 characters');
    return;
  }
  const currentTags = Storage.getTags();
  if (currentTags.includes(val)) {
    showError('custTagError', 'Tag already exists');
    return;
  }
  if (currentTags.length >= 30) {
    showError('custTagError', 'Max 30 tags reached');
    return;
  }

  await Storage.addTag(val);
  input.value = '';
  renderFilters();
  renderCustTagPills();
  showNotification(`Tag "${val}" added`);
}

// ── Data Export / Import ───────────────────────────────────────
function exportData() {
  const data = Storage.exportData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `manger-maki-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  showNotification('Data exported');
}

function handleImport(file?: File) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const parsed = JSON.parse(e.target?.result as string);
      const success = await Storage.importData(parsed);
      if (success) {
        renderFilters();
        renderBookmarks();
        refreshSettingsLists();
        refreshCustomizePanel();
        Wallpaper.apply($('wallpaperContainer'));
        updateWallpaperPreview();
        applyCustomize();
        showNotification('Data imported successfully');
      } else {
        showNotification('Failed to import data');
      }
    } catch {
      showNotification('Invalid JSON backup file');
    }
  };
  reader.readAsText(file);
}

async function clearAllData() {
  if (!confirm('Are you sure you want to clear ALL bookmarks, tags, and settings? This cannot be undone.')) {
    return;
  }
  await Storage.clearAll();
  currentFilter = 'All';
  selectedTags.clear();
  selectedGroup = null;
  renderFilters();
  renderBookmarks();
  refreshSettingsLists();
  refreshCustomizePanel();
  Wallpaper.apply($('wallpaperContainer'));
  updateWallpaperPreview();
  applyCustomize();
  showNotification('All data cleared');
}

// ── Error Helpers ──────────────────────────────────────────────
function showError(elementId: string, message: string) {
  const el = $(elementId);
  el.textContent = message;
  el.classList.add('show');
}

function clearError(elementId: string) {
  const el = $(elementId);
  el.textContent = '';
  el.classList.remove('show');
}

// ── Wire Event Listeners ───────────────────────────────────────
function wireEventListeners() {
  // Filters bar delegation
  $('filters').addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.filter-pill');
    if (btn?.dataset.tag) {
      const tag = btn.dataset.tag;
      if (currentFilter !== tag) {
        currentFilter = tag;
        renderFilters();
        renderBookmarks();
      }
    }
  });

  // Bookmarks list event delegation
  const bookmarksList = $('bookmarksList');

  bookmarksList.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    // Check menu button click
    const menuBtn = target.closest<HTMLButtonElement>('.bookmark-menu-btn');
    if (menuBtn) {
      e.preventDefault();
      e.stopPropagation();
      const bookmarkEl = menuBtn.closest<HTMLAnchorElement>('.bookmark');
      if (bookmarkEl?.dataset.id) {
        const bId = Number(bookmarkEl.dataset.id);
        const b = bookmarkMap.get(bId);
        if (b) showBookmarkContextMenu(e, b, menuBtn);
      }
      return;
    }

    // Check clear recent button
    const clearRecentBtn = target.closest<HTMLButtonElement>('[data-action="clear-recent"]');
    if (clearRecentBtn) {
      e.stopPropagation();
      Storage.clearRecent().then(() => renderBookmarks());
      return;
    }

    // Check link click to track recent visit
    const bookmarkEl = target.closest<HTMLAnchorElement>('.bookmark');
    if (bookmarkEl?.dataset.url) {
      Storage.addVisit(bookmarkEl.dataset.url, bookmarkEl.dataset.title || '');
    }
  });

  bookmarksList.addEventListener('contextmenu', (e) => {
    const target = e.target as HTMLElement;
    const bookmarkEl = target.closest<HTMLAnchorElement>('.bookmark');
    if (bookmarkEl?.dataset.id) {
      e.preventDefault();
      const bId = Number(bookmarkEl.dataset.id);
      const b = bookmarkMap.get(bId);
      if (b) showBookmarkContextMenu(e, b, bookmarkEl);
    }
  });

  // Add modal trigger
  $('addBtn').addEventListener('click', openAddModal);
  $('addBookmarkBtn').addEventListener('click', openAddModal);
  $('closeAddModal').addEventListener('click', closeAddModal);
  $('cancelAddBtn').addEventListener('click', closeAddModal);
  $('saveBookmarkBtn').addEventListener('click', saveBookmarkFromModal);
  $('addModal').addEventListener('click', (e) => {
    if (e.target === $('addModal')) closeAddModal();
  });

  $<HTMLInputElement>('urlInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveBookmarkFromModal();
  });
  $<HTMLInputElement>('titleInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveBookmarkFromModal();
  });

  // Add modal tag / group delegation
  $('tagList').addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.tag-option');
    if (btn?.dataset.tag) {
      const tag = btn.dataset.tag;
      if (selectedTags.has(tag)) {
        selectedTags.delete(tag);
        btn.classList.remove('selected');
      } else {
        selectedTags.add(tag);
        btn.classList.add('selected');
      }
    }
  });

  $('groupList').addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.tag-option');
    if (btn && btn.dataset.group !== undefined) {
      selectedGroup = btn.dataset.group || null;
      const allBtns = $('groupList').querySelectorAll<HTMLButtonElement>('.tag-option');
      for (const b of allBtns) {
        b.classList.toggle('selected', b === btn);
      }
    }
  });

  // Settings modal trigger
  $('settingsBtn').addEventListener('click', openSettingsModal);
  $('closeSettingsModal').addEventListener('click', closeSettingsModal);
  $('closeSettingsBtn').addEventListener('click', closeSettingsModal);
  $('settingsModal').addEventListener('click', (e) => {
    if (e.target === $('settingsModal')) closeSettingsModal();
  });

  // Settings bookmarks list delegation
  $('settingsBookmarksList').addEventListener('click', async (e) => {
    const delBtn = (e.target as HTMLElement).closest<HTMLButtonElement>('.delete-btn-sm');
    if (delBtn?.dataset.id) {
      const id = Number(delBtn.dataset.id);
      const title = delBtn.dataset.title || 'bookmark';
      if (confirm(`Delete bookmark "${title}"?`)) {
        await Bookmarks.delete(id);
        renderBookmarks();
        renderSettingsBookmarks();
        showNotification('Bookmark deleted');
      }
    }
  });

  // Settings group manager delegation
  $('groupManager').addEventListener('click', async (e) => {
    const delBtn = (e.target as HTMLElement).closest<HTMLButtonElement>('.delete-btn-sm');
    if (delBtn?.dataset.id) {
      const id = delBtn.dataset.id;
      const name = delBtn.dataset.name || 'group';
      if (confirm(`Delete group "${name}"? Bookmarks will become ungrouped.`)) {
        await Bookmarks.deleteGroup(id);
        renderBookmarks();
        renderSettingsGroups();
        showNotification('Group deleted');
      }
    }
  });

  // Wallpaper settings
  $('applyWallpaperBtn').addEventListener('click', applyWallpaperUrl);
  $<HTMLInputElement>('wallpaperInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') applyWallpaperUrl();
  });
  $<HTMLInputElement>('wallpaperUpload').addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    applyWallpaperFile(file);
  });
  $('resetWallpaperBtn').addEventListener('click', resetWallpaper);

  // Groups
  $('addGroupBtn').addEventListener('click', addGroup);
  $<HTMLInputElement>('newGroupInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addGroup();
  });

  // Customize: typography with instant GPU CSS property updates + debounced storage
  $<HTMLInputElement>('custFontSize').addEventListener('input', (e) => {
    const val = Number((e.target as HTMLInputElement).value);
    $('custFontSizeVal').textContent = `${val}px`;
    document.documentElement.style.setProperty('--bookmark-font-size', `${val}px`);
    debouncedSaveCustomize({ fontSize: val });
  }, { passive: true });

  $<HTMLInputElement>('custFontColor').addEventListener('input', (e) => {
    const val = (e.target as HTMLInputElement).value;
    updateSwatchActive(val);
    document.documentElement.style.setProperty('--bookmark-color', val);
    debouncedSaveCustomize({ fontColor: val });
  }, { passive: true });

  document.querySelector('.cust-color-row')?.addEventListener('click', (e) => {
    const sw = (e.target as HTMLElement).closest<HTMLButtonElement>('.cust-swatch');
    if (sw?.dataset.color) {
      const color = sw.dataset.color;
      if (color.startsWith('#')) {
        $<HTMLInputElement>('custFontColor').value = color;
      }
      updateSwatchActive(color);
      document.documentElement.style.setProperty('--bookmark-color', color);
      Storage.saveCustomize({ fontColor: color });
    }
  });

  $('custFontWeight').addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.cust-toggle-btn');
    if (btn?.dataset.val) {
      const val = btn.dataset.val as 'normal' | 'bold';
      setToggleActive('custFontWeight', val);
      document.documentElement.style.setProperty('--bookmark-weight', val);
      Storage.saveCustomize({ fontWeight: val });
    }
  });

  $('custTextTransform').addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.cust-toggle-btn');
    if (btn?.dataset.val) {
      const val = btn.dataset.val as 'uppercase' | 'lowercase' | 'none';
      setToggleActive('custTextTransform', val);
      document.documentElement.style.setProperty('--bookmark-transform', val);
      Storage.saveCustomize({ textTransform: val });
    }
  });

  $<HTMLInputElement>('custSpacing').addEventListener('input', (e) => {
    const val = parseFloat((e.target as HTMLInputElement).value);
    $('custSpacingVal').textContent = `${val.toFixed(1)}px`;
    document.documentElement.style.setProperty('--bookmark-spacing', `${val}px`);
    debouncedSaveCustomize({ letterSpacing: val });
  }, { passive: true });

  // Custom tags pills delegation
  $('custTagPills').addEventListener('click', async (e) => {
    const delBtn = (e.target as HTMLElement).closest<HTMLButtonElement>('.cust-tag-pill-del');
    if (delBtn?.dataset.tag) {
      const tag = delBtn.dataset.tag;
      await Storage.deleteTag(tag);
      if (currentFilter === tag) {
        currentFilter = 'All';
      }
      renderFilters();
      renderBookmarks();
      renderCustTagPills();
      showNotification(`Tag "${tag}" removed`);
    }
  });

  $('custAddTagBtn').addEventListener('click', addCustomTag);
  $<HTMLInputElement>('custNewTagInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addCustomTag();
  });

  // Customize: layout columns
  $('custColumns').addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.cust-toggle-btn');
    if (btn?.dataset.val) {
      const val = Number(btn.dataset.val);
      setToggleActive('custColumns', String(val));
      Storage.saveCustomize({ columnCount: val }).then(() => {
        applyCustomize();
        renderBookmarks();
      });
    }
  });

  // Customize: compact mode
  $('custCompact').addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.cust-toggle-btn');
    if (btn?.dataset.val) {
      const val = btn.dataset.val === 'true';
      setToggleActive('custCompact', String(val));
      document.documentElement.style.setProperty('--bookmark-padding', val ? '4px' : '7px');
      Storage.saveCustomize({ compactMode: val });
    }
  });

  // Customize: show favicons
  $('custFavicons').addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.cust-toggle-btn');
    if (btn?.dataset.val) {
      const val = btn.dataset.val === 'true';
      setToggleActive('custFavicons', String(val));
      document.documentElement.classList.toggle('show-favicons', val);
      Storage.saveCustomize({ showFavicons: val }).then(() => {
        renderBookmarks();
      });
    }
  });

  // Data management
  $('exportBtn').addEventListener('click', exportData);
  const importFile = $<HTMLInputElement>('importFile');
  $('importBtn').addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    handleImport(file);
  });
  $('clearBtn').addEventListener('click', clearAllData);

  // Global keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAddModal();
      closeSettingsModal();
      closeContextMenu();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const addModal = $('addModal');
      addModal.classList.contains('active') ? closeAddModal() : openAddModal();
    }
  });

  // Responsive window resize listener with column check
  let resizeTimer: ReturnType<typeof setTimeout> | null = null;
  let lastCols = getResponsiveColumnCount();

  window.addEventListener('resize', () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const newCols = getResponsiveColumnCount();
      if (newCols !== lastCols) {
        lastCols = newCols;
        applyCustomize();
        renderBookmarks();
      }
    }, 100);
  }, { passive: true });
}

// ── Main App Initialization ────────────────────────────────────
async function init() {
  await Storage.init();

  // Selective reactive listener: only re-render the components that actually changed!
  Storage.onChange((keys: ReadonlySet<StorageChangeKey>) => {
    if (keys.has('tags')) {
      renderFilters();
      if ($('settingsModal').classList.contains('active')) {
        renderCustTagPills();
      }
    }
    if (
      keys.has('bookmarks') ||
      keys.has('starred') ||
      keys.has('recent') ||
      keys.has('groups') ||
      keys.has('tags')
    ) {
      renderBookmarks();
      refreshSettingsLists();
    }
    if (keys.has('customize')) {
      applyCustomize();
    }
    if (keys.has('wallpaper')) {
      Wallpaper.apply($('wallpaperContainer'));
    }
  });

  applyCustomize();
  Wallpaper.apply($('wallpaperContainer'));
  renderFilters();
  renderBookmarks();
  wireEventListeners();
}

document.addEventListener('DOMContentLoaded', init);
