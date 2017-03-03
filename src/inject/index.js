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
    }
});

function max(nums) {
    return Math.max.apply(Math, nums.filter(function (x) {
        return x;
    }));
}

function getPositions() {

    const body = document.body;
    const backup = {
        BodyStyleOverflowY: body ? body.style.overflowY : ''
    };

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

    if (body) {
        body.style.overflowY = backup.BodyStyleOverflowY;
    }

    // Disable all scrollbars. We'll restore the scrollbar state when we're done
    // taking the screenshots.
    //document.documentElement.style.overflow = 'hidden';

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