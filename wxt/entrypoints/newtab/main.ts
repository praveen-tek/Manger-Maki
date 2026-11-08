import '../../src/styles/newtab.css';
import { Bookmarks } from '../../src/bookmarks';
import { getIconSvg } from '../../src/icons';
import { Storage } from '../../src/storage';
import type { Bookmark, RecentVisit } from '../../src/types';
import { Wallpaper } from '../../src/wallpaper';

// ── State ──────────────────────────────────────────────────────
let currentFilter = 'All';
let selectedTags: string[] = [];
let selectedGroup: string | null = null;

// ── DOM Element Helper ─────────────────────────────────────────
const $ = <T extends HTMLElement = HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Element #${id} not found`);
  return el as T;
};

// ── Initialize Icons in Static HTML ────────────────────────────
function setupStaticIcons() {
  $('settingsBtn').innerHTML = getIconSvg('gear', { size: 16 });
  $('addBtn').innerHTML = getIconSvg('plus', { size: 22 });
  $('closeAddModal').innerHTML = getIconSvg('x', { size: 16 });
  $('closeSettingsModal').innerHTML = getIconSvg('x', { size: 16 });
  $('addBookmarkBtn').innerHTML = `${getIconSvg('plus', { size: 13 })} Add first bookmark`;

  // Modal Section Headers
  $('addModalTitle').innerHTML = `${getIconSvg('plus', { size: 15 })} Add Bookmark`;
  $('settingsModalTitle').innerHTML = `${getIconSvg('gear', { size: 15 })} Settings`;
  $('sectionWallpaperTitle').innerHTML = `${getIconSvg('sliders', { size: 14 })} Wallpaper`;
  $('sectionGroupsTitle').innerHTML = `${getIconSvg('folder', { size: 14 })} Groups`;
  $('sectionBookmarksTitle').innerHTML = `${getIconSvg('tag', { size: 14 })} Bookmarks`;
  $('sectionCustomizeTitle').innerHTML = `${getIconSvg('sliders', { size: 14 })} Customize`;
  $('sectionDataTitle').innerHTML = `${getIconSvg('exportIcon', { size: 14 })} Data & Backup`;

  // Buttons with icons
  $('resetWallpaperBtn').innerHTML = `${getIconSvg('arrowCounterClockwise', { size: 13 })} Reset`;
  $('exportBtn').innerHTML = `${getIconSvg('exportIcon', { size: 14 })} Export Data (JSON)`;
  $('importBtn').innerHTML = `${getIconSvg('uploadSimple', { size: 14 })} Import Data (JSON)`;
  $('clearBtn').innerHTML = `${getIconSvg('trash', { size: 14 })} Clear All Data`;
}

