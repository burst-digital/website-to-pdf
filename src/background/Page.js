import ChromePromise from 'chrome-promise';

const chromep = new ChromePromise({ chrome, Promise });

export default class Page {

  constructor({ url }) {
    this.url = url;
  }

  async scan({ tabId, folder, waitAfterLoading, waitBeforeCapture }) {
    let tab = await chromep.tabs.get(tabId);

    if (tab.url !== this.url) {
      const loadingCompleted = new Promise((r) => {
        const onUpdate = async (updatedTabId, info) => {
          if (tabId === updatedTabId && info.status === 'complete') {
            // Tab has completed loading
            chrome.tabs.onUpdated.removeListener(onUpdate);
            r(await chromep.tabs.get(tab.id));
          }
        };
        chrome.tabs.onUpdated.addListener(onUpdate);
      });

      // Sometimes, it loads too quickly and the Listner is not set up yet.
      // A timeout of 20 ms fixes this.
      await new Promise(r => setTimeout(r, 20));

      console.debug('Navigating to', this.url);
      await chromep.tabs.update(tab.id, { url: this.url });

      console.debug('Waiting for page to complete loading..');
      tab = await loadingCompleted;

      if (waitAfterLoading) {
        await new Promise(r => setTimeout(r, waitAfterLoading * 1000));
      }
    }

    console.debug('Injecting script..');
    await chromep.tabs.executeScript(tab.id, { file: 'dist/inject.js' });
    console.debug('Calculate positions..');
    const positions = await this.getPositions(tab);

    await this.captureAndDownload({ tab, folder, positions, waitBeforeCapture });
  }

  getPositions(tab) {
    return chromep.tabs.sendMessage(tab.id, { action: 'getPositions' });
  }

  scrollTo(tab, pos) {
    return chromep.tabs.sendMessage(tab.id, { action: 'scrollTo', pos });
  }

  getLinks(tab) {
    return chromep.tabs.sendMessage(tab.id, { action: 'getLinks' });
  }

  captureAndDownload({ tab, folder, positions, waitBeforeCapture }) {
    return chromep.tabs.sendMessage(tab.id, { action: 'captureAndDownload', tab, folder, positions, waitBeforeCapture });
  }

}
