import '../../src/styles/popup.css';
import { Storage } from '../../src/storage';
import { getIconSvg } from '../../src/icons';
import { browser } from 'wxt/browser';

let selectedTags: string[] = [];

const urlInput = document.getElementById('popupUrl') as HTMLInputElement;
const titleInput = document.getElementById('popupTitle') as HTMLInputElement;
const tagGrid = document.getElementById('popupTagGrid') as HTMLDivElement;
const groupSelect = document.getElementById('popupGroup') as HTMLSelectElement;
const saveBtn = document.getElementById('popupSaveBtn') as HTMLButtonElement;
const statusText = document.getElementById('popupStatus') as HTMLSpanElement;
const headerTitle = document.getElementById('headerTitle') as HTMLSpanElement;

// Add Phosphor icon to header and save button
if (headerTitle) {
  headerTitle.innerHTML = `${getIconSvg('tag', { size: 14 })} Add Bookmark`;
}
if (saveBtn) {
  saveBtn.innerHTML = `${getIconSvg('plus', { size: 13 })} Save`;
}

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

  tags.forEach((tag) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `tag-btn ${selectedTags.includes(tag) ? 'selected' : ''}`;
    btn.textContent = tag;
    btn.title = tag;
    btn.onclick = () => {
      if (selectedTags.includes(tag)) {
        selectedTags = selectedTags.filter((t) => t !== tag);
        btn.classList.remove('selected');
      } else {
        selectedTags.push(tag);
        btn.classList.add('selected');
      }
    };
    tagGrid.appendChild(btn);
  });
}

function renderGroups() {
  const groups = Storage.getGroups();
  // Clear any existing options beyond "None"
  while (groupSelect.options.length > 1) {
    groupSelect.remove(1);
  }

  groups.forEach((group) => {
    const option = document.createElement('option');
    option.value = group.id;
    option.textContent = group.name;
    groupSelect.appendChild(option);
  });
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

  // Prepend https:// if protocol is missing
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
      tags: [...selectedTags],
      group,
    });

    showStatus('SAVED');
    setTimeout(() => {
      window.close();
    }, 600);
  } catch {
    saveBtn.disabled = false;
    showStatus('SAVE FAILED', true);
  }
}

async function prefillActiveTab() {
  try {
    if (browser.tabs?.query) {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('about:')) {
          urlInput.value = tab.url;
        }
        if (tab.title) {
          titleInput.value = tab.title;
        }
        titleInput.select();
      }
    }
  } catch (err) {
    console.warn('Could not query active tab', err);
  }
}

function wireEventListeners() {
  saveBtn.addEventListener('click', saveBookmark);
  urlInput.addEventListener('input', clearStatus);
  titleInput.addEventListener('input', clearStatus);

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
    }
    if (e.key === 'Escape') {
      window.close();
    }
  });
}

async function init() {
  await Storage.init();
  renderTags();
  renderGroups();
  await prefillActiveTab();
  wireEventListeners();
}

document.addEventListener('DOMContentLoaded', init);
