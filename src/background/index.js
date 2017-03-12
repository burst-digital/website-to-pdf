import ScanJob from './ScanJob';

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse){

    console.info('Got message:', message);

    switch(message.action){
        case 'newScanJob':
            new ScanJob(message.settings);
            return sendResponse();
        case 'capture':
            chrome.tabs.captureVisibleTab(message.windowId, {format: 'png'}, sendResponse);
            return true;
        case 'download':
            chrome.downloads.download({
                url: message.url,
                filename: message.filename
            }, sendResponse);
            return true;
    }

});