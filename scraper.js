// Research Scraper - Multiple Sources

const puppeteer = require('puppeteer');

const sources = {
  hn: {
    name: 'Hacker News',
    url: 'https://news.ycombinator.com',
    selector: '.titleline > a',
    limit: 10
  },
  music: {
    name: 'Music Business Worldwide',
    url: 'https://www.musicbusinessworldwide.com',
    selector: 'h2, h3',
    limit: 8
  },
  hiphopdx: {
    name: 'HipHopDX',
    url: 'https://hiphopdx.com',
    selector: '.story-title, h2',
    limit: 8
  },
  design: {
    name: 'Design Week',
    url: 'https://www.designweek.co.uk',
    selector: 'h2, h3',
    limit: 8
  },
  creative: {
    name: 'Creative Boom',
    url: 'https://www.creativeboom.com',
    selector: 'h2, h3',
    limit: 8
  },
  techcrunch: {
    name: 'TechCrunch',
    url: 'https://techcrunch.com',
    selector: '.post-title, h2',
    limit: 8
  }
};

async function scrape(source = 'hn') {
  const config = sources[source];
  if (!config) {
    console.log('Available sources:', Object.keys(sources).join(', '));
    return;
  }

  console.log(`Scraping ${config.name}...`);
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  try {
    await page.goto(config.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1500));

    const titles = await page.evaluate((selector, limit) => {
      return Array.from(document.querySelectorAll(selector))
        .map(el => el.textContent.trim())
        .filter(t => t.length > 15 && t.length < 200)
        .slice(0, limit);
    }, config.selector, config.limit);

    await browser.close();
    return titles;
  } catch (e) {
    await browser.close();
    return [`Error: ${e.message}`];
  }
}

const arg = process.argv[2] || 'hn';

if (arg === 'all') {
  (async () => {
    for (const source of Object.keys(sources)) {
      const titles = await scrape(source);
      console.log(`\n=== ${sources[source].name.toUpperCase()} ===`);
      titles.forEach((t, i) => console.log(`${i+1}. ${t}`));
    }
  })();
} else {
  scrape(arg).then(titles => {
    titles.forEach((t, i) => console.log(`${i+1}. ${t}`));
  });
}
