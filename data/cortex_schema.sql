-- Cortex Knowledge Base Schema
-- Vector embeddings + structured metadata

-- Main knowledge entries table
CREATE TABLE cortex_entries (
    id TEXT PRIMARY KEY,
    title TEXT,
    content TEXT NOT NULL,
    content_type TEXT NOT NULL, -- article, video, tweet, pdf, note
    source_url TEXT,
    source_platform TEXT, -- youtube, twitter, web, pdf, telegram
    section TEXT NOT NULL, -- emerald_tablets, hitchhiker_guide, all_spark, howls_kitchen
    category TEXT, -- sub-category within section
    tags TEXT, -- JSON array
    entities TEXT, -- JSON array of extracted entities
    embedding BLOB, -- vector embedding for semantic search
    metadata TEXT, -- JSON: author, publish_date, duration, etc.
    user_rating INTEGER, -- 1-5 stars (for reviews)
    status TEXT DEFAULT 'active', -- active, archived, cooking, wishlist
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Timeline events (for Emerald Tablets history section)
CREATE TABLE cortex_timeline (
    id TEXT PRIMARY KEY,
    entry_id TEXT,
    event_date INTEGER, -- timestamp
    event_title TEXT,
    event_description TEXT,
    category TEXT, -- african_american, filipino, oakland, hiphop, family
    location TEXT,
    significance TEXT, -- major, minor, personal
    sources TEXT, -- JSON array
    created_at INTEGER,
    FOREIGN KEY (entry_id) REFERENCES cortex_entries(id)
);

-- Connections between ideas (for All Spark)
CREATE TABLE cortex_connections (
    id TEXT PRIMARY KEY,
    source_entry_id TEXT,
    target_entry_id TEXT,
    connection_type TEXT, -- inspired_by, related_to, evolved_from, contradicts
    strength REAL, -- 0.0 to 1.0
    notes TEXT,
    created_at INTEGER,
    FOREIGN KEY (source_entry_id) REFERENCES cortex_entries(id),
    FOREIGN KEY (target_entry_id) REFERENCES cortex_entries(id)
);

-- Recipe tracking (for Howl's Kitchen)
CREATE TABLE cortex_recipes (
    id TEXT PRIMARY KEY,
    entry_id TEXT,
    recipe_name TEXT,
    category TEXT, -- vegan, beef, fish, poultry, quick, cheap, dessert
    source_type TEXT, -- social_media, family, original
    cooked BOOLEAN DEFAULT 0,
    wishlist BOOLEAN DEFAULT 0,
    cook_count INTEGER DEFAULT 0,
    last_cooked INTEGER,
    notes TEXT,
    rating INTEGER,
    FOREIGN KEY (entry_id) REFERENCES cortex_entries(id)
);

-- Restaurant reviews (for Howl's Kitchen)
CREATE TABLE cortex_restaurants (
    id TEXT PRIMARY KEY,
    entry_id TEXT,
    restaurant_name TEXT,
    location TEXT,
    visit_date INTEGER,
    rating INTEGER, -- 1-5 stars
    favorites TEXT, -- JSON array of favorite dishes
    photos TEXT, -- JSON array of photo paths
    would_return BOOLEAN,
    FOREIGN KEY (entry_id) REFERENCES cortex_entries(id)
);

-- Full-text search index
CREATE VIRTUAL TABLE cortex_fts USING fts5(
    title, content, tags, entities,
    content='cortex_entries',
    content_rowid='rowid'
);

-- Triggers to keep FTS index updated
CREATE TRIGGER cortex_ai AFTER INSERT ON cortex_entries BEGIN
    INSERT INTO cortex_fts(rowid, title, content, tags, entities)
    VALUES (new.rowid, new.title, new.content, new.tags, new.entities);
END;

CREATE TRIGGER cortex_ad AFTER DELETE ON cortex_entries BEGIN
    INSERT INTO cortex_fts(cortex_fts, rowid, title, content, tags, entities)
    VALUES ('delete', old.rowid, old.title, old.content, old.tags, old.entities);
END;

CREATE TRIGGER cortex_au AFTER UPDATE ON cortex_entries BEGIN
    INSERT INTO cortex_fts(cortex_fts, rowid, title, content, tags, entities)
    VALUES ('delete', old.rowid, old.title, old.content, old.tags, old.entities);
    INSERT INTO cortex_fts(rowid, title, content, tags, entities)
    VALUES (new.rowid, new.title, new.content, new.tags, new.entities);
END;
