export interface Bookmark {
  id: number;
  title: string;
  url: string;
  tags: string[];
  group: string | null;
}

export interface Group {
  id: string;
  name: string;
}

export interface Wallpaper {
  type: 'gradient' | 'url' | 'upload';
  value: string;
}

export interface CustomizeConfig {
  fontSize: number;
  fontColor: string;
  fontWeight: 'normal' | 'bold';
  letterSpacing: number;
  columnCount: number;
  compactMode: boolean;
  textTransform: 'uppercase' | 'lowercase' | 'none';
  showFavicons: boolean;
}

export interface RecentVisit {
  url: string;
  title: string;
  timestamp: number;
}

export interface ExportData {
  bookmarks: Bookmark[];
  wallpaper: Wallpaper;
  groups: Group[];
  tags?: string[];
  customize?: CustomizeConfig;
  starred?: number[];
  recent?: RecentVisit[];
  exportedAt: string;
}
