/**
 * Audio Dump Processor
 * Listens for audio in Discord, transcribes, analyzes, creates tasks
 */

const fs = require('fs');
const path = require('path');

const DASHBOARD_DIR = '/root/.openclaw/workspace/dashboard';
const AUDIO_DIR = `${DASHBOARD_DIR}/data/audio-dumps`;

async function processAudioDump(audioBuffer, filename, channelId) {
  const date = new Date().toISOString().split('T')[0];
  
  // Ensure audio dump directory exists
  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }
  
  // Save audio file
  const audioPath = `${AUDIO_DIR}/${date}-${Date.now()}.mp3`;
  fs.writeFileSync(audioPath, audioBuffer);
  
  // TODO: Add transcription when Whisper is set up
  // For now, return placeholder - user can review manually
  
  return {
    success: true,
    audioPath,
    message: `Audio saved to ${audioPath}. Transcription not yet configured - manual review needed.`,
    needsTranscription: true
  };
}

function createTasksFromTranscript(transcript) {
  // Parse transcript for action items
  const taskPatterns = [
    /need to (.*)/i,
    /have to (.*)/i,
    /should (.*)/i,
    /gotta (.*)/i,
    /remember to (.*)/i,
    /don't forget (.*)/i
  ];
  
  const tasks = [];
  const lines = transcript.split('\n');
  
  for (const line of lines) {
    for (const pattern of taskPatterns) {
      const match = line.match(pattern);
      if (match) {
        tasks.push({
          title: match[1].trim(),
          status: 'pending',
          source: 'audio-dump',
          created_at: Date.now()
        });
      }
    }
  }
  
  return tasks;
}

function addTasksToDashboard(tasks) {
  const tasksFile = `${DASHBOARD_DIR}/data/tasks.json`;
  let existing = [];
  
  if (fs.existsSync(tasksFile)) {
    existing = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
  }
  
  const updated = [...existing, ...tasks];
  fs.writeFileSync(tasksFile, JSON.stringify(updated, null, 2));
  
  return updated.length;
}

function writeJournalEntry(date, transcript, mood, updates) {
  const journalPath = `${DASHBOARD_DIR}/data/journal-audio/${date}.md`;
  const dir = path.dirname(journalPath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const content = `# Audio Dump - ${date}

## Transcript
${transcript}

## Mood/Energy
${mood || 'Not detected'}

## Updates
${updates || 'None recorded'}

---
*Processed by Clawdette 🤖*
`;
  
  fs.writeFileSync(journalPath, content);
  return journalPath;
}

module.exports = {
  processAudioDump,
  createTasksFromTranscript,
  addTasksToDashboard,
  writeJournalEntry
};
