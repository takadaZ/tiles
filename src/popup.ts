/* eslint-disable import/prefer-default-export */

import './css/popup.scss';

import {
  HtmlBookmarks,
  Settings,
  State,
  ClientState,
  initialState,
  BkgMessageTypes,
} from './types';

import {
  $,
  $$,
  addRules,
  addClass,
  makeStyleIcon,
  cssid,
  setSplitWidth,
  bootstrap,
  getKeys,
  extractDomain,
  getColorWhiteness,
  lightColorWhiteness,
  setMessageListener,
  setHTML,
  addStyle,
  insertHTML,
} from './common';

import { makeTab } from './html';
import setEventListners from './client-events';
import { refreshVScroll, resetHistory } from './vscroll';
import { resetQuery } from './search';

type Options = State['options'];

function setTabs(currentWindowId: number) {
  chrome.tabs.query({}, (tabs) => {
    const htmlByWindow = tabs.reduce((acc, tab) => {
      const { [tab.windowId]: prev = '', ...rest } = acc;
      const className = tab.active && tab.windowId === currentWindowId ? 'current-tab' : '';
      const domain = extractDomain(tab.url);
      const title = `${tab.title}\n${domain}`;
      const style = makeStyleIcon(tab.url!);
      const htmlTabs = makeTab(tab.id!, className, title, style, tab.title!);
      return { ...rest, [tab.windowId]: prev + htmlTabs };
    }, {} as { [key: number]: string });
    const { [currentWindowId]: currentTabs, ...rest } = htmlByWindow;
    const html = Object.entries(rest).map(([key, value]) => `<div id="win-${key}">${value}</div>`).join('');
    $('.pane-tabs')!.innerHTML = `<div id="win-${currentWindowId}">${currentTabs}</div>${html}`;
  });
}

const lightColor = '#efefef';
const darkColor = '#222222';
const shadeBgColorDark = 'rgba(0, 0, 0, 0.6)';

function setOptions(settings: Settings, options: Options) {
  addRules('body', [
    ['width', `${settings.width}px`],
    ['height', `${settings.height}px`],
    ['color', settings.bodyColor],
  ]);
  const [
    [paneBg, paneColor, isLightPaneBg],
    [frameBg, frameColor, isLightFrameBg],
    [itemHoverBg, itemHoverColor, isLightHoverBg],
    [searchingBg, searchingColor, isLightSearchingBg],
    [keyBg, keyColor, isLightKeyBg],
  ] = options.colorPalette
    .map((code) => [`#${code}`, getColorWhiteness(code)])
    .map(([bgColor, whiteness]) => [bgColor, whiteness > lightColorWhiteness] as [string, boolean])
    .map(([bgColor, isLight]) => [bgColor, isLight ? darkColor : lightColor, isLight]);
  addRules('.leafs, .pane-history, .pane-tabs > div', [['background-color', paneBg], ['color', paneColor]]);
  addRules('body', [['background-color', frameBg]]);
  addRules('.folders', [['color', frameColor]]);
  addRules('.folders .open > .marker > .title, .current-tab, .current-tab > .icon-x::before', [
    ['background-color', keyBg],
    ['color', `${keyColor} !important`],
  ]);
  addRules('.folders .open > .marker > .title::before', [['color', isLightKeyBg ? 'rgba(0, 0, 0, 0.5) !important' : '#EFEFEF !important']]);
  addRules('.pin-bookmark:hover > .icon-fa-star-o', [['color', keyBg]]);
  addRules('.form-query .query-wrap[data-searching]', [['background-color', searchingBg], ['color', searchingColor]]);
  addRules('.form-query .icon-x', [['color', searchingColor]]);
  addRules(
    '.leaf:hover, .folders .marker:hover::before, .pane-tabs > div > .tab-wrap:not(.current-tab):hover, .pane-history .rows > .history:not(.header-date):hover, .date-collapsed .header-date:hover',
    [['background-color', itemHoverBg], ['color', itemHoverColor]],
  );
  addRules('.folders .marker:hover > .icon-fa-angle-right', [['color', itemHoverColor]]);
  if (!isLightPaneBg) {
    addRules('.leafs::-webkit-scrollbar-thumb, .v-scroll-bar::-webkit-scrollbar-thumb', [['background-color', 'dimgray']]);
    addRules('.leafs::-webkit-scrollbar-thumb:hover, .v-scroll-bar::-webkit-scrollbar-thumb:hover', [['background-color', 'darkgray']]);
    addRules('.leafs .title::before', [['color', lightColor]]);
    addRules('.auto-zoom .zoom-pane .shade-left, .auto-zoom .zoom-pane .shade-right', [['background-color', shadeBgColorDark]]);
  }
  if (!isLightFrameBg) {
    addRules('.pane-title, .form-query button > i, .form-query .query', [['color', 'lightgray']]);
    addRules('.title::before, .form-query .submit > i', [['color', 'rgba(255,255,255,0.5)']]);
    addRules('.form-query .query-wrap, button:not(.submit):hover::after, button:not(.submit):focus::after', [['background-color', 'rgba(255, 255, 255, 0.3)']]);
    addRules('.form-query button:hover .icon-fa-ellipsis-v, .form-query button:focus .icon-fa-ellipsis-v, .pane-title button:not(.submit) > i', [['color', 'darkgray']]);
    addRules(
      '.form-query button:hover::after, .form-query button:focus::after, .pane-title button:hover::after, .pane-title button:focus::after',
      [['background-color', 'rgba(255, 255, 255, 0.3)']],
    );
    addRules(
      '.form-query button:active::after, .form-query button:active::after, .pane-title button:active::after',
      [['background-color', 'rgba(255, 255, 255, 0.5)']],
    );
  }
  if (!isLightPaneBg && !isLightFrameBg) {
    addRules('.pane-tabs > div', [['border-color', 'lightgray']]);
  }
  if (!isLightHoverBg) {
    addRules('.folders .marker:hover > .title, .folders .marker:hover > .title::before', [['color', itemHoverColor]]);
    addRules(
      [
        '.leaf:hover .icon-fa-ellipsis-v',
        '.marker:hover .icon-fa-ellipsis-v',
        '.tab-wrap:not(.current-tab):hover .icon-x',
        '.history:hover .icon-x',
      ].join(','),
      [['color', 'darkgray']],
    );
    addRules(
      '.leaf:hover button:hover::after, .leaf:hover button:focus::after, .marker:hover button:hover::after, .marker:hover button:focus::after',
      [['background-color', 'rgba(255, 255, 255, 0.3)']],
    );
    addRules(
      '.leaf:hover button:active::after, .marker:hover button:active::after',
      [['background-color', 'rgba(255, 255, 255, 0.5)']],
    );
  }
  if (!isLightSearchingBg) {
    addRules('.query-wrap[data-searching] + button > .icon-fa-search', [['color', 'rgba(255,255,255,0.7)']]);
  }
  if (options.showCloseTab) {
    addRules('.pane-tabs > div > div:hover > i', [['display', 'inline-block']]);
  }
  if (options.showDeleteHistory) {
    addRules('.pane-history > div > div:not(.header-date):hover > i', [['display', 'inline-block']]);
  }
  setSplitWidth(settings.paneWidth);
  const [sheet] = document.styleSheets;
  options.css
    .replaceAll('\n', '').trim()
    .split('}')
    .filter(Boolean)
    .map((rule) => rule.trim().concat('}'))
    .forEach((rule) => sheet.insertRule(rule.trim(), sheet.cssRules.length));
  document.body.classList.toggle('auto-zoom', settings.autoZoom);
  $('.main-menu')!.classList.toggle('checked-include-url', settings.includeUrl);
}

function setExternalUrl(options: Options) {
  if (!options.enableExternalUrl || !options.externalUrl) {
    return;
  }
  addRules('.query-wrap[data-searching] .icon-fa-search', [['visibility', 'hidden']]);
  addRules('.query-wrap[data-searching]', [
    ['background-image', `url("chrome://favicon/${options.externalUrl}")`],
    ['background-repeat', 'no-repeat'],
    ['background-position', '6px center'],
  ]);
}

function setBookmarks(html: HtmlBookmarks) {
  setHTML(html.leafs)($('.leafs'));
  setHTML(html.folders)($('.folders'));
  ($('.folders .open') as any)?.scrollIntoViewIfNeeded();
}

function setBookmarksState(clState: ClientState) {
  clState.paths?.forEach((id) => $(`.folders ${cssid(id)}`)?.classList.add('path'));
  if (clState.open) {
    $$(cssid(clState.open))?.forEach(addClass('open'));
  }
}

function toggleElement(selector: string, isShow = true, shownDisplayType = 'block') {
  addStyle('display', isShow ? shownDisplayType : 'none')($(selector));
}

function setHistory($target: HTMLElement, htmlHistory: string) {
  insertHTML('afterbegin', htmlHistory)($target);
}

function init({
  settings, htmlBookmarks, clientState, options, currentWindowId, htmlHistory,
}: State) {
  setOptions(settings, options);
  setTabs(currentWindowId);
  setHistory($('.pane-history')!.firstElementChild as HTMLElement, htmlHistory);
  setBookmarks(htmlBookmarks);
  setBookmarksState(clientState);
  toggleElement('[data-value="find-in-tabs"]', !options.findTabsFirst);
  toggleElement('[data-value="open-new-tab"]', options.findTabsFirst);
  setEventListners(options);
  setExternalUrl(options);
  resetQuery(settings.includeUrl);
  resetHistory({ initialize: true }).then(refreshVScroll);
}

bootstrap(...getKeys(initialState)).then(init);

export const mapMessagesBtoP = {
  [BkgMessageTypes.updateHistory]: resetHistory,
};

setMessageListener(mapMessagesBtoP, true);
