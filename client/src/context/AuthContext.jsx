import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
  updateProfile: async () => {},
  signInWithGoogle: async () => {}
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign Up
  const signUp = async (email, password, username) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    });
    if (error) throw error;
    return data;
  };

  // Sign In
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  };

  // Sign Out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
    setUser(null);
  };

  // Sign In with Google OAuth
  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
    return data;
  };

  // Manual Profile Update Helper
  const updateProfile = async (updates) => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);
    if (error) throw error;
  };

  // Function to process streak calculation
  const processStreak = async (fetchedProfile) => {
    if (!fetchedProfile) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const lastLoginStr = fetchedProfile.last_login_date;
    
    // Check if login is already processed today
    if (lastLoginStr === todayStr) {
      return;
    }

    const updates = { last_login_date: todayStr };

    if (!lastLoginStr) {
      // First login ever
      updates.streak_count = 1;
    } else {
      const lastLoginDate = new Date(lastLoginStr);
      const todayDate = new Date(todayStr);
      
      // Calculate difference in days
      const diffTime = todayDate - lastLoginDate;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Logged in consecutive day
        updates.streak_count = fetchedProfile.streak_count + 1;
        
        // Grant streak bonuses
        if (updates.streak_count === 7) {
          updates.virtual_balance = Number(fetchedProfile.virtual_balance) + 10000;
          alert("🎉 7-Day Streak Achieved! ₹10,000 bonus credited!");
        } else if (updates.streak_count === 30) {
          updates.virtual_balance = Number(fetchedProfile.virtual_balance) + 50000;
          alert("🔥 30-Day Streak Achieved! ₹50,000 bonus credited!");
        }
      } else if (diffDays > 1) {
        // Missed a day
        if (fetchedProfile.streak_freeze_count > 0) {
          // Use streak freeze
          updates.streak_freeze_count = fetchedProfile.streak_freeze_count - 1;
          updates.streak_count = fetchedProfile.streak_count; // Maintain streak
          console.log("Streak frozen! Used 1 streak freeze.");
        } else {
          // Reset streak
          updates.streak_count = 1;
        }
      }
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', fetchedProfile.id);
      if (error) console.error("Error updating streak count:", error.message);
    } catch (err) {
      console.error("Streak updating exception:", err);
    }
  };

  useEffect(() => {
    // Check current session
    const getSession = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser(session.user);
          // Fetch profile
          const { data: prof, error: profErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (prof) {
            setProfile(prof);
            await processStreak(prof);
          } else if (profErr) {
            console.error("Error fetching profile:", profErr.message);
          }
        }
      } catch (err) {
        console.error("Error checking session:", err);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen to Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setUser(session.user);
        
        // Fetch or subscribe profile
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (prof) {
          setProfile(prof);
          await processStreak(prof);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Listen to profile updates in real-time
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`profile-changes-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new) {
            setProfile(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, updateProfile, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
