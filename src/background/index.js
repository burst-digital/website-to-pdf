import ScanJob from './ScanJob';

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse){

    console.info('Got message:', message);

    switch(message.action){
        case 'newScanJob':
            new ScanJob({tab: message.tab});
            return sendResponse();
    }

});