// ── Constants ────────────────────────────────────────────────
const BOOKMARKS_KEY = 'minimal_tab_bookmarks';
const TAGS_KEY      = 'minimal_tab_tags';

const DEFAULT_TAGS = [
  'news', 'ui', 'robotics', 'open-media', 'research',
  'tools', 'ai', 'design', 'dev', 'productivity', 'social',
  'entertainment', 'education', 'business', 'health',
];

// ── State ─────────────────────────────────────────────────────
let selectedTags = [];

// ── DOM refs ──────────────────────────────────────────────────
const urlInput    = document.getElementById('popupUrl');
const titleInput  = document.getElementById('popupTitle');
const tagGrid     = document.getElementById('popupTagGrid');
const saveBtn     = document.getElementById('popupSaveBtn');
const statusText  = document.getElementById('popupStatus');

// ── Helpers ───────────────────────────────────────────────────
function getStoredTags() {
  try {
    const raw = localStorage.getItem(TAGS_KEY);
    return raw ? JSON.parse(raw) : [...DEFAULT_TAGS];
  } catch {
    return [...DEFAULT_TAGS];
  }
}

function getStoredBookmarks() {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBookmarks(bookmarks) {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
}

// ── Render tag grid ───────────────────────────────────────────
function renderTags() {
  const tags = getStoredTags();
  tagGrid.innerHTML = '';

  if (!tags.length) {
    const empty = document.createElement('div');
    empty.className = 'tags-empty';
    empty.textContent = 'No tags defined';
    tagGrid.appendChild(empty);
    return;
  }

  tags.forEach(tag => {
    const btn = document.createElement('button');
    btn.className = 'tag-btn';
    btn.textContent = tag;
    btn.title = tag;
    btn.onclick = () => {
      if (selectedTags.includes(tag)) {
        selectedTags = selectedTags.filter(t => t !== tag);
        btn.classList.remove('selected');
      } else {
        selectedTags.push(tag);
        btn.classList.add('selected');
      }
    };
    tagGrid.appendChild(btn);
  });
}

// ── Show status message ───────────────────────────────────────
function showStatus(msg, isError = false) {
  statusText.textContent = msg;
  statusText.classList.toggle('error', isError);
  statusText.classList.add('show');
}

function clearStatus() {
  statusText.classList.remove('show', 'error');
}

// ── Save bookmark ─────────────────────────────────────────────
function saveBookmark() {
  const url   = urlInput.value.trim();
  const title = titleInput.value.trim();

  if (!url)   { showStatus('URL REQUIRED', true); return; }
  if (!title) { showStatus('TITLE REQUIRED', true); return; }

  // Basic URL validation
  try { new URL(url); } catch { showStatus('INVALID URL', true); return; }

  const bookmarks = getStoredBookmarks();
  const id = Date.now();
  bookmarks.push({ id, title, url, tags: [...selectedTags], group: null });
  saveBookmarks(bookmarks);

  saveBtn.disabled = true;
  showStatus('SAVED');
  setTimeout(() => window.close(), 1000);
}

// ── Pre-fill URL + Title from active tab ──────────────────────
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab) return;
  if (tab.url)   urlInput.value   = tab.url;
  if (tab.title) titleInput.value = tab.title;
  // Select title text after fill so user can immediately retype it
  titleInput.select();
});

// ── Wire up ───────────────────────────────────────────────────
saveBtn.addEventListener('click', saveBookmark);

urlInput.addEventListener('input', clearStatus);
titleInput.addEventListener('input', clearStatus);

// Ctrl+Enter to save
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    saveBookmark();
  }
  if (e.key === 'Escape') window.close();
});

// ── Init ──────────────────────────────────────────────────────
renderTags();
