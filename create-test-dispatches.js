// Quick test dispatches creator
const { lifeos } = require('./lifeos-supabase.js');

async function createTestDispatches() {
  const designs = [0, 1, 2, 3, 4];
  const dates = ['2026-03-01', '2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05'];
  
  for (let i = 0; i < dates.length; i++) {
    const { error } = await lifeos.from('abyssal_dispatches').upsert({
      date: dates[i],
      content: {
        date: dates[i],
        word_of_the_day: { word: `Word${i+1}`, definition: 'Definition here', partOfSpeech: 'noun' },
        tagalog_lesson: { phrase: 'Lesson phrase', meaning: 'Meaning' },
        french_lesson: { phrase: 'French phrase', meaning: 'Meaning' },
        current_events: [{ title: `Event ${i+1}`, description: 'Description', source: 'Source' }],
        rant_ideas: ['Rant idea 1', 'Rant idea 2'],
        viral_prompt: { hook: 'Viral hook', format: 'Video' },
        stream_schedule: [{ day: 'Monday', time: '8PM', activity: 'Stream' }],
        brain_prompts: ['Prompt 1', 'Prompt 2'],
        quote: { text: 'Quote text', author: 'Author' }
      },
      card_design: designs[i],
      status: 'generated'
    }, { onConflict: 'date' });
    
    if (error) console.log('Error:', error.message);
    else console.log('Created:', dates[i], 'with design', designs[i]);
  }
}

createTestDispatches();
