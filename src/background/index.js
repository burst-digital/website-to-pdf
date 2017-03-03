import ScanJob from './ScanJob';

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse){

    console.info('Got message:', message);

    switch(message.action){
        case 'newScanJob':
            const job = new ScanJob({tab: message.tab});
            job.promise.then(sendResponse);
            return true;
    }

});