import '../../src/styles/popup.css';
import { Storage } from '../../src/storage';
import { getIconSvg } from '../../src/icons';
import { browser } from 'wxt/browser';

const selectedTags = new Set<string>();

const urlInput = document.getElementById('popupUrl') as HTMLInputElement;
const titleInput = document.getElementById('popupTitle') as HTMLInputElement;
const tagGrid = document.getElementById('popupTagGrid') as HTMLDivElement;
const groupSelect = document.getElementById('popupGroup') as HTMLSelectElement;
const saveBtn = document.getElementById('popupSaveBtn') as HTMLButtonElement;
const statusText = document.getElementById('popupStatus') as HTMLSpanElement;

function renderTags() {
  const tags = Storage.getTags();
  if (!tags.length) {
    tagGrid.innerHTML = '<div class="tags-empty">No tags defined</div>';
    return;
  }

  const frag = document.createDocumentFragment();
  for (const tag of tags) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `tag-btn${selectedTags.has(tag) ? ' selected' : ''}`;
    btn.textContent = tag;
    btn.title = tag;
    btn.dataset.tag = tag;
    frag.appendChild(btn);
  }
  tagGrid.replaceChildren(frag);
}

function renderGroups() {
  const groups = Storage.getGroups();
  groupSelect.length = 1;

  if (groups.length > 0) {
    const frag = document.createDocumentFragment();
    for (const group of groups) {
      const opt = document.createElement('option');
      opt.value = group.id;
      opt.textContent = group.name;
      frag.appendChild(opt);
    }
    groupSelect.appendChild(frag);
  }
}

function showStatus(msg: string, isError = false) {
  const icon = isError ? getIconSvg('x', { size: 12 }) : getIconSvg('check', { size: 12 });
  statusText.innerHTML = `${icon} ${msg}`;
  statusText.classList.toggle('error', isError);
  statusText.classList.add('show');
}

function clearStatus() {
  statusText.classList.remove('show', 'error');
  statusText.innerHTML = '';
}

async function saveBookmark() {
  let url = urlInput.value.trim();
  const title = titleInput.value.trim();
  const group = groupSelect.value || null;

  if (!url) {
    showStatus('URL REQUIRED', true);
    urlInput.focus();
    return;
  }
  if (!title) {
    showStatus('TITLE REQUIRED', true);
    titleInput.focus();
    return;
  }

  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  try {
    new URL(url);
  } catch {
    showStatus('INVALID URL', true);
    urlInput.focus();
    return;
  }

  saveBtn.disabled = true;

  try {
    await Storage.addBookmark({
      title,
      url,
      tags: Array.from(selectedTags),
      group,
    });

    showStatus('SAVED');
    setTimeout(() => {
      window.close();
    }, 450);
  } catch {
    saveBtn.disabled = false;
    showStatus('SAVE FAILED', true);
  }
}

async function queryActiveTab(): Promise<{ url?: string; title?: string } | null> {
  try {
    if (browser.tabs?.query) {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        return {
          url: tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('about:') ? tab.url : undefined,
          title: tab.title || undefined,
        };
      }
    }
  } catch (err) {
    console.warn('Could not query active tab', err);
  }
  return null;
}

function wireEventListeners() {
  // Event delegation on tag grid
  tagGrid.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.tag-btn');
    if (!btn?.dataset.tag) return;
    const tag = btn.dataset.tag;
    if (selectedTags.has(tag)) {
      selectedTags.delete(tag);
      btn.classList.remove('selected');
    } else {
      selectedTags.add(tag);
      btn.classList.add('selected');
    }
  });

  saveBtn.addEventListener('click', saveBookmark);
  urlInput.addEventListener('input', clearStatus, { passive: true });
  titleInput.addEventListener('input', clearStatus, { passive: true });

  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveBookmark();
    }
  });

  titleInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveBookmark();
    }
  });

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      saveBookmark();
    } else if (e.key === 'Escape') {
      window.close();
    }
  });
}

async function init() {
  // Query tab info and initialize storage in parallel
  const [_, tab] = await Promise.all([Storage.init(), queryActiveTab()]);

  renderTags();
  renderGroups();

  if (tab) {
    if (tab.url) urlInput.value = tab.url;
    if (tab.title) titleInput.value = tab.title;
    titleInput.select();
  }

  wireEventListeners();
}

document.addEventListener('DOMContentLoaded', init);
