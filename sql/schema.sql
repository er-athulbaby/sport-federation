-- Sport Federation & Game Management System
-- Full schema, matching the agreed project spec (4-phase workflow)

-- ============ Identity ============

CREATE TABLE admins (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(150) NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  username      VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'super_admin' CHECK (role IN ('super_admin', 'sub_admin')),
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Sub-admin privileges: only meaningful when admins.role = 'sub_admin' (super_admin bypasses all checks)
CREATE TABLE admin_permissions (
  id         SERIAL PRIMARY KEY,
  admin_id   INT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  resource   VARCHAR(30) NOT NULL CHECK (resource IN ('federations', 'sports_events', 'games', 'roster')),
  can_view   BOOLEAN DEFAULT false,
  can_edit   BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  UNIQUE (admin_id, resource)
);

CREATE TABLE federations (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(150) NOT NULL,
  logo_url      TEXT,
  email         VARCHAR(150) UNIQUE NOT NULL,
  username      VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ============ Global catalog ============

CREATE TABLE sports (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(150) NOT NULL,
  icon_url   TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE federation_sports (
  id            SERIAL PRIMARY KEY,
  federation_id INT NOT NULL REFERENCES federations(id) ON DELETE CASCADE,
  sport_id      INT NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (federation_id, sport_id)
);

CREATE TABLE events (
  id         SERIAL PRIMARY KEY,
  sport_id   INT NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
  name       VARCHAR(150) NOT NULL,          -- e.g. "Men's 60kg", "Women's 49kg"
  gender     VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'mixed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============ Games ============

CREATE TABLE games (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(150) NOT NULL,     -- e.g. "AIMAG 2026"
  logo_url        TEXT,
  start_date      DATE,
  end_date        DATE,
  status          VARCHAR(20) DEFAULT 'draft', -- draft | open | closed | completed
  phase1_enabled  BOOLEAN DEFAULT true,
  phase2_enabled  BOOLEAN DEFAULT true,
  phase3_enabled  BOOLEAN DEFAULT true,
  phase4_enabled  BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Phase 1: Entry by Sport (participation confirmation + phase-gating checkpoints)
CREATE TABLE game_federations (
  id                   SERIAL PRIMARY KEY,
  game_id              INT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  federation_id        INT NOT NULL REFERENCES federations(id) ON DELETE CASCADE,
  is_participating     BOOLEAN,
  participation_note   TEXT,
  phase1_confirmed_at  TIMESTAMPTZ,
  phase2_completed_at  TIMESTAMPTZ,
  phase3_completed_at  TIMESTAMPTZ,
  phase4_completed_at  TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT now(),
  UNIQUE (game_id, federation_id)
);

CREATE TABLE game_federation_sports (
  id                  SERIAL PRIMARY KEY,
  game_federation_id  INT NOT NULL REFERENCES game_federations(id) ON DELETE CASCADE,
  sport_id            INT NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
  entry_policy_note   TEXT,
  age_cutoff_date     DATE,                  -- enforced: athlete.dob must be on/before this date
  participate_men     BOOLEAN DEFAULT true,  -- Phase 1: federation confirms/declines per gender
  participate_women   BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE (game_federation_id, sport_id)
);

-- Phase 2: Entry by Number (admin quota + federation's declared count)
CREATE TABLE game_events (
  id                       SERIAL PRIMARY KEY,
  game_federation_sport_id INT NOT NULL REFERENCES game_federation_sports(id) ON DELETE CASCADE,
  event_id                 INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  max_male                 INT DEFAULT 0,
  max_female               INT DEFAULT 0,
  declared_male            INT DEFAULT 0,
  declared_female          INT DEFAULT 0,
  created_at               TIMESTAMPTZ DEFAULT now(),
  UNIQUE (game_federation_sport_id, event_id)
);

-- ============ Roster ============

CREATE TABLE athletes (
  id                   SERIAL PRIMARY KEY,
  federation_id        INT NOT NULL REFERENCES federations(id) ON DELETE CASCADE,
  full_name_en         VARCHAR(200) NOT NULL,
  full_name_ar         VARCHAR(200) NOT NULL,
  gender               VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
  dob                  DATE,
  height_cm            NUMERIC(5,1),
  weight_kg            NUMERIC(5,1),
  passport_number      VARCHAR(50) NOT NULL,
  passport_expiry_date DATE NOT NULL,
  photo_url            TEXT,
  tshirt_size          VARCHAR(10),
  suit_size            VARCHAR(10),
  created_by           VARCHAR(10) DEFAULT 'federation' CHECK (created_by IN ('admin', 'federation')),
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now(),
  UNIQUE (federation_id, passport_number)
);

CREATE TABLE officials (
  id                   SERIAL PRIMARY KEY,
  federation_id        INT NOT NULL REFERENCES federations(id) ON DELETE CASCADE,
  full_name_en         VARCHAR(200) NOT NULL,
  full_name_ar         VARCHAR(200) NOT NULL,
  designation          VARCHAR(100),
  dob                  DATE,
  contact_number       VARCHAR(30),
  email                VARCHAR(150),
  passport_number      VARCHAR(50) NOT NULL,
  passport_expiry_date DATE NOT NULL,
  photo_url            TEXT,
  tshirt_size          VARCHAR(10),
  suit_size            VARCHAR(10),
  created_by           VARCHAR(10) DEFAULT 'federation' CHECK (created_by IN ('admin', 'federation')),
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now(),
  UNIQUE (federation_id, passport_number)
);

-- ============ Phase 3: Long List ============

CREATE TABLE delegation_long_list (
  id               SERIAL PRIMARY KEY,
  game_federation_id INT NOT NULL REFERENCES game_federations(id) ON DELETE CASCADE,
  sport_id         INT NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
  participant_type VARCHAR(10) NOT NULL CHECK (participant_type IN ('athlete', 'official')),
  athlete_id       INT REFERENCES athletes(id) ON DELETE CASCADE,
  official_id      INT REFERENCES officials(id) ON DELETE CASCADE,
  added_at         TIMESTAMPTZ DEFAULT now(),
  CHECK (
    (participant_type = 'athlete' AND athlete_id IS NOT NULL AND official_id IS NULL) OR
    (participant_type = 'official' AND official_id IS NOT NULL AND athlete_id IS NULL)
  )
);

-- ============ Phase 4: Short List (final, no admin override) ============

CREATE TABLE delegation_short_list (
  id                 SERIAL PRIMARY KEY,
  game_federation_id INT NOT NULL REFERENCES game_federations(id) ON DELETE CASCADE,
  long_list_id       INT NOT NULL REFERENCES delegation_long_list(id) ON DELETE CASCADE,
  game_event_id      INT NOT NULL REFERENCES game_events(id) ON DELETE CASCADE,
  created_at         TIMESTAMPTZ DEFAULT now(),
  UNIQUE (long_list_id, game_event_id)
);

-- ============ Notifications ============

CREATE TABLE notifications (
  id                   SERIAL PRIMARY KEY,
  federation_id        INT NOT NULL REFERENCES federations(id) ON DELETE CASCADE,
  type                 VARCHAR(50) NOT NULL,   -- passport_expiry, etc.
  title                VARCHAR(200),
  message              TEXT,
  related_athlete_id   INT REFERENCES athletes(id) ON DELETE CASCADE,
  related_official_id  INT REFERENCES officials(id) ON DELETE CASCADE,
  channel              VARCHAR(10) DEFAULT 'both' CHECK (channel IN ('in_app', 'email', 'both')),
  is_read              BOOLEAN DEFAULT false,
  sent_at              TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT now()
);

-- ============ Generated documents ============

CREATE TABLE documents (
  id             SERIAL PRIMARY KEY,
  game_id        INT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  federation_id  INT NOT NULL REFERENCES federations(id) ON DELETE CASCADE,
  phase          INT NOT NULL CHECK (phase IN (2, 3, 4)),
  reference_code VARCHAR(20) UNIQUE NOT NULL,
  file_url       TEXT,
  generated_at   TIMESTAMPTZ DEFAULT now()
);

-- ============ Indexes ============

CREATE INDEX idx_athletes_federation ON athletes(federation_id);
CREATE INDEX idx_officials_federation ON officials(federation_id);
CREATE INDEX idx_athletes_passport_expiry ON athletes(passport_expiry_date);
CREATE INDEX idx_officials_passport_expiry ON officials(passport_expiry_date);
CREATE INDEX idx_notifications_federation ON notifications(federation_id, is_read);
CREATE INDEX idx_long_list_game_federation ON delegation_long_list(game_federation_id);
CREATE INDEX idx_game_events_gfs ON game_events(game_federation_sport_id);
