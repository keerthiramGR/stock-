import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { BookOpen, CheckCircle, ChevronRight, Lock, Award, ArrowLeft, PlayCircle } from 'lucide-react';

export default function Learn() {
  const { profile, updateProfile } = useAuth();
  
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selected lesson to read
  const [activeLesson, setActiveLesson] = useState(null);
  const [claiming, setClaiming] = useState(false);

  const formatRupees = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(value || 0);
  };

  const fetchData = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      // Fetch all lessons
      const { data: lessonData } = await supabase
        .from('lessons')
        .select('*')
        .order('order_index', { ascending: true });
      
      setLessons(lessonData || []);

      // Fetch user's completed lesson progress
      const { data: progressData } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', profile.id)
        .eq('completed', true);

      setProgress(progressData || []);
    } catch (err) {
      console.error("Error loading courses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  const isCompleted = (lessonId) => {
    return progress.some(p => p.lesson_id === lessonId);
  };

  const handleCompleteLesson = async (lesson) => {
    if (!profile || isCompleted(lesson.id)) return;
    setClaiming(true);

    try {
      // 1. Write progress
      const { error } = await supabase
        .from('lesson_progress')
        .insert({
          user_id: profile.id,
          lesson_id: lesson.id,
          completed: true
        });

      if (error) throw error;

      // 2. Credit profile balance
      const reward = Number(lesson.rupees_reward);
      const newBalance = Number(profile.virtual_balance) + reward;
      await updateProfile({
        virtual_balance: parseFloat(newBalance.toFixed(2))
      });

      // 3. Award "Lesson Graduate" Badge if this is their first completed lesson
      const completedCount = progress.length + 1;
      if (completedCount === 1) {
        const { data: hasBadge } = await supabase
          .from('achievements')
          .select('badge_name')
          .eq('user_id', profile.id)
          .eq('badge_name', 'Lesson Graduate')
          .maybeSingle();

        if (!hasBadge) {
          await supabase.from('achievements').insert({
            user_id: profile.id,
            badge_name: 'Lesson Graduate',
            badge_icon: '🎓'
          });
          alert("🏆 Achievement Unlocked: Lesson Graduate!");
        }
      }

      alert(`🎉 Lesson completed! ${formatRupees(reward)} credited to your account.`);
      
      // Refresh local progress state
      await fetchData();
      
      // Keep active view open, it will now show completed state
    } catch (err) {
      console.error("Error completing lesson:", err.message);
    } finally {
      setClaiming(false);
    }
  };

  // Group lessons by level
  const levels = ['beginner', 'intermediate', 'advanced'];
  const getLevelColor = (level) => {
    switch (level) {
      case 'beginner': return 'text-accentGreen bg-accentGreen/10 border-accentGreen/20';
      case 'intermediate': return 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20';
      case 'advanced': return 'text-accentGold bg-accentGold/10 border-accentGold/20';
      default: return 'text-slate-400 bg-slate-900 border-slate-800';
    }
  };

  if (loading) {
    return (
      <div className="py-16 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accentGreen"></div>
      </div>
    );
  }

  // Render detail view of active lesson
  if (activeLesson) {
    const lessonDone = isCompleted(activeLesson.id);
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
        {/* Back button */}
        <div>
          <button
            onClick={() => setActiveLesson(null)}
            className="inline-flex items-center space-x-1.5 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
            <span>Back to Lessons</span>
          </button>
        </div>

        {/* Lesson Card */}
        <div className="glass-card rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full border ${getLevelColor(activeLesson.level)}`}>
              {activeLesson.level}
            </span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Reward: {formatRupees(activeLesson.rupees_reward)}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            {activeLesson.title}
          </h1>

          <div className="h-px bg-slate-900"></div>

          {/* Simple custom markdown style formatter */}
          <div className="prose prose-invert text-slate-300 text-sm md:text-base leading-relaxed space-y-4 max-w-none">
            {activeLesson.content.split('\n\n').map((paragraph, pIdx) => {
              if (paragraph.startsWith('### ')) {
                return <h3 key={pIdx} className="text-lg md:text-xl font-bold text-white mt-6 mb-2">{paragraph.replace('### ', '')}</h3>;
              }
              if (paragraph.startsWith('#### ')) {
                return <h4 key={pIdx} className="text-base md:text-lg font-bold text-white mt-4 mb-2">{paragraph.replace('#### ', '')}</h4>;
              }
              if (paragraph.startsWith('- ')) {
                return (
                  <ul key={pIdx} className="list-disc pl-5 space-y-1.5 my-2">
                    {paragraph.split('\n').map((li, lIdx) => (
                      <li key={lIdx}>{li.replace('- ', '').replace('[x] ', '✓ ').replace('[ ] ', '☐ ')}</li>
                    ))}
                  </ul>
                );
              }
              return <p key={pIdx}>{paragraph}</p>;
            })}
          </div>

          <div className="pt-6 border-t border-slate-900/60 flex items-center justify-between">
            {lessonDone ? (
              <div className="flex items-center space-x-2 text-accentGreen bg-accentGreen/10 border border-accentGreen/20 px-4 py-2.5 rounded-xl font-bold text-sm w-full justify-center">
                <CheckCircle className="h-5 w-5" />
                <span>Lesson Completed & Reward Claimed</span>
              </div>
            ) : (
              <button
                disabled={claiming}
                onClick={() => handleCompleteLesson(activeLesson)}
                className="w-full bg-accentGreen hover:bg-emerald-600 text-darkBg font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-accentGreen/10 flex items-center justify-center space-x-1.5 text-sm cursor-pointer uppercase tracking-wider"
              >
                {claiming ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-darkBg"></div>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    <span>Complete Lesson & Claim {formatRupees(activeLesson.rupees_reward)}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center space-x-2">
          <BookOpen className="h-7 w-7 text-accentGreen" />
          <span>Financial Academy</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Unlock structured courses from stock market fundamentals to advanced risk management. Complete each to claim cash.
        </p>
      </div>

      {/* Progress overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {levels.map((level) => {
          const levelLessons = lessons.filter(l => l.level === level);
          const completedCount = levelLessons.filter(l => isCompleted(l.id)).length;
          const totalCount = levelLessons.length;
          const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

          return (
            <div key={level} className="glass-card rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${getLevelColor(level)}`}>
                  {level}
                </span>
                <span className="text-xs text-slate-400 font-bold">{completedCount} / {totalCount} Done</span>
              </div>
              <div className="w-full bg-[#050811] h-1.5 rounded-full overflow-hidden border border-slate-900">
                <div
                  className="bg-accentGreen h-full rounded-full transition-all duration-300"
                  style={{ width: `${pct}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lesson list by level */}
      <div className="space-y-8 pt-4">
        {levels.map((level) => {
          const levelLessons = lessons.filter(l => l.level === level);
          if (levelLessons.length === 0) return null;

          return (
            <div key={level} className="space-y-4">
              <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accentGreen"></span>
                <span>{level} course</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {levelLessons.map((lesson) => {
                  const done = isCompleted(lesson.id);
                  return (
                    <div
                      key={lesson.id}
                      onClick={() => setActiveLesson(lesson)}
                      className="glass-card rounded-2xl p-5 cursor-pointer hover:border-slate-800 transition-all flex items-start justify-between space-x-4 group"
                    >
                      <div className="space-y-2">
                        <h3 className="font-extrabold text-white group-hover:text-accentGreen transition-colors line-clamp-1">
                          {lesson.title}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 pr-4">
                          {lesson.content.replace(/###|####|#|\*|-|\[x\]|\[ \]/g, '').slice(0, 120)}...
                        </p>
                        
                        <div className="flex items-center space-x-3 pt-2 text-[10px] font-semibold text-slate-400">
                          <span className="text-accentGreen">{formatRupees(lesson.rupees_reward)} Reward</span>
                        </div>
                      </div>

                      {done ? (
                        <span className="p-1.5 bg-accentGreen/10 border border-accentGreen/20 text-accentGreen rounded-xl shrink-0 mt-1">
                          <CheckCircle className="h-4.5 w-4.5" />
                        </span>
                      ) : (
                        <span className="p-1.5 bg-slate-900 border border-slate-850 text-slate-400 group-hover:text-white rounded-xl shrink-0 mt-1 transition-colors">
                          <PlayCircle className="h-4.5 w-4.5" />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
