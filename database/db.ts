import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync('lovelog.db');

  // Enable WAL mode for better performance
  await db.execAsync('PRAGMA journal_mode = WAL;');
  // Enable foreign keys
  await db.execAsync('PRAGMA foreign_keys = ON;');

  await initializeDatabase(db);

  return db;
}

async function initializeDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS flirts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      photo_uri TEXT,
      met_date TEXT,
      met_place TEXT,
      age INTEGER,
      zodiac TEXT,
      height TEXT,
      body_type TEXT,
      hair_color TEXT,
      eye_color TEXT,
      instagram TEXT,
      tiktok TEXT,
      snapchat TEXT,
      phone TEXT,
      interests TEXT,
      status TEXT DEFAULT 'active',
      notes TEXT,
      score REAL DEFAULT 5.0,
      total_ratings INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS traits (
      id TEXT PRIMARY KEY,
      flirt_id TEXT NOT NULL,
      type TEXT NOT NULL,
      label TEXT NOT NULL,
      is_custom INTEGER DEFAULT 0,
      FOREIGN KEY (flirt_id) REFERENCES flirts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS dates (
      id TEXT PRIMARY KEY,
      flirt_id TEXT NOT NULL,
      date TEXT NOT NULL,
      location TEXT,
      notes TEXT,
      score REAL,
      is_rated INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (flirt_id) REFERENCES flirts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      context TEXT NOT NULL,
      question_text TEXT NOT NULL,
      options TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS answers (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL,
      reference_id TEXT NOT NULL,
      reference_type TEXT NOT NULL,
      selected_option TEXT NOT NULL,
      sentiment TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (question_id) REFERENCES questions(id)
    );

    CREATE TABLE IF NOT EXISTS preset_tags (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      label TEXT NOT NULL
    );
  `);

  // Seed preset tags if not exists
  const tagCount = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM preset_tags');
  if (!tagCount || tagCount.count === 0) {
    await seedPresetTags(database);
  }

  // Seed questions if not exists
  const questionCount = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM questions');
  if (!questionCount || questionCount.count === 0) {
    await seedQuestions(database);
  }
}

async function seedPresetTags(database: SQLite.SQLiteDatabase): Promise<void> {
  const pros = [
    'Good listener', 'Funny', 'Romantic', 'Ambitious', 'Honest',
    'Adventurous', 'Caring', 'Smart', 'Stylish', 'Confident',
    'Kind', 'Supportive', 'Creative', 'Spontaneous', 'Great cook',
  ];
  const cons = [
    'Late', 'Jealous', 'Distant', 'Boring', 'Selfish',
    'Messy', 'Rude', 'Flaky', 'Clingy', 'Dishonest',
    'Stubborn', 'Immature', 'Lazy', 'Arrogant', 'Bad texter',
  ];

  for (let i = 0; i < pros.length; i++) {
    await database.runAsync(
      'INSERT INTO preset_tags (id, type, label) VALUES (?, ?, ?)',
      [`pro_${i}`, 'pro', pros[i]]
    );
  }
  for (let i = 0; i < cons.length; i++) {
    await database.runAsync(
      'INSERT INTO preset_tags (id, type, label) VALUES (?, ?, ?)',
      [`con_${i}`, 'con', cons[i]]
    );
  }
}

async function seedQuestions(database: SQLite.SQLiteDatabase): Promise<void> {
  const dateQuestions = [
    { text: 'Who paid the bill?', options: ['They paid', 'I paid', 'We split', 'No bill'] },
    { text: 'Did they arrive on time?', options: ['Early', 'On time', 'A little late', 'Very late'] },
    { text: 'How much did they look at their phone?', options: ['Never', 'A few times', 'A lot', 'Constantly'] },
    { text: 'How was the conversation flow?', options: ['Amazing', 'Good', 'Okay', 'Awkward'] },
    { text: 'Did they make eye contact?', options: ['Yes, a lot', 'Normal', 'Not really', 'Avoided it'] },
    { text: 'How was their body language?', options: ['Very open & warm', 'Normal', 'Distant', 'Closed off'] },
    { text: 'Did they ask about you?', options: ['Very interested', 'Some questions', 'Not much', 'All about them'] },
    { text: 'How did the date end?', options: ['Kiss', 'Hug', 'Handshake', 'Just goodbye'] },
    { text: 'Did they mention meeting again?', options: ['Yes, eagerly', 'Casually', 'Vaguely', 'Not at all'] },
    { text: 'Would you go on another date?', options: ['Definitely', 'Probably', 'Maybe', 'No way'] },
  ];

  const flirtQuestions = [
    { text: 'Where did you meet?', options: ['Dating app', 'Social media', 'Through friends', 'School/Work', 'Bar/Club', 'Random'] },
    { text: 'Who initiated the conversation?', options: ['I did', 'They did', 'Mutual'] },
    { text: 'First impression?', options: ['Love at first sight', 'Very attractive', 'Nice', 'Average', 'Not my type'] },
    { text: 'How quickly do they respond to messages?', options: ['Instantly', 'Fast', 'Normal', 'Slow', 'Very slow'] },
    { text: 'How interesting is their conversation?', options: ['Super engaging', 'Good', 'Average', 'Boring', 'Dry'] },
  ];

  for (let i = 0; i < dateQuestions.length; i++) {
    const q = dateQuestions[i];
    await database.runAsync(
      'INSERT INTO questions (id, context, question_text, options, sort_order) VALUES (?, ?, ?, ?, ?)',
      [`date_q${i}`, 'date', q.text, JSON.stringify(q.options), i]
    );
  }

  for (let i = 0; i < flirtQuestions.length; i++) {
    const q = flirtQuestions[i];
    await database.runAsync(
      'INSERT INTO questions (id, context, question_text, options, sort_order) VALUES (?, ?, ?, ?, ?)',
      [`flirt_q${i}`, 'flirt_initial', q.text, JSON.stringify(q.options), i]
    );
  }
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
