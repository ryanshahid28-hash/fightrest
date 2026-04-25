-- 1. Create the `tasks` table
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID, -- Optional: explicitly tie tasks to authenticated users
  title TEXT NOT NULL,
  date DATE NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create the `happy_list` table
CREATE TABLE happy_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create the `fat_list` table (Anti-To-Do blocklist)
CREATE TABLE fat_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional Row Level Security (RLS) policies 
-- enable these if you begin using Supabase Authentication
-- ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE happy_list ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE fat_list ENABLE ROW LEVEL SECURITY;
