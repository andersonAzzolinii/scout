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

  // Criar tabela squads (elencos por modalidade)
  db.execSync(`
    CREATE TABLE IF NOT EXISTS squads (
      id TEXT PRIMARY KEY NOT NULL,
      team_id TEXT NOT NULL,
      sport_type TEXT NOT NULL DEFAULT 'futsal',
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
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

  // Migração: adicionar campo tactical_position na tabela match_players
  try {
    const matchPlayersInfo = db.getAllSync<{ name: string }>(
      `PRAGMA table_info(match_players);`
    );
    const hasTacticalPosition = matchPlayersInfo.some((col) => col.name === 'tactical_position');

    if (!hasTacticalPosition) {
      console.log('🔄 Adicionando campo tactical_position na tabela match_players...');
      db.execSync(`ALTER TABLE match_players ADD COLUMN tactical_position INTEGER;`);
      console.log('✅ Campo tactical_position adicionado na tabela match_players');
    }
  } catch (error) {
    console.warn('Migração tactical_position:', error);
  }

  // Criar tabela bench_periods para rastrear tempo no banco
  db.execSync(`
    CREATE TABLE IF NOT EXISTS bench_periods (
      id TEXT PRIMARY KEY NOT NULL,
      match_id TEXT NOT NULL,
      player_id TEXT NOT NULL,
      start_minute INTEGER NOT NULL,
      start_second INTEGER NOT NULL,
      end_minute INTEGER,
      end_second INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
    );
  `);

  // Migração: adicionar start_timestamp/end_timestamp na tabela bench_periods
  try {
    const bpInfo = db.getAllSync<{ name: string }>(`PRAGMA table_info(bench_periods);`);
    if (!bpInfo.some(c => c.name === 'start_timestamp')) {
      db.execSync(`ALTER TABLE bench_periods ADD COLUMN start_timestamp INTEGER;`);
    }
    if (!bpInfo.some(c => c.name === 'end_timestamp')) {
      db.execSync(`ALTER TABLE bench_periods ADD COLUMN end_timestamp INTEGER;`);
    }
  } catch (e) { console.warn('Migração bench timestamps:', e); }

  // Criar tabela field_periods para rastrear tempo em quadra
  db.execSync(`
    CREATE TABLE IF NOT EXISTS field_periods (
      id TEXT PRIMARY KEY NOT NULL,
      match_id TEXT NOT NULL,
      player_id TEXT NOT NULL,
      start_minute INTEGER NOT NULL,
      start_second INTEGER NOT NULL,
      end_minute INTEGER,
      end_second INTEGER,
      start_timestamp INTEGER,
      end_timestamp INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
    );
  `);

  // Migração: adicionar campo venue na tabela teams
  try {
    const teamsInfo2 = db.getAllSync<{ name: string }>(`PRAGMA table_info(teams);`);
    if (!teamsInfo2.some(c => c.name === 'venue')) {
      db.execSync(`ALTER TABLE teams ADD COLUMN venue TEXT;`);
    }
  } catch (e) { console.warn('Migração venue:', e); }

  // Migração: adicionar campo is_home na tabela matches
  try {
    const matchesInfo = db.getAllSync<{ name: string }>(`PRAGMA table_info(matches);`);
    if (!matchesInfo.some(c => c.name === 'is_home')) {
      db.execSync(`ALTER TABLE matches ADD COLUMN is_home INTEGER NOT NULL DEFAULT 1;`);
    }
  } catch (e) { console.warn('Migração is_home:', e); }

  // Migração: adicionar campo period na tabela match_events
  try {
    const eventsInfo = db.getAllSync<{ name: string }>(`PRAGMA table_info(match_events);`);
    if (!eventsInfo.some(c => c.name === 'period')) {
      db.execSync(`ALTER TABLE match_events ADD COLUMN period INTEGER NOT NULL DEFAULT 1;`);
    }
  } catch (e) { console.warn('Migração period:', e); }

  // Migração: adicionar campos de timer na tabela matches
  try {
    const matchesInfo2 = db.getAllSync<{ name: string }>(`PRAGMA table_info(matches);`);
    if (!matchesInfo2.some(c => c.name === 'elapsed_seconds')) {
      console.log('🔄 Adicionando campos de timer na tabela matches...');
      db.execSync(`ALTER TABLE matches ADD COLUMN elapsed_seconds INTEGER NOT NULL DEFAULT 0;`);
      db.execSync(`ALTER TABLE matches ADD COLUMN is_timer_running INTEGER NOT NULL DEFAULT 0;`);
      db.execSync(`ALTER TABLE matches ADD COLUMN current_period INTEGER NOT NULL DEFAULT 1;`);
      console.log('✅ Campos de timer adicionados na tabela matches');
    }
  } catch (e) { console.warn('Migração timer matches:', e); }

  // Migração: adicionar campo paused_elapsed_seconds na tabela field_periods
  try {
    const fieldPeriodsInfo = db.getAllSync<{ name: string }>(`PRAGMA table_info(field_periods);`);
    if (!fieldPeriodsInfo.some(c => c.name === 'paused_elapsed_seconds')) {
      console.log('🔄 Adicionando campo paused_elapsed_seconds na tabela field_periods...');
      db.execSync(`ALTER TABLE field_periods ADD COLUMN paused_elapsed_seconds INTEGER;`);
      console.log('✅ Campo paused_elapsed_seconds adicionado');
    }
  } catch (e) { console.warn('Migração paused_elapsed_seconds:', e); }

  // Migração: adicionar campo period na tabela field_periods
  try {
    const fieldPeriodsInfo2 = db.getAllSync<{ name: string }>(`PRAGMA table_info(field_periods);`);
    if (!fieldPeriodsInfo2.some(c => c.name === 'period')) {
      console.log('🔄 Adicionando campo period na tabela field_periods...');
      db.execSync(`ALTER TABLE field_periods ADD COLUMN period INTEGER NOT NULL DEFAULT 1;`);
      console.log('✅ Campo period adicionado');
    }
  } catch (e) { console.warn('Migração period field_periods:', e); }

  // Migração: adicionar campo period na tabela bench_periods
  try {
    const benchPeriodsInfo2 = db.getAllSync<{ name: string }>(`PRAGMA table_info(bench_periods);`);
    if (!benchPeriodsInfo2.some(c => c.name === 'period')) {
      console.log('🔄 Adicionando campo period na tabela bench_periods...');
      db.execSync(`ALTER TABLE bench_periods ADD COLUMN period INTEGER NOT NULL DEFAULT 1;`);
      console.log('✅ Campo period adicionado em bench_periods');
    }
  } catch (e) { console.warn('Migração period bench_periods:', e); }

  // Migração: adicionar total_duration_seconds na tabela matches
  try {
    const matchesInfo3 = db.getAllSync<{ name: string }>(`PRAGMA table_info(matches);`);
    if (!matchesInfo3.some(c => c.name === 'total_duration_seconds')) {
      console.log('🔄 Adicionando campo total_duration_seconds na tabela matches...');
      db.execSync(`ALTER TABLE matches ADD COLUMN total_duration_seconds INTEGER;`);
      console.log('✅ Campo total_duration_seconds adicionado');
    }
    if (!matchesInfo3.some(c => c.name === 'first_half_seconds')) {
      console.log('🔄 Adicionando campo first_half_seconds na tabela matches...');
      db.execSync(`ALTER TABLE matches ADD COLUMN first_half_seconds INTEGER;`);
      console.log('✅ Campo first_half_seconds adicionado');
    }
    if (!matchesInfo3.some(c => c.name === 'second_half_seconds')) {
      console.log('🔄 Adicionando campo second_half_seconds na tabela matches...');
      db.execSync(`ALTER TABLE matches ADD COLUMN second_half_seconds INTEGER;`);
      console.log('✅ Campo second_half_seconds adicionado');
    }
  } catch (e) { console.warn('Migração total_duration_seconds:', e); }

  // ============================================================================
  // MIGRAÇÃO SQUAD SYSTEM - Suporte para múltiplas modalidades
  // ============================================================================

  // Migração: adicionar sport_type na tabela scout_profiles
  try {
    const profilesInfo = db.getAllSync<{ name: string }>(`PRAGMA table_info(scout_profiles);`);
    if (!profilesInfo.some(c => c.name === 'sport_type')) {
      console.log('🔄 Adicionando campo sport_type na tabela scout_profiles...');
      db.execSync(`ALTER TABLE scout_profiles ADD COLUMN sport_type TEXT NOT NULL DEFAULT 'futsal';`);
      console.log('✅ Campo sport_type adicionado');
    }
  } catch (e) { console.warn('Migração sport_type profiles:', e); }

  // Migração: adicionar squad_id na tabela players
  try {
    const playersInfo2 = db.getAllSync<{ name: string }>(`PRAGMA table_info(players);`);
    if (!playersInfo2.some(c => c.name === 'squad_id')) {
      console.log('🔄 Adicionando campo squad_id na tabela players...');
      db.execSync(`ALTER TABLE players ADD COLUMN squad_id TEXT;`);
      console.log('✅ Campo squad_id adicionado');
    }
  } catch (e) { console.warn('Migração squad_id players:', e); }

  // Migração: adicionar squad_id na tabela matches
  try {
    const matchesInfo4 = db.getAllSync<{ name: string }>(`PRAGMA table_info(matches);`);
    if (!matchesInfo4.some(c => c.name === 'squad_id')) {
      console.log('🔄 Adicionando campo squad_id na tabela matches...');
      db.execSync(`ALTER TABLE matches ADD COLUMN squad_id TEXT;`);
      console.log('✅ Campo squad_id adicionado');
    }
  } catch (e) { console.warn('Migração squad_id matches:', e); }

  // Migração: criar squads default para times existentes (migração de dados)
  try {
    const existingSquads = db.getAllSync<{ id: string }>(
      `SELECT id FROM squads LIMIT 1;`
    );

    // Se não há squads, criar squads padrão para todos os times
    if (existingSquads.length === 0) {
      console.log('🔄 Criando squads padrão para times existentes...');
      
      const teams = db.getAllSync<{ id: string; name: string }>(
        `SELECT id, name FROM teams;`
      );

      if (teams.length > 0) {
        for (const team of teams) {
          const squadId = `squad-${team.id}`;
          db.execSync(`
            INSERT OR IGNORE INTO squads (id, team_id, sport_type, name, created_at)
            VALUES (?, ?, 'futsal', ?, datetime('now'));
          `, [squadId, team.id, `${team.name} - Futsal`]);
        }

        // Vincular jogadores existentes aos squads
        db.execSync(`
          UPDATE players 
          SET squad_id = 'squad-' || team_id
          WHERE squad_id IS NULL;
        `);

        // Vincular partidas existentes aos squads
        db.execSync(`
          UPDATE matches 
          SET squad_id = 'squad-' || team_id
          WHERE squad_id IS NULL;
        `);

        console.log(`✅ ${teams.length} squads padrão criados e dados migrados`);
      }
    }
  } catch (e) { console.warn('Migração squad data:', e); }
}
