import {
  $, $$, $$byClass, $byClass,
  addClass, rmClass, toggleClass, hasClass, addChild, addStyle,
  addBookmark, findInTabsBookmark, openBookmark, getBookmark,
  addFolder, setAnimationClass, editTitle,
} from './client';
import {
  addListener,
  cbToResolve,
  cssid,
  curry,
  curry3,
  extractUrl, pipe, setEvents, setFavicon, switches,
} from './common';
import { ISearchable, SearchParams } from './search';
import {
  IPublishElement, ISubscribeElement, makeAction, Store,
} from './store';
import { OpenBookmarkType, Options, State } from './types';

export function openOrFindBookmarks(options: Options, $target: HTMLElement) {
  return (options.findTabsFirst ? findInTabsBookmark : openBookmark)(options, $target);
}

export class PaneHeader extends HTMLDivElement implements IPublishElement {
  #autoZoom!: boolean;
  #includeUrl!: boolean;
  private $mainMenu!: HTMLElement;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  init(settings: State['settings'], _?: boolean) {
    this.$mainMenu = $byClass('main-menu', this);
    this.#autoZoom = settings.autoZoom;
    this.#includeUrl = settings.includeUrl;
    pipe(
      addListener('click', (e) => {
        const $menu = e.target as HTMLElement;
        switch ($menu.dataset.value) {
          case 'add-bookmark': {
            const id = $byClass('open')?.id;
            addBookmark(id || '1');
            break;
          }
          case 'add-folder':
            addFolder();
            break;
          case 'settings':
            chrome.runtime.openOptionsPage();
            break;
          default:
        }
      }),
      addListener('mousedown', (e) => e.preventDefault()),
    )(this.$mainMenu);
  }
  actions() {
    if (!hasClass(this, 'end')) {
      return {};
    }
    return {
      setAutoZoom: makeAction({
        initValue: this.#autoZoom,
        persistent: true,
        target: $byClass('auto-zoom', this.$mainMenu),
        eventType: 'click',
        eventProcesser: (_, currentValue) => !currentValue,
      }),
      setIncludeUrl: makeAction({
        initValue: this.#includeUrl,
        persistent: true,
        target: $byClass('include-url', this.$mainMenu),
        eventType: 'click',
        eventProcesser: (_, currentValue) => !currentValue,
      }),
    };
  }
}

export class HeaderLeafs extends PaneHeader {
  private $pinBookmark!: HTMLElement;
  override init(settings: State['settings']) {
    super.init(settings);
    this.$pinBookmark = $byClass('pin-bookmark', this);
    this.$pinBookmark.addEventListener('click', () => addBookmark());
  }
}

export class Leaf extends HTMLElement {
  updateTitle(title: string) {
    const $anchor = this.firstElementChild as HTMLAnchorElement;
    $anchor.setAttribute('title', title);
    $anchor.textContent = title;
  }
  updateAnker({ title, url }: Pick<chrome.bookmarks.BookmarkTreeNode, 'title' | 'url'>) {
    setFavicon(url!)(this);
    this.updateTitle(title);
  }
  async editBookmarkTitle() {
    const $anchor = this.firstElementChild as HTMLAnchorElement;
    const title = await editTitle($anchor, this.id, false, true).catch(() => null);
    if (!title) {
      return;
    }
    this.updateTitle(title);
    setAnimationClass('hilite')(this);
  }
}

