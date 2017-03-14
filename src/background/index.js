import ScanJob from './ScanJob';
import store from './store';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.info('Got message:', message);

  switch (message.action) {
    case 'newScanJob':
      store.push(new ScanJob(message.settings));
      return sendResponse();
    case 'capture':
      chrome.tabs.captureVisibleTab(message.windowId, { format: 'png' }, sendResponse);
      return true;
    case 'download':
      chrome.downloads.download({
        url: message.url,
        filename: message.filename,
      }, sendResponse);
      return true;
    default:
      return false;
  }
});
