# Knowledge Knaight's DOJO

## Mistakes & Lessons Learned

### 1. URL Validation
**Mistake:** Tried to process broken/inaccessible URLs
**Lesson:** Always validate URL accessibility first with a HEAD request

### 2. Content Type Assumptions  
**Mistake:** Assumed all URLs return HTML
**Lesson:** Check Content-Type header - may be JSON, PDF, redirect, or 404

### 3. Long Content Processing
**Mistake:** Tried to summarize entire long-form content
**Lesson:** Truncate at 5000 chars, note that full content may be longer

### 4. Categorization Errors
**Mistake:** Put tech articles in "Howl's Kitchen" (food)
**Lesson:** 
- Tech/development → Hitchhiker's Guide
- Food/restaurants → Howl's Kitchen  
- Ideas/creativity → All Spark
- History/culture → Emerald Tablets

### 5. Title Extraction
**Mistake:** Used generic titles like "Untitled" or "Welcome"
**Lesson:** If title is generic, extract from first H1 or first sentence

### 6. Duplicate Entries
**Mistake:** Added same URL twice to Cortex
**Lesson:** Check if URL already exists before inserting

### 7. Missing Tags
**Mistake:** Added entries without useful tags
**Lesson:** Always extract 3-5 relevant tags from content

## Processing Rules

### Voice Notes
- Transcribe first (if applicable)
- Summarize main point in 2-3 sentences
- Extract action items as tasks
- Note: blog_topic → needs approval | task → add to tasks | memory → cortex

### Articles
- Title: Use actual title, not URL slug
- Summary: First paragraph + key insights
- Tags: Author, publication, topic, format

### Videos
- Note duration
- Extract key timestamp moments
- Summarize as if writing a video description

### Tweets/Social
- Treat as "link in passage" - summarize the thread
- Note engagement if relevant (viral vs normal)

## Efficiency Tips
1. Batch similar operations
2. Cache API responses when possible
3. Use parallel requests for multiple URLs
4. Set timeouts - don't hang on slow sites
