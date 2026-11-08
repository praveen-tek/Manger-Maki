import { defineConfig } from 'wxt';

// See https://wxt.dev/api/reference/wxt/interfaces/inlineconfig.html
export default defineConfig({
  manifest: {
    name: 'Manger-Maki',
    description: 'A minimal new tab extension for managing bookmarks across multiple interests. Tag-based filtering, terminal-style UI, zero clutter.',
    version: '1.0.0',
    permissions: [
      'storage',
      'unlimitedStorage',
      'tabs',
      'activeTab',
    ],
    action: {
      default_title: 'Manger-Maki — Add Bookmark',
    },
    browser_specific_settings: {
      gecko: {
        id: 'manger-maki@praveen.dev',
        strict_min_version: '109.0',
      },
    },
  },
  webExt: {
    binaries: {
      chrome: process.env.CHROME_PATH || '/usr/bin/brave-origin',
    },
  },
});
