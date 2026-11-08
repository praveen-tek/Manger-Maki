import { Storage } from '../src/storage';

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(async () => {
    // Ensure default bookmarks, tags, and settings are seeded in browser.storage.local
    await Storage.init();
  });
});
