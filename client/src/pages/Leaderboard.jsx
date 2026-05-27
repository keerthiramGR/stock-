import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Award, Trophy, User, ArrowUpRight, Loader2 } from 'lucide-react';

export default function Leaderboard() {
  const { profile } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatRupees = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(value || 0);
  };

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .limit(10);
      
      if (error) throw error;
      setLeaders(data || []);
    } catch (err) {
      console.error("Error fetching leaderboard view:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    
    // Set up polling interval to fetch leaderboard updates every 10 seconds
    const interval = setInterval(() => {
      fetchLeaderboard();
    }, 10000);

    // Subscribe to profiles changes to trigger manual re-fetches
    const profileSub = supabase
      .channel('leaderboard-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(profileSub);
    };
  }, []);

  const getRankBadge = (index) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-accentGold drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]" />;
      case 1:
        return <Award className="h-5 w-5 text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.4)]" />;
      case 2:
        return <Award className="h-5 w-5 text-amber-600 drop-shadow-[0_0_8px_rgba(180,83,9,0.4)]" />;
      default:
        return <span className="text-slate-500 font-bold w-5 text-center text-xs">{index + 1}</span>;
    }
  };

  if (loading) {
    return (
      <div className="py-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accentGreen" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 md:space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center space-x-2">
          <Trophy className="h-7 w-7 text-accentGold" />
          <span>Global Leaderboard</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Top 10 users ranked by aggregate portfolio value (virtual cash + holdings valuation). Updates live.
        </p>
      </div>

      {/* Rankings List Container */}
      <div className="glass-card rounded-3xl overflow-hidden border border-slate-900 shadow-xl">
        <div className="p-4 md:p-5 border-b border-slate-900 bg-slate-900/20 flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <div className="flex items-center space-x-4">
            <span className="w-8 text-center">Rank</span>
            <span>Trader Name</span>
          </div>
          <div className="text-right">
            <span>Portfolio Value</span>
          </div>
        </div>

        <div className="divide-y divide-slate-900">
          {leaders.map((leader, index) => {
            const isSelf = profile && leader.id === profile.id;
            const rankStyle = isSelf ? 'bg-accentGreen/5 border-l-4 border-l-accentGreen' : '';

            return (
              <div
                key={leader.id}
                className={`p-4 md:p-5 flex items-center justify-between transition-colors ${rankStyle}`}
              >
                {/* User stats */}
                <div className="flex items-center space-x-4">
                  <div className="w-8 flex justify-center items-center">
                    {getRankBadge(index)}
                  </div>
                  
                  {/* User Profile Info */}
                  <div className="flex items-center space-x-2.5">
                    {leader.avatar_url ? (
                      <img
                        src={leader.avatar_url}
                        alt={leader.username}
                        className="h-8 w-8 rounded-full border border-slate-800"
                      />
                    ) : (
                      <div className={`p-1.5 rounded-lg border ${
                        isSelf ? 'bg-accentGreen/10 border-accentGreen/30 text-accentGreen' : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}>
                        <User className="h-4.5 w-4.5" />
                      </div>
                    )}
                    <div>
                      <div className={`text-sm font-bold flex items-center space-x-1.5 ${isSelf ? 'text-accentGreen' : 'text-slate-200'}`}>
                        <span>{leader.username || 'Anonymous'}</span>
                        {isSelf && (
                          <span className="text-[9px] bg-accentGreen/10 px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wide">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-semibold mt-0.5 flex items-center space-x-1">
                        <span>🔥 {leader.streak_count || 0} Streak</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Valuations */}
                <div className="text-right">
                  <div className="text-sm font-black text-white">
                    {formatRupees(leader.total_portfolio_value)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Cash: {formatRupees(leader.virtual_balance)}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Helpful tip overlay */}
      <div className="bg-slate-900/35 border border-slate-900 p-4 rounded-2xl flex items-start space-x-3 text-xs text-slate-400">
        <span className="text-base">💡</span>
        <p className="leading-relaxed">
          Want to climb the ranks? Compete in daily quizzes (+₹500 correct answer, +₹2,000 completion bonus) and log in consecutively to claim streak bonuses! Then, invest your funds in high-performing stocks to grow your net worth.
        </p>
      </div>
    </div>
  );
}