// ── Notification Toast ─────────────────────────────────────────
function showNotification(message: string, duration = 2500) {
  const toast = document.createElement('div');
  toast.className = 'notification';
  toast.innerHTML = `${getIconSvg('check', { size: 14 })} <span>${message}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.2s ease forwards';
    setTimeout(() => toast.remove(), 200);
  }, duration);
}

// ── Customize Styles ───────────────────────────────────────────
function applyCustomize() {
  const c = Storage.getCustomize();
  const root = document.documentElement;

  root.style.setProperty('--bookmark-font-size', `${c.fontSize}px`);
  root.style.setProperty('--bookmark-color', c.fontColor);
  root.style.setProperty('--bookmark-weight', c.fontWeight);
  root.style.setProperty('--bookmark-spacing', `${c.letterSpacing}px`);
  root.style.setProperty('--column-count', String(c.columnCount));
  root.style.setProperty('--bookmark-padding', c.compactMode ? '3px' : '7px');
  root.style.setProperty('--bookmark-transform', c.textTransform || 'uppercase');
  root.classList.toggle('show-favicons', !!c.showFavicons);
}

async function saveCustomizePatch(patch: Parameters<typeof Storage.saveCustomize>[0]) {
  await Storage.saveCustomize(patch);
  applyCustomize();
}

// ── Filter Pills ───────────────────────────────────────────────
function renderFilters() {
  const container = $('filters');
  container.innerHTML = '';

  const tags = ['All', ...Bookmarks.getTags()];
  tags.forEach((tag) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `filter-pill ${currentFilter === tag ? 'active' : ''}`;
    btn.textContent = tag;
    btn.onclick = () => {
      currentFilter = tag;
      renderFilters();
      renderBookmarks();
    };
    container.appendChild(btn);
  });
}

// ── Bookmark Element Builder ───────────────────────────────────
function createBookmarkElement(bookmark: Bookmark, isStarredView = false): HTMLElement {
  const a = document.createElement('a');
  a.href = bookmark.url;
  a.className = 'bookmark';
  a.title = `${bookmark.title} — ${bookmark.url}`;

  // Favicon handling
  let hostname = '';
  try {
    hostname = new URL(bookmark.url).hostname;
  } catch {
    // ignore
  }

  const favicon = document.createElement('img');
  favicon.className = 'bookmark-favicon';
  favicon.alt = '';
  favicon.loading = 'lazy';
  if (hostname) {
    favicon.src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=32`;
    favicon.onerror = () => {
      favicon.style.display = 'none';
    };
  }

  const label = document.createElement('span');
  label.className = 'bookmark-label';
  label.textContent = bookmark.title;

  a.appendChild(favicon);
  a.appendChild(label);

  const isStarred = Storage.isStarred(bookmark.id);
  if (isStarred && !isStarredView) {
    const starBadge = document.createElement('span');
    starBadge.className = 'bookmark-star-badge';
    starBadge.innerHTML = getIconSvg('starFill', { size: 11 });
    a.appendChild(starBadge);
  }

  // Kebab menu button
  const menuBtn = document.createElement('button');
  menuBtn.type = 'button';
  menuBtn.className = 'bookmark-menu-btn';
  menuBtn.title = 'Options';
  menuBtn.innerHTML = getIconSvg('dotsThreeVertical', { size: 14 });
  menuBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    showBookmarkContextMenu(e, bookmark);
  };
  a.appendChild(menuBtn);

  // Track visit on link click
  a.onclick = () => {
    Storage.addVisit(bookmark.url, bookmark.title);
  };

  return a;
}

// ── Context Menu ───────────────────────────────────────────────
function showBookmarkContextMenu(event: MouseEvent, bookmark: Bookmark) {
  const existing = document.querySelector('.bookmark-context-menu');
  if (existing) existing.remove();

  const isStarred = Storage.isStarred(bookmark.id);
  const menu = document.createElement('div');
  menu.className = 'bookmark-context-menu';

  // Star / Unstar
  const starItem = document.createElement('button');
  starItem.type = 'button';
  starItem.className = 'context-menu-item';
  const starIcon = isStarred ? getIconSvg('star', { size: 13 }) : getIconSvg('starFill', { size: 13 });
  starItem.innerHTML = `${starIcon} ${isStarred ? 'Unstar' : 'Star'}`;
  starItem.onclick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await Storage.toggleStar(bookmark.id);
    renderBookmarks();
    menu.remove();
  };

  // Remove
  const deleteItem = document.createElement('button');
  deleteItem.type = 'button';
  deleteItem.className = 'context-menu-item danger';
  deleteItem.innerHTML = `${getIconSvg('trash', { size: 13 })} Remove`;
  deleteItem.onclick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Delete bookmark "${bookmark.title}"?`)) {
      await Bookmarks.delete(bookmark.id);
      renderBookmarks();
      refreshSettingsLists();
      showNotification('Bookmark removed');
    }
    menu.remove();
  };

  menu.appendChild(starItem);
  menu.appendChild(deleteItem);

  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  menu.style.left = `${Math.min(window.innerWidth - 150, Math.max(10, rect.right - 100))}px`;
  menu.style.top = `${rect.bottom + 4}px`;

  document.body.appendChild(menu);

  const handleOutsideClick = (e: MouseEvent) => {
    if (!menu.contains(e.target as Node) && e.target !== event.currentTarget) {
      menu.remove();
      document.removeEventListener('click', handleOutsideClick);
    }
  };
  setTimeout(() => document.addEventListener('click', handleOutsideClick), 0);
}

// ── Render Bookmarks ───────────────────────────────────────────
function renderBookmarks() {
  const container = $('bookmarksList');
  const emptyState = $('emptyState');
  container.innerHTML = '';

  const bookmarks = Bookmarks.getByTag(currentFilter);

  if (!bookmarks.length) {
    container.style.display = 'none';
    emptyState.style.display = 'flex';
    return;
  }

  container.style.display = 'block';
  emptyState.style.display = 'none';

  // Single tag view: straightforward grid
  if (currentFilter !== 'All') {
    const grid = document.createElement('div');
    grid.className = 'bookmarks-grid';
    bookmarks.forEach((b) => grid.appendChild(createBookmarkElement(b)));
    container.appendChild(grid);
    return;
  }

  // Masonry layout for "All" view
  renderMasonryView(container, bookmarks);
}

function renderMasonryView(container: HTMLElement, bookmarks: Bookmark[]) {
  const customize = Storage.getCustomize();
  const numColumns = customize.columnCount || 4;

  const masonry = document.createElement('div');
  masonry.className = 'masonry-container';

  type Section =
    | { type: 'recent'; items: RecentVisit[] }
    | { type: 'starred'; items: Bookmark[] }
    | { type: 'tag'; tag: string; items: Bookmark[] };

  const columns: Section[][] = Array.from({ length: numColumns }, () => []);
  const columnHeights = new Array(numColumns).fill(0);

  const starred = Storage.getStarred();
  const recent = Storage.getRecent();

  // 1. RECENT section
  if (recent.length > 0 && columns[0]) {
    const height = 28 + recent.length * 20;
    columns[0].push({ type: 'recent', items: recent });
    columnHeights[0] += height;
  }

  // 2. STARRED section
  const starredBookmarks = bookmarks.filter((b) => starred.includes(b.id));
  if (starredBookmarks.length > 0) {
    const height = 28 + starredBookmarks.length * 20;
    const targetCol = columnHeights.indexOf(Math.min(...columnHeights));
    if (columns[targetCol]) {
      columns[targetCol].push({ type: 'starred', items: starredBookmarks });
      columnHeights[targetCol] += height;
    }
  }

  // 3. Tag groups for remaining bookmarks
  const tagOrder = Bookmarks.getTags();
  const byTag: Record<string, Bookmark[]> = {};
  const seen = new Set<string>();

  bookmarks.forEach((b) => {
    if (starred.includes(b.id)) return;
    const tags = b.tags && b.tags.length ? b.tags : ['_none'];
    tags.forEach((t) => {
      if (!byTag[t]) byTag[t] = [];
      const key = `${b.id}-${t}`;
      if (!seen.has(key)) {
        byTag[t].push(b);
        seen.add(key);
      }
    });
  });

  const orderedTags = tagOrder.filter((t) => byTag[t] && byTag[t].length);
  if (byTag['_none'] && byTag['_none'].length) orderedTags.push('_none');

  orderedTags.forEach((tag) => {
    const items = byTag[tag];
    if (!items || !items.length) return;

    const groupHeight = 28 + items.length * 20;
    const shortestIdx = columnHeights.indexOf(Math.min(...columnHeights));
    if (columns[shortestIdx]) {
      columns[shortestIdx].push({ type: 'tag', tag, items });
      columnHeights[shortestIdx] += groupHeight;
    }
  });

  // Render columns into DOM
  columns.forEach((colSections) => {
    const colEl = document.createElement('div');
    colEl.className = 'masonry-column';

    colSections.forEach((section) => {
      if (section.type === 'recent') {
        colEl.appendChild(createRecentSection(section.items));
      } else if (section.type === 'starred') {
        colEl.appendChild(createStarredSection(section.items));
      } else if (section.type === 'tag') {
        colEl.appendChild(createTagSection(section.tag, section.items));
      }
    });

    masonry.appendChild(colEl);
  });

  container.appendChild(masonry);
}

function createRecentSection(items: RecentVisit[]): HTMLElement {
  const section = document.createElement('div');
  section.className = 'group-section';

  const header = document.createElement('div');
  header.className = 'group-header';
  header.innerHTML = `
    <span class="group-name">${getIconSvg('arrowCounterClockwise', { size: 11 })} Recent</span>
    <button class="clear-text-btn" title="Clear recent visits">
      ${getIconSvg('trash', { size: 10 })} Clear
    </button>
  `;

  header.querySelector('.clear-text-btn')?.addEventListener('click', async (e) => {
    e.stopPropagation();
    await Storage.clearRecent();
    renderBookmarks();
  });

  section.appendChild(header);

  const list = document.createElement('div');
  list.className = 'bookmark-list';

  items.forEach((item) => {
    const a = document.createElement('a');
    a.href = item.url;
    a.className = 'bookmark';
    a.title = `${item.title} — ${item.url}`;

    let hostname = '';
    try {
      hostname = new URL(item.url).hostname;
    } catch {
      // ignore
    }

    const favicon = document.createElement('img');
    favicon.className = 'bookmark-favicon';
    favicon.alt = '';
    favicon.loading = 'lazy';
    if (hostname) {
      favicon.src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=32`;
      favicon.onerror = () => {
        favicon.style.display = 'none';
      };
    }

    const label = document.createElement('span');
    label.className = 'bookmark-label';
    label.textContent = item.title;

    a.appendChild(favicon);
    a.appendChild(label);
    list.appendChild(a);
  });

  section.appendChild(list);
  return section;
}

