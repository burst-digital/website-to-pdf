import ChromePromise from 'chrome-promise';
const chromep = new ChromePromise({chrome, Promise});
import jsPDF from 'jspdf';
import { slug } from '../utils';

// TODO: Only inject if wasn't injected before
chrome.runtime.onMessage.addListener((message = {}, sender, sendResponse) => {

    console.log('Recieved message:', message);

    switch (message.action) {
        case 'getPositions':
            sendResponse(getPositions());
            return;
        case 'scrollTo':
            window.scrollTo(...message.pos);
            window.requestAnimationFrame(() => window.requestAnimationFrame(() => window.requestAnimationFrame(() => sendResponse([window.scrollX, window.scrollY]))));
            return true;
        case 'getLinks':
            sendResponse(getLinks());
            return;
        case 'captureAndDownload':
            captureAndDownload(message, sendResponse);
            return true;
    }
});

function max(nums) {
    return Math.max.apply(Math, nums.filter(function (x) {
        return x;
    }));
}

function getPositions() {

    const body = document.body;

    if (body) {
        body.style.overflowY = 'visible';
    }

    const total = {
        width: max([
            document.documentElement.clientWidth,
            body ? body.scrollWidth : 0,
            document.documentElement.scrollWidth,
            body ? body.offsetWidth : 0,
            document.documentElement.offsetWidth
        ]),
        height: max([
            document.documentElement.clientHeight,
            body ? body.scrollHeight : 0,
            document.documentElement.scrollHeight,
            body ? body.offsetHeight : 0,
            document.documentElement.offsetHeight
        ])
    };

    var windowWidth = window.innerWidth,
        windowHeight = window.innerHeight,
        arrangements = [],
        // pad the vertical scrolling to try to deal with
        // sticky headers, 250 is an arbitrary size
        scrollPad = 200,
        yDelta = windowHeight - (windowHeight > scrollPad ? scrollPad : 0),
        xDelta = windowWidth,
        yPos = total.height - windowHeight,
        xPos;

    // During zooming, there can be weird off-by-1 types of things...
    if (total.width <= xDelta + 1) {
        total.width = xDelta;
    }

    // Disable all scrollbars.
    document.documentElement.style.overflow = 'hidden';

    while (yPos > -yDelta) {
        xPos = 0;
        while (xPos < total.width) {
            arrangements.push([xPos, yPos]);
            xPos += xDelta;
        }
        yPos -= yDelta;
    }

    return {total, arrangements, window: {width: window.innerWidth, height: window.innerHeight}};

}

function getLinks() {
    return Array.prototype.slice.call(document.getElementsByTagName('a'))
        .map(element => element.href);
}

async function captureAndDownload({tab, folder, positions}, callback) {

    console.debug('Creating pdf..');
    let pdf = new jsPDF({
        unit: 'mm',
        format: [positions.total.width, positions.total.height]
    });

    for (let pos of positions.arrangements) {
        console.debug('Scrolling page to', ...pos);
        window.scrollTo(...pos);
        pos = await new Promise(r => {
            window.requestAnimationFrame(() =>
                window.requestAnimationFrame(() =>
                    window.requestAnimationFrame(() =>
                        r([window.scrollX, window.scrollY])
                    )
                )
            );
        });

        // TIMEOUT
        await new Promise(r => setTimeout(r, 100));

        console.debug('Capturing page..');
        console.log(chromep, chrome);
        const dataUrl = await chromep.runtime.sendMessage({action: 'capture', windowId: tab.windowId});
        console.debug('Adding image to pdf..');
        pdf.addImage(dataUrl, pos[0], pos[1], positions.window.width, positions.window.height)
    }

    console.debug('Generating pdf..');
    let pdfDataUri = pdf.output('bloburi');

    console.debug('Downloading pdf..');

    await chromep.runtime.sendMessage({action: 'download', url: pdfDataUri, filename: `pdfs/${folder}/${slug(tab.title)}.pdf`});

    callback();
}