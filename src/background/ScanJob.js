import Page from './Page';

class ScanJob {

  constructor(args) {
    this.start(args);
  }

  async start({ tab, batch, folder, waitAfterLoading, waitBeforeCapture, filters: filtersText }) {
    console.debug('New ScanJob for tab', tab);
    const pages = [new Page({ url: tab.url })];

    const filters = filtersText.split('\n').map(text => new RegExp(text));

    let page;
    while (page = pages.filter(page => !page.done)[0]) {
      await page.scan({ tabId: tab.id, folder, waitAfterLoading, waitBeforeCapture });

      if (batch) {
        const links = await page.getLinks(tab);

        links
                    .map(link => link.split('#')[0])
                    .filter(link => link.length)
                    .filter(link => !filters.some(filter => (!filter.test(link))))
                    .forEach((link) => {
                      if (!pages.map(page => page.url).includes(link)) {
                        console.debug('Adding link', link, 'to index.');
                        pages.push(new Page({ url: link }));
                      }
                    });
      }
      page.done = true;
    }

    console.debug('All pages done.');
  }

}

export default ScanJob;
