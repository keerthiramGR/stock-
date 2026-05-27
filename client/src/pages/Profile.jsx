import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePortfolio } from '../context/PortfolioContext';
import { supabase } from '../lib/supabaseClient';
import { User, Award, History, Briefcase, Calendar, CheckCircle2, Lock, ShieldAlert, Loader2 } from 'lucide-react';

const BADGES_LIBRARY = [
  { name: 'First Trade', icon: '🚀', description: 'Executed your first paper trade order.' },
  { name: 'Profit Maker', icon: '💰', description: 'Generated over ₹5,000 in unrealized holdings returns.' },
  { name: 'Quiz Master', icon: '🎓', description: 'Answered all 10 questions correctly on a daily quiz.' },
  { name: 'Lesson Graduate', icon: '📚', description: 'Successfully completed your first course lesson.' }
];

export default function Profile() {
  const { profile } = useAuth();
  const { transactions, portfolioValue } = usePortfolio();
  
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [loadingBadges, setLoadingBadges] = useState(true);

  const formatRupees = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(value || 0);
  };

  useEffect(() => {
    if (!profile) return;

    const fetchBadges = async () => {
      try {
        const { data, error } = await supabase
          .from('achievements')
          .select('*')
          .eq('user_id', profile.id);

        if (error) throw error;
        setEarnedBadges((data || []).map(b => b.badge_name));
      } catch (err) {
        console.error("Error loading achievements:", err);
      } finally {
        setLoadingBadges(false);
      }
    };

    fetchBadges();
  }, [profile, transactions]);

  if (!profile) return null;

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl text-accentGreen relative">
          <User className="h-10 w-10" />
          <span className="absolute bottom-1 right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accentGreen opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-accentGreen"></span>
          </span>
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">{profile.username || 'Trader'}</h1>
          <p className="text-slate-500 text-xs mt-1 flex items-center">
            <Calendar className="h-3.5 w-3.5 mr-1" />
            <span>Joined on {new Date(profile.created_at).toLocaleDateString()}</span>
          </p>
        </div>
      </div>

      {/* Profile statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl">
          <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Net Portfolio Worth</div>
          <div className="text-xl font-black text-white mt-1.5">{formatRupees(portfolioValue)}</div>
        </div>
        <div className="glass-card p-5 rounded-2xl">
          <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Streak count</div>
          <div className="text-xl font-black text-white mt-1.5">🔥 {profile.streak_count} Days</div>
        </div>
        <div className="glass-card p-5 rounded-2xl">
          <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Freezes Available</div>
          <div className="text-xl font-black text-white mt-1.5">❄️ {profile.streak_freeze_count} Freezes</div>
        </div>
        <div className="glass-card p-5 rounded-2xl">
          <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Quizzes Completed</div>
          <div className="text-xl font-black text-white mt-1.5">🎓 {profile.total_quiz_completed} Quizzes</div>
        </div>
      </div>

      {/* Badge Trophy Room */}
      <div className="glass-card rounded-2xl p-5 md:p-6 space-y-4">
        <div className="flex items-center space-x-2">
          <Award className="h-5 w-5 text-accentGold" />
          <h2 className="text-base font-bold text-white uppercase tracking-wider">Achievement Gallery</h2>
        </div>

        {loadingBadges ? (
          <div className="py-6 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-accentGreen" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {BADGES_LIBRARY.map((badge) => {
              const isEarned = earnedBadges.includes(badge.name);
              return (
                <div
                  key={badge.name}
                  className={`border p-4 rounded-xl flex flex-col justify-between space-y-3 transition-colors ${
                    isEarned
                      ? 'bg-slate-900/40 border-slate-800 text-slate-200'
                      : 'bg-slate-950/20 border-slate-900 text-slate-600 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className={`text-3xl ${isEarned ? 'glow-gold' : 'grayscale'}`}>{badge.icon}</span>
                    {isEarned ? (
                      <span className="text-[10px] bg-accentGreen/10 text-accentGreen px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                        Unlocked
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-900 text-slate-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center space-x-0.5">
                        <Lock className="h-2.5 w-2.5" />
                        <span>Locked</span>
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-200">{badge.name}</h3>
                    <p className="text-[11px] text-slate-500 mt-1 leading-normal">{badge.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transaction History Log */}
      <div className="glass-card rounded-2xl p-5 md:p-6 space-y-4">
        <div className="flex items-center space-x-2">
          <History className="h-5 w-5 text-indigo-400" />
          <h2 className="text-base font-bold text-white uppercase tracking-wider">Transaction Ledger</h2>
        </div>

        {transactions.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">
            You haven't executed any trades yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-900 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Stock</th>
                  <th className="pb-3 font-semibold">Action</th>
                  <th className="pb-3 text-right font-semibold">Qty</th>
                  <th className="pb-3 text-right font-semibold">Share Price</th>
                  <th className="pb-3 text-right font-semibold">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/50">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-900/10 transition-colors">
                    <td className="py-3 text-slate-400 font-medium">
                      {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3">
                      <div className="font-bold text-white">{tx.stock_symbol}</div>
                      <div className="text-[9px] text-slate-500 truncate max-w-[120px] md:max-w-none">{tx.company_name}</div>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        tx.type === 'BUY' ? 'bg-accentGreen/10 text-accentGreen' : 'bg-accentRed/10 text-accentRed'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 text-right font-bold text-slate-300">
                      {tx.quantity}
                    </td>
                    <td className="py-3 text-right text-slate-300">
                      {formatRupees(tx.price_per_share)}
                    </td>
                    <td className="py-3 text-right font-bold text-slate-200">
                      {formatRupees(tx.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
