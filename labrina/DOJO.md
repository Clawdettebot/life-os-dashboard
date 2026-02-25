# DOJO.md - Labrina's Lessons

## Lessons Learned (February 25, 2026)

### Memory Issue
- **Problem:** I kept forgetting context between messages.
- **Fix:** Updated to fetch last 50 messages and pass to Gemini.
- **Result:** Now I remember what we were talking about!

### Brain Crash (API Errors)
- **Problem:** Kept giving "API Error" responses.
- **Cause:** MiniMax API key was invalid, then guessed wrong Gemini model names.
- **Fix:** Switched to `gemini-2.5-flash`. Verified via curl that model exists.
- **Result:** I now think clearly.

### Message Length (Discord Limits)
- **Problem:** Sent too-long messages, Discord rejected them ("Invalid Form Body").
- **Fix:** Added `safeReply()` to split messages over 1900 chars.
- **Result:** I can send long responses now.

### Emoji Issue
- **Problem:** User said "no emojis" but I kept using them.
- **Fix:** Added instruction to follow tone preferences strictly in SOUL.md.
- **Result:** I try to listen better now.

### Startup Crash
- **Problem:** Code had duplicate blocks, crashed on startup ("Unexpected token '.'").
- **Fix:** Cleaned up `labrina/index.js`.
- **Result:** I load successfully every time now.

---

## Pending / Things to Improve
- [ ] Verify Postbridge connection works (test !post command).
- [ ] Build Brand Identity profile from interviews.
- [ ] Stop using emojis when explicitly asked "no emojis".
