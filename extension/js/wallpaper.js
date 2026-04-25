const Wallpaper = {
  isVideo(url) {
    if (!url) return false;
    return !!(url.match(/\.(mp4|webm|ogg)(\?.*)?$/i) || url.startsWith('data:video/'));
  },

  apply(container) {
    const wallpaper = Storage.getWallpaper();
    const existingImgs = container.querySelectorAll('img, video');
    existingImgs.forEach(el => el.remove());

    if (wallpaper.type === 'gradient') {
      container.style.background = wallpaper.value;
    } else {
      const isVideo = this.isVideo(wallpaper.value);
      if (isVideo) {
        const vid = document.createElement('video');
        vid.src = wallpaper.value;
        vid.autoplay = true;
        vid.loop = true;
        vid.muted = true;
        vid.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:0;pointer-events:none;';
        vid.onerror = () => {
          vid.remove();
          container.style.background = 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)';
        };
        container.appendChild(vid);
        container.style.background = 'transparent';
      } else {
        const img = document.createElement('img');
        img.src = wallpaper.value;
        img.alt = '';
        img.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:0;';
        img.onerror = () => {
          img.remove();
          container.style.background = 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)';
        };
        container.appendChild(img);
        container.style.background = 'transparent';
      }
    }
  },

  setFromUrl(url) {
    if (!url) return false;
    try { new URL(url); } catch { return false; }
    Storage.saveWallpaper({ type: 'url', value: url });
    return true;
  },

  setFromFile(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        Storage.saveWallpaper({ type: 'upload', value: e.target.result });
        resolve(true);
      };
      reader.onerror = () => resolve(false);
      reader.readAsDataURL(file);
    });
  },

  reset() {
    Storage.saveWallpaper({ type: 'gradient', value: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)' });
  },

  getPreviewUrl() {
    const w = Storage.getWallpaper();
    return (w.type === 'url' || w.type === 'upload') ? w.value : null;
  },
};