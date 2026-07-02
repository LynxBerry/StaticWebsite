-- Zeno 的单词农场 · 数据库 schema（第二步：多设备同步）
-- 在 Supabase Dashboard → SQL Editor 执行此文件
--
-- 设计：
--   - 三张表都按 user_id 隔离，外键关联 auth.users(id)
--   - 全部启用 RLS，用户只能读写自己的行
--   - ON DELETE CASCADE：用户被删除时，其数据自动清理

-- ============================================================
-- 表 1：用户词库（每个用户导入自己的单词）
-- ============================================================
CREATE TABLE IF NOT EXISTS user_words (
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  en        TEXT NOT NULL,
  cn        TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, en)
);

ALTER TABLE user_words ENABLE ROW LEVEL SECURITY;

-- 删除已存在的同名 policy（便于重复执行）
DROP POLICY IF EXISTS "users manage own words" ON user_words;
CREATE POLICY "users manage own words" ON user_words
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 表 2：单词进度（核心高频表，每次答题都更新）
-- ============================================================
CREATE TABLE IF NOT EXISTS user_word_progress (
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  en                 TEXT NOT NULL,
  level              INT NOT NULL DEFAULT 1,
  next_review        BIGINT NOT NULL,
  first_learned_date TEXT,
  PRIMARY KEY (user_id, en)
);

ALTER TABLE user_word_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users manage own progress" ON user_word_progress;
CREATE POLICY "users manage own progress" ON user_word_progress
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 表 3：错题队列（需连续答对的单词）
-- ============================================================
CREATE TABLE IF NOT EXISTS user_wrong_queue (
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  en        TEXT NOT NULL,
  remaining INT NOT NULL DEFAULT 3,
  PRIMARY KEY (user_id, en)
);

ALTER TABLE user_wrong_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users manage own wrong queue" ON user_wrong_queue;
CREATE POLICY "users manage own wrong queue" ON user_wrong_queue
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 表 4：用户设置（每用户一行，存自定义标题等）
-- ============================================================
CREATE TABLE IF NOT EXISTS user_settings (
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_title TEXT NOT NULL DEFAULT 'Zeno的单词农场',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id)
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users manage own settings" ON user_settings;
CREATE POLICY "users manage own settings" ON user_settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
