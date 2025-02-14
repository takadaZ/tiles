import { mapMessagesPtoB } from './sw';
import { HeaderLeafs, Leafs } from './bookmarks';
import { AppMain } from './app-main';
import { Folders } from './folders';
import { HeaderHistory, History } from './history';
import { mapMessagesBtoP } from './popup';
import { HeaderTabs, Tabs } from './tabs';

export type StoredElements = {
  'app-main': AppMain,
  'header-leafs': HeaderLeafs,
  'body-leafs': Leafs,
  'body-folders': Folders,
  'header-tabs': HeaderTabs,
  'body-tabs': Tabs,
  'header-history': HeaderHistory,
  'body-history': History,
}

export type MapMessagesPtoB = typeof mapMessagesPtoB;
export type MapMessagesBtoP = typeof mapMessagesBtoP;

export const historyHtmlCount = 50;
export const pastMSec = 1000 * 60 * 60 * 24 * 365;

export type ColorInfo = {
  color: string;
  whiteness: number;
  chroma: number;
  vivid: number;
}

export const maxHeight = 570;

export const paneNames = ['leafs', 'tabs', 'histories', 'folders'] as const;

type PaneWidth = {
  name: (typeof paneNames)[number];
  width: number,
};

export type PaneLayouts = [PaneWidth, PaneWidth, PaneWidth][];

export const defaultWidthes: PaneLayouts = [
  [{ name: 'histories', width: 100 }, { name: 'tabs', width: 325 }, { name: 'leafs', width: 200 }],
  [{ name: 'histories', width: 100 }, { name: 'tabs', width: 325 }, { name: 'folders', width: 150 }],
  [{ name: 'tabs', width: 300 }, { name: 'histories', width: 175 }, { name: 'leafs', width: 175 }],
  [{ name: 'tabs', width: 300 }, { name: 'histories', width: 175 }, { name: 'folders', width: 130 }],
  [{ name: 'histories', width: 100 }, { name: 'leafs', width: 200 }, { name: 'folders', width: 150 }],
  [{ name: 'histories', width: 100 }, { name: 'folders', width: 150 }, { name: 'leafs', width: 200 }],
  [{ name: 'tabs', width: 300 }, { name: 'leafs', width: 150 }, { name: 'folders', width: 130 }],
  [{ name: 'tabs', width: 300 }, { name: 'folders', width: 130 }, { name: 'leafs', width: 150 }],
  [{ name: 'leafs', width: 150 }, { name: 'folders', width: 130 }, { name: 'tabs', width: 300 }],
  [{ name: 'folders', width: 130 }, { name: 'leafs', width: 150 }, { name: 'tabs', width: 300 }],
  [{ name: 'leafs', width: 175 }, { name: 'folders', width: 130 }, { name: 'histories', width: 175 }],
  [{ name: 'folders', width: 130 }, { name: 'leafs', width: 175 }, { name: 'histories', width: 175 }],
];

export const defaultWidth = {
  histories: 100,
  tabs: 325,
  leafs: 200,
  folders: 150,
};

export const initialSettings = {
  postPage: false,
  height: 500,
  windowSize: {
    width: 800,
    height: 600,
    top: undefined as number | undefined,
    left: undefined as number | undefined,
  },
  paneWidth: {
    pane1: defaultWidth.leafs,
    pane2: defaultWidth.tabs,
    pane3: defaultWidth.histories,
  },
  paneLayouts: [] as PaneLayouts,
  paneLayoutsWindowMode: [] as PaneLayouts,
  bodyColor: '#222222',
  tabs: true,
  history: true,
  historyMax: {
    rows: 30,
    days: null,
  },
  includeUrl: false,
  theme: {
    light: '',
    dark: '',
    other: '',
  },
  palettes: {
    light: [] as ColorInfo[][],
    dark: [] as ColorInfo[][],
    other: [] as ColorInfo[][],
  },
};

export type Settings = typeof initialSettings;

export type ClientState = {
  open?: string;
  paths?: Array<string>;
}

export type HtmlBookmarks = {
  leafs: string;
  folders: string;
}

export type MyHistoryItem = Partial<
  chrome.history.HistoryItem & {
    headerDate: boolean,
    selected: boolean,
    isSession?: boolean,
    isChildSession?: boolean,
    isOpenSessionWindow?: boolean,
    sessionWindow?: chrome.history.HistoryItem[],
  }
>;

export type ColorPalette = [
  paneBg: string,
  searching: string,
  frameBg: string,
  itemHover: string,
  keyColor: string,
];

export const defaultColorPalette: ColorPalette = [
  'FEFFFE',
  'BFD7EA',
  '0B3954',
  'E0FF4F',
  'FF6663',
];

const panes = [
  'histories',
  'tabs',
  'bookmarks',
] as const;

