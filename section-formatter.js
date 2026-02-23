/**
 * Knowledge Knaight - Smart Section Formatter
 * Handles section-specific formatting for each Cortex section
 */

const { v4: uuidv4 } = require('crypto').randomUUID ? () => 'ctx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9) : () => require('uuid').v4();

class SectionFormatter {
  constructor() {
    // Keywords for auto-detecting sections
    this.sectionKeywords = {
      hitchhiker_guide: [
        'how to', 'tutorial', 'guide', 'diy', 'build', 'make', 'fix', 'repair',
        'install', 'setup', 'configure', 'learn', 'step by step', 'instructions',
        'recipe', 'cook', 'garden', 'survival', 'craft', 'hack', 'tips', 'tricks'
      ],
      emerald_tablets: [
        'history', 'historical', 'heritage', 'culture', 'origin', 'timeline',
        'born', 'founded', 'established', 'first', 'legacy', 'tradition', 'roots',
        'ancestors', 'family', 'milestone', 'anniversary', 'movement', 'era'
      ],
      all_spark: [
        'idea', 'concept', 'inspired', 'creative', 'brainstorm', 'vision',
        'imagine', 'possibility', 'innovation', 'invention', 'design', 'art',
        'music', 'story', 'character', 'worldbuilding', 'future', 'dream',
        // All Spark specific types
        'film', 'movie', 'script', 'skit', 'comedy', 'joke', 'rant', 'blog', 'topic',
        'song', 'verse', 'hook', 'beat', 'lyrics', 'mood', 'vibe'
      ],
      howls_kitchen: [
        'recipe', 'ingredients', 'cook', 'bake', 'food', 'restaurant', 'eat',
        'dinner', 'lunch', 'breakfast', 'meal', 'delicious', 'tasty', 'flavor',
        'cuisine', 'dish', 'kitchen', 'chef', 'yummy', 'menu', 'review'
      ]
    };

    // Platform to section mapping hints
    this.platformHints = {
      'youtube': 'hitchhiker_guide', // Default YouTube to how-tos
      'tiktok': 'all_spark', // Creative content
      'instagram': 'all_spark', // Creative/visual
      'twitter': 'emerald_tablets', // News/history
      'article': null // Need content analysis
    };
  }

  /**
   * Detect the best section based on content
   */
  detectSection(extracted, explicitSection = null) {
    if (explicitSection) {
      return this.normalizeSection(explicitSection);
    }

    const text = (extracted.title + ' ' + (extracted.content || '')).toLowerCase();
    const platform = extracted.platform;

    // Don't use platform hints - let content analysis decide
    // (YouTube cooking videos should go to Howl's Kitchen, not Hitchhiker's Guide)

    // Score each section - with weighted priorities
    const scores = {
      hitchhiker_guide: 0,
      emerald_tablets: 0,
      all_spark: 0,
      howls_kitchen: 0
    };

    for (const [section, keywords] of Object.entries(this.sectionKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          // Weight food/cooking keywords higher for Howl's Kitchen
          if (section === 'howls_kitchen' && ['cook', 'recipe', 'steak', 'food', 'restaurant', 'bake', 'fry', 'grill', 'kitchen', 'chef', 'ingredients', 'meal', 'dinner', 'lunch', 'breakfast', 'delicious', 'cuisine'].includes(keyword)) {
            scores[section] += 3; // Higher weight for food-specific keywords
          } else {
            scores[section] += 1;
          }
        }
      }
    }

    // HOWL'S KITCHEN PRIORITY: Only actual cooking/recipes go to Howl's Kitchen
    const cookingKeywords = ['cook', 'recipe', 'steak', 'bake', 'fry', 'grill', 'kitchen', 'chef', 'ingredients', 'meal prep', 'cooking'];
    const hasCookingContent = cookingKeywords.some(k => text.includes(k));
    
    if (hasCookingContent) {
      return 'howls_kitchen';
    }
    
    // HISTORY PRIORITY: Food history, culture, origins go to Emerald Tablets
    const historyKeywords = ['history', 'historical', 'origin', 'culture', 'tradition', 'story', 'heritage', 'evolution', 'background'];
    const hasHistoryContent = historyKeywords.some(k => text.includes(k));
    
    if (hasHistoryContent) {
      return 'emerald_tablets';
    }
    
    // Food-related but not cooking = Emerald Tablets (food history/culture)
    const foodKeywords = ['food', 'restaurant', 'cuisine', 'dish', 'gumbo', 'soup', 'stew', 'sauce'];
    if (foodKeywords.some(k => text.includes(k))) {
      return 'emerald_tablets';
    }
    
