import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePortfolio } from '../context/PortfolioContext';
import { useAuth } from '../context/AuthContext';
import PriceTicker from '../components/PriceTicker';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Briefcase, DollarSign, Loader2, RefreshCw } from 'lucide-react';

export default function StockDetail() {
  const { symbol } = useParams();
  const { profile } = useAuth();
  const { stockPrices, holdings, executeTrade, refreshPortfolio } = usePortfolio();
  
  const [range, setRange] = useState('1d'); // '1d' | '1w' | '1m' | '1y'
  const [history, setHistory] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [tradeType, setTradeType] = useState('BUY'); // 'BUY' | 'SELL'
  const [tradeError, setTradeError] = useState('');
  const [tradeSuccess, setTradeSuccess] = useState('');
  const [executing, setExecuting] = useState(false);

  const formatRupees = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(value || 0);
  };

  const stock = stockPrices[symbol.toUpperCase()];
  const userHolding = holdings.find(h => h.stock_symbol.toUpperCase() === symbol.toUpperCase());

  // Fetch historical data
  const fetchHistory = async () => {
    setChartLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/stocks/${symbol}/history?range=${range}`);
      if (!response.ok) throw new Error("Failed to load historical data");
      const data = await response.json();
      setHistory(data);
    } catch (err) {
      console.error("Error fetching stock history:", err);
    } finally {
      setChartLoading(false);
    }
  };

  useEffect(() => {
    if (symbol) {
      fetchHistory();
    }
  }, [symbol, range]);

  if (!stock) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-slate-400">Stock symbol not found in active market watchlists.</p>
        <Link to="/market" className="text-accentGreen hover:underline">Back to Market Terminal</Link>
      </div>
    );
  }

  // Calculate overall performance in chart interval
  const firstPoint = history[0]?.close || stock.current_price;
  const lastPoint = history[history.length - 1]?.close || stock.current_price;
  const rangePerformance = lastPoint - firstPoint;
  const rangePerformancePercent = (rangePerformance / firstPoint) * 100;
  const isRangePositive = rangePerformance >= 0;

  const handleTrade = async (e) => {
    e.preventDefault();
    setTradeError('');
    setTradeSuccess('');
    
    if (quantity <= 0) {
      setTradeError("Please enter a valid quantity.");
      return;
    }

    setExecuting(true);
    try {
      await executeTrade(stock.symbol, stock.company_name, tradeType, Number(quantity), stock.current_price);
      setTradeSuccess(`Successfully ${tradeType === 'BUY' ? 'purchased' : 'sold'} ${quantity} shares of ${stock.symbol}!`);
      setQuantity(1);
    } catch (err) {
      setTradeError(err.message || "Execution failed. Please try again.");
    } finally {
      setExecuting(false);
    }
  };

  const estimatedValue = quantity * stock.current_price;
  const isPositive = stock.change_percent >= 0;

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn">
      {/* Back to market */}
      <div>
        <Link to="/market" className="inline-flex items-center space-x-1.5 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors">
          <ArrowLeft className="h-4.5 w-4.5" />
          <span>Back to Market Terminal</span>
        </Link>
      </div>

      {/* Stock Ticker header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-900 pb-6">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">{stock.symbol}</h1>
            <span className={`flex items-center space-x-0.5 px-2.5 py-0.5 rounded-lg text-xs font-bold ${
              isPositive ? 'bg-accentGreen/10 text-accentGreen' : 'bg-accentRed/10 text-accentRed'
            }`}>
              {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              <span>{isPositive ? '+' : ''}{stock.change_percent}%</span>
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1.5 font-semibold uppercase tracking-wider">{stock.company_name}</p>
        </div>

        <div className="flex flex-col md:items-end">
          <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Last Traded Price</span>
          <div className="text-2xl md:text-3xl font-black mt-0.5">
            <PriceTicker value={stock.current_price} changePercent={stock.change_percent} />
          </div>
        </div>
      </div>

      {/* Chart and Trading Panel grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card rounded-2xl p-5 flex flex-col justify-between min-h-[420px]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-400">Timeframe:</span>
                <span className={`font-bold uppercase ${isRangePositive ? 'text-accentGreen' : 'text-accentRed'}`}>
                  {isRangePositive ? '+' : ''}{rangePerformancePercent.toFixed(2)}% ({range.toUpperCase()})
                </span>
              </div>

              {/* Timeframe Toggles */}
              <div className="flex bg-[#050811] p-1 rounded-xl border border-slate-900">
                {['1d', '1w', '1m', '1y'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setRange(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer ${
                      range === t
                        ? 'bg-slate-900 text-accentGreen'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="flex-1 w-full h-[280px] relative">
              {chartLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20 rounded-xl">
                  <Loader2 className="h-8 w-8 animate-spin text-accentGreen" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isRangePositive ? '#10b981' : '#f43f5e'} stopOpacity={0.25}/>
                        <stop offset="95%" stopColor={isRangePositive ? '#10b981' : '#f43f5e'} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#090d16" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="time"
                      tickFormatter={(time) => {
                        const date = new Date(time);
                        return range === '1d' 
                          ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                      }}
                      stroke="#334155"
                      fontSize={10}
                      fontFamily="Inter"
                    />
                    <YAxis
                      domain={['auto', 'auto']}
                      stroke="#334155"
                      fontSize={10}
                      fontFamily="Inter"
                      tickFormatter={(val) => `₹${Math.round(val)}`}
                    />
                    <Tooltip
                      contentStyle={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '12px' }}
                      labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                      itemStyle={{ color: '#f8fafc', fontSize: '12px' }}
                      formatter={(val) => [formatRupees(val), 'Price']}
                      labelFormatter={(label) => new Date(label).toLocaleString()}
                    />
                    <Area
                      type="monotone"
                      dataKey="close"
                      stroke={isRangePositive ? '#10b981' : '#f43f5e'}
                      strokeWidth={2}
                      fill="url(#chartGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Key Statistics card */}
          <div className="glass-card rounded-2xl p-5 md:p-6 space-y-4">
            <h2 className="text-base font-bold text-white uppercase tracking-wider">Market Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#050811]/50 border border-slate-900 p-3.5 rounded-xl">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Daily High</div>
                <div className="text-sm font-bold text-white mt-1">{formatRupees(stock.high_price)}</div>
              </div>
              <div className="bg-[#050811]/50 border border-slate-900 p-3.5 rounded-xl">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Daily Low</div>
                <div className="text-sm font-bold text-white mt-1">{formatRupees(stock.low_price)}</div>
              </div>
              <div className="bg-[#050811]/50 border border-slate-900 p-3.5 rounded-xl">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Holdings Cost</div>
                <div className="text-sm font-bold text-white mt-1">
                  {userHolding ? formatRupees(userHolding.quantity * userHolding.avg_buy_price) : '₹0.00'}
                </div>
              </div>
              <div className="bg-[#050811]/50 border border-slate-900 p-3.5 rounded-xl">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Holdings Profit/Loss</div>
                <div className="text-sm font-bold mt-1">
                  {userHolding ? (
                    <span className={userHolding.quantity * (stock.current_price - userHolding.avg_buy_price) >= 0 ? 'text-accentGreen' : 'text-accentRed'}>
                      {formatRupees(userHolding.quantity * (stock.current_price - userHolding.avg_buy_price))}
                    </span>
                  ) : '₹0.00'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trade Exec panel */}
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5 md:p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Briefcase className="h-5 w-5 text-accentGreen" />
              <span>Execution Desk</span>
            </h2>

            {/* Tabs for trade type selection */}
            <div className="flex bg-[#050811] p-1 rounded-xl border border-slate-900">
              <button
                onClick={() => { setTradeType('BUY'); setError(''); setSuccess(''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wide transition-colors cursor-pointer ${
                  tradeType === 'BUY' ? 'bg-accentGreen text-darkBg' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Buy Shares
              </button>
              <button
                onClick={() => { setTradeType('SELL'); setError(''); setSuccess(''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wide transition-colors cursor-pointer ${
                  tradeType === 'SELL' ? 'bg-accentRed text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Sell Shares
              </button>
            </div>

            {tradeError && (
              <div className="p-3 bg-accentRed/10 border border-accentRed/20 text-accentRed rounded-xl text-xs font-semibold">
                {tradeError}
              </div>
            )}

            {tradeSuccess && (
              <div className="p-3 bg-accentGreen/10 border border-accentGreen/20 text-accentGreen rounded-xl text-xs font-semibold">
                {tradeSuccess}
              </div>
            )}

            <form onSubmit={handleTrade} className="space-y-4">
              {/* Stats details */}
              <div className="space-y-2 text-xs bg-[#050811]/40 p-3.5 rounded-xl border border-slate-900">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold uppercase">Wallet Cash:</span>
                  <span className="text-slate-300 font-bold">{formatRupees(profile?.virtual_balance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold uppercase">Position Qty:</span>
                  <span className="text-slate-300 font-bold">{userHolding?.quantity || 0} Shares</span>
                </div>
                {userHolding && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold uppercase">Avg Buy Price:</span>
                    <span className="text-slate-300 font-bold">{formatRupees(userHolding.avg_buy_price)}</span>
                  </div>
                )}
              </div>

              {/* Quantity input */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Order Quantity (Shares)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#050811] border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-accentGreen transition-colors"
                />
              </div>

              {/* Estimate valuation */}
              <div className="space-y-2 pt-2 text-xs font-semibold">
                <div className="flex justify-between border-t border-slate-900 pt-3">
                  <span className="text-slate-400 uppercase">Estimated Value:</span>
                  <span className="text-white text-sm font-bold">{formatRupees(estimatedValue)}</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={executing}
                className={`w-full py-3 rounded-xl font-bold cursor-pointer transition-all duration-200 uppercase shadow-lg flex items-center justify-center space-x-1.5 ${
                  tradeType === 'BUY'
                    ? 'bg-accentGreen hover:bg-emerald-600 text-darkBg hover:shadow-accentGreen/10'
                    : 'bg-accentRed hover:bg-rose-600 text-white hover:shadow-accentRed/10'
                }`}
              >
                {executing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span>Execute {tradeType} Order</span>
                )}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
