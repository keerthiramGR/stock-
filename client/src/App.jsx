import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Market from './pages/Market';
import StockDetail from './pages/StockDetail';
import Quiz from './pages/Quiz';
import Learn from './pages/Learn';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Auth from './pages/Auth';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-darkBg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accentGreen"></div>
      </div>
    );
  }
  return user ? children : <Navigate to="/auth" replace />;
};

function App() {
  const { user } = useAuth();
  
  return (
    <Router>
      <div className="min-h-screen bg-darkBg text-slate-100 flex flex-col">
        {user && <Navbar />}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:py-8">
          <Routes>
            <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" replace />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/market" element={<ProtectedRoute><Market /></ProtectedRoute>} />
            <Route path="/stock/:symbol" element={<ProtectedRoute><StockDetail /></ProtectedRoute>} />
            <Route path="/quiz" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
            <Route path="/learn" element={<ProtectedRoute><Learn /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer className="py-6 text-center text-xs text-slate-500 border-t border-slate-900 bg-[#04060d] mt-auto">
          <p>⚠️ Paper Trading Mode. All transactions on this platform are simulated with virtual rupees.</p>
          <p className="mt-1">Disclaimer: Educational purposes only. Not financial advice.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
