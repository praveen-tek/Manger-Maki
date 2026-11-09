import { Storage } from './storage';
import type { Bookmark, Group } from './types';

export const Bookmarks = {
  getAll(): Bookmark[] {
    return Storage.getBookmarks();
  },

  getByTag(tag: string): Bookmark[] {
    const all = this.getAll();
    if (!tag || tag === 'All') return all;
    return all.filter((b) => b.tags?.includes(tag));
  },

  getTags(): string[] {
    return Storage.getTags();
  },

  getGroups(): Group[] {
    return Storage.getGroups();
  },

  async add(data: {
    title: string;
    url: string;
    tags?: string[];
    group?: string | null;
  }): Promise<Bookmark> {
    const title = data.title?.trim();
    const url = data.url?.trim();

    if (!title || !url) {
      throw new Error('URL and Title are required');
    }

    try {
      new URL(url);
    } catch {
      throw new Error('Invalid URL');
    }

    return Storage.addBookmark({
      title,
      url,
      tags: data.tags || [],
      group: data.group || null,
    });
  },

  async delete(id: number): Promise<boolean> {
    return Storage.deleteBookmark(id);
  },

  async addGroup(name: string): Promise<Group> {
    return Storage.addGroup(name);
  },

  async deleteGroup(id: string): Promise<boolean> {
    return Storage.deleteGroup(id);
  },
};
