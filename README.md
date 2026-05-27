# Antigravity Trade: Stock Market Simulator & Financial Academy

A gamified, production-grade stock market paper trading simulator and educational platform. Users practice trading with virtual rupees using real-time stock prices (polled from Yahoo Finance with robust simulated fallbacks), complete daily financial trivia quizzes to maintain login streaks, and finish interactive lessons to unlock capital and achievements.

---

## 🎯 Key Features

1. **Paper Trading Terminal**: Execute instant BUY/SELL orders at live stock prices. Holdings, average buy prices, transactions history, and unrealized profit & loss (P&L) update in real-time.
2. **Real-time Price Tickers**: Continuous 10-second price ticks for top Indian NSE equities, with visual green/red pulsing indicators on change.
3. **Financial Academy**: Categorized courses (Beginner, Intermediate, Advanced) teaching stock basics, chart reading, financial ratios, and risk control. Claim ₹1,000 for each lesson finished.
4. **Daily MCQ Trivia**: Solve 10-question quizzes with a ticking 30-second circular timer, instant option corrections, educational explanations, and reward credit.
5. **Gamification & Leaderboard**: Earn active login streaks, save streaks using streak freezes, unlock achievements badges (First Trade, Profit Maker, Quiz Master, Lesson Graduate), and view live rankings of the top 10 traders based on total portfolio value.

---

## 📁 Repository Structure

```text
/
├── client/                     # React + Vite + Tailwind CSS Frontend SPA
│   ├── src/
│   │   ├── components/         # Navbar, PriceTicker components
│   │   ├── context/            # AuthContext, PortfolioContext
│   │   ├── lib/                # supabaseClient.js config
│   │   ├── pages/              # Dashboard, Market, StockDetail, Learn, Quiz, Leaderboard, Profile, Auth
│   │   ├── App.jsx             # Main Router and protected routes
│   │   ├── index.css           # Global stylesheets & visual animations
│   │   └── main.jsx            # Entry point wrapping Context providers
│   ├── index.html              # HTML shell & SEO Meta configuration
│   └── tailwind.config.js      # Tailwind theme parameters
├── server/                     # Node.js + Express.js price updater backend
│   ├── index.js                # Background stock polling poller & history API proxy
│   └── package.json            # Backend package definitions
├── supabase/                   # Supabase Postgres database artifacts
│   ├── migrations/
│   │   └── 00_schema.sql       # Database schema, triggers, and RLS policies
│   └── seed.sql                # Lessons course structure & MCQ questions bank
├── .env.example                # Unified environment variables template
└── README.md                   # Setup guide and documentation
```

---

## 🛠️ Installation & Setup

### 1. Database Setup (Supabase)

1. Create a free account at [Supabase](https://supabase.com).
2. Create a new project named `Stock Simulator`.
3. In the left panel, navigate to the **SQL Editor**.
4. Open the SQL editor and paste the contents of `supabase/migrations/00_schema.sql` (found [here](file:///d:/projects/stock%20market/supabase/migrations/00_schema.sql)). Click **Run** to provision the tables, triggers, policies, and the leaderboard view.
5. Open a new query in the SQL editor, paste the contents of `supabase/seed.sql` (found [here](file:///d:/projects/stock%20market/supabase/seed.sql)), and click **Run** to load initial quiz questions and lesson courses.
6. Retrieve your Project API credentials from **Project Settings > API**:
   - `Project URL`
   - `anon public` key
   - `service_role` secret key (needed for the backend poller to modify stock prices by bypassing RLS).

### 2. Backend Server Setup (`/server`)

1. Open your terminal and navigate to the `/server` directory.
2. Create a `.env` file based on `.env.example`:
   ```bash
   PORT=5000
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
3. Install dependencies and start the server:
   ```bash
   npm install
   npm start
   ```
   *The server will start on port 5000 and run a background task polling stock prices every 10 seconds, writing updates to the `stock_prices` table in Supabase.*

### 3. Frontend Client Setup (`/client`)

1. Open a new terminal and navigate to the `/client` directory.
2. Create a `.env` file:
   ```bash
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
3. Install dependencies and start the client:
   ```bash
   npm install
   npm run dev
   ```
4. Access the web application in your browser at `http://localhost:5173`.

---

## 🚀 Deployment Guide

### Frontend Deployment (Vercel)

1. Connect your GitHub repository to [Vercel](https://vercel.com).
2. Select the `client` directory as the root folder.
3. Configure the build command as `npm run build` and output directory as `dist`.
4. Add the environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy**.

### Backend Deployment (Render or Heroku)

1. Connect your repository to a service provider like [Render](https://render.com).
2. Select **Web Service** and choose the `server` directory.
3. Set the build command to `npm install` and start command to `node index.js`.
4. Configure the environment variables:
   - `PORT`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`.
5. Deploy the service. (Update `/client/src/pages/StockDetail.jsx` fetch URL if your Express server is hosted at a custom domain).

---

## 🛡️ Security & Real-Time Specifications

- **Row Level Security (RLS)** is enabled on all tables. Users can only select and modify their own transactions, holdings, quiz attempts, and lesson progress.
- Public tables like `stock_prices`, `lessons`, and `quiz_questions` are set to read-only for public/authenticated keys.
- **Supabase Realtime WebSockets** are utilized inside the `PortfolioProvider` context. Whenever the server writes a price update or a trade is made, the holdings tables, available balance, and global leaderboard update instantly without full page re-renders.
