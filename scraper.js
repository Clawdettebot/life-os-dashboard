// Research Scraper
// Run with: node scraper.js [source]

const puppeteer = require('puppeteer');

const sources = {
  hn: {
    url: 'https://news.ycombinator.com',
    selector: '.titleline > a',
    limit: 15
  },
  reddit: {
    url: 'https://www.reddit.com/r/hiphopheads',
    selector: '[data-testid="post-title"]',
    limit: 10
  },
  techcrunch: {
    url: 'https://techcrunch.com',
    selector: '.post-block__title',
    limit: 10
  }
};

async function scrape(source = 'hn') {
  const config = sources[source];
  if (!config) {
    console.log('Available sources:', Object.keys(sources).join(', '));
    return;
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto(config.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  
  // Wait a bit for dynamic content
  await new Promise(r => setTimeout(r, 2000));

  const titles = await page.evaluate((selector, limit) => {
    return Array.from(document.querySelectorAll(selector))
      .slice(0, limit)
      .map(el => el.textContent.trim())
      .filter(t => t.length > 0);
  }, config.selector, config.limit);

  await browser.close();

  return titles;
}

// CLI
const arg = process.argv[2] || 'hn';
scrape(arg).then(titles => {
  console.log(`\n=== ${arg.toUpperCase()} ===`);
  titles.forEach((t, i) => console.log(`${i+1}. ${t}`));
  console.log('');
});
