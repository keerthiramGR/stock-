import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePortfolio } from '../context/PortfolioContext';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import PriceTicker from '../components/PriceTicker';
import { ArrowUpRight, ArrowDownRight, Award, BookOpen, Brain, Briefcase, ChevronRight, TrendingUp, History, ShieldAlert } from 'lucide-react';

export default function Dashboard() {
  const { profile } = useAuth();
  const { portfolioValue, holdingsValue, pnl, holdings, stockPrices, transactions } = usePortfolio();
  const navigate = useNavigate();

  const [recentAchievements, setRecentAchievements] = useState([]);
  const [completedLessonsCount, setCompletedLessonsCount] = useState(0);
  const [totalLessonsCount, setTotalLessonsCount] = useState(0);

  const formatRupees = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(value || 0);
  };

  useEffect(() => {
    if (!profile) return;
    
    // Fetch recent achievements
    const fetchAchievements = async () => {
      const { data } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', profile.id)
        .order('earned_at', { ascending: false })
        .limit(3);
      setRecentAchievements(data || []);
    };

    // Fetch lesson progression metrics
    const fetchLessonMetrics = async () => {
      const { count: completed } = await supabase
        .from('lesson_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('completed', true);

      const { count: total } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true });

      setCompletedLessonsCount(completed || 0);
      setTotalLessonsCount(total || 0);
    };

    fetchAchievements();
    fetchLessonMetrics();
  }, [profile, holdings]);

  const pnlIsPositive = pnl >= 0;
  const lessonProgressPercent = totalLessonsCount > 0 ? Math.round((completedLessonsCount / totalLessonsCount) * 100) : 0;

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            Welcome back, <span className="text-accentGreen">{profile?.username || 'Trader'}</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Analyze market metrics, execute mock trades, and track your learnings.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/market"
            className="px-4 py-2.5 rounded-xl bg-accentGreen hover:bg-emerald-600 text-darkBg font-bold text-sm shadow-md shadow-accentGreen/10 transition-all flex items-center space-x-1"
          >
            <span>Trade Markets</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link
            to="/quiz"
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 font-semibold text-sm transition-colors flex items-center space-x-1"
          >
            <Brain className="h-4 w-4 text-accentGold" />
            <span>Daily Quiz</span>
          </Link>
        </div>
      </div>

      {/* Portfolio Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Portfolio Value */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Portfolio Value</span>
            <div className="p-1.5 bg-slate-800/60 text-slate-300 rounded-lg">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {formatRupees(portfolioValue)}
            </h3>
            <div className="flex items-center mt-1 text-xs">
              <span className={`font-semibold flex items-center ${pnlIsPositive ? 'text-accentGreen' : 'text-accentRed'}`}>
                {pnlIsPositive ? <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" /> : <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />}
                {formatRupees(Math.abs(pnl))} ({holdingsValue > 0 ? ((pnl / (holdingsValue - pnl)) * 100).toFixed(2) : '0.00'}%)
              </span>
              <span className="text-slate-500 ml-1">unrealized P&L</span>
            </div>
          </div>
        </div>

        {/* Available Cash Balance */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Virtual Balance</span>
            <span className="text-xs font-bold text-accentGreen bg-accentGreen/10 border border-accentGreen/20 px-2 py-0.5 rounded-full uppercase">
              Liquid Cash
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {formatRupees(profile?.virtual_balance)}
            </h3>
            <p className="text-slate-500 text-xs mt-1.5 flex items-center">
              <span>Earn more by completing courses & quizzes</span>
            </p>
          </div>
        </div>

        {/* Current Value of Holdings */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Holdings Value</span>
            <div className="p-1.5 bg-slate-800/60 text-slate-300 rounded-lg">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {formatRupees(holdingsValue)}
            </h3>
            <p className="text-slate-500 text-xs mt-1.5">
              Locked in stocks based on live prices
            </p>
          </div>
        </div>

        {/* Daily Streak Tracker */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Streak Status</span>
            <span className="flex items-center space-x-1 text-xs font-bold text-accentGold bg-accentGold/10 border border-accentGold/20 px-2.5 py-0.5 rounded-full uppercase">
              🔥 Active
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center">
              <span>{profile?.streak_count || 0}</span>
              <span className="text-sm font-semibold text-slate-400 ml-1.5 uppercase">Days Login</span>
            </h3>
            <p className="text-slate-500 text-xs mt-1.5">
              Streak Freezes: <span className="text-slate-300 font-semibold">{profile?.streak_freeze_count || 0} left</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Holdings (Left) & Gamification Stats (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Holdings Table */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 md:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Briefcase className="h-5 w-5 text-accentGreen" />
                <h2 className="text-lg font-bold text-white">Active Holdings</h2>
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase">{holdings.length} Positions</span>
            </div>

            {holdings.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-slate-500 text-sm">No active holdings in your portfolio.</p>
                <Link to="/market" className="inline-block mt-3 text-accentGreen hover:underline text-xs font-bold uppercase tracking-wider">
                  Browse Stocks to Buy &rarr;
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Stock</th>
                      <th className="pb-3 text-right font-semibold">Qty</th>
                      <th className="pb-3 text-right font-semibold">Avg. Buy</th>
                      <th className="pb-3 text-right font-semibold">LTP (Live)</th>
                      <th className="pb-3 text-right font-semibold">P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/50">
                    {holdings.map((holding) => {
                      const liveStock = stockPrices[holding.stock_symbol];
                      const ltp = liveStock?.current_price || holding.avg_buy_price;
                      const stockChange = liveStock?.change_percent || 0;
                      const cost = holding.quantity * holding.avg_buy_price;
                      const value = holding.quantity * ltp;
                      const profitOrLoss = value - cost;
                      const gainPercent = ((profitOrLoss / cost) * 100).toFixed(2);
                      const isGain = profitOrLoss >= 0;

                      return (
                        <tr
                          key={holding.id}
                          onClick={() => navigate(`/stock/${holding.stock_symbol}`)}
                          className="hover:bg-slate-950/40 cursor-pointer transition-colors group"
                        >
                          <td className="py-3.5 pr-2">
                            <div className="font-bold text-white group-hover:text-accentGreen transition-colors">
                              {holding.stock_symbol}
                            </div>
                            <div className="text-[10px] text-slate-500 max-w-[120px] md:max-w-none truncate">
                              {holding.company_name}
                            </div>
                          </td>
                          <td className="py-3.5 text-right font-semibold text-slate-300">
                            {holding.quantity}
                          </td>
                          <td className="py-3.5 text-right text-slate-300">
                            {formatRupees(holding.avg_buy_price)}
                          </td>
                          <td className="py-3.5 text-right font-medium">
                            <PriceTicker value={ltp} changePercent={stockChange} />
                          </td>
                          <td className="py-3.5 text-right font-bold">
                            <div className={isGain ? 'text-accentGreen' : 'text-accentRed'}>
                              {isGain ? '+' : ''}{formatRupees(profitOrLoss)}
                            </div>
                            <div className={`text-[10px] ${isGain ? 'text-accentGreen/80' : 'text-accentRed/80'}`}>
                              {isGain ? '+' : ''}{gainPercent}%
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {holdings.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-900 flex justify-end">
              <Link to="/market" className="text-slate-400 hover:text-white text-xs font-semibold flex items-center space-x-1">
                <span>View Full Market Terminal</span>
                <ChevronRight className="h-4.5 w-4.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar Cards */}
        <div className="space-y-6">
          
          {/* Learn & Quiz Progress Card */}
          <div className="glass-card rounded-2xl p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <BookOpen className="h-4.5 w-4.5 text-accentGreen" />
                <span>Learning Hub</span>
              </h2>
              <span className="text-xs font-bold text-accentGreen bg-accentGreen/10 px-2 py-0.5 rounded-lg">
                {lessonProgressPercent}% Completed
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-[#050811] h-2 rounded-full overflow-hidden border border-slate-900">
              <div
                className="bg-accentGreen h-full rounded-full transition-all duration-500"
                style={{ width: `${lessonProgressPercent}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-400">
              You completed <span className="text-white font-bold">{completedLessonsCount}</span> out of <span className="text-white font-bold">{totalLessonsCount}</span> lessons. Completing a lesson awards ₹1,000.
            </p>

            <div className="h-px bg-slate-900 my-2"></div>
            
            <div className="flex flex-col space-y-2.5">
              <Link
                to="/learn"
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-950 border border-slate-800 text-center text-xs font-bold tracking-wide uppercase transition-colors"
              >
                Go to Courses
              </Link>
            </div>
          </div>

          {/* Badges / Achievements Card */}
          <div className="glass-card rounded-2xl p-5 md:p-6 space-y-4">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-accentGold" />
              <h2 className="text-base font-bold text-white">Recent Achievements</h2>
            </div>

            {recentAchievements.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-slate-500 text-xs">Execute a trade or finish lessons to earn badges.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {recentAchievements.map((badge) => (
                  <div
                    key={badge.id}
                    className="bg-[#050811]/60 border border-slate-800/80 p-3 rounded-xl flex flex-col items-center justify-center text-center space-y-1.5"
                    title={`Earned on ${new Date(badge.earned_at).toLocaleDateString()}`}
                  >
                    <span className="text-2xl glow-gold">{badge.badge_icon}</span>
                    <span className="text-[10px] font-bold text-slate-300 leading-tight block">
                      {badge.badge_name}
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            <div className="h-px bg-slate-900 my-2"></div>
            <Link to="/profile" className="text-slate-400 hover:text-white text-xs font-semibold flex items-center justify-between">
              <span>View all achievements</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Recent Activity Card */}
          <div className="glass-card rounded-2xl p-5 md:p-6 space-y-4">
            <div className="flex items-center space-x-2">
              <History className="h-5 w-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">Recent Orders</h2>
            </div>

            {transactions.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-slate-500 text-xs">No transactions recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 3).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between text-xs bg-[#050811]/40 border border-slate-900/60 p-2.5 rounded-xl">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className={`font-bold uppercase ${tx.type === 'BUY' ? 'text-accentGreen' : 'text-accentRed'}`}>
                          {tx.type}
                        </span>
                        <span className="text-white font-bold">{tx.stock_symbol}</span>
                      </div>
                      <div className="text-[9px] text-slate-500 mt-0.5">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-200">
                        {tx.quantity} Shares
                      </div>
                      <div className="text-[10px] text-slate-400">
                        @ {formatRupees(tx.price_per_share)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {transactions.length > 0 && (
              <>
                <div className="h-px bg-slate-900 my-2"></div>
                <Link to="/profile" className="text-slate-400 hover:text-white text-xs font-semibold flex items-center justify-between">
                  <span>View full audit logs</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