    // YouTube cooking videos should go to Howl's Kitchen as recipes
    if (extracted.platform === 'youtube' && (text.includes('recipe') || text.includes('how to cook') || text.includes('chef'))) {
      return 'howls_kitchen';
    }

    // Find highest score for non-food content
    const maxSection = Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b);
    
    if (maxSection[1] === 0) {
      return 'all_spark'; // Default to creative
    }

    return maxSection[0];
  }

  normalizeSection(section) {
    const s = section.toLowerCase().replace('#', '').trim();
    const mapping = {
      'hitchhiker': 'hitchhiker_guide',
      'hitchhikers': 'hitchhiker_guide',
      'guide': 'hitchhiker_guide',
      'emerald': 'emerald_tablets',
      'tablets': 'emerald_tablets',
      'history': 'emerald_tablets',
      'heritage': 'emerald_tablets',
      'allspark': 'all_spark',
      'all_spark': 'all_spark',
      'spark': 'all_spark',
      'creative': 'all_spark',
      'howl': 'howls_kitchen',
      'howls': 'howls_kitchen',
      'kitchen': 'howls_kitchen',
      'food': 'howls_kitchen',
      'recipe': 'howls_kitchen',
      'restaurant': 'howls_kitchen'
    };
    return mapping[s] || 'all_spark';
  }

  /**
   * Format content according to section schema
   */
  formatForSection(section, extracted, messageContext = {}) {
    switch (section) {
      case 'hitchhiker_guide':
        return this.formatHitchhiker(extracted, messageContext);
      case 'emerald_tablets':
        return this.formatEmerald(extracted, messageContext);
      case 'all_spark':
        return this.formatAllSpark(extracted, messageContext);
      case 'howls_kitchen':
        return this.formatHowlsKitchen(extracted, messageContext);
      default:
        return this.formatGeneric(extracted);
    }
  }

  /**
   * Hitchhiker's Guide - How-To / DIY
   */
  formatHitchhiker(extracted, context) {
    // Extract potential steps, materials from content
    const content = extracted.content || '';
    
    // Simple extraction - in production, use AI
    const steps = this.extractSteps(content);
    const materials = this.extractMaterials(content);
    
    // Determine difficulty from content
    const difficulty = this.assessDifficulty(content);

    return {
      title: extracted.title || 'Untitled Guide',
      section: 'hitchhiker_guide',
      content_type: 'howto',
      difficulty: difficulty,
      time_estimate: extracted.metadata?.duration || 'Unknown',
      materials: materials,
      steps: steps,
      warnings: this.extractWarnings(content),
      summary: this.generateSummary(content),
      source_url: extracted.url,
      source_platform: extracted.platform,
      tags: this.generateTags(extracted),
      rating: null,
      status: 'active',
      metadata: {
        author: extracted.author,
        ...extracted.metadata
      }
    };
  }

  /**
   * Emerald Tablets - History & Heritage
   */
  formatEmerald(extracted, context) {
    const content = extracted.content || '';
    
    return {
      title: extracted.title || 'Historical Entry',
      section: 'emerald_tablets',
      content_type: 'history',
      event_date: extracted.metadata?.publishDate || null,
      location: this.extractLocation(content),
      category: this.categorizeHistory(content),
      significance: this.assessSignificance(content),
      key_figures: this.extractNames(content),
      summary: this.generateSummary(content),
      timeline_events: this.extractTimeline(content),
      sources: [extracted.url],
      tags: this.generateTags(extracted),
      status: 'active',
      metadata: {
        author: extracted.author,
        ...extracted.metadata
      }
    };
  }

  /**
   * The All Spark - Creative Ideas
   * Handles: film projects, skits, rants, blog starters, music ideas, characters, general ideas
   */
  formatAllSpark(extracted, context) {
    const content = extracted.content || '';
    const title = extracted.title || '';
    const text = (title + ' ' + content).toLowerCase();
    
    // Detect content type based on keywords
    let contentType = 'idea';
    let category = 'general';
    
    if (text.includes('film') || text.includes('movie') || text.includes('script') || text.includes('scene')) {
      contentType = 'film';
      category = this.detectFilmGenre(text);
    } else if (text.includes('skit') || text.includes('sketch') || text.includes('sketch')) {
      contentType = 'skit';
      category = 'comedy';
    } else if (text.includes('joke') || text.includes('comedian') || text.includes('standup') || text.includes('punchline')) {
      contentType = 'joke';
      category = 'comedy';
    } else if (text.includes('rant') || text.includes('opinion') || text.includes('take') || text.includes('frustrat')) {
      contentType = 'rant';
      category = 'commentary';
    } else if (text.includes('blog') || text.includes('article') || text.includes('post') || text.includes('write')) {
      contentType = 'blog';
      category = 'thought leadership';
    } else if (text.includes('song') || text.includes('lyric') || text.includes('verse') || text.includes('hook') || text.includes('beat')) {
      contentType = 'music';
      category = this.detectMusicGenre(text);
    } else if (text.includes('character') || text.includes('persona') || text.includes('avatar')) {
      contentType = 'character';
      category = 'original';
    } else {
      // Default to general idea
      contentType = 'idea';
      category = this.categorizeCreative(content);
    }
    
    return {
      title: extracted.title || 'Creative Idea',
      section: 'all_spark',
      content_type: contentType,
      category: category,
      
      // Common fields
      core_idea: this.generateSummary(content) || this.extractCoreIdea(title + ' ' + content),
      inspiration: this.extractInspiration(content),
      mood_keywords: this.extractMoodKeywords(content),
      
      // Film specific
      logline: this.extractLogline(content),
      plot_summary: this.extractPlot(content),
      characters: this.extractCharacters(content),
      
      // Skit specific
      concept: this.extractConcept(content),
      setting: this.extractSetting(content),
      
      // Rant specific
      topic: this.extractTopic(title, content),
      key_points: this.extractKeyPoints(content),
      
      // Blog specific
      hook: this.extractHook(content),
      outline: this.extractOutline(content),
      
      // Music specific
      genre: this.detectMusicGenre(text),
      hook_line: this.extractHookLine(content),
      
      // Character specific
      character_name: this.extractCharacterName(title),
      backstory: this.extractBackstory(content),
      personality: this.extractPersonality(content),
      
      // General
      references: extracted.url ? [extracted.url] : [],
      related_entries: [],
      tags: this.generateTags(extracted),
      status: 'idea', // idea, in_progress, complete
      metadata: {
        author: extracted.author,
        source_platform: extracted.platform,
        ...extracted.metadata
      }
    };
  }
  
  detectFilmGenre(text) {
    if (text.includes('action') || text.includes('fight')) return 'action';
    if (text.includes('comedy') || text.includes('funny')) return 'comedy';
    if (text.includes('drama')) return 'drama';
    if (text.includes('horror') || text.includes('scary')) return 'horror';
    if (text.includes('sci-fi') || text.includes('space') || text.includes('future')) return 'sci-fi';
    if (text.includes('romance') || text.includes('love')) return 'romance';
    if (text.includes('thriller') || text.includes('suspense')) return 'thriller';
    return 'drama';
  }
  
  detectMusicGenre(text) {
    if (text.includes('hip-hop') || text.includes('rap')) return 'hip-hop';
    if (text.includes('r&b') || text.includes('soul')) return 'r&b';
    if (text.includes('pop')) return 'pop';
    if (text.includes('rock')) return 'rock';
    if (text.includes('jazz')) return 'jazz';
    return 'hip-hop';
  }
  
  extractCoreIdea(text) {
    // Try to extract the main idea
    const firstSentence = text.split(/[.!?]/)[0];
    return firstSentence.length < 200 ? firstSentence : text.substring(0, 200);
  }
  
  extractLogline(content) {
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('logline') || line.toLowerCase().includes('premise')) {
        return line.replace(/logline[:\s]*/i, '').trim();
      }
    }
    return null;
  }
  
  extractPlot(content) {
    const plotKeywords = ['plot', 'story', 'synopsis'];
    const lines = content.split('\n');
    let inPlot = false;
    let plot = [];
    
    for (const line of lines) {
      if (plotKeywords.some(k => line.toLowerCase().includes(k))) {
        inPlot = true;
        continue;
      }
      if (inPlot && line.match(/^[A-Z]/)) {
        plot.push(line.trim());
      }
    }
    return plot.length > 0 ? plot.join('\n') : null;
  }
  
  extractCharacters(content) {
    const charKeywords = ['character', 'person', 'protagonist', 'antagonist'];
    const characters = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (charKeywords.some(k => line.toLowerCase().includes(k))) {
        const name = line.replace(/character[s]?[:\s]*/i, '').trim();
        if (name && name.length < 50) characters.push(name);
      }
    }
    return characters.length > 0 ? characters : null;
  }
  
  extractConcept(content) {
    const conceptMatch = content.match(/concept[:\s]+([^\n]+)/i);
    return conceptMatch ? conceptMatch[1].trim() : null;
  }
  
  extractSetting(content) {
    const settingKeywords = ['setting', 'location', 'scene', 'where'];
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (settingKeywords.some(k => line.toLowerCase().includes(k))) {
        return line.replace(/setting[s]?[:\s]*/i, '').trim();
      }
    }
    return null;
  }
  
  extractTopic(title, content) {
    return title || 'Untitled Rant';
  }
  
  extractKeyPoints(content) {
    const points = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.match(/^[-•*]\s/) || line.match(/^\d+[\.\)]\s/)) {
        points.push(line.replace(/^[-•*\d\.\)]\s*/, '').trim());
      }
    }
    return points.length > 0 ? points : null;
  }
  
  extractHook(content) {
    const hookMatch = content.match(/hook[:\s]+([^\n]+)/i);
    return hookMatch ? hookMatch[1].trim() : null;
  }
  
  extractOutline(content) {
    const outlineKeywords = ['outline', 'points', 'section'];
    const outline = [];
    const lines = content.split('\n');
    let inOutline = false;
    
    for (const line of lines) {
      if (outlineKeywords.some(k => line.toLowerCase().includes(k))) {
        inOutline = true;
        continue;
      }
      if (inOutline && line.match(/^[-•*]/)) {
        outline.push(line.replace(/^[-•*]\s*/, '').trim());
      }
    }
    return outline.length > 0 ? outline : null;
  }
  
  extractHookLine(content) {
    const hookMatch = content.match(/hook[:\s]+([^\n]+)/i) || content.match(/hook line[:\s]+([^\n]+)/i);
    return hookMatch ? hookMatch[1].trim() : null;
  }
  
  extractCharacterName(title) {
    // Try to extract character name from title
    const match = title.match(/(?:character|portrait|profile)[:\s]+([^\n-]+)/i);
    return match ? match[1].trim() : title;
  }
  
  extractBackstory(content) {
    const backstoryKeywords = ['backstory', 'history', 'origin', 'past'];
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (backstoryKeywords.some(k => line.toLowerCase().includes(k))) {
        return line.replace(/backstory[:\s]*/i, '').trim();
      }
    }
    return null;
  }
  
  extractPersonality(content) {
    const personalityKeywords = ['personality', 'trait', '性格'];
    const traits = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (personalityKeywords.some(k => line.toLowerCase().includes(k))) {
        traits.push(line.replace(/personality[:\s]*/i, '').trim());
      }
    }
    return traits.length > 0 ? traits : null;
  }

  /**
   * Howl's Kitchen - Recipes & Restaurants
   */
  formatHowlsKitchen(extracted, context) {
    const content = extracted.content || '';
    const title = extracted.title || '';
    
    // It's a recipe if:
    // 1. Has recipe keywords in content, OR
    // 2. Is a YouTube video with cooking-related title
    const isRecipe = this.isRecipe(content) || 
      (extracted.platform === 'youtube' && 
       (title.toLowerCase().includes('recipe') || 
        title.toLowerCase().includes('how to cook') ||
        title.toLowerCase().includes('how to make') ||
        title.toLowerCase().includes('cook ') ||
        title.toLowerCase().includes('baking') ||
        title.toLowerCase().includes('chef')));
    
    if (isRecipe) {
      return {
        title: extracted.title || 'Recipe',
        section: 'howls_kitchen',
        content_type: 'recipe',
        category: this.categorizeRecipe(content),
        cuisine: this.extractCuisine(content),
        ingredients: this.extractIngredients(content),
        steps: this.extractRecipeSteps(content),
        tips: this.extractTips(content),
        servings: null,
        cook_time: extracted.metadata?.duration || null,
        difficulty: this.assessDifficulty(content),
        cooked_count: 0,
        last_cooked: null,
        rating: null,
        source: extracted.url,
        status: 'active',
        metadata: {
          author: extracted.author,
          ...extracted.metadata
        }
      };
    } else {
      // Restaurant review
      return {
        title: extracted.title || 'Restaurant Review',
        section: 'howls_kitchen',
        content_type: 'review',
        restaurant_name: this.extractRestaurantName(extracted.title || content),
        location: this.extractLocation(content),
        visit_date: new Date().toISOString().split('T')[0],
        rating: null,
        price_range: null,
        best_dishes: this.extractDishes(content),
        notes: this.generateSummary(content),
        would_return: null,
        photos: [],
        status: 'active',
        metadata: {
          author: extracted.author,
          ...extracted.metadata
        }
      };
    }
  }

  formatGeneric(extracted) {
    return {
      title: extracted.title || 'Knowledge Entry',
      section: 'all_spark',
      content_type: extracted.platform || 'note',
      content: this.generateSummary(extracted.content || ''),
      source_url: extracted.url,
      source_platform: extracted.platform,
      tags: this.generateTags(extracted),
      status: 'active',
      metadata: extracted.metadata || {}
    };
  }

  // ============ HELPER METHODS ============

  generateSummary(content) {
    if (!content) return '';
    // Take first 500 chars as summary
    const cleaned = content.replace(/\s+/g, ' ').trim();
    return cleaned.length > 500 ? cleaned.substring(0, 497) + '...' : cleaned;
  }

  generateTags(extracted) {
    const tags = new Set();
    const text = (extracted.title + ' ' + (extracted.content || '')).toLowerCase();
    
    // Add platform as tag
    if (extracted.platform) tags.add(extracted.platform);
    
    // Add detected keywords as tags
    for (const [section, keywords] of Object.entries(this.sectionKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          tags.add(keyword);
        }
      }
    }
    
    return Array.from(tags).slice(0, 10);
  }

  extractSteps(content) {
    // Simple step extraction - look for numbered lists
    const stepRegex = /(\d+[\.\)]\s*|[•]\s*)([^\n]+)/g;
    const steps = [];
    let match;
    while ((match = stepRegex.exec(content)) && steps.length < 20) {
      steps.push(match[2].trim());
    }
    return steps.length > 0 ? steps : ['Review content for steps'];
  }

  extractMaterials(content) {
    const materialsSection = content.toLowerCase().includes('materials');
    if (!materialsSection) return [];
    
    const lines = content.split('\n');
    const materials = [];
    let inMaterials = false;
    
    for (const line of lines) {
      if (line.toLowerCase().includes('materials')) {
        inMaterials = true;
        continue;
      }
      if (inMaterials && line.match(/^[A-Z]/)) {
        materials.push(line.trim());
      }
      if (inMaterials && line.match(/^\s*$/)) {
        break;
      }
    }
    
    return materials;
  }

  extractWarnings(content) {
    const warnings = [];
    const warningKeywords = ['warning', 'caution', 'danger', 'not recommended', 'avoid'];
    
    const lines = content.split('\n');
    for (const line of lines) {
      if (warningKeywords.some(k => line.toLowerCase().includes(k))) {
        warnings.push(line.trim());
      }
    }
    return warnings;
  }

  assessDifficulty(content) {
    const text = content.toLowerCase();
    if (text.includes('beginner') || text.includes('easy') || text.includes('simple')) return 'beginner';
    if (text.includes('advanced') || text.includes('expert') || text.includes('difficult')) return 'advanced';
    return 'intermediate';
  }

  extractLocation(content) {
    // Simple location extraction
    const locationPatterns = [
      /(?:in|at|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+CA|\s+NY|\s+TX|\s+CA|\s+USA)?)/g,
      /(Oakland|San Francisco|Los Angeles|New York|Atlanta|Memphis)/gi
    ];
    
    for (const pattern of locationPatterns) {
      const match = pattern.exec(content);
      if (match) return match[1];
    }
    return null;
  }

  categorizeHistory(content) {
    const text = content.toLowerCase();
    if (text.includes('hip-hop') || text.includes('rap') || text.includes('music')) return 'hip-hop';
    if (text.includes('filipino') || text.includes('philippines')) return 'filipino';
    if (text.includes('oakland') || text.includes('bay area')) return 'oakland';
    if (text.includes('family') || text.includes('ancestor')) return 'family';
    return 'general';
  }

  assessSignificance(content) {
    const text = content.toLowerCase();
    if (text.includes('major') || text.includes('important') || text.includes('milestone')) return 'major';
    if (text.includes('minor') || text.includes('small')) return 'minor';
    return 'personal';
  }

  extractNames(content) {
    // Look for capitalized words that might be names
    const nameRegex = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g;
    const names = [];
    let match;
    const seen = new Set();
    
    while ((match = nameRegex.exec(content)) && names.length < 10) {
      const name = match[1];
      if (!seen.has(name) && name.length > 2 && !['The', 'This', 'That', 'What', 'When'].includes(name)) {
        names.push(name);
        seen.add(name);
      }
    }
    return names;
  }

  extractTimeline(content) {
    // Extract year-based events
    const yearRegex = /(\d{4})[^\d]*([^\n.]+)/g;
    const events = [];
    let match;
    
    while ((match = yearRegex.exec(content)) && events.length < 10) {
      events.push({
        year: match[1],
        event: match[2].trim().substring(0, 100)
      });
    }
    return events;
  }

  categorizeCreative(content) {
    const text = content.toLowerCase();
    if (text.includes('music') || text.includes('song') || text.includes('beat')) return 'music';
    if (text.includes('fashion') || text.includes('clothing') || text.includes('wear')) return 'fashion';
    if (text.includes('art') || text.includes('design') || text.includes('visual')) return 'art';
    if (text.includes('story') || text.includes('character') || text.includes('plot')) return 'storytelling';
    if (text.includes('food') || text.includes('recipe')) return 'culinary';
    return 'general';
  }

  extractInspiration(content) {
    const inspirationPatterns = [
      /inspired by[:\s]+([^\n.]+)/i,
      /inspiration[:\s]+([^\n.]+)/i,
      /based on[:\s]+([^\n.]+)/i
    ];
    
    for (const pattern of inspirationPatterns) {
      const match = pattern.exec(content);
      if (match) return match[1].trim();
    }
    return null;
  }

  extractMoodKeywords(content) {
    const moods = ['bold', 'dark', 'bright', 'retro', 'futuristic', 'nostalgic', 'minimal', 'chaotic', 'peaceful', 'energetic'];
    const found = moods.filter(m => content.toLowerCase().includes(m));
    return found.length > 0 ? found : ['creative'];
  }

  isRecipe(content) {
    const recipeKeywords = ['ingredients', 'instructions', 'steps', 'directions', 'prep time', 'cook time', 'bake', 'fry', 'simmer'];
    return recipeKeywords.some(k => content.toLowerCase().includes(k));
  }

  categorizeRecipe(content) {
    const text = content.toLowerCase();
    if (text.includes('chicken') || text.includes('beef') || text.includes('pork')) return 'meat';
    if (text.includes('fish') || text.includes('salmon') || text.includes('shrimp')) return 'seafood';
    if (text.includes('vegan') || text.includes('vegetable') || text.includes('salad')) return 'vegan';
    if (text.includes('pasta') || text.includes('pizza') || text.includes('italian')) return 'italian';
    if (text.includes('dessert') || text.includes('cake') || text.includes('sweet')) return 'dessert';
    return 'general';
  }

  extractCuisine(content) {
    const cuisines = ['italian', 'mexican', 'chinese', 'japanese', 'korean', 'indian', 'southern', 'french', 'thai', 'vietnamese'];
    for (const cuisine of cuisines) {
      if (content.toLowerCase().includes(cuisine)) return cuisine;
    }
    return null;
  }

  extractIngredients(content) {
    // Look for list-like content after "ingredients"
    const ingredientRegex = /^[-•*]\s*([^\n]+)/gm;
    const ingredients = [];
    let match;
    
    while ((match = ingredientRegex.exec(content)) && ingredients.length < 30) {
      ingredients.push({ item: match[1].trim(), amount: '', notes: '' });
    }
    
    return ingredients.length > 0 ? ingredients : [];
  }

  extractRecipeSteps(content) {
    const steps = this.extractSteps(content);
    return steps.map((step, i) => ({ step: i + 1, instruction: step, time: '' }));
  }

  extractTips(content) {
    const tipKeywords = ['tip', 'pro tip', 'note', 'suggestion', 'advice'];
    const tips = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (tipKeywords.some(k => line.toLowerCase().includes(k))) {
        tips.push(line.trim());
      }
    }
    return tips;
  }

  extractRestaurantName(title) {
    // Try to extract restaurant name from title
    const patterns = [
      /review[:\s]+([^\n-]+)/i,
      /([A-Z][a-z]+[']?[A-Za-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:review|restaurant|cafe|bar|grill)/i
    ];
    
    for (const pattern of patterns) {
      const match = pattern.exec(title);
      if (match) return match[1].trim();
    }
    return title || 'Unknown Restaurant';
  }

  extractDishes(content) {
    const dishRegex = /(?:best|favorite|dishes|recommend)[:\s]+([^\n.]+)/gi;
    const dishes = [];
    let match;
    
    while ((match = dishRegex.exec(content)) && dishes.length < 5) {
      dishes.push(match[1].trim());
    }
    return dishes;
  }
}

module.exports = SectionFormatter;
