import { getDatabase } from './db';

export function runMigrations(): void {
  const db = getDatabase();

  db.execSync(`PRAGMA journal_mode = WAL;`);
  db.execSync(`PRAGMA foreign_keys = ON;`);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS scout_profiles (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS scout_categories (
      id TEXT PRIMARY KEY NOT NULL,
      profile_id TEXT NOT NULL,
      name TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (profile_id) REFERENCES scout_profiles(id) ON DELETE CASCADE
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS scout_events (
      id TEXT PRIMARY KEY NOT NULL,
      category_id TEXT NOT NULL,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT 'star',
      event_type TEXT NOT NULL DEFAULT 'count',
      is_positive INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES scout_categories(id) ON DELETE CASCADE
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY NOT NULL,
      team_id TEXT NOT NULL,
      name TEXT NOT NULL,
      number INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY  NOT NULL,
      team_id TEXT NOT NULL,
      opponent_name TEXT NOT NULL DEFAULT '',
      profile_id TEXT NOT NULL,
      date TEXT NOT NULL,
      location TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (team_id) REFERENCES teams(id),
      FOREIGN KEY (profile_id) REFERENCES scout_profiles(id)
    );
  `);

  // Migração: converter estrutura antiga (team_a_id, team_b_id) para nova (team_id, opponent_name)
  try {
    const tableInfo = db.getAllSync<{ name: string }>(
      `PRAGMA table_info(matches);`
    );
    const hasOldStructure = tableInfo.some((col) => col.name === 'team_a_id');
    const hasNewStructure = tableInfo.some((col) => col.name === 'team_id');

    if (hasOldStructure && !hasNewStructure) {
      console.log('🔄 Migrando estrutura da tabela matches...');
      
      // Criar tabela temporária com nova estrutura
      db.execSync(`
        CREATE TABLE matches_new (
          id TEXT PRIMARY KEY NOT NULL,
          team_id TEXT NOT NULL,
          opponent_name TEXT NOT NULL DEFAULT '',
          profile_id TEXT NOT NULL,
          date TEXT NOT NULL,
          location TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (team_id) REFERENCES teams(id),
          FOREIGN KEY (profile_id) REFERENCES scout_profiles(id)
        );
      `);

      // Copiar dados (usando team_a como team_id e team_b.name como opponent_name)
      db.execSync(`
        INSERT INTO matches_new (id, team_id, opponent_name, profile_id, date, location, created_at)
        SELECT m.id, m.team_a_id, 
               COALESCE((SELECT name FROM teams WHERE id = m.team_b_id), 'Adversário'), 
               m.profile_id, m.date, m.location, m.created_at
        FROM matches m;
      `);

      // Remover tabela antiga e renomear
      db.execSync(`DROP TABLE matches;`);
      db.execSync(`ALTER TABLE matches_new RENAME TO matches;`);
      
      console.log('✅ Migração concluída');
    }
  } catch (error) {
    console.warn('Migração da tabela matches:', error);
  }

  db.execSync(`
    CREATE TABLE IF NOT EXISTS match_players (
      id TEXT PRIMARY KEY NOT NULL,
      match_id TEXT NOT NULL,
      player_id TEXT NOT NULL,
      team_id TEXT NOT NULL,
      is_starting INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
      FOREIGN KEY (player_id) REFERENCES players(id),
      FOREIGN KEY (team_id) REFERENCES teams(id)
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS match_events (
      id TEXT PRIMARY KEY NOT NULL,
      match_id TEXT NOT NULL,
      team_id TEXT NOT NULL,
      player_id TEXT NOT NULL,
      event_id TEXT NOT NULL,
      minute INTEGER NOT NULL DEFAULT 0,
      second INTEGER NOT NULL DEFAULT 0,
      x REAL,
      y REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
      FOREIGN KEY (team_id) REFERENCES teams(id),
      FOREIGN KEY (player_id) REFERENCES players(id),
      FOREIGN KEY (event_id) REFERENCES scout_events(id)
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS event_relations (
      id TEXT PRIMARY KEY NOT NULL,
      event_id TEXT NOT NULL,
      related_player_id TEXT NOT NULL,
      relation_type TEXT NOT NULL DEFAULT 'assist',
      FOREIGN KEY (event_id) REFERENCES match_events(id) ON DELETE CASCADE,
      FOREIGN KEY (related_player_id) REFERENCES players(id)
    );
  `);

  // Seed: ensure the default single-user always exists so FK constraints on
  // scout_profiles.user_id are never violated.
  db.execSync(`
    INSERT OR IGNORE INTO users (id, name, email)
    VALUES ('default-user', 'Scout User', 'scout@app.local');
  `);

  // Migração: adicionar campo photo_uri na tabela players
  try {
    const playersInfo = db.getAllSync<{ name: string }>(
      `PRAGMA table_info(players);`
    );
    const hasPhotoUri = playersInfo.some((col) => col.name === 'photo_uri');

    if (!hasPhotoUri) {
      console.log('🔄 Adicionando campo photo_uri na tabela players...');
      db.execSync(`ALTER TABLE players ADD COLUMN photo_uri TEXT;`);
      console.log('✅ Campo photo_uri adicionado');
    }
  } catch (error) {
    console.warn('Migração photo_uri:', error);
  }

  // Migração: adicionar campo photo_uri na tabela teams
  try {
    const teamsInfo = db.getAllSync<{ name: string }>(
      `PRAGMA table_info(teams);`
    );
    const hasTeamPhotoUri = teamsInfo.some((col) => col.name === 'photo_uri');

    if (!hasTeamPhotoUri) {
      console.log('🔄 Adicionando campo photo_uri na tabela teams...');
      db.execSync(`ALTER TABLE teams ADD COLUMN photo_uri TEXT;`);
      console.log('✅ Campo photo_uri adicionado na tabela teams');
    }
  } catch (error) {
    console.warn('Migração photo_uri teams:', error);
  }
}
