# Manger-Maki (WXT Extension)

A minimal, terminal-inspired new tab and bookmark manager extension built with [WXT](https://wxt.dev/) and TypeScript.

## Priorities & Highlights

- **Ultra-Small Size & Fast Performance**: Zero framework bloat (no React or heavy virtual-DOM runtimes). Total built extension is ~105 kB (with 30 kB being multi-resolution icon assets).
- **Official Phosphor Icons**: Zero emojis. Uses pixel-perfect SVGs from [Phosphor Icons](https://phosphoricons.com/).
- **Responsive & Minimalist**: Monospace typography, subtle transparency, dark terminal aesthetic, responsive masonry and grid layouts.
- **Cross-Browser MV3**: Supports Chrome, Brave, Edge, and Firefox.
- **Reactive Sync**: Real-time cross-tab updates using `browser.storage.local` with automatic migration from older `localStorage` installs.

## Development

```bash
# Install dependencies
pnpm install

# Start development server with live reload in Chrome
pnpm dev

# Start development server in Firefox
pnpm dev:firefox
```

## Build

```bash
# Build for Chrome (MV3)
pnpm build

# Build for Firefox
pnpm build:firefox

# Create distribution zip
pnpm zip
```

## Project Structure

```
wxt/
├── entrypoints/
│   ├── background.ts          # Minimal service worker
│   ├── newtab/                # New tab override entrypoint
│   │   ├── index.html
│   │   └── main.ts
│   └── popup/                 # Action popup entrypoint
│       ├── index.html
│       └── main.ts
├── src/
│   ├── types.ts               # Core TypeScript models
│   ├── icons.ts               # Phosphor Icons SVG helpers
│   ├── storage.ts             # Reactive browser.storage.local wrapper
│   ├── bookmarks.ts           # Bookmark filtering & manipulation
│   ├── wallpaper.ts           # Background wallpaper management
│   └── styles/
│       ├── base.css           # Theme variables & reset
│       ├── newtab.css         # New tab responsive styles & modals
│       └── popup.css          # Popup styles
├── public/
│   └── icon/                  # Extension icons (16, 32, 48, 96, 128)
├── package.json
├── tsconfig.json
└── wxt.config.ts              # WXT build configuration & manifest
```
