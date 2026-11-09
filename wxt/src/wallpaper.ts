import { Storage, DEFAULT_WALLPAPER } from './storage';

let lastAppliedKey = '';

export const Wallpaper = {
  isVideo(url: string): boolean {
    if (!url) return false;
    return !!(url.match(/\.(mp4|webm|ogg)(\?.*)?$/i) || url.startsWith('data:video/'));
  },

  apply(container: HTMLElement): void {
    const wallpaper = Storage.getWallpaper();
    const key = `${wallpaper.type}:${wallpaper.value}`;

    // If already applied and media exists, skip expensive DOM reconstruction
    if (key === lastAppliedKey && (wallpaper.type === 'gradient' || container.children.length > 0)) {
      return;
    }
    lastAppliedKey = key;

    // Clean up previous video/image elements
    const existingMedia = container.querySelectorAll('img, video');
    existingMedia.forEach((el) => {
      if (el instanceof HTMLVideoElement) {
        el.pause();
        el.removeAttribute('src');
        el.load();
      }
      el.remove();
    });

    if (wallpaper.type === 'gradient') {
      container.style.background = wallpaper.value;
    } else {
      const isVid = this.isVideo(wallpaper.value);
      if (isVid) {
        const vid = document.createElement('video');
        vid.src = wallpaper.value;
        vid.autoplay = true;
        vid.loop = true;
        vid.muted = true;
        vid.playsInline = true;
        vid.style.cssText =
          'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:0;pointer-events:none;';
        vid.onerror = () => {
          vid.remove();
          container.style.background = DEFAULT_WALLPAPER.value;
          lastAppliedKey = `gradient:${DEFAULT_WALLPAPER.value}`;
        };
        container.appendChild(vid);
        container.style.background = 'transparent';
      } else {
        const img = document.createElement('img');
        img.src = wallpaper.value;
        img.alt = '';
        img.decoding = 'async';
        img.style.cssText =
          'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:0;pointer-events:none;';
        img.onerror = () => {
          img.remove();
          container.style.background = DEFAULT_WALLPAPER.value;
          lastAppliedKey = `gradient:${DEFAULT_WALLPAPER.value}`;
        };
        container.appendChild(img);
        container.style.background = 'transparent';
      }
    }
  },

  async setFromUrl(url: string): Promise<boolean> {
    if (!url) return false;
    try {
      new URL(url);
    } catch {
      return false;
    }
    await Storage.saveWallpaper({ type: 'url', value: url });
    return true;
  },

  setFromFile(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      if (!file) return resolve(false);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const value = e.target?.result as string;
        if (value) {
          await Storage.saveWallpaper({ type: 'upload', value });
          resolve(true);
        } else {
          resolve(false);
        }
      };
      reader.onerror = () => resolve(false);
      reader.readAsDataURL(file);
    });
  },

  async reset(): Promise<void> {
    await Storage.saveWallpaper({ ...DEFAULT_WALLPAPER });
  },

  getPreviewUrl(): string | null {
    const w = Storage.getWallpaper();
    return w.type === 'url' || w.type === 'upload' ? w.value : null;
  },
};
