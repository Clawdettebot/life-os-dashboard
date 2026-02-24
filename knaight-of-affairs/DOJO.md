# Knaight of Affairs' DOJO

## Mistakes & Lessons Learned

### 1. Timezone Confusion
**Mistake:** Displayed times in UTC or server timezone
**Lesson:** Always convert to US/Pacific for user

### 2. Past Events
**Mistake:** Showed old events in "upcoming"
**Lesson:** Filter out events that have already started

### 3. Empty Calendar Panic
**Mistake:** Sent alert when calendar was empty
**Lesson:** Empty calendar is fine - only alert on conflicts or important events

### 4. Too Many Reminders
**Mistake:** Sent reminder for every single event
**Lesson:** Only remind for: streams, meetings, deadlines. Skip: personal reminders

### 5. Ignoring All-Day Events
**Mistake:** Only looked at timed events
**Lesson:** All-day events (like "Work on X") count as busy

### 6. Missing Recurring Events
**Mistake:** Only showed next occurrence
**Lesson:** Note if event is recurring (weekly, monthly)

## Processing Rules

### Google Calendar Events
- Fetch from `/api/google-calendar/upcoming?days=7`
- Parse: title, start time, end time, location, attendees
- Convert to Pacific timezone
- Flag: isOnline? (has meet/video link), isRecurring?

### Content Calendar
- Fetch from `/api/content/calendar`
- Identify: release dates, post dates, promo dates
- Calculate: days until, prep time needed

### Stream Schedule
- Check for "stream" or "live" in event titles
- Note: game, duration, scheduled time
- Remind: 1 hour before (prep), 10 min before (go live)

### Task Deadlines
- Fetch from `/api/tasks`
- Filter: tasks with due dates in next 7 days
- Sort by: due date, priority

## Alert Thresholds
- **Critical (now):** Meeting in <15 min, stream in <30 min
- **Warning (soon):** Event in <1 hour, deadline today
- **Notice (upcoming):** Event today, deadline this week
- **Info (later):** Event this week

## Report Formats

### Morning Brief
```
📅 DAILY BRIEF - Feb 24
━━━━━━━━━━━━━━━━━━━━━
🎬 Streams: 1 (7PM Pacific)
📅 Events: 3 meetings
⚠️ Conflicts: None
📝 Deadlines: 2 due this week
```

### Pre-Event Reminder
```
⏰ STREAM IN 1 HOUR
━━━━━━━━━━━━━━━━━━━━━
Game: Valorant
Prep needed:OBS, overlays, Twitter go-live
Link: meet.google.com/xxx
```

### Conflict Alert
```
⚠️ CONFLICT DETECTED
━━━━━━━━━━━━━━━━━━━━━
11AM: Team Standup (30min)
11:30AM: Client Call (1hr)
→ Suggest: Push standup to 10:30AM or call in to client meeting
```
