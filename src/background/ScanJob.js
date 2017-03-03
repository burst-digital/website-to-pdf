
import ChromePromise from 'chrome-promise';
const chromep = new ChromePromise({chrome, Promise});
import jsPDF from 'jspdf';
import escapeStringRegexp from 'escape-string-regexp';

class ScanJob {

    constructor(args) {
        this._constructor(args);
    }

    async _constructor({tab, batch = true}) {
        console.log('New ScanJob for tab', tab);
        const pages = [new Page({url: tab.url})];

        const filters = [
            new RegExp('^' + escapeStringRegexp(tab.url))
        ];

        let page;
        while(page = pages.filter(page => !page.done)[0]){
            await page.scan({tab});
            const links = await page.getLinks(tab);


            console.log(pages.map(page => page.url));

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
                        console.log('Adding link', link, 'to index.')
                        pages.push(new Page({url: link}));
                    }
                });
            page.done = true;
        }

        console.log('All pages done.');

    }

}

export default ScanJob;

class Page {

    constructor({url}) {
        this.url = url;
    }

    async scan({tab}) {
        tab = await chromep.tabs.get(tab.id);
        console.log('Scanning tab ', tab);
        if (tab.url != this.url) {
            await chromep.tabs.update(tab.id, {url: this.url});

            tab = await new Promise(r => {
                const onUpdate = async (tabId, info) => {
                    console.log({tabId, info});
                    if(tabId == tab.id && info.status == 'complete'){
                        chrome.tabs.onUpdated.removeListener(onUpdate);
                        r(await chromep.tabs.get(tab.id));
                    }
                };
                chrome.tabs.onUpdated.addListener(onUpdate);
            });

        }
        await chromep.tabs.executeScript(tab.id, {file: 'dist/inject.js'});
        const positions = await this.getPositions(tab);

        console.log('Positions:', this.positions);
        let pdf = new jsPDF({
            unit: 'mm',
            format: [positions.total.width, positions.total.height]
        });

        for (let pos of positions.arrangements) {
            pos = await this.scrollTo(tab, pos);
            const dataUrl = await chromep.tabs.captureVisibleTab(tab.windowId, {format: 'png'});
            pdf.addImage(dataUrl, pos[0], pos[1], positions.window.width, positions.window.height)
        }

        let pdfDataUri = pdf.output('bloburi');

        console.log('Downloading now! Data uri is', pdfDataUri.length, 'chars long..');

        const download = await chromep.downloads.download({
            url: pdfDataUri,
            filename: 'pdfs/pdf.pdf'
        });

        console.log('Download done!', download);

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