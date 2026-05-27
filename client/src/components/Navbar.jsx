import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, Award, BookOpen, Brain, LayoutDashboard, LineChart, LogOut, Menu, X, User } from 'lucide-react';

export default function Navbar() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const formatRupees = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(value || 0);
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Market', path: '/market', icon: LineChart },
    { name: 'Learn', path: '/learn', icon: BookOpen },
    { name: 'Quiz', path: '/quiz', icon: Brain },
    { name: 'Leaderboard', path: '/leaderboard', icon: Award },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#070b14]/80 backdrop-blur-md border-b border-slate-900 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 text-xl font-bold tracking-tight text-white">
          <div className="bg-gradient-to-tr from-accentGreen to-emerald-400 p-1.5 rounded-lg">
            <TrendingUp className="h-5 w-5 text-darkBg" />
          </div>
          <span>Antigravity<span className="text-accentGreen">Trade</span></span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-slate-900 text-accentGreen border-b-2 border-accentGreen/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-950'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Right Side Stats & Profile */}
        <div className="hidden md:flex items-center space-x-4">
          {/* Streak */}
          <Link to="/profile" className="flex items-center space-x-1 bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg hover:border-accentGold/45 transition-colors">
            <span className="text-base" role="img" aria-label="streak">🔥</span>
            <span className="text-xs font-semibold text-slate-300">{profile?.streak_count || 0} Days</span>
          </Link>

          {/* Virtual Balance */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Virtual Balance</span>
            <span className="text-sm font-bold text-accentGreen glow-green">
              {formatRupees(profile?.virtual_balance)}
            </span>
          </div>

          {/* Profile link */}
          <Link
            to="/profile"
            className="flex items-center space-x-1 text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-950 border border-slate-800 p-2 rounded-lg transition-colors"
            title="Profile"
          >
            <User className="h-4 w-4" />
          </Link>

          {/* Log Out */}
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-accentRed bg-slate-900/40 hover:bg-accentRed/10 border border-slate-800 hover:border-accentRed/30 p-2 rounded-lg transition-all"
            title="Log Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex md:hidden items-center space-x-3">
          {/* Balance for mobile quick view */}
          <div className="flex flex-col items-end text-xs">
            <span className="text-accentGreen font-bold">
              {formatRupees(profile?.virtual_balance)}
            </span>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-slate-900 flex flex-col space-y-2 animate-fadeIn">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2.5 p-3 rounded-lg text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-accentGreen'
                    : 'text-slate-400 hover:text-white hover:bg-slate-950'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <div className="h-px bg-slate-900 my-2"></div>

          <div className="flex items-center justify-between p-3">
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2 text-slate-300"
            >
              <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg">
                <User className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold">View Profile</span>
            </Link>

            <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
              <span>🔥</span>
              <span className="text-xs font-bold text-slate-300">{profile?.streak_count || 0} Streak</span>
            </div>
          </div>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              handleLogout();
            }}
            className="flex items-center justify-center space-x-2 w-full p-3 rounded-lg text-sm font-semibold bg-accentRed/10 border border-accentRed/20 text-accentRed hover:bg-accentRed/20 transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Log Out</span>
          </button>
        </div>
      )}
    </nav>
  );
}
