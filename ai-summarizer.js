/**
 * AI Content Summarizer for Knowledge Knaight
 * Uses LLM to extract and format content for each section
 */

const axios = require('axios');

class AISummarizer {
  constructor() {
    // Use OpenClaw's API or local LLM
    this.apiUrl = process.env.LLM_API_URL || 'http://localhost:3000/api/llm';
    this.model = process.env.LLM_MODEL || 'minimax/MiniMax-M2.5';
  }

  /**
   * Summarize content for a specific section
   */
  async summarizeForSection(content, section, sourceUrl) {
    const prompt = this.getSectionPrompt(section, content, sourceUrl);
    
    try {
      // Try using OpenClaw's LLM endpoint if available
      const summary = await this.callLLM(prompt);
      return summary;
    } catch (e) {
      console.error('AI summarization failed:', e.message);
      // Return null to use fallback extraction
      return null;
    }
  }

  getSectionPrompt(section, content, sourceUrl) {
    const prompts = {
      howls_kitchen_recipe: `You are a culinary expert. Analyze this recipe content and extract:
1. Full ingredient list with amounts
2. Step-by-step cooking instructions
3. Cooking tips and techniques
4. Prep time and cook time
5. Difficulty level (beginner/intermediate/advanced)
6. Serving size
7. Cuisine type

Content to analyze:
${content.substring(0, 8000)}

Respond in JSON format:
{
  "ingredients": [{"item": "ingredient name", "amount": "quantity", "notes": "optional notes"}],
  "steps": [{"step": 1, "instruction": "detailed instruction", "time": "time for this step"}],
  "tips": ["tip 1", "tip 2"],
  "prep_time": "e.g. 15 minutes",
  "cook_time": "e.g. 30 minutes",
  "difficulty": "beginner/intermediate/advanced",
  "servings": 4,
  "cuisine": "e.g. American, French"
}`,

      howls_kitchen_review: `You are a food critic. Analyze this restaurant/food review and extract:
1. Restaurant name and location
2. Price range ($, $$, $$$)
3. Best dishes mentioned
4. Rating (1-5 stars)
5. Key observations about food quality
6. Would I return? (yes/no)

Content to analyze:
${content.substring(0, 8000)}

Respond in JSON format:
{
  "restaurant_name": "name",
  "location": "city/neighborhood",
  "price_range": "$/$$/$$$",
  "best_dishes": ["dish 1", "dish 2"],
  "rating": 4,
  "observations": "key food observations",
  "would_return": true
}`,

      hitchhiker_guide: `You are a DIY expert. Analyze this how-to content and extract:
1. Complete list of materials needed
2. Tools required
3. Step-by-step instructions (detailed)
4. Difficulty level
5. Estimated time
6. Safety warnings
7. Pro tips

Content to analyze:
${content.substring(0, 8000)}

Respond in JSON format:
{
  "materials": ["material 1", "material 2"],
  "tools_needed": ["tool 1", "tool 2"],
  "steps": [{"step": 1, "instruction": "detailed instruction", "time": "time estimate"}],
  "difficulty": "beginner/intermediate/advanced",
  "time_estimate": "e.g. 2 hours",
  "warnings": ["warning 1"],
  "pro_tips": ["tip 1", "tip 2"]
}`,

      emerald_tablets: `You are a historian. Analyze this historical content and extract:
1. Event/title
2. Date/time period
3. Location
4. Key people involved
5. Significance (major/personal/minor)
6. Brief summary of what happened
7. Historical context

Content to analyze:
${content.substring(0, 8000)}

Respond in JSON format:
{
  "title": "event title",
  "event_date": "year or date",
  "location": "city/country",
  "key_figures": ["person 1", "person 2"],
  "significance": "major/personal/minor",
  "summary": "2-3 sentence summary",
  "context": "historical background"
}`,

      all_spark: `You are a creative strategist. Analyze this content and extract:
1. Core idea/concept (in one sentence)
2. Inspiration source
3. Potential applications/use cases
4. Related fields or industries
5. Mood/aesthetic keywords
6. Potential collaborators or references

Content to analyze:
${content.substring(0, 8000)}

Respond in JSON format:
{
  "core_idea": "one sentence summary",
  "inspiration": "what inspired this",
  "applications": ["use case 1", "use case 2"],
  "related_fields": ["field 1", "field 2"],
  "mood_keywords": ["keyword 1", "keyword 2"],
  "collaborators": ["person/brand 1"]
}`
    };

    // Select prompt based on section
    if (section === 'howls_kitchen') {
      // Determine if it's a recipe or review
      const isRecipe = content.toLowerCase().includes('ingredient') || 
                       content.toLowerCase().includes('step') ||
                       content.toLowerCase().includes('instruction');
      return isRecipe ? prompts.howls_kitchen_recipe : prompts.howls_kitchen_review;
    }
    
    return prompts[section] || prompts.hitchhiker_guide;
  }

  async callLLM(prompt) {
    // Try OpenClaw's LLM API first
    try {
      const response = await axios.post('http://localhost:3000/api/llm/summarize', {
        prompt: prompt,
        model: this.model
      }, { timeout: 30000 });
      
      return response.data;
    } catch (e) {
      // Fallback: try direct OpenAI-compatible endpoint
      try {
        const response = await axios.post(process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions', {
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 4000
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });
        
        return response.data.choices[0].message.content;
      } catch (e2) {
        throw new Error('All LLM APIs failed');
      }
    }
  }

  /**
   * Parse JSON from LLM response
   */
  parseJSONResponse(responseText) {
    try {
      // Try direct parse first
      return JSON.parse(responseText);
    } catch (e) {
      // Try to extract JSON from markdown
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) ||
                       responseText.match(/```\n([\s\S]*?)\n```/) ||
                       responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } catch (e2) {
          console.error('Failed to parse JSON:', jsonMatch);
          return null;
        }
      }
      return null;
    }
  }
}

module.exports = AISummarizer;
