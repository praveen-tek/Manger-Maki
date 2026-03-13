let currentFilter = 'All';
let selectedTags = [];
let selectedGroup = null;

// Patch Bookmarks.getTags to use Storage (custom tag list) instead of hardcoded array
// This runs before bookmarks.js's AVAILABLE_TAGS is read, keeping bookmarks.js untouched.
function syncTagsFromStorage() {
  Bookmarks.AVAILABLE_TAGS = Storage.getTags();
}

const $ = id => document.getElementById(id);

const wallpaperContainer = $('wallpaperContainer');
const filtersContainer = $('filters');
const bookmarksList = $('bookmarksList');
const emptyState = $('emptyState');
const addModal = $('addModal');
const settingsModal = $('settingsModal');
const urlInput = $('urlInput');
const titleInput = $('titleInput');
const urlError = $('urlError');
const titleError = $('titleError');
const tagList = $('tagList');
const groupList = $('groupList');
const wallpaperInput = $('wallpaperInput');
const wallpaperUpload = $('wallpaperUpload');
const wallpaperPreview = $('wallpaperPreview');
const settingsBookmarksList = $('settingsBookmarksList');
const groupManager = $('groupManager');
const newGroupInput = $('newGroupInput');
const importFile = $('importFile');

function init() {
  syncTagsFromStorage();
  applyCustomize();
  Wallpaper.apply(wallpaperContainer);
  renderFilters();
  renderBookmarks();
  attachEventListeners();
}

function renderFilters() {
  UI.renderFilters(filtersContainer, currentFilter, tag => {
    currentFilter = tag;
    window._currentFilter = tag;
    renderFilters();
    renderBookmarks();
  });
}

function renderBookmarks() {
  window._currentFilter = currentFilter;
  const filtered = Bookmarks.getByTag(currentFilter);
  const hasBookmarks = filtered.length > 0;
  bookmarksList.style.display = hasBookmarks ? 'block' : 'none';
  emptyState.style.display = hasBookmarks ? 'none' : 'flex';
  if (hasBookmarks) UI.renderBookmarks(bookmarksList, filtered, deleteBookmark, renderBookmarks);
}

function deleteBookmark(id) {
  Bookmarks.delete(id);
  renderBookmarks();
  refreshSettingsLists();
  UI.showNotification('Bookmark deleted');
}

function openAddModal() {
  selectedTags = [];
  selectedGroup = null;
  urlInput.value = '';
  titleInput.value = '';
  UI.clearError(urlError);
  UI.clearError(titleError);
  UI.renderTagOptions(tagList, selectedTags, toggleTag);
  // Named function to allow re-render on group toggle without arguments.callee
  function onGroupChange(g) {
    selectedGroup = g;
    UI.renderGroupOptions(groupList, selectedGroup, onGroupChange);
  }
  UI.renderGroupOptions(groupList, selectedGroup, onGroupChange);
  UI.toggleModal(addModal, true);
  urlInput.focus();
}

function closeAddModal() {
  UI.toggleModal(addModal, false);
}

function toggleTag(tag) {
  selectedTags = selectedTags.includes(tag)
    ? selectedTags.filter(t => t !== tag)
    : [...selectedTags, tag];
  UI.renderTagOptions(tagList, selectedTags, toggleTag);
}

function saveBookmark() {
  UI.clearError(urlError);
  UI.clearError(titleError);

  const url = urlInput.value.trim();
  const title = titleInput.value.trim();
  let hasError = false;

  if (!url) { UI.showError(urlError, 'URL is required'); hasError = true; }
  if (!title) { UI.showError(titleError, 'Title is required'); hasError = true; }
  if (hasError) return;

  try {
    Bookmarks.add({ url, title, tags: selectedTags, group: selectedGroup });
    closeAddModal();
    renderBookmarks();
    refreshSettingsLists();
    UI.showNotification('Bookmark added');
  } catch (err) {
    UI.showError(urlError, err.message);
  }
}

function openSettingsModal() {
  updateWallpaperPreview();
  refreshSettingsLists();
  refreshCustomizePanel();
  UI.toggleModal(settingsModal, true);
}

function closeSettings() {
  UI.toggleModal(settingsModal, false);
}

function refreshSettingsLists() {
  UI.renderBookmarksList(settingsBookmarksList, Bookmarks.getAll(), deleteBookmark);
  UI.renderGroupManager(groupManager, deleteGroup);
}

function deleteGroup(id) {
  Bookmarks.deleteGroup(id);
  renderBookmarks();
  refreshSettingsLists();
  UI.showNotification('Group deleted');
}

function addGroup() {
  const name = newGroupInput.value.trim();
  if (!name) return;
  Bookmarks.addGroup(name);
  newGroupInput.value = '';
  refreshSettingsLists();
  UI.showNotification('Group added');
}

