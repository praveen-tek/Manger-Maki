const UI = {
  renderFilters(container, activeFilter, onFilterChange) {
    container.innerHTML = '';
    ['All', ...Bookmarks.getTags()].forEach(tag => {
      const btn = document.createElement('button');
      btn.className = `filter-pill ${activeFilter === tag ? 'active' : ''}`;
      btn.textContent = tag;
      btn.onclick = () => onFilterChange(tag);
      container.appendChild(btn);
    });
  },

  renderBookmarks(container, bookmarks, onDelete, onStar) {
    container.innerHTML = '';
    if (!bookmarks.length) return;

    const activeTag = window._currentFilter;

    // Single tag filter - show in 4-column grid without headers
    if (activeTag && activeTag !== 'All') {
      const grid = document.createElement('div');
      grid.className = 'bookmarks-grid';
      bookmarks.forEach(bookmark => {
        grid.appendChild(this._makeBookmarkElement(bookmark, onDelete, onStar));
      });
      container.appendChild(grid);
      return;
    }

    // Masonry layout for "All" view
    this._renderMasonry(container, bookmarks, onDelete, onStar);
  },

  _renderMasonry(container, bookmarks, onDelete, onStar) {
    const masonryContainer = document.createElement('div');
    masonryContainer.className = 'masonry-container';

    // Initialize 4 columns
    const columns = [[], [], [], []];
    let columnHeights = [0, 0, 0, 0];

    // Get starred bookmarks
    const starred = Storage.getStarred();
    const recent = Storage.getRecent();

    // Add RECENT section to column 0 if exists
    if (recent.length > 0) {
      const recentHeight = 24 + (recent.length * 18) + 8; // header + items + gap
      columns[0].push({ type: 'recent', items: recent });
      columnHeights[0] += recentHeight;
    }

    // Add STARRED section to column 0 if exists
    const starredBookmarks = bookmarks.filter(b => starred.includes(b.id));
    if (starredBookmarks.length > 0) {
      const starredHeight = 24 + (starredBookmarks.length * 18) + 8;
      columns[0].push({ type: 'starred', items: starredBookmarks });
      columnHeights[0] += starredHeight;
    }

    // Group remaining bookmarks by tag
    const tagOrder = Bookmarks.getTags();
    const seen = new Set();
    const byTag = {};

    bookmarks.forEach(b => {
      // Skip if already in starred
      if (starred.includes(b.id)) return;

      const tags = b.tags && b.tags.length ? b.tags : ['_none'];
      tags.forEach(t => {
        if (!byTag[t]) byTag[t] = [];
        if (!seen.has(b.id + t)) {
          byTag[t].push(b);
          seen.add(b.id + t);
        }
      });
    });

    const orderedTags = tagOrder.filter(t => byTag[t] && byTag[t].length);
    if (byTag['_none'] && byTag['_none'].length) orderedTags.push('_none');

    // Distribute tag groups greedily to shortest column
    orderedTags.forEach(tag => {
      const items = byTag[tag];
      if (!items || !items.length) return;

      const groupHeight = 24 + (items.length * 18) + 8; // header + items + gap
      const shortestIdx = columnHeights.indexOf(Math.min(...columnHeights));
      
      columns[shortestIdx].push({ type: 'tag', tag, items });
      columnHeights[shortestIdx] += groupHeight;
    });

    // Render columns
    columns.forEach((col, idx) => {
      const colEl = document.createElement('div');
      colEl.className = 'masonry-column';

      col.forEach(section => {
        if (section.type === 'recent') {
          colEl.appendChild(this._makeRecentSection(section.items, onStar, onDelete));
        } else if (section.type === 'starred') {
          colEl.appendChild(this._makeStarredSection(section.items, onDelete, onStar));
        } else if (section.type === 'tag') {
          colEl.appendChild(this._makeTagSection(section.tag, section.items, onDelete, onStar));
        }
      });

      masonryContainer.appendChild(colEl);
    });

    container.appendChild(masonryContainer);
  },

  _makeRecentSection(items, onStar, onClearRecent) {
    const section = document.createElement('div');
    section.className = 'group-section';

    const header = document.createElement('div');
    header.className = 'group-header';
    header.innerHTML = `
      <span class="group-name">RECENT</span>
      <button class="recent-clear-btn" title="Clear recent history">CLEAR</button>
    `;
    header.querySelector('.recent-clear-btn').onclick = (e) => {
      e.stopPropagation();
      Storage.clearRecent();
      if (onClearRecent) onClearRecent();
    };
    section.appendChild(header);

    const list = document.createElement('div');
    list.className = 'bookmark-list';
    items.forEach(item => {
      const a = document.createElement('a');
      a.href = item.url;
      a.className = 'bookmark';
      let hostname = '';
      try { hostname = new URL(item.url).hostname; } catch(e) {}
      const faviconHTML = hostname ? `<img class="bookmark-favicon" src="https://www.google.com/s2/favicons?domain=${hostname}&sz=32" alt="" loading="lazy">` : '';
      a.innerHTML = `${faviconHTML}<span class="bookmark-label">${item.title}</span>`;
      list.appendChild(a);
    });
    section.appendChild(list);

    return section;
  },

  _makeStarredSection(items, onDelete, onStar) {
    const section = document.createElement('div');
    section.className = 'group-section';

    const header = document.createElement('div');
    header.className = 'group-header';
    header.innerHTML = '<span class="group-name">STARRED</span>';
    section.appendChild(header);

    const list = document.createElement('div');
    list.className = 'bookmark-list';
    items.forEach(bookmark => {
      list.appendChild(this._makeBookmarkElement(bookmark, onDelete, onStar, true));
    });
    section.appendChild(list);

    return section;
  },

  _makeTagSection(tag, items, onDelete, onStar) {
    const section = document.createElement('div');
    section.className = 'group-section';

    const header = document.createElement('div');
    header.className = 'group-header';
    header.innerHTML = `<span class="group-name">${tag === '_none' ? 'OTHER' : tag}</span>`;
    section.appendChild(header);

    const list = document.createElement('div');
    list.className = 'bookmark-list';
    items.forEach(bookmark => {
      list.appendChild(this._makeBookmarkElement(bookmark, onDelete, onStar));
    });
    section.appendChild(list);

    return section;
  },

  _makeBookmarkElement(bookmark, onDelete, onStar, isStarred = false) {
    const a = document.createElement('a');
    a.href = bookmark.url;
    a.className = 'bookmark';

    // SVG kebab (three vertical dots) icon
    const menuSVG = `<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7" cy="2" r="1.4"/>
      <circle cx="7" cy="7" r="1.4"/>
      <circle cx="7" cy="12" r="1.4"/>
    </svg>`;

    let hostname = '';
    try { hostname = new URL(bookmark.url).hostname; } catch(e) {}
    const faviconHTML = hostname ? `<img class="bookmark-favicon" src="https://www.google.com/s2/favicons?domain=${hostname}&sz=32" alt="" loading="lazy">` : '';

    a.innerHTML = `
      ${faviconHTML}
      <span class="bookmark-label">${bookmark.title}</span>
      <button class="bookmark-menu" title="Options">${menuSVG}</button>
    `;

    a.querySelector('.bookmark-menu').onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this._showBookmarkMenu(e, bookmark, onDelete, onStar);
    };

    // Track visit on click
    a.onclick = (e) => {
      Storage.addVisit(bookmark.url, bookmark.title);
    };

    return a;
  },

  _showBookmarkMenu(event, bookmark, onDelete, onStar) {
    // Close any existing menu
    const existing = document.querySelector('.bookmark-context-menu');
    if (existing) existing.remove();

    const isStarred = Storage.isStarred(bookmark.id);
    const menu = document.createElement('div');
    menu.className = 'bookmark-context-menu';

    const starItem = document.createElement('button');
    starItem.className = 'context-menu-item';
    starItem.textContent = isStarred ? '✩ UNSTAR' : '★ STAR';
    starItem.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      Storage.toggleStar(bookmark.id);
      onStar();
      menu.remove();
    };

    const deleteItem = document.createElement('button');
    deleteItem.className = 'context-menu-item';
    deleteItem.textContent = '✕ REMOVE';
    deleteItem.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (confirm(`Delete "${bookmark.title}"?`)) onDelete(bookmark.id);
      menu.remove();
    };

    menu.appendChild(starItem);
    menu.appendChild(deleteItem);

    // Position near cursor
    const rect = event.target.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.left = (rect.right - 80) + 'px';
    menu.style.top = (rect.bottom + 4) + 'px';
    menu.style.zIndex = '2000';

    document.body.appendChild(menu);

    // Close on outside click
    const closeMenu = (e) => {
      if (!menu.contains(e.target) && e.target !== event.target) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };
    document.addEventListener('click', closeMenu);
  },

  renderTagOptions(container, selectedTags, onTagChange) {
    container.innerHTML = '';
    container.className = 'tag-grid';
    Bookmarks.getTags().forEach(tag => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `tag-option ${selectedTags.includes(tag) ? 'selected' : ''}`;
      btn.textContent = tag;
      btn.onclick = () => onTagChange(tag);
      container.appendChild(btn);
    });
  },

  renderGroupOptions(container, selectedGroup, onGroupChange) {
    container.innerHTML = '';
    const groups = Bookmarks.getGroups();
    if (!groups.length) {
      container.innerHTML = '<div style="opacity:0.4;font-size:11px;font-family:Courier New,monospace;">No groups yet. Create one in settings.</div>';
      return;
    }

    const noneBtn = document.createElement('button');
    noneBtn.type = 'button';
    noneBtn.className = `tag-option ${!selectedGroup ? 'selected' : ''}`;
    noneBtn.textContent = 'none';
    noneBtn.onclick = () => onGroupChange(null);
    container.appendChild(noneBtn);

    groups.forEach(group => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `tag-option ${selectedGroup === group.id ? 'selected' : ''}`;
      btn.textContent = group.name;
      btn.onclick = () => onGroupChange(group.id);
      container.appendChild(btn);
    });
  },

  renderBookmarksList(container, bookmarks, onDelete) {
    container.innerHTML = '';
    container.className = 'settings-bookmarks-list';
    if (!bookmarks.length) {
      container.innerHTML = '<div style="opacity:0.4;text-align:center;padding:16px;font-size:11px;font-family:Courier New,monospace;text-transform:uppercase;letter-spacing:1px;">No bookmarks yet</div>';
      return;
    }
    bookmarks.forEach(bookmark => {
      const div = document.createElement('div');
      div.className = 'bookmark-item';
      div.innerHTML = `
        <div class="bookmark-item-info">
          <div class="bookmark-item-details">
            <div class="bookmark-item-title">${bookmark.title}</div>
            <div class="bookmark-item-url">${bookmark.url}</div>
          </div>
        </div>
        <button class="bookmark-item-delete" title="Delete">✕</button>
      `;
      div.querySelector('.bookmark-item-delete').onclick = () => {
        if (confirm(`Delete "${bookmark.title}"?`)) onDelete(bookmark.id);
      };
      container.appendChild(div);
    });
  },

  renderGroupManager(container, onDeleteGroup) {
    container.innerHTML = '';
    container.className = 'group-manager';
    const groups = Bookmarks.getGroups();
    if (!groups.length) {
      container.innerHTML = '<div style="opacity:0.4;font-size:11px;font-family:Courier New,monospace;padding:8px 0;">No groups yet</div>';
    } else {
      groups.forEach(group => {
        const row = document.createElement('div');
        row.className = 'group-row';
        row.innerHTML = `
          <span class="group-row-name">${group.name}</span>
          <button class="group-row-delete" title="Delete group">✕</button>
        `;
        row.querySelector('.group-row-delete').onclick = () => {
          if (confirm(`Delete group "${group.name}"? Bookmarks will be ungrouped.`)) onDeleteGroup(group.id);
        };
        container.appendChild(row);
      });
    }
  },

  showError(el, msg) {
    el.textContent = msg;
    el.classList.add('show');
  },

  clearError(el) {
    el.textContent = '';
    el.classList.remove('show');
  },

  showNotification(message, duration = 2500) {
    const n = document.createElement('div');
    n.className = 'notification';
    n.textContent = message;
    document.body.appendChild(n);
    setTimeout(() => {
      n.style.animation = 'slideOut 0.2s ease forwards';
      setTimeout(() => n.remove(), 200);
    }, duration);
  },

  toggleModal(modal, show) {
    modal.classList.toggle('active', show);
  },
};