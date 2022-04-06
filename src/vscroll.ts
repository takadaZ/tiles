import { State, Collection, MyHistoryItem } from './types';
import {
  $, getLocal, setLocal, pick, when,
} from './utils';

export function rowSetterHistory(
  data: MyHistoryItem[],
  rowTop: number,
  dataTop: number,
) {
  const latestDate = (new Date()).toLocaleDateString();
  const $currentDate = $('.pane-history .current-date')!;
  $currentDate.style.transform = 'translateY(0)';
  return (row: HTMLElement, index: number) => {
    if (index === 0) {
      return;
    }
    const item = data[dataTop + index - 1];
    if (!item) {
      row.style.setProperty('transform', 'translateY(-10000px)');
      return;
    }
    const {
      url, title, lastVisitTime, lastVisitDate, headerDate,
    } = item;
    if (index === 1) {
      $currentDate.textContent = latestDate === lastVisitDate ? '' : lastVisitDate!;
    }
    row.style.setProperty('transform', `translateY(${rowTop}px)`);
    if (headerDate) {
      // eslint-disable-next-line no-param-reassign
      row.textContent = lastVisitDate!;
      row.style.removeProperty('background-image');
      row.classList.add('header-date');
      row.removeAttribute('title');
      if (index === 2) {
        $currentDate.style.transform = `translateY(${rowTop}px)`;
      }
      return;
    }
    const text = title || url;
    const tooltip = `${text}\n${(new Date(lastVisitTime!)).toLocaleString()}`;
    // eslint-disable-next-line no-param-reassign
    row.textContent = text!;
    row.style.setProperty('background-image', `url('chrome://favicon/${url}')`);
    row.setAttribute('title', tooltip);
    row.classList.remove('header-date');
  };
}

function getRowHeight(rows: HTMLElement) {
  const tester = rows.appendChild(document.createElement('div'));
  tester.textContent = 'A';
  const styles = getComputedStyle(tester);
  const props = pick('marginTop', 'marginBottom', 'paddingTop', 'paddingBottom')(styles);
  const elementHeight = Math.round(Number.parseFloat(styles.height));
  const rowHeight: number = Object.values(props)
    .reduce((acc, value) => acc + Number.parseFloat(String(value)), elementHeight) - 2;
  tester.remove();
  [...rows.children].forEach((el) => (el as HTMLElement).style.setProperty('height', `${elementHeight}px`));
  return { rowHeight, elementHeight };
}

export type VScrollRowSetter = typeof rowSetterHistory;

let vScrollHandler: Parameters<HTMLElement['removeEventListener']>[1];

export function setVScroll(
  container: HTMLDivElement,
  setter: VScrollRowSetter,
  data: Collection,
  { rowHeight }: State['vscrollProps'],
) {
  const rows = $('.rows', container);
  const vscroll = $('.v-scroll-bar', container);
  const vscrollFiller = $('.scroll-filler', container);
  const firstRow = rows?.firstElementChild as HTMLElement;
  if (!firstRow || !rows || !vscroll || !vscrollFiller) {
    return;
  }
  vscrollFiller.style.height = `${rowHeight * data.length}px`;
  if (vScrollHandler) {
    vscroll.removeEventListener('scroll', vScrollHandler);
  } else {
    rows.addEventListener('wheel', (e: WheelEvent) => {
      vscroll.scrollTop += e.deltaY;
    });
  }
  const children = [...rows.children] as HTMLElement[];
  vScrollHandler = () => {
    const rowTop = -(vscroll.scrollTop % rowHeight);
    const dataTop = Math.floor(vscroll.scrollTop / rowHeight);
    children.forEach(setter(data, rowTop, dataTop));
  };
  vscroll.addEventListener('scroll', vScrollHandler);
}

function searchHistory(source: MyHistoryItem[], reFilter: RegExp, includeUrl: boolean) {
  const [results] = source.reduce(([result, prevHeaderDate], el) => {
    if (el.headerDate) {
      return [result, el];
    }
    if (!reFilter!.test(el.title || el.url || '') && !(includeUrl && reFilter!.test(el.url || ''))) {
      return [result, prevHeaderDate];
    }
    if (!prevHeaderDate) {
      return [[...result, el], null];
    }
    return [[...result, prevHeaderDate, el], null];
  }, [[], null] as [MyHistoryItem[], MyHistoryItem | null]);
  return results;
}

type ResetParams = { initialize?: boolean, reFilter?: RegExp, includeUrl?: boolean, searchType?: 'forward' | 'back' | 'new', queryValue?: string, lastQueryValue?: string };

export async function resetHistory({
  initialize,
  reFilter,
  includeUrl,
  searchType,
  queryValue,
  lastQueryValue,
}: ResetParams = {}) {
  const $paneHistory = $<HTMLDivElement>('.pane-history')!;
  const rows = $('.rows', $paneHistory)!;
  if (initialize) {
    const { rowHeight, elementHeight } = getRowHeight(rows);
    setLocal({ vscrollProps: { rowHeight, elementHeight }, historiesCache: {} });
  }
  const {
    histories: [init, ...tail],
    vscrollProps,
    historiesCache = {},
  } = await getLocal('histories', 'vscrollProps', 'historiesCache');
  const today = (new Date()).toLocaleDateString();
  const histories2 = when(!!initialize && init.lastVisitDate !== today && !init.headerDate)
    .then(() => {
      const lastVisitTime = init.lastVisitTime! - (init.lastVisitTime! % (1000 * 60 * 60 * 24));
      const headerDate = { headerDate: true, lastVisitDate: init.lastVisitDate, lastVisitTime };
      const histories = [headerDate, init, ...tail];
      const headerDateHtml = `<div class="header-date" style="height: ${vscrollProps.elementHeight}px">${init.lastVisitDate}</div>`;
      rows.firstElementChild?.insertAdjacentHTML('afterend', headerDateHtml);
      setLocal({ histories, htmlHistory: rows.innerHTML });
      return histories as MyHistoryItem[];
    })
    .else(() => [init, ...tail]);
  let data: Array<MyHistoryItem>;
  if (!reFilter) {
    data = histories2;
    setLocal({ historiesCache: {} });
  } else if (searchType === 'back') {
    data = historiesCache[queryValue!] || histories2;
  } else if (searchType === 'forward') {
    data = searchHistory(historiesCache[lastQueryValue!] || histories2, reFilter, includeUrl!);
    setLocal({ historiesCache: { ...historiesCache, [queryValue!]: data } });
  } else {
    data = searchHistory(histories2, reFilter, includeUrl!);
    setLocal({ historiesCache: { ...historiesCache, [queryValue!]: data } });
  }
  setVScroll($paneHistory, rowSetterHistory, data, vscrollProps);
  if (reFilter || !initialize) {
    [...rows?.children || []].forEach((el) => {
      (el as HTMLElement).style.removeProperty('background-image');
      el.removeAttribute('title');
      // eslint-disable-next-line no-param-reassign
      el.textContent = '';
    });
    const vscroll = $('.v-scroll-bar', $paneHistory)!;
    vscroll.scrollTop = 0;
    vscroll.dispatchEvent(new Event('scroll'));
  }
}
