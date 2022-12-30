import { MyHistoryItem } from './types';

function getSessionTab({ url, title, sessionId }: chrome.tabs.Tab, lastVisitTime?: number) {
  return {
    url, title, lastVisitTime, id: sessionId!,
  };
}

function getSessionItem({ window, tab, lastModified }: chrome.sessions.Session): MyHistoryItem {
  const lastVisitTime = lastModified * 1000;
  if (tab) {
    return { isSession: true, ...getSessionTab(tab, lastVisitTime) };
  }
  return {
    id: window!.sessionId!,
    isSession: true,
    sessionWindow: window!.tabs!.map((t) => getSessionTab(t)),
    lastVisitTime,
  };
}

export default function addHeadersHistory(
  [historyItems, sessions]: [chrome.history.HistoryItem[], chrome.sessions.Session[]],
) {
  // const sessionsToHistories = sessions.reduce(
  //   (acc, { window, tab, lastModified }) => {
  //     if (lastModified === 0) {
  //       return acc;
  //     }
  //     return tab
  //       ? [...acc, getSessionItem(lastModified)(tab)]
  //       : [...acc, ...window?.tabs?.map(getSessionItem(lastModified)) || []];
  //   },
  //   [] as MyHistoryItem[],
  // );
  const sorted = sessions.map(getSessionItem).concat(historyItems)
    .sort((a, b) => b.lastVisitTime! - a.lastVisitTime!);
  const histories = [] as MyHistoryItem[];
  for (let i = 0, prevLastVisitDate = ''; i < sorted.length; i += 1) {
    const { url, ...rest } = sorted[i];
    const item = { ...rest, url: url?.substring(0, 1024) };
    const lastVisitDate = (new Date(rest.lastVisitTime!)).toLocaleDateString();
    if (prevLastVisitDate === lastVisitDate || !prevLastVisitDate) {
      histories.push(item);
    } else {
      histories.push({ headerDate: true, lastVisitTime: rest.lastVisitTime }, item);
    }
    prevLastVisitDate = lastVisitDate;
  }
  return histories;
}