function setLeafMenu($leafMenu: HTMLElement, options: Options) {
  setEvents([$leafMenu], {
    async click(e) {
      const $leaf = (e.target as HTMLElement)
        ?.parentElement?.previousElementSibling?.parentElement as Leaf;
      const $anchor = $leaf?.firstElementChild as HTMLAnchorElement;
      switch ((e.target as HTMLElement).dataset.value) {
        case 'find-in-tabs': {
          findInTabsBookmark(options, $anchor);
          break;
        }
        case 'open-new-tab':
          openBookmark(options, $anchor);
          break;
        case 'open-new-window':
          openBookmark(options, $anchor, OpenBookmarkType.window);
          break;
        case 'open-incognito':
          openBookmark(options, $anchor, OpenBookmarkType.incognito);
          break;
        case 'edit-title': {
          $leaf.editBookmarkTitle();
          break;
        }
        case 'edit-url': {
          const { url = '', title } = await getBookmark($leaf.id);
          // eslint-disable-next-line no-alert
          const value = prompt(`[Edit URL]\n${title}`, url);
          if (value == null) {
            break;
          }
          await cbToResolve(curry3(chrome.bookmarks.update)($leaf.id)({ url: value }));
          $leaf.updateAnker({ title, url: value });
          setAnimationClass('hilite')($leaf);
          break;
        }
        case 'remove': {
          await cbToResolve(curry(chrome.bookmarks.remove)($leaf.id));
          addChild($byClass('leaf-menu'))($byClass('components'));
          pipe(
            addListener('animationend', () => $leaf.remove(), { once: true }),
            rmClass('hilite'),
            setAnimationClass('remove-hilite'),
          )($leaf);
          break;
        }
        case 'show-in-folder': {
          const id = $leaf.parentElement?.id;
          const $target = $(`.folders ${cssid(id!)} > .marker > .title`);
          if (!$target) {
            break;
          }
          $target.click();
          $target.focus();
          setTimeout(() => {
            ($leaf.firstElementChild as HTMLAnchorElement).focus();
            ($leaf as any).scrollIntoViewIfNeeded();
            setAnimationClass('hilite')($leaf);
          }, 100);
          break;
        }
        default:
      }
      ($anchor.nextElementSibling as HTMLElement).blur();
    },
    mousedown(e) {
      e.preventDefault();
    },
  });
}

export class Leafs extends HTMLDivElement implements ISubscribeElement, ISearchable {
  init(options: Options) {
    this.addEventListener('click', (e) => {
      const $target = e.target as HTMLDivElement;
      if ($target.hasAttribute('contenteditable')) {
        return;
      }
      if (hasClass($target, 'anchor')) {
        openOrFindBookmarks(options, $target!);
      } else if (hasClass($target, 'title', 'icon-fa-angle-right')) {
        toggleClass('path')($target.parentElement?.parentElement);
      }
    });
    const $leafMenu = $byClass('leaf-menu');
    this.addEventListener('mousedown', (e) => {
      if (hasClass(e.target as HTMLElement, 'leaf-menu-button')) {
        addStyle({ top: '-1000px' })($leafMenu);
      }
    });
    setLeafMenu($leafMenu, options);
  }
  search({ reFilter, searchSelector, includeUrl }: SearchParams) {
    const targetBookmarks = switches(searchSelector)
      .case('match')
      .then(() => {
        const target = $$byClass('search-path', this);
        target.forEach(rmClass('search-path'));
        $$byClass('path', this).forEach(rmClass('path'));
        return target;
      })
      .case('unmatch')
      .then(() => $$('.leaf:not(.search-path)', this))
      .else(() => {
        $$byClass('search-path', this).forEach(rmClass('search-path'));
        $$byClass('path', this).forEach(rmClass('path'));
        return $$byClass('leaf', this);
      });
    targetBookmarks.reduce((acc, $leaf) => {
      const $anchor = $leaf.firstElementChild as HTMLAnchorElement;
      if (reFilter.test($anchor.textContent!)
        || (includeUrl && reFilter.test(extractUrl($leaf.style.backgroundImage)))) {
        addClass('search-path')($leaf);
        if (acc === $leaf.parentElement) {
          return acc;
        }
        for (let $folder = $leaf.parentElement as HTMLElement | null; $folder && $folder.classList.contains('folder'); $folder = $folder.parentElement) {
          addClass('search-path', 'path')($folder);
        }
        return $leaf.parentElement;
      }
      return acc;
    }, null as HTMLElement | null);
  }
  clearSearch() {
    $$byClass('search-path', this).forEach(rmClass('search-path'));
    $$byClass('path', this).forEach(rmClass('path'));
  }
  connect(store: Store) {
    store.subscribe('clearSearch', this.clearSearch.bind(this));
  }
}