export const initialOptions = {
  panes,
  bookmarksPanes: ['leafs', 'folders'] as const,
  newTabPosition: 'rs' as 'rs' | 're' | 'ls' | 'le',
  showCloseTab: true,
  showSwitchTabsWin: false,
  showDeleteHistory: true,
  findTabsFirst: true,
  enableExternalUrl: false,
  externalUrl: '',
  findTabsMatches: 'domain' as 'domain' | 'prefix',
  css: '',
  editorTheme: 'vs-dark' as 'vs' | 'vs-dark',
  colorPalette: defaultColorPalette,
  zoomTabs: false,
  zoomHistory: true,
  zoomRatio: '0.7',
  fontSize: '0.9em',
  collapseTabs: true,
  exclusiveOpenBmFolderTree: true,
  bmAutoFindTabs: true,
  bmAutoFindTabsDelay: '500',
  restoreSearching: true,
  favColorPalettes: [] as ColorPalette[],
  showMinimizeAll: true,
  windowMode: true,
};

export type Panes = typeof panes[number];
export type MulitiSelectables = {
[key in Panes]?: boolean;
} & { all: boolean | undefined };

export type WindowModeInfo = {
  currentWindowId: number | undefined,
  popupWindowId: number | undefined,
}

export const initialState = {
  htmlBookmarks: {} as HtmlBookmarks,
  htmlTabs: '',
  htmlHistory: '',
  clientState: {} as ClientState,
  settings: initialSettings,
  options: initialOptions,
  lastSearchWord: '',
  queries: [] as string[],
  bmFindTabMatchMode: {} as { [key: string]: 'domain' | 'prefix' },
  toggleWindowOrder: true,
  pinWindows: {
    top: undefined as number[] | undefined,
    bottom: undefined as number[] | undefined,
  },
  windowModeInfo: {
    popupWindowId: undefined,
    currentWindowId: undefined,
  } as WindowModeInfo,
  updatedHistory: Date.now(),
};

export type State = typeof initialState;
export type Options = State['options'];

export const CliMessageTypes = {
  initialize: 'cl-initialize',
  moveWindow: 'cl-move-window',
  moveWindowNew: 'cl-move-window-new',
  moveTabs: 'cl-move-tabs',
  moveTabsNewWindow: 'cl-move-tabs-new-window',
  openUrls: 'cl-open-urls',
  setThemeColor: 'cl-set-theme-color',
  getWindowModeInfo: 'cl-get-window-mode-info',
  restoreSession: 'cl-restore-session',
  updateWindow: 'cl-update-window',
  getSvgBrowserFavicon: 'cl-get-svg-favicon',
} as const;

export const BkgMessageTypes = {
  applyOptions: 'bkg-apply-options',
  applyStyle: 'bkg-apply-style',
  tryChangePalette: 'bkg-try-change-palette',
  terminateWindowMode: 'bkg-terminate-window-mode',
} as const;

export type ApplyStyle = {
  css: string,
  colorPalette: ColorPalette,
  windowMode: boolean,
}

export const OpenBookmarkType = {
  tab: 'tab',
  window: 'window',
  incognito: 'incognito',
  current: 'current',
} as const;

export type OpenBookmarkTypes = {
  openType: keyof typeof OpenBookmarkType;
  id: string;
}

export const EditBookmarkType = {
  title: 'title',
  url: 'url',
} as const;

export type EditBookmarkTypes = {
  editType: keyof typeof EditBookmarkType;
  value: string;
  id: string;
}

export const dropAreaClasses = [
  'drop-top',
  'drop-bottom',
  'drop-folder',
  'leafs',
  'new-window-plus',
  'query',
] as const;

export type DropClasses = typeof dropAreaClasses[number];

export const splitterClasses = ['pane1', 'pane2', 'pane3'] as const;

export type SplitterClasses = { [key in typeof splitterClasses[number]]: number };

export type SetCurrentWindow = {
  windowId: number,
  isEventTrigger: boolean,
};

export type PayloadMoveItem = {
  id: string;
  targetId: string;
  dropClass: DropClasses;
}

export type PayloadUpdateWindow = {
  windowId: number,
  updateInfo: chrome.windows.UpdateInfo,
};

export type PayloadAction<P = void, M = never, E = never> = {
  payload: P;
} & ([M] extends [never] ? {} : {
  meta: M;
}) & ([E] extends [never] ? {} : {
  error: E;
});

export type PayloadActionType<T> = ({ payload }: PayloadAction<T>) => any;

type MapMessages = MapMessagesPtoB & MapMessagesBtoP;

export type MessageTypePayloadAction<M extends MapMessages> = {
  [K in keyof M]: M[K] extends PayloadActionType<infer S> ? S : never;
}

export type InsertPosition = Parameters<Element['insertAdjacentElement']>[0];
export const positions: { [key: string]: InsertPosition } = {
  'drop-top': 'beforebegin',
  'drop-bottom': 'afterend',
  'drop-folder': 'beforeend',
  leafs: 'beforeend',
};

export type Model = { [key: string]: any };
export type Collection = Array<Model>;

export type Nil = undefined | null;

// eslint-disable-next-line no-undef
export type HTMLElementEventType = HTMLElementEventMap;

export type InitailTabs = {
  windowId: number,
  tabs: chrome.tabs.Tab[];
}[];

export type PromiseInitTabs = Promise<[InitailTabs, number]>;

// eslint-disable-next-line no-undef
export type EventListenerOptions = boolean | AddEventListenerOptions;

export type AbstractConstructor<T = any> = abstract new (...args: any[]) => T;

export type PromiseType<T extends Promise<any>> = T extends Promise<infer P> ? P : never;