function updateWallpaperPreview() {
  const url = Wallpaper.getPreviewUrl();
  wallpaperPreview.innerHTML = '';
  if (url) {
    const img = document.createElement('img');
    img.src = url;
    wallpaperPreview.appendChild(img);
  }
}

function applyWallpaperUrl() {
  const url = wallpaperInput.value.trim();
  if (!url) return UI.showNotification('Please enter a URL');
  if (Wallpaper.setFromUrl(url)) {
    setTimeout(() => { Wallpaper.apply(wallpaperContainer); updateWallpaperPreview(); }, 100);
    wallpaperInput.value = '';
    UI.showNotification('Wallpaper updated');
  } else {
    UI.showNotification('Invalid URL');
  }
}

function applyWallpaperFile(file) {
  if (!file) return;
  Wallpaper.setFromFile(file).then(success => {
    if (success) {
      Wallpaper.apply(wallpaperContainer);
      updateWallpaperPreview();
      wallpaperUpload.value = '';
      UI.showNotification('Wallpaper updated');
    } else {
      UI.showNotification('Failed to upload');
    }
  });
}

function resetWallpaper() {
  Wallpaper.reset();
  Wallpaper.apply(wallpaperContainer);
  updateWallpaperPreview();
  UI.showNotification('Wallpaper reset');
}

