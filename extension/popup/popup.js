// ── State ─────────────────────────────────────────────────────
let selectedTags = [];

// ── DOM refs ──────────────────────────────────────────────────
const urlInput    = document.getElementById('popupUrl');
const titleInput  = document.getElementById('popupTitle');
const tagGrid     = document.getElementById('popupTagGrid');
const groupSelect = document.getElementById('popupGroup');
const saveBtn     = document.getElementById('popupSaveBtn');
const statusText  = document.getElementById('popupStatus');

// ── Render tag grid ───────────────────────────────────────────
function renderTags() {
  const tags = Storage.getTags();
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

// ── Render groups ─────────────────────────────────────────────
function renderGroups() {
  const groups = Storage.getGroups();
  groups.forEach(group => {
    const option = document.createElement('option');
    option.value = group.id;
    option.textContent = group.name;
    groupSelect.appendChild(option);
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
  const group = groupSelect.value || null;

  if (!url)   { showStatus('URL REQUIRED', true); return; }
  if (!title) { showStatus('TITLE REQUIRED', true); return; }

  // Basic URL validation
  try { new URL(url); } catch { showStatus('INVALID URL', true); return; }

  Storage.addBookmark({ 
    title, 
    url, 
    tags: [...selectedTags], 
    group 
  });

  saveBtn.disabled = true;
  showStatus('SAVED');
  setTimeout(() => window.close(), 1000);
}

// ── Pre-fill URL + Title from active tab ──────────────────────
if (chrome && chrome.tabs) {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab) return;
    if (tab.url)   urlInput.value   = tab.url;
    if (tab.title) titleInput.value = tab.title;
    // Select title text after fill so user can immediately retype it
    titleInput.select();
  });
}

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
renderGroups();
