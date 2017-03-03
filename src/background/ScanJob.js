
import ChromePromise from 'chrome-promise';
const chromep = new ChromePromise({chrome, Promise});
import jsPDF from 'jspdf';
import escapeStringRegexp from 'escape-string-regexp';
import { slug } from '../utils';

class ScanJob {

    constructor(args) {
        this._constructor(args);
    }

    async _constructor({tab, batch = true}) {
        console.debug('New ScanJob for tab', tab);
        const pages = [new Page({url: tab.url})];

        const filters = [
            new RegExp('^' + escapeStringRegexp(tab.url))
        ];

        const folder = slug(tab.title);

        let page;
        while(page = pages.filter(page => !page.done)[0]){
            await page.scan({tab, folder});
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
                    if(!pages.map(page => page.url).includes(link)) {
                        console.debug('Adding link', link, 'to index.')
                        pages.push(new Page({url: link}));
                    }
                });
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

    async scan({tab, folder}) {
        tab = await chromep.tabs.get(tab.id);

        if (tab.url != this.url) {
            const loadingCompleted = new Promise(r => {
                const onUpdate = async (tabId, info) => {
                    if(tabId == tab.id && info.status == 'complete'){
                        chrome.tabs.onUpdated.removeListener(onUpdate);
                        r(await chromep.tabs.get(tab.id));
                    }
                };
                chrome.tabs.onUpdated.addListener(onUpdate);
            });
            console.debug('Navigating to', this.url);
            await chromep.tabs.update(tab.id, {url: this.url});
            console.debug('Waiting for page to complete loading..')
            await loadingCompleted;
        }

        console.debug('Injecting script..');
        await chromep.tabs.executeScript(tab.id, {file: 'dist/inject.js'});
        console.debug('Calculate positions..');
        const positions = await this.getPositions(tab);

        console.debug('Creating pdf..');
        let pdf = new jsPDF({
            unit: 'mm',
            format: [positions.total.width, positions.total.height]
        });

        for (let pos of positions.arrangements) {
            console.debug('Scrolling page to', ...pos);
            pos = await this.scrollTo(tab, pos);
            console.debug('Capturing page..');
            const dataUrl = await chromep.tabs.captureVisibleTab(tab.windowId, {format: 'png'});
            console.debug('Adding image to pdf..');
            pdf.addImage(dataUrl, pos[0], pos[1], positions.window.width, positions.window.height)
        }

        console.debug('Generating pdf..');
        let pdfDataUri = pdf.output('bloburi');

        console.debug('Downloading pdf..');
        await chromep.downloads.download({
            url: pdfDataUri,
            filename: `pdfs/${folder}/${slug(tab.title)}.pdf`
        });

        // Clean up
        global.URL.revokeObjectURL(pdfDataUri)
        pdfDataUri = null;
        pdf = null;
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

}