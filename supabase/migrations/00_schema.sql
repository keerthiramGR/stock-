-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    username TEXT,
    avatar_url TEXT,
    virtual_balance NUMERIC(15, 2) DEFAULT 100000.00 NOT NULL,
    streak_count INT DEFAULT 0 NOT NULL,
    last_login_date DATE,
    streak_freeze_count INT DEFAULT 0 NOT NULL,
    total_quiz_completed INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table: stock_prices
CREATE TABLE IF NOT EXISTS public.stock_prices (
    symbol TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    current_price NUMERIC(15, 2) NOT NULL,
    change_percent NUMERIC(5, 2) NOT NULL,
    high_price NUMERIC(15, 2),
    low_price NUMERIC(15, 2),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table: holdings
CREATE TABLE IF NOT EXISTS public.holdings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    stock_symbol TEXT NOT NULL,
    company_name TEXT NOT NULL,
    quantity INT NOT NULL CHECK (quantity >= 0),
    avg_buy_price NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_user_stock UNIQUE (user_id, stock_symbol)
);

-- Table: transactions
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    stock_symbol TEXT NOT NULL,
    company_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('BUY', 'SELL')),
    quantity INT NOT NULL CHECK (quantity > 0),
    price_per_share NUMERIC(15, 2) NOT NULL,
    total_amount NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table: quiz_questions
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of 4 options
    correct_option INT NOT NULL CHECK (correct_option >= 0 AND correct_option <= 3),
    explanation TEXT,
    category TEXT NOT NULL CHECK (category IN ('basics', 'charts', 'terms', 'news')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard'))
);

-- Table: quiz_attempts
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    score INT NOT NULL,
    total_questions INT NOT NULL,
    rupees_earned NUMERIC(15, 2) NOT NULL,
    completed BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_user_date_quiz UNIQUE (user_id, date)
);

-- Table: lessons
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    order_index INT NOT NULL,
    rupees_reward NUMERIC(15, 2) DEFAULT 1000.00 NOT NULL
);

-- Table: lesson_progress
CREATE TABLE IF NOT EXISTS public.lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
    completed BOOLEAN DEFAULT TRUE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_user_lesson UNIQUE (user_id, lesson_id)
);

-- Table: achievements
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    badge_name TEXT NOT NULL,
    badge_icon TEXT NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_user_badge UNIQUE (user_id, badge_name)
);

-- Leaderboard View: Combines profiles and real-time holdings values
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT 
    p.id,
    p.username,
    p.avatar_url,
    p.virtual_balance,
    p.streak_count,
    COALESCE(SUM(h.quantity * s.current_price), 0) AS holdings_value,
    (p.virtual_balance + COALESCE(SUM(h.quantity * s.current_price), 0)) AS total_portfolio_value
FROM public.profiles p
LEFT JOIN public.holdings h ON p.id = h.user_id
LEFT JOIN public.stock_prices s ON h.stock_symbol = s.symbol
GROUP BY p.id, p.username, p.avatar_url, p.virtual_balance, p.streak_count
ORDER BY total_portfolio_value DESC;

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles Policies
CREATE POLICY "Allow public read of profiles for authenticated users" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow individual update of own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- Stock Prices Policies
CREATE POLICY "Allow public read of stock prices" 
ON public.stock_prices FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Allow admin/service role full access to stock prices" 
ON public.stock_prices FOR ALL 
TO service_role 
USING (true);

-- Holdings Policies
CREATE POLICY "Allow individual read of own holdings" 
ON public.holdings FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Allow individual write of own holdings" 
ON public.holdings FOR ALL 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Transactions Policies
CREATE POLICY "Allow individual read of own transactions" 
ON public.transactions FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Allow individual creation of own transactions" 
ON public.transactions FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Quiz Questions Policies
CREATE POLICY "Allow public read of quiz questions" 
ON public.quiz_questions FOR SELECT 
TO public 
USING (true);

-- Quiz Attempts Policies
CREATE POLICY "Allow individual read of own quiz attempts" 
ON public.quiz_attempts FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Allow individual creation of own quiz attempts" 
ON public.quiz_attempts FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Lessons Policies
CREATE POLICY "Allow public read of lessons" 
ON public.lessons FOR SELECT 
TO public 
USING (true);

-- Lesson Progress Policies
CREATE POLICY "Allow individual read of own lesson progress" 
ON public.lesson_progress FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Allow individual write of own lesson progress" 
ON public.lesson_progress FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Achievements Policies
CREATE POLICY "Allow public read of achievements for authenticated users" 
ON public.achievements FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow individual write of own achievements" 
ON public.achievements FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger: Automatically insert profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, avatar_url, virtual_balance, streak_count, streak_freeze_count)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url',
        100000.00,
        0,
        1 -- Start with 1 free streak freeze!
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