function createStarredSection(items: Bookmark[]): HTMLElement {
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
  items.forEach((b) => list.appendChild(createBookmarkElement(b, true)));
  section.appendChild(list);

  return section;
}

function createTagSection(tag: string, items: Bookmark[]): HTMLElement {
  const section = document.createElement('div');
  section.className = 'group-section';

  const header = document.createElement('div');
  header.className = 'group-header';
  const label = tag === '_none' ? 'Other' : tag;
  header.innerHTML = `
    <span class="group-name">
      ${getIconSvg('tag', { size: 11 })} ${label}
    </span>
  `;
  section.appendChild(header);

  const list = document.createElement('div');
  list.className = 'bookmark-list';
  items.forEach((b) => list.appendChild(createBookmarkElement(b)));
  section.appendChild(list);

  return section;
}

// ── Modals: Add Bookmark ───────────────────────────────────────
function openAddModal() {
  selectedTags = [];
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
  container.innerHTML = '';

  Bookmarks.getTags().forEach((tag) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `tag-option ${selectedTags.includes(tag) ? 'selected' : ''}`;
    btn.textContent = tag;
    btn.onclick = () => {
      selectedTags = selectedTags.includes(tag)
        ? selectedTags.filter((t) => t !== tag)
        : [...selectedTags, tag];
      renderAddModalTags();
    };
    container.appendChild(btn);
  });
}

function renderAddModalGroups() {
  const container = $('groupList');
  container.innerHTML = '';

  const groups = Bookmarks.getGroups();
  if (!groups.length) {
    container.innerHTML =
      '<div style="opacity:0.4;font-size:10px;font-family:var(--font-mono);padding:4px 0;">No groups defined yet</div>';
    return;
  }

  const noneBtn = document.createElement('button');
  noneBtn.type = 'button';
  noneBtn.className = `tag-option ${!selectedGroup ? 'selected' : ''}`;
  noneBtn.textContent = 'None';
  noneBtn.onclick = () => {
    selectedGroup = null;
    renderAddModalGroups();
  };
  container.appendChild(noneBtn);

  groups.forEach((group) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `tag-option ${selectedGroup === group.id ? 'selected' : ''}`;
    btn.textContent = group.name;
    btn.onclick = () => {
      selectedGroup = group.id;
      renderAddModalGroups();
    };
    container.appendChild(btn);
  });
}

