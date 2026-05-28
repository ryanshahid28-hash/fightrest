-- ═══════════════════════════════════════════════════════════════
-- Fight Club (fightrest) — Supabase Schema
-- Run this in the Supabase SQL Editor to bootstrap the database.
-- ═══════════════════════════════════════════════════════════════

-- ── Tasks ─────────────────────────────────────────────────────
-- Stores daily tasks with rich content blocks as JSONB.
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  blocks JSONB DEFAULT '[]'::jsonb,
  rolled_over_from DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Happy List ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS happy_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_checked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Fat List (Anti-ToDo / Ignore List) ────────────────────────
-- Includes streak tracking fields for gamified habit avoidance.
CREATE TABLE IF NOT EXISTS fat_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  streak_start DATE DEFAULT CURRENT_DATE,
  last_broken DATE,
  is_checked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Daily Reflections ─────────────────────────────────────────
-- Stores end-of-day summaries and rollover metadata.
CREATE TABLE IF NOT EXISTS daily_reflections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  summary_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ── User Preferences ──────────────────────────────────────────
-- Theme, integrations, and user-level settings.
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  theme TEXT DEFAULT 'fight',
  google_calendar_token JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- Row Level Security — every user can only access their own data
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE happy_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE fat_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their tasks"
  ON tasks FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own their happy_list"
  ON happy_list FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own their fat_list"
  ON fat_list FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own their reflections"
  ON daily_reflections FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own their preferences"
  ON user_preferences FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- Indexes for common query patterns
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);
CREATE INDEX IF NOT EXISTS idx_happy_list_user ON happy_list(user_id);
CREATE INDEX IF NOT EXISTS idx_fat_list_user ON fat_list(user_id);
CREATE INDEX IF NOT EXISTS idx_reflections_user_date ON daily_reflections(user_id, date);
