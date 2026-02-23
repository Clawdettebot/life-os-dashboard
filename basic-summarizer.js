/**
 * Basic Content Summarizer - No AI required
 * Extracts key information from raw content
 */

class BasicSummarizer {
  /**
   * Create a summary from raw content for each section
   */
  summarizeForSection(rawContent, section, title) {
    if (!rawContent) return null;

    switch (section) {
      case 'howls_kitchen':
        return this.summarizeRecipe(rawContent, title);
      case 'hitchhiker_guide':
        return this.summarizeHowTo(rawContent, title);
      case 'emerald_tablets':
        return this.summarizeHistory(rawContent, title);
      case 'all_spark':
        return this.summarizeIdea(rawContent, title);
      default:
        return this.summarizeGeneric(rawContent, title);
    }
  }

  summarizeRecipe(content, title) {
    const lines = content.split('\n').filter(l => l.trim());
    
    // Extract ingredients (look for list items)
    const ingredients = [];
    const ingredientPatterns = [/^[-•*]\s*(.+)/, /^(\d+\s+\w+\s+(?:of\s+)?.+)/];
    
    let inIngredients = false;
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes('ingredient')) {
        inIngredients = true;
        continue;
      }
      if (inIngredients && line.match(/^[A-Z]/)) {
        ingredients.push({ item: line.trim(), amount: '', notes: '' });
      }
      if (inIngredients && line.match(/^\s*$/)) break;
    }

    // Extract steps
    const steps = [];
    const stepPatterns = [/(\d+)[\.\)]\s*(.+)/, /step\s+(\d+)[:\s]+(.+)/i];
    for (const line of lines) {
      const match = line.match(/(\d+)[\.\)]\s*(.+)/);
      if (match) {
        steps.push({ step: parseInt(match[1]), instruction: match[2].trim(), time: '' });
      }
    }

    // Estimate difficulty
    const difficulty = content.toLowerCase().includes('expert') ? 'advanced' :
                      content.toLowerCase().includes('beginner') ? 'beginner' : 'intermediate';

    // Extract times
    const timeMatch = content.match(/(\d+)\s*(hour|min|minute|second)/gi);
    const times = timeMatch ? timeMatch.join(', ') : 'Not specified';

    return {
      title: title,
      content_type: 'recipe',
      ingredients: ingredients.length > 0 ? ingredients : [{ item: 'See source for ingredients', amount: '', notes: '' }],
      steps: steps.length > 0 ? steps : [{ step: 1, instruction: 'See source for full instructions', time: '' }],
      tips: this.extractTips(content),
      prep_time: this.extractTime(content, ['prep', 'preparation']),
      cook_time: this.extractTime(content, ['cook', 'cooking', 'total time']),
      difficulty: difficulty,
      servings: this.extractServings(content),
      cuisine: this.extractCuisine(content),
      summary: this.createSummary(content, 200)
    };
  }

  summarizeHowTo(content, title) {
    const lines = content.split('\n').filter(l => l.trim());
    
    // Extract materials
    const materials = [];
    let inMaterials = false;
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes('material')) {
        inMaterials = true;
        continue;
      }
      if (inMaterials && line.match(/^[-•*]/)) {
        materials.push(line.replace(/^[-•*]\s*/, '').trim());
      }
      if (inMaterials && line.match(/^[A-Z][a-z]/)) break;
    }

    // Extract tools
    const tools = [];
    let inTools = false;
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes('tool')) {
        inTools = true;
        continue;
      }
      if (inTools && line.match(/^[-•*]/)) {
        tools.push(line.replace(/^[-•*]\s*/, '').trim());
      }
      if (inTools && line.match(/^[A-Z][a-z]/)) break;
    }

    // Extract steps
    const steps = [];
    for (const line of lines) {
      const match = line.match(/(\d+)[\.\)]\s*(.+)/);
      if (match) {
        steps.push({ step: parseInt(match[1]), instruction: match[2].trim(), time: '' });
      }
    }

    // Extract warnings
    const warnings = this.extractWarnings(content);

    // Difficulty
    const difficulty = content.toLowerCase().includes('beginner') ? 'beginner' :
                      content.toLowerCase().includes('advanced') ? 'advanced' : 'intermediate';

    return {
      title: title,
      content_type: 'howto',
      materials: materials,
      tools_needed: tools,
      steps: steps.length > 0 ? steps : [{ step: 1, instruction: 'See source for full instructions', time: '' }],
      warnings: warnings,
      difficulty: difficulty,
      time_estimate: this.extractTime(content, ['time', 'hour', 'minute']),
      pro_tips: this.extractTips(content),
      summary: this.createSummary(content, 200)
    };
  }

  summarizeHistory(content, title) {
    // Extract dates/years
    const years = content.match(/\b(19|20)\d{2}\b/g) || [];
    const uniqueYears = [...new Set(years)].sort();

    // Extract locations
    const locations = this.extractLocations(content);

    // Extract names (capitalized words)
    const names = this.extractNames(content);

    return {
      title: title,
      content_type: 'history',
      event_date: uniqueYears[0] || 'Unknown',
      location: locations[0] || null,
      key_figures: names.slice(0, 5),
      significance: content.toLowerCase().includes('major') ? 'major' : 
                   content.toLowerCase().includes('important') ? 'major' : 'personal',
      summary: this.createSummary(content, 300),
      timeline_events: uniqueYears.map(y => ({ year: y, event: `See source for ${y} events` })),
      context: this.createSummary(content, 150)
    };
  }

  summarizeIdea(content, title) {
    const text = (title + ' ' + content).toLowerCase();
    
    // Detect content type
    let contentType = 'idea';
    if (text.includes('film') || text.includes('movie') || text.includes('script')) contentType = 'film';
    else if (text.includes('skit') || text.includes('comedy')) contentType = 'skit';
    else if (text.includes('rant') || text.includes('opinion')) contentType = 'rant';
    else if (text.includes('blog') || text.includes('article')) contentType = 'blog';
    else if (text.includes('song') || text.includes('lyric') || text.includes('beat')) contentType = 'music';
    else if (text.includes('character')) contentType = 'character';
    
    return {
      title: title,
      content_type: contentType,
      category: this.detectAllSparkCategory(text),
      core_idea: this.createSummary(content, 150),
      inspiration: this.extractInspiration(content),
      applications: this.extractApplications(content),
      mood_keywords: this.extractMood(content),
      key_points: this.extractKeyPointsSimple(content),
      summary: this.createSummary(content, 300),
      status: 'idea'
    };
  }
  
  detectAllSparkCategory(text) {
    const categories = {
      film: ['film', 'movie', 'script', 'scene', 'director'],
      skit: ['skit', 'comedy', 'sketch', 'joke', 'humor'],
      rant: ['rant', 'opinion', 'take', 'frustrated'],
      blog: ['blog', 'article', 'post', 'write'],
      music: ['song', 'lyrics', 'verse', 'beat', 'hook', 'melody'],
      character: ['character', 'persona', 'avatar'],
      idea: ['idea', 'concept', 'brainstorm']
    };
    
    for (const [cat, keywords] of Object.entries(categories)) {
      if (keywords.some(k => text.includes(k))) return cat;
    }
    return 'general';
  }
  
  extractKeyPointsSimple(content) {
    const points = [];
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.match(/^[-•*]\s/) || line.match(/^\d+[\.\)]\s/)) {
        points.push(line.replace(/^[-•*\d\.\)]\s*/, '').trim());
      }
    }
    return points.length > 0 ? points.slice(0, 5) : null;
  }

  summarizeGeneric(content, title) {
    return {
      title: title,
      content: this.createSummary(content, 500),
      summary: this.createSummary(content, 200)
    };
  }

  // Helper methods
  createSummary(content, maxLength) {
    if (!content) return '';
    // Clean and truncate
    const cleaned = content.replace(/\s+/g, ' ').trim();
    if (cleaned.length <= maxLength) return cleaned;
    return cleaned.substring(0, maxLength - 3) + '...';
  }

  extractTime(content, keywords) {
    for (const keyword of keywords) {
      const match = content.match(new RegExp(`(\\d+)\\s*${keyword}`, 'i'));
      if (match) return match[0];
    }
    return null;
  }

  extractServings(content) {
    const match = content.match(/(\d+)\s*(?:servings?|portion)/i);
    return match ? parseInt(match[1]) : null;
  }

  extractCuisine(content) {
    const cuisines = ['italian', 'mexican', 'chinese', 'japanese', 'korean', 'indian', 'american', 'french', 'thai', 'vietnamese', 'southern', 'mediterranean'];
    for (const cuisine of cuisines) {
      if (content.toLowerCase().includes(cuisine)) return cuisine;
    }
    return null;
  }

  extractTips(content) {
    const tips = [];
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('tip') || line.toLowerCase().includes('pro ') || line.toLowerCase().includes('note:')) {
        tips.push(line.trim());
      }
    }
    return tips.slice(0, 5);
  }

  extractWarnings(content) {
    const warnings = [];
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('warning') || line.toLowerCase().includes('caution') || line.toLowerCase().includes('danger')) {
        warnings.push(line.trim());
      }
    }
    return warnings;
  }

  extractLocations(content) {
    const locationPatterns = [
      /(?:in|at|from|located in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
      /(Oakland|San Francisco|Los Angeles|New York|Atlanta|Memphis|Chicago|Bay Area)/gi
    ];
    const locations = [];
    for (const pattern of locationPatterns) {
      const matches = content.match(pattern);
      if (matches) locations.push(...matches);
    }
    return [...new Set(locations)];
  }

  extractNames(content) {
    const nameRegex = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;
    const names = [];
    let match;
    const skip = ['The', 'This', 'That', 'What', 'When', 'Where', 'How', 'Why', 'Which', 'Step', 'First', 'Next', 'Then', 'Also', 'Note', 'Warning'];
    while ((match = nameRegex.exec(content)) && names.length < 10) {
      if (!skip.includes(match[1])) names.push(match[1]);
    }
    return names;
  }

  extractInspiration(content) {
    const patterns = [
      /inspired by[:\s]+([^\n.]+)/i,
      /inspiration[:\s]+([^\n.]+)/i,
      /based on[:\s]+([^\n.]+)/i
    ];
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return match[1].trim();
    }
    return null;
  }

  extractApplications(content) {
    const apps = [];
    if (content.toLowerCase().includes('use')) {
      const lines = content.split('\n');
      for (const line of lines) {
        if (line.toLowerCase().includes('use') && line.match(/^[-•*]/)) {
          apps.push(line.replace(/^[-•*]\s*/, '').trim());
        }
      }
    }
    return apps.slice(0, 5);
  }

  extractMood(content) {
    const moods = ['bold', 'dark', 'bright', 'retro', 'futuristic', 'nostalgic', 'minimal', 'chaotic', 'peaceful', 'energetic', 'warm', 'cool', 'edgy', 'soft'];
    return moods.filter(m => content.toLowerCase().includes(m));
  }
}

module.exports = BasicSummarizer;
