
import ChromePromise from 'chrome-promise';
const chromep = new ChromePromise({chrome, Promise});
import { saveFile } from '../utils';
import jsPDF from 'jspdf';

window.saveThisFile = saveFile;

class ScanJob {

    constructor(args) {
        this.promise = this._constructor(args);
    }

    async _constructor({tab, batch = true}) {
        console.log('New ScanJob for tab', tab);
        this.tab = tab;
        this.pages = [new Page({url: tab.url})];

        let page;
        while(page = this.pages.filter(page => !page.done)[0]){
            await page.scan({tab});
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
        this.positions = await this.getPositions(tab);
        this.screenshots = [];
        console.log('Positions:', this.positions);
        this.pdf = new jsPDF({
            unit: 'mm',
            format: [this.positions.total.width, this.positions.total.height]
        });

        for (let pos of this.positions.arrangements) {
            pos = await this.scrollTo(tab, pos);
            const dataUrl = await chromep.tabs.captureVisibleTab(tab.windowId, {format: 'png'});
            this.screenshots.push({
                pos
            });
            this.pdf.addImage(dataUrl, pos[0], pos[1], this.positions.window.width, this.positions.window.height)
        }

        await chromep.downloads.download({
            url: this.pdf.output('datauristring'),
            filename: 'pdfs/pdf.pdf'
        });
    }

    getPositions(tab) {
        return chromep.tabs.sendMessage(tab.id, {action: 'getPositions'});
    }

    scrollTo(tab, pos) {
        return chromep.tabs.sendMessage(tab.id, {action: 'scrollTo', pos});
    }

}