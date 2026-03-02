# Research Scraper Skill

## Description
Run web scraping to gather research from various sources. Uses puppeteer to fetch headlines and content from news sites.

## Commands

### Research: Hacker News
Run: `node /root/.openclaw/workspace/dashboard/scraper.js hn`
Fetches top 15 stories from Hacker News - good for tech and AI news.

### Research: Reddit (Hip-Hop Heads)
Run: `node /root/.openclaw/workspace/dashboard/scraper.js reddit`
Fetches trending posts from r/hiphopheads - good for hip-hop/music industry news.

### Research: TechCrunch
Run: `node /root/.openclaw/workspace/dashboard/scraper.js techcrunch`
Fetches latest tech news from TechCrunch.

## How to Use

1. Run the scraper command
2. Review the output
3. If relevant, add to research files in `/root/.openclaw/workspace/dashboard/data/research/`
4. Update the appropriate research file with new findings

## Research Files Location
`/root/.openclaw/workspace/dashboard/data/research/`

- 10-music-industry.md
- 11-openclaw-ai.md
- 12-la-events.md
- 13-deals.md
- 14-tech-productivity.md
- 15-food-restaurants.md
- 16-culture-streetwear.md
- 17-writing-creativity.md
- 18-political-shifts.md
- 19-filipino-news.md
- 20-bay-area-news.md

## Notes
- Puppeteer runs headless Chrome
- May need to install dependencies: `npm install puppeteer`
- Some sites may block scraping - try different sources if one fails
