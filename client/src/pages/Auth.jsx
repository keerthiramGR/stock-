import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Key, Mail, User, AlertCircle } from 'lucide-react';

export default function Auth() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!username.trim()) throw new Error("Username is required.");
        await signUp(email, password, username);
        setSuccess("Account registered! Please check your email for confirmation, or login if email confirmation is disabled.");
      } else {
        await signIn(email, password);
        navigate('/');
      }
    } catch (err) {
      setError(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleMockLogin = () => {
    setError("Google OAuth is enabled in Supabase! To complete setup, configure the redirect URL in your Supabase dashboard Auth Providers settings.");
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md glass-card p-8 rounded-2xl shadow-xl relative overflow-hidden">
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex bg-gradient-to-tr from-accentGreen to-emerald-400 p-3 rounded-xl mb-4">
            <TrendingUp className="h-6 w-6 text-darkBg" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {isSignUp ? "Create a Free Account" : "Access Trading Terminal"}
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            {isSignUp ? "Get ₹1,00,000 in virtual cash instantly" : "Start paper trading with real-time stock prices"}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-accentRed/10 border border-accentRed/20 text-accentRed rounded-xl flex items-start space-x-2 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-accentGreen/10 border border-accentGreen/20 text-accentGreen rounded-xl flex items-start space-x-2 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="investor101"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#050811] border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-accentGreen transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#050811] border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-accentGreen transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Key className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#050811] border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-accentGreen transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accentGreen hover:bg-emerald-600 text-darkBg font-bold py-3 rounded-xl transition-all duration-200 cursor-pointer shadow-lg hover:shadow-accentGreen/10 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-darkBg"></div>
            ) : (
              <span>{isSignUp ? "Create Trading Profile" : "Connect to Terminal"}</span>
            )}
          </button>
        </form>

        <div className="mt-6 flex flex-col space-y-3 relative z-10">
          <button
            onClick={handleGoogleMockLogin}
            className="w-full bg-transparent hover:bg-slate-900 border border-slate-800 text-slate-300 font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.706 0 3.277.61 4.5 1.625l2.437-2.437C17.312 1.696 14.933 1 12.24 1 6.58 1 2 5.58 2 11.24s4.58 10.24 10.24 10.24c5.795 0 10.24-4.11 10.24-10.24 0-.685-.08-1.355-.24-1.955H12.24z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setSuccess('');
            }}
            className="text-xs font-semibold text-slate-400 hover:text-accentGreen text-center transition-colors focus:outline-none"
          >
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