async function saveBookmarkFromModal() {
  clearError('urlError');
  clearError('titleError');

  const urlInput = $<HTMLInputElement>('urlInput');
  const titleInput = $<HTMLInputElement>('titleInput');
  const url = urlInput.value.trim();
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

  try {
    await Bookmarks.add({
      url,
      title,
      tags: selectedTags,
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
  refreshSettingsLists();
  refreshCustomizePanel();
  $('settingsModal').classList.add('active');
}

function closeSettingsModal() {
  $('settingsModal').classList.remove('active');
}

function refreshSettingsLists() {
  renderSettingsBookmarks();
  renderSettingsGroups();
}

function renderSettingsBookmarks() {
  const container = $('settingsBookmarksList');
  container.innerHTML = '';

  const bookmarks = Bookmarks.getAll();
  if (!bookmarks.length) {
    container.innerHTML =
      '<div style="opacity:0.4;text-align:center;padding:18px;font-size:10px;text-transform:uppercase;letter-spacing:1px;">No bookmarks saved</div>';
    return;
  }

  bookmarks.forEach((b) => {
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
    delBtn.innerHTML = getIconSvg('trash', { size: 12 });
    delBtn.onclick = async () => {
      if (confirm(`Delete bookmark "${b.title}"?`)) {
        await Bookmarks.delete(b.id);
        renderBookmarks();
        refreshSettingsLists();
        showNotification('Bookmark deleted');
      }
    };

    row.appendChild(info);
    row.appendChild(delBtn);
    container.appendChild(row);
  });
}

function renderSettingsGroups() {
  const container = $('groupManager');
  container.innerHTML = '';

  const groups = Bookmarks.getGroups();
  if (!groups.length) {
    container.innerHTML =
      '<div style="opacity:0.4;font-size:10px;padding:8px 0;text-transform:uppercase;">No groups created yet</div>';
    return;
  }

  groups.forEach((g) => {
    const row = document.createElement('div');
    row.className = 'group-row';

    const name = document.createElement('span');
    name.className = 'group-row-name';
    name.textContent = g.name;

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'delete-btn-sm';
    delBtn.title = 'Delete group';
    delBtn.innerHTML = getIconSvg('trash', { size: 12 });
    delBtn.onclick = async () => {
      if (confirm(`Delete group "${g.name}"? Bookmarks will become ungrouped.`)) {
        await Bookmarks.deleteGroup(g.id);
        renderBookmarks();
        refreshSettingsLists();
        showNotification('Group deleted');
      }
    };

    row.appendChild(name);
    row.appendChild(delBtn);
    container.appendChild(row);
  });
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

  // Font size
  $<HTMLInputElement>('custFontSize').value = String(c.fontSize);
  $('custFontSizeVal').textContent = `${c.fontSize}px`;

  // Font color
  if (c.fontColor.startsWith('#')) {
    $<HTMLInputElement>('custFontColor').value = c.fontColor;
  }
  updateSwatchActive(c.fontColor);

  // Font weight
  setToggleActive('custFontWeight', c.fontWeight);

  // Text transform
  setToggleActive('custTextTransform', c.textTransform || 'uppercase');

  // Letter spacing
  $<HTMLInputElement>('custSpacing').value = String(c.letterSpacing);
  $('custSpacingVal').textContent = `${Number(c.letterSpacing).toFixed(1)}px`;

  // Layout columns
  setToggleActive('custColumns', String(c.columnCount));

  // Compact mode
  setToggleActive('custCompact', String(c.compactMode));

  // Favicons
  setToggleActive('custFavicons', String(!!c.showFavicons));

  // Custom tags pills
  renderCustTagPills();
}

function setToggleActive(groupId: string, val: string) {
  const group = $(groupId);
  group.querySelectorAll<HTMLButtonElement>('.cust-toggle-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.val === val);
  });
}

function updateSwatchActive(color: string) {
  document.querySelectorAll<HTMLButtonElement>('.cust-swatch').forEach((sw) => {
    sw.classList.toggle('active', sw.dataset.color === color);
  });
}

function renderCustTagPills() {
  const container = $('custTagPills');
  container.innerHTML = '';

  Storage.getTags().forEach((tag) => {
    const pill = document.createElement('span');
    pill.className = 'cust-tag-pill';
    pill.innerHTML = `
      <span>${tag}</span>
      <button type="button" class="cust-tag-pill-del" title="Remove tag">
        ${getIconSvg('x', { size: 10 })}
      </button>
    `;

    pill.querySelector('.cust-tag-pill-del')?.addEventListener('click', async () => {
      await Storage.deleteTag(tag);
      if (currentFilter === tag) {
        currentFilter = 'All';
      }
      renderFilters();
      renderBookmarks();
      renderCustTagPills();
      showNotification(`Tag "${tag}" removed`);
    });

    container.appendChild(pill);
  });
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
  selectedTags = [];
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
  // Add modal trigger
  $('addBtn').onclick = openAddModal;
  $('addBookmarkBtn').onclick = openAddModal;
  $('closeAddModal').onclick = closeAddModal;
  $('cancelAddBtn').onclick = closeAddModal;
  $('saveBookmarkBtn').onclick = saveBookmarkFromModal;
  $('addModal').onclick = (e) => {
    if (e.target === $('addModal')) closeAddModal();
  };

  // Settings modal trigger
  $('settingsBtn').onclick = openSettingsModal;
  $('closeSettingsModal').onclick = closeSettingsModal;
  $('closeSettingsBtn').onclick = closeSettingsModal;
  $('settingsModal').onclick = (e) => {
    if (e.target === $('settingsModal')) closeSettingsModal();
  };

  // Wallpaper settings
  $('applyWallpaperBtn').onclick = applyWallpaperUrl;
  $<HTMLInputElement>('wallpaperInput').onkeydown = (e) => {
    if (e.key === 'Enter') applyWallpaperUrl();
  };
  $<HTMLInputElement>('wallpaperUpload').onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    applyWallpaperFile(file);
  };
  $('resetWallpaperBtn').onclick = resetWallpaper;

  // Groups
  $('addGroupBtn').onclick = addGroup;
  $<HTMLInputElement>('newGroupInput').onkeydown = (e) => {
    if (e.key === 'Enter') addGroup();
  };

  // Customize: typography
  $<HTMLInputElement>('custFontSize').oninput = (e) => {
    const val = Number((e.target as HTMLInputElement).value);
    $('custFontSizeVal').textContent = `${val}px`;
    saveCustomizePatch({ fontSize: val });
  };

  $<HTMLInputElement>('custFontColor').oninput = (e) => {
    const val = (e.target as HTMLInputElement).value;
    updateSwatchActive(val);
    saveCustomizePatch({ fontColor: val });
  };

  document.querySelectorAll<HTMLButtonElement>('.cust-swatch').forEach((sw) => {
    sw.onclick = () => {
      const color = sw.dataset.color || '#ffffff';
      if (color.startsWith('#')) {
        $<HTMLInputElement>('custFontColor').value = color;
      }
      updateSwatchActive(color);
      saveCustomizePatch({ fontColor: color });
    };
  });

  $('custFontWeight').querySelectorAll<HTMLButtonElement>('.cust-toggle-btn').forEach((btn) => {
    btn.onclick = () => {
      const val = (btn.dataset.val || 'bold') as 'normal' | 'bold';
      setToggleActive('custFontWeight', val);
      saveCustomizePatch({ fontWeight: val });
    };
  });

  $('custTextTransform').querySelectorAll<HTMLButtonElement>('.cust-toggle-btn').forEach((btn) => {
    btn.onclick = () => {
      const val = (btn.dataset.val || 'uppercase') as 'uppercase' | 'lowercase' | 'none';
      setToggleActive('custTextTransform', val);
      saveCustomizePatch({ textTransform: val });
    };
  });

  $<HTMLInputElement>('custSpacing').oninput = (e) => {
    const val = parseFloat((e.target as HTMLInputElement).value);
    $('custSpacingVal').textContent = `${val.toFixed(1)}px`;
    saveCustomizePatch({ letterSpacing: val });
  };

  // Customize: custom tag addition
  $('custAddTagBtn').onclick = addCustomTag;
  $<HTMLInputElement>('custNewTagInput').onkeydown = (e) => {
    if (e.key === 'Enter') addCustomTag();
  };

  // Customize: layout columns
  $('custColumns').querySelectorAll<HTMLButtonElement>('.cust-toggle-btn').forEach((btn) => {
    btn.onclick = () => {
      const val = Number(btn.dataset.val || 4);
      setToggleActive('custColumns', String(val));
      saveCustomizePatch({ columnCount: val });
      renderBookmarks();
    };
  });

  // Customize: compact mode
  $('custCompact').querySelectorAll<HTMLButtonElement>('.cust-toggle-btn').forEach((btn) => {
    btn.onclick = () => {
      const val = btn.dataset.val === 'true';
      setToggleActive('custCompact', String(val));
      saveCustomizePatch({ compactMode: val });
    };
  });

  // Customize: show favicons
  $('custFavicons').querySelectorAll<HTMLButtonElement>('.cust-toggle-btn').forEach((btn) => {
    btn.onclick = () => {
      const val = btn.dataset.val === 'true';
      setToggleActive('custFavicons', String(val));
      saveCustomizePatch({ showFavicons: val });
    };
  });

  // Data management
  $('exportBtn').onclick = exportData;
  const importFile = $<HTMLInputElement>('importFile');
  $('importBtn').onclick = () => importFile.click();
  importFile.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    handleImport(file);
  };
  $('clearBtn').onclick = clearAllData;

  // Global keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAddModal();
      closeSettingsModal();
      document.querySelector('.bookmark-context-menu')?.remove();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const addModal = $('addModal');
      addModal.classList.contains('active') ? closeAddModal() : openAddModal();
    }
  });
}

// ── Main App Initialization ────────────────────────────────────
async function init() {
  await Storage.init();

  // Reactive listener: whenever data changes in storage (e.g. from popup or other tab),
  // re-render UI automatically in real-time!
  Storage.onChange(() => {
    renderFilters();
    renderBookmarks();
    applyCustomize();
    Wallpaper.apply($('wallpaperContainer'));
  });

  setupStaticIcons();
  applyCustomize();
  Wallpaper.apply($('wallpaperContainer'));
  renderFilters();
  renderBookmarks();
  wireEventListeners();
}

document.addEventListener('DOMContentLoaded', init);
