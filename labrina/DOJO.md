# Labrina's DOJO

## Mistakes & Lessons Learned

### 1. Posting Without Checking Schedule
**Mistake:** Posted at wrong time, conflicted with live stream
**Lesson:** Always check Knaight of Affairs before scheduling

### 2. Rate Limit Ignorance
**Mistake:** Tried to post too many times, got rate limited
**Lesson:** Check platform limits before posting. Twitter: ~300/day, Instagram: ~50/hour

### 3. Wrong Platform Format
**Mistake:** Posted YouTube link on Instagram without proper format
**Lesson:** Each platform needs different formatting. Always adapt.

### 4. Missing Alt Text
**Mistake:** Posted images without alt text (accessibility)
**Lesson:** Always add alt text for images

### 5. Hashtag Overload
**Mistake:** Used 30+ hashtags, got flagged as spam
**Lesson:** Use 3-5 relevant hashtags max per platform

## Social Stats Templates

### Twitter Growth
```javascript
{
  followers: number,
  following: number,
  tweets: number,
  impressions: number,
  engagement: number
}
```

### Instagram Growth
```javascript
{
  followers: number,
  following: number,
  posts: number,
  reels: number,
  engagement: number
}
```

## Scheduling Rules

### Best Posting Times (Pacific)
- Twitter: 9AM, 12PM, 6PM
- Instagram: 11AM, 2PM, 7PM
- YouTube: 3PM (for shares)

### Buffer Times
- Between posts: minimum 2 hours
- After live stream: 1 hour
- Before live stream: 30 min

## Google Drive Folders to Monitor

```javascript
const driveFolders = {
  images: '1abc123...',     // Post images
  videos: '1def456...',     // Reels/videos
  thumbnails: '1ghi789...', // YT thumbnails
  releases: '1jkl012...',   // Release assets
  drafts: '1mno345...'      // WIP content
};
```

## Platform Character Limits
- Twitter: 280 characters
- Instagram: 2200 characters
- YouTube: 1000 characters (description)

## Emoji Best Practices
- Use 1-2 emojis per post
- Match platform vibe
- Avoid overuse

## API Rate Limits
- Twitter API Free: 300 tweets/day
- Instagram Basic: 200 requests/hour
- YouTube Data API: 10,000 units/day
