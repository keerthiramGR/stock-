import React, { useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { useNavigate } from 'react-router-dom';
import PriceTicker from '../components/PriceTicker';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Search, TrendingUp, TrendingDown, ArrowRight, Activity } from 'lucide-react';

// Card Sparkline component to display a mini trend chart
const Sparkline = ({ basePrice, currentPrice, isPositive }) => {
  // Generate a deterministic path of 8 data points ending at currentPrice
  const points = [];
  const count = 8;
  const startPrice = basePrice * (isPositive ? 0.985 : 1.015);
  const diff = currentPrice - startPrice;

  for (let i = 0; i < count; i++) {
    const factor = i / (count - 1);
    const noise = Math.sin(i * 1.5) * (basePrice * 0.004);
    points.push({ price: startPrice + (diff * factor) + noise });
  }

  const strokeColor = isPositive ? '#10b981' : '#f43f5e';
  const fillGradient = isPositive ? 'url(#sparklineGreen)' : 'url(#sparklineRed)';

  return (
    <div className="h-10 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 2, bottom: 2, left: 2, right: 2 }}>
          <defs>
            <linearGradient id="sparklineGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="sparklineRed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="price"
            stroke={strokeColor}
            strokeWidth={1.5}
            fill={fillGradient}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default function Market() {
  const { stockPrices } = usePortfolio();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'GAINERS' | 'LOSERS'

  const formatRupees = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(value || 0);
  };

  const stocks = Object.values(stockPrices);

  // Filters and searches stocks
  const filteredStocks = stocks.filter(stock => {
    const matchesSearch = stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (activeFilter === 'GAINERS') {
      return stock.change_percent > 0;
    } else if (activeFilter === 'LOSERS') {
      return stock.change_percent < 0;
    }
    
    return true;
  });

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn">
      {/* Header and overview */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center space-x-2">
            <Activity className="h-7 w-7 text-accentGreen" />
            <span>Market Terminal</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time Indian Equity tickers. Click on any asset to execute trades or view interactive history.
          </p>
        </div>
      </div>

      {/* Filters & search block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 border border-slate-900 p-4 rounded-2xl">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by ticker or company name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#050811] border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accentGreen transition-colors"
          />
        </div>

        {/* Toggles */}
        <div className="flex items-center space-x-2">
          {['ALL', 'GAINERS', 'LOSERS'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer ${
                activeFilter === filter
                  ? 'bg-accentGreen text-darkBg'
                  : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of stock cards */}
      {filteredStocks.length === 0 ? (
        <div className="py-16 text-center glass-card rounded-2xl">
          <p className="text-slate-500 text-sm">No stocks matched your filters or search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStocks.map((stock) => {
            const isPositive = stock.change_percent >= 0;
            // Base price approximated for sparkline reference
            const basePrice = stock.current_price / (1 + (stock.change_percent / 100));

            return (
              <div
                key={stock.symbol}
                onClick={() => navigate(`/stock/${stock.symbol}`)}
                className="glass-card rounded-2xl p-5 cursor-pointer hover:scale-[1.01] hover:border-slate-800 transition-all flex flex-col justify-between space-y-4 group relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-lg text-white group-hover:text-accentGreen transition-colors">
                      {stock.symbol}
                    </h3>
                    <p className="text-slate-500 text-[11px] font-semibold mt-0.5 line-clamp-1">
                      {stock.company_name}
                    </p>
                  </div>
                  
                  {/* Percent Badge */}
                  <span className={`flex items-center space-x-0.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                    isPositive ? 'bg-accentGreen/10 text-accentGreen' : 'bg-accentRed/10 text-accentRed'
                  }`}>
                    {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    <span>{isPositive ? '+' : ''}{stock.change_percent}%</span>
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    {/* Live price ticker */}
                    <div className="text-xl font-black">
                      <PriceTicker value={stock.current_price} changePercent={stock.change_percent} />
                    </div>
                    {/* High/Low */}
                    <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-1 font-semibold">
                      <span>H: {formatRupees(stock.high_price)}</span>
                      <span>L: {formatRupees(stock.low_price)}</span>
                    </div>
                  </div>

                  {/* Sparkline Chart */}
                  <Sparkline
                    basePrice={basePrice}
                    currentPrice={stock.current_price}
                    isPositive={isPositive}
                  />
                </div>

                {/* Card footer details */}
                <div className="pt-3 border-t border-slate-900/60 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-white transition-colors">
                  <span>Open Market order</span>
                  <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