function exportData() {
  const blob = new Blob([JSON.stringify(Storage.exportData(), null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `manger-maki-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  UI.showNotification('Data exported');
}

function handleImport(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      Storage.importData(JSON.parse(e.target.result));
      renderFilters();
      renderBookmarks();
      refreshSettingsLists();
      UI.showNotification('Data imported');
    } catch {
      UI.showNotification('Failed to import');
    }
  };
  reader.readAsText(file);
}

function clearAllData() {
  if (!confirm('Delete all bookmarks, groups and settings?')) return;
  Storage.clearAll();
  syncTagsFromStorage();
  currentFilter = 'All';
  selectedTags = [];
  selectedGroup = null;
  renderFilters();
  renderBookmarks();
  Wallpaper.reset();
  Wallpaper.apply(wallpaperContainer);
  updateWallpaperPreview();
  applyCustomize();
  UI.showNotification('All data cleared');
}

// ── CUSTOMIZE ──────────────────────────────────────────────

function applyCustomize() {
  const c = Storage.getCustomize();
  const root = document.documentElement;
  root.style.setProperty('--bookmark-font-size', c.fontSize + 'px');
  root.style.setProperty('--bookmark-color', c.fontColor);
  root.style.setProperty('--bookmark-weight', c.fontWeight);
  root.style.setProperty('--bookmark-spacing', c.letterSpacing + 'px');
  root.style.setProperty('--column-count', c.columnCount);
  root.style.setProperty('--bookmark-padding', c.compactMode ? '3px' : '7px');
}

function saveCustomize(patch) {
  const current = Storage.getCustomize();
  Storage.saveCustomize({ ...current, ...patch });
  applyCustomize();
}

function refreshCustomizePanel() {
  const c = Storage.getCustomize();

  // Font size
  const fsSlider = $('custFontSize');
  const fsVal = $('custFontSizeVal');
  fsSlider.value = c.fontSize;
  fsVal.textContent = c.fontSize + 'px';

  // Font color
  const colorInput = $('custFontColor');
  // Only set if it's a hex value (color input doesn't support rgba)
  if (c.fontColor.startsWith('#')) colorInput.value = c.fontColor;
  updateSwatchActive(c.fontColor);

  // Font weight
  setToggleActive('custFontWeight', c.fontWeight);

  // Letter spacing
  const lsSlider = $('custSpacing');
  const lsVal = $('custSpacingVal');
  lsSlider.value = c.letterSpacing;
  lsVal.textContent = parseFloat(c.letterSpacing).toFixed(1) + 'px';

  // Columns
  setToggleActive('custColumns', String(c.columnCount));

  // Compact mode
  setToggleActive('custCompact', String(c.compactMode));

  // Tag pills
  renderCustTagPills();
}

function setToggleActive(groupId, val) {
  const group = $(groupId);
  if (!group) return;
  group.querySelectorAll('.cust-toggle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.val === val);
  });
}

function updateSwatchActive(color) {
  document.querySelectorAll('.cust-swatch').forEach(sw => {
    sw.classList.toggle('active', sw.dataset.color === color);
  });
}

function renderCustTagPills() {
  const container = $('custTagPills');
  if (!container) return;
  container.innerHTML = '';
  Storage.getTags().forEach(tag => {
    const pill = document.createElement('span');
    pill.className = 'cust-tag-pill';
    pill.innerHTML = `${tag}<button class="cust-tag-pill-del" title="Remove tag">✕</button>`;
    pill.querySelector('.cust-tag-pill-del').onclick = () => {
      deleteCustomTag(tag);
    };
    container.appendChild(pill);
  });
}

function deleteCustomTag(tag) {
  Storage.deleteTag(tag);
  syncTagsFromStorage();
  // If the deleted tag was the active filter, reset to 'All' to avoid empty-state bug
  if (currentFilter === tag) {
    currentFilter = 'All';
    window._currentFilter = 'All';
  }
  renderFilters();
  renderBookmarks();
  renderCustTagPills();
  UI.showNotification('Tag removed');
}

function addCustomTag() {
  const input = $('custNewTagInput');
  const errorEl = $('custTagError');
  const val = input.value.trim().toLowerCase();
  UI.clearError(errorEl);

  if (!val) { UI.showError(errorEl, 'Tag name required'); return; }
  if (val.length > 20) { UI.showError(errorEl, 'Max 20 characters'); return; }
  const current = Storage.getTags();
  if (current.includes(val)) { UI.showError(errorEl, 'Tag already exists'); return; }
  if (current.length >= 30) { UI.showError(errorEl, 'Max 30 tags'); return; }

  Storage.addTag(val);
  input.value = '';
  syncTagsFromStorage();
  renderFilters();
  renderCustTagPills();
  UI.showNotification('Tag added');
}

function attachEventListeners() {
  $('addBtn').onclick = openAddModal;
  $('addBookmarkBtn').onclick = openAddModal;
  $('closeAddModal').onclick = closeAddModal;
  $('cancelAddBtn').onclick = closeAddModal;
  $('saveBookmarkBtn').onclick = saveBookmark;
  addModal.onclick = e => { if (e.target === addModal) closeAddModal(); };

  $('settingsBtn').onclick = openSettingsModal;
  $('closeSettingsModal').onclick = closeSettings;
  $('closeSettingsBtn').onclick = closeSettings;
  settingsModal.onclick = e => { if (e.target === settingsModal) closeSettings(); };

  wallpaperInput.onkeypress = e => { if (e.key === 'Enter') applyWallpaperUrl(); };
  $('applyWallpaperBtn').onclick = applyWallpaperUrl;
  wallpaperUpload.onchange = e => applyWallpaperFile(e.target.files[0]);
  $('resetWallpaperBtn').onclick = resetWallpaper;

  $('exportBtn').onclick = exportData;
  $('importBtn').onclick = () => importFile.click();
  importFile.onchange = e => handleImport(e.target.files[0]);
  $('clearBtn').onclick = clearAllData;

  $('addGroupBtn').onclick = addGroup;
  newGroupInput.onkeypress = e => { if (e.key === 'Enter') addGroup(); };

  // Customize — Typography
  $('custFontSize').oninput = e => {
    $('custFontSizeVal').textContent = e.target.value + 'px';
    saveCustomize({ fontSize: Number(e.target.value) });
  };

  $('custFontColor').oninput = e => {
    updateSwatchActive(e.target.value);
    saveCustomize({ fontColor: e.target.value });
  };

  document.querySelectorAll('.cust-swatch').forEach(sw => {
    sw.onclick = () => {
      const color = sw.dataset.color;
      // Attempt to sync color picker if hex
      if (color.startsWith('#')) $('custFontColor').value = color;
      updateSwatchActive(color);
      saveCustomize({ fontColor: color });
    };
  });

  $('custFontWeight').querySelectorAll('.cust-toggle-btn').forEach(btn => {
    btn.onclick = () => {
      setToggleActive('custFontWeight', btn.dataset.val);
      saveCustomize({ fontWeight: btn.dataset.val });
    };
  });

  $('custSpacing').oninput = e => {
    const v = parseFloat(e.target.value);
    $('custSpacingVal').textContent = v.toFixed(1) + 'px';
    saveCustomize({ letterSpacing: v });
  };

  // Customize — Tags
  $('custAddTagBtn').onclick = addCustomTag;
  $('custNewTagInput').onkeypress = e => { if (e.key === 'Enter') addCustomTag(); };

  // Customize — Layout
  $('custColumns').querySelectorAll('.cust-toggle-btn').forEach(btn => {
    btn.onclick = () => {
      setToggleActive('custColumns', btn.dataset.val);
      saveCustomize({ columnCount: Number(btn.dataset.val) });
      renderBookmarks();
    };
  });

  $('custCompact').querySelectorAll('.cust-toggle-btn').forEach(btn => {
    btn.onclick = () => {
      const isOn = btn.dataset.val === 'true';
      setToggleActive('custCompact', btn.dataset.val);
      saveCustomize({ compactMode: isOn });
    };
  });

  document.onkeydown = e => {
    if (e.key === 'Escape') { closeAddModal(); closeSettings(); }
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      addModal.classList.contains('active') ? closeAddModal() : openAddModal();
    }
  };
}

document.addEventListener('DOMContentLoaded', init);