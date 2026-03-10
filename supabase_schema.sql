-- 在 Supabase 的 SQL Editor 中运行以下所有代码
-- 这会创建 `conversations` 表和 `word_book` 表，并设置安全的访问策略 (RLS)

-- ======== 1. 创建 Conversations (对话记录表) ========
CREATE TABLE public.conversations (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    title TEXT NOT NULL,
    messages JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ======== 2. 创建 Word Book (单词本表) ========
CREATE TABLE public.word_book (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    english TEXT NOT NULL,
    chinese_explanation TEXT,
    style TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ======== 3. 启用 RLS (行级安全策略) ========
-- 安全机制：让每个用户只能看到和修改自己的数据，不能串号。
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.word_book ENABLE ROW LEVEL SECURITY;

-- ======== 4. 编写 Policies (访问控制规则) ========

-- Conversations policies
CREATE POLICY "Users can insert their own conversations" 
ON public.conversations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select their own conversations" 
ON public.conversations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" 
ON public.conversations FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" 
ON public.conversations FOR DELETE 
USING (auth.uid() = user_id);

-- Word Book policies
CREATE POLICY "Users can insert their own words" 
ON public.word_book FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select their own words" 
ON public.word_book FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own words" 
ON public.word_book FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own words" 
ON public.word_book FOR DELETE 
USING (auth.uid() = user_id);

-- 💡 执行完毕后，你的数据库就准备好了！

-- User Settings Table for sync (e.g., API Keys)
create table if not exists public.user_settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  api_keys jsonb default '[""]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_user_id unique(user_id)
);

-- Turn on RLS for settings
alter table public.user_settings enable row level security;

-- Policies for settings
create policy "Users can view own settings"
  on public.user_settings for select
  using ( auth.uid() = user_id );

create policy "Users can insert own settings"
  on public.user_settings for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own settings"
  on public.user_settings for update
  using ( auth.uid() = user_id );
