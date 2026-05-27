import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Brain, Clock, Award, CheckCircle, XCircle, ChevronRight, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Quiz() {
  const { profile, updateProfile } = useAuth();
  
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quizAttemptedToday, setQuizAttemptedToday] = useState(false);
  const [pastAttempt, setPastAttempt] = useState(null);

  // Active quiz state
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null); // null or index 0-3
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(30);
  const [earnings, setEarnings] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const formatRupees = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(value || 0);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Check if already attempted today
  useEffect(() => {
    if (!profile) return;

    const checkQuizStatus = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('user_id', profile.id)
          .eq('date', todayStr)
          .maybeSingle();

        if (data) {
          setQuizAttemptedToday(true);
          setPastAttempt(data);
        } else {
          // Fetch quiz questions
          const { data: qList } = await supabase
            .from('quiz_questions')
            .select('*');
          
          if (qList && qList.length > 0) {
            // Pick 10 random questions
            const shuffled = [...qList].sort(() => 0.5 - Math.random());
            setQuestions(shuffled.slice(0, 10));
          }
        }
      } catch (err) {
        console.error("Error checking quiz status:", err);
      } finally {
        setLoading(false);
      }
    };

    checkQuizStatus();
  }, [profile]);

  // Timer logic
  useEffect(() => {
    if (!started || answered || quizFinished) return;

    if (timer === 0) {
      // Auto-submit as wrong on timeout
      handleAnswerSelect(-1); // -1 triggers timeout incorrect
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [started, timer, answered, quizFinished]);

  const handleAnswerSelect = (optionIndex) => {
    if (answered) return;
    
    setSelectedOption(optionIndex);
    setAnswered(true);

    const correctIndex = questions[currentIndex].correct_option;
    let earnedThisQuestion = 0;

    if (optionIndex === correctIndex) {
      setScore((prev) => prev + 1);
      earnedThisQuestion = 500;
      setEarnings((prev) => prev + 500);
    }

    // Accumulate virtual balance credit
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setAnswered(false);
      setTimer(30);
    } else {
      // Finished
      setQuizFinished(true);
      
      // Calculate final bonuses
      let totalEarned = score * 500;
      let isPerfect = score === questions.length;
      if (isPerfect) {
        totalEarned += 2000; // completion/perfect bonus
      }

      // 1. Submit attempt to db
      try {
        const { error } = await supabase
          .from('quiz_attempts')
          .insert({
            user_id: profile.id,
            date: todayStr,
            score: score,
            total_questions: questions.length,
            rupees_earned: totalEarned,
            completed: true
          });
        
        if (error) console.error("Error saving quiz attempt:", error.message);

        // 2. Update profile cash and total quiz count
        const newBalance = Number(profile.virtual_balance) + totalEarned;
        await updateProfile({
          virtual_balance: parseFloat(newBalance.toFixed(2)),
          total_quiz_completed: profile.total_quiz_completed + 1
        });

        // 3. Award Achievement Badges
        const awardBadge = async (name, icon) => {
          // Check if already earned
          const { data } = await supabase
            .from('achievements')
            .select('badge_name')
            .eq('user_id', profile.id)
            .eq('badge_name', name)
            .maybeSingle();

          if (!data) {
            await supabase.from('achievements').insert({
              user_id: profile.id,
              badge_name: name,
              badge_icon: icon
            });
            alert(`🏆 Achievement Unlocked: ${name}!`);
          }
        };

        if (isPerfect) {
          await awardBadge('Quiz Master', '🎓');
        }

        // Fire celebration confetti!
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });

      } catch (err) {
        console.error("Quiz submission error:", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="py-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accentGreen" />
      </div>
    );
  }

  // Case 1: Already took quiz today
  if (quizAttemptedToday) {
    return (
      <div className="max-w-xl mx-auto glass-card p-8 rounded-2xl text-center space-y-6 animate-fadeIn">
        <div className="inline-flex bg-slate-900 border border-slate-800 p-4 rounded-full text-accentGold mb-2">
          <Lock className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-white">Daily Quiz Completed</h1>
        <p className="text-slate-400 text-sm">
          You have already completed today's quiz session. Return tomorrow for new financial trivia challenges!
        </p>

        {pastAttempt && (
          <div className="bg-[#050811] p-4 rounded-xl border border-slate-900 space-y-2.5 max-w-sm mx-auto text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Score:</span>
              <span className="font-bold text-white">{pastAttempt.score} / {pastAttempt.total_questions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Rupees Earned:</span>
              <span className="font-bold text-accentGreen">{formatRupees(pastAttempt.rupees_earned)}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Case 2: Quiz finished
  if (quizFinished) {
    const isPerfect = score === questions.length;
    const totalEarned = score * 500 + (isPerfect ? 2000 : 0);

    return (
      <div className="max-w-xl mx-auto glass-card p-8 rounded-2xl text-center space-y-6 animate-fadeIn">
        <div className="inline-flex bg-accentGreen/15 border border-accentGreen/20 p-4 rounded-full text-accentGreen mb-2">
          <Award className="h-10 w-10" />
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Daily Quiz Complete!</h1>
        
        <div className="py-4 space-y-4">
          <div className="text-sm text-slate-400">
            You answered <span className="text-white font-extrabold">{score}</span> out of <span className="text-white font-extrabold">{questions.length}</span> questions correctly.
          </div>
          
          <div className="bg-[#050811] p-5 rounded-2xl border border-slate-900 grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Correct Answers</div>
              <div className="text-xl font-bold text-white mt-1">+{score * 500}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Perfect Bonus</div>
              <div className="text-xl font-bold text-white mt-1">+{isPerfect ? 2000 : 0}</div>
            </div>
          </div>

          <div className="text-xl font-extrabold text-accentGreen mt-2">
            Total Reward: {formatRupees(totalEarned)}
          </div>
        </div>

        <p className="text-xs text-slate-500">
          The rewards have been added directly to your virtual balance. Check back tomorrow!
        </p>
      </div>
    );
  }

  // Case 3: Quiz not started
  if (!started) {
    return (
      <div className="max-w-xl mx-auto glass-card p-8 rounded-2xl text-center space-y-6 animate-fadeIn">
        <div className="inline-flex bg-gradient-to-tr from-accentGreen to-emerald-400 p-4 rounded-2xl mb-2 text-darkBg">
          <Brain className="h-8 w-8" />
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Daily Financial Trivia</h1>
        <p className="text-slate-400 text-sm">
          Test your stock market knowledge with our daily 10-question quiz. Earn virtual rupees to grow your portfolio.
        </p>

        <div className="bg-[#050811]/60 p-4 rounded-xl border border-slate-900 space-y-2 text-left text-xs text-slate-300">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-accentGreen" />
            <span>₹500 credited for each correct answer</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-accentGreen" />
            <span>₹2,000 bonus for a perfect score (10/10)</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-indigo-400" />
            <span>30 seconds limit per question</span>
          </div>
        </div>

        <button
          onClick={() => setStarted(true)}
          className="w-full bg-accentGreen hover:bg-emerald-600 text-darkBg font-bold py-3.5 rounded-xl cursor-pointer shadow-lg hover:shadow-accentGreen/15 transition-all text-sm uppercase tracking-wide"
        >
          Begin Quiz
        </button>
      </div>
    );
  }

  // Case 4: Actively playing
  const currentQuestion = questions[currentIndex];
  const options = typeof currentQuestion.options === 'string' ? JSON.parse(currentQuestion.options) : currentQuestion.options;
  const correctOption = currentQuestion.correct_option;

  return (
    <div className="max-w-2xl mx-auto glass-card p-6 md:p-8 rounded-3xl shadow-xl space-y-6 animate-fadeIn">
      {/* Progress & timer */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="text-xs font-semibold text-slate-400">
          Question <span className="text-white font-bold">{currentIndex + 1}</span> of <span className="text-white font-bold">{questions.length}</span>
        </div>
        
        {/* Timer UI */}
        <div className="flex items-center space-x-1.5 text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
          <Clock className="h-4 w-4 text-accentGold" />
          <span className="font-bold text-white">{timer}s</span>
        </div>
      </div>

      {/* Category & difficulty */}
      <div className="flex items-center space-x-2">
        <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold uppercase px-2.5 py-0.5 rounded-full">
          {currentQuestion.category}
        </span>
        <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 font-bold uppercase px-2.5 py-0.5 rounded-full">
          {currentQuestion.difficulty}
        </span>
      </div>

      {/* Question string */}
      <h2 className="text-lg md:text-xl font-bold text-white leading-snug">
        {currentQuestion.question}
      </h2>

      {/* Options grid */}
      <div className="grid grid-cols-1 gap-3 pt-2">
        {options.map((option, idx) => {
          let optionClass = 'bg-[#050811] border-slate-800 text-slate-300 hover:border-slate-700';
          
          if (answered) {
            if (idx === correctOption) {
              optionClass = 'bg-accentGreen/10 border-accentGreen text-accentGreen font-semibold';
            } else if (selectedOption === idx) {
              optionClass = 'bg-accentRed/10 border-accentRed text-accentRed';
            } else {
              optionClass = 'bg-[#050811]/45 border-slate-900/60 text-slate-500 opacity-60';
            }
          }

          return (
            <button
              key={idx}
              disabled={answered}
              onClick={() => handleAnswerSelect(idx)}
              className={`w-full text-left p-4 rounded-xl border text-sm transition-all focus:outline-none flex items-center justify-between ${
                !answered ? 'cursor-pointer hover:bg-slate-900/40' : ''
              } ${optionClass}`}
            >
              <span>{option}</span>
              {answered && idx === correctOption && <CheckCircle className="h-4.5 w-4.5 text-accentGreen shrink-0 ml-2" />}
              {answered && selectedOption === idx && idx !== correctOption && <XCircle className="h-4.5 w-4.5 text-accentRed shrink-0 ml-2" />}
            </button>
          );
        })}
      </div>

      {/* Explanation & Next */}
      {answered && (
        <div className="space-y-4 pt-4 border-t border-slate-900/60 animate-fadeIn">
          <div className="bg-[#050811]/60 p-4 rounded-2xl border border-slate-900/80 text-xs text-slate-300 leading-relaxed">
            <div className="font-extrabold text-white mb-1.5 uppercase tracking-wide">Explanation:</div>
            {currentQuestion.explanation}
          </div>

          <button
            onClick={handleNext}
            className="w-full bg-accentGreen hover:bg-emerald-600 text-darkBg font-bold py-3 rounded-xl cursor-pointer shadow-lg hover:shadow-accentGreen/10 transition-colors flex items-center justify-center space-x-1"
          >
            <span>{currentIndex < questions.length - 1 ? "Next Question" : "View Final Score"}</span>
            <ChevronRight className="h-4.5 w-4.5" />
          </button>
        </div>
      )}
    </div>
  );
}
