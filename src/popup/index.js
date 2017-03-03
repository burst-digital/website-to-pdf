// Copyright (c) 2012,2013 Peter Coles - http://mrcoles.com/ - All rights reserved.
// Use of this source code is governed by the MIT License found in LICENSE

import ChromePromise from 'chrome-promise';
const chromep = new ChromePromise({chrome, Promise});

const status = document.getElementById('status');

(async function (){

    let tab;

    /**
     * Initializing
     */
    status.innerText = 'Initializing...';
    try {

        /**
         * The tab the user is currently browsing.
         */
        tab = (await chromep.tabs.query({active: true, currentWindow: true}))[0];

        console.log('Got the active tab:', tab);

        /**
         * Inject inject.js into the inject
         */
        await chromep.tabs.executeScript(tab.id, {file: 'dist/inject.js'});

    }
    catch (error) {

        console.error(error);
        status.innerText = `Can't initialize. Error: ${error.message}`;
        return;

    }

    status.innerText = 'Starting scan job!';

    await chromep.runtime.sendMessage({action: 'newScanJob', tab});

    window.close();

})();