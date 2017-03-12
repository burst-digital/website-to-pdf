import ChromePromise from 'chrome-promise';
const chromep = new ChromePromise({chrome, Promise});
import escapeStringRegexp from 'escape-string-regexp';
import { slug } from '../utils';

class ScanJob {

    constructor(args) {
        this._constructor(args);
    }

    async _constructor({tab, batch, folder, waitAfterLoading, waitBeforeCapture, filters: filtersText}) {
        console.debug('New ScanJob for tab', tab);
        const pages = [new Page({url: tab.url})];

        const filters = filtersText.split('\n').map(text => new RegExp(text));

        let page;
        while(page = pages.filter(page => !page.done)[0]){
            await page.scan({tab, folder, waitAfterLoading, waitBeforeCapture});

            if(batch) {
                const links = await page.getLinks(tab);

                links
                    .map(link => link.split('#')[0])
                    .filter(link => link.length)
                    .filter(link => {
                        return !filters.some(filter => {
                            return (!filter.test(link));
                        })
                    })
                    .forEach(link => {
                        if (!pages.map(page => page.url).includes(link)) {
                            console.debug('Adding link', link, 'to index.')
                            pages.push(new Page({url: link}));
                        }
                    });
            }
            page.done = true;
        }

        console.debug('All pages done.');

    }

}

export default ScanJob;

class Page {

    constructor({url}) {
        this.url = url;
    }

    async scan({tab, folder, waitAfterLoading, waitBeforeCapture}) {
        tab = await chromep.tabs.get(tab.id);

        if (tab.url != this.url) {
            const loadingCompleted = new Promise(r => {
                const onUpdate = async (tabId, info) => {
                    if(tabId == tab.id && info.status == 'complete'){
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
            await chromep.tabs.update(tab.id, {url: this.url});

            console.debug('Waiting for page to complete loading..')
            tab = await loadingCompleted;

            if(waitAfterLoading) {
                await new Promise(r => setTimeout(r, waitAfterLoading * 1000));
            }
        }

        console.debug('Injecting script..');
        await chromep.tabs.executeScript(tab.id, {file: 'dist/inject.js'});
        console.debug('Calculate positions..');
        const positions = await this.getPositions(tab);

        await this.captureAndDownload({tab, folder, positions, waitBeforeCapture});
    }

    getPositions(tab) {
        return chromep.tabs.sendMessage(tab.id, {action: 'getPositions'});
    }

    scrollTo(tab, pos) {
        return chromep.tabs.sendMessage(tab.id, {action: 'scrollTo', pos});
    }

    getLinks(tab) {
        return chromep.tabs.sendMessage(tab.id, {action: 'getLinks'});
    }

    captureAndDownload({tab, folder, positions, waitBeforeCapture}) {
        return chromep.tabs.sendMessage(tab.id, {action: 'captureAndDownload', tab, folder, positions, waitBeforeCapture});
    }

}