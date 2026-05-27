import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

const PortfolioContext = createContext({
  holdings: [],
  stockPrices: {},
  transactions: [],
  portfolioValue: 0,
  holdingsValue: 0,
  pnl: 0,
  loading: true,
  executeTrade: async () => {},
  fetchTransactions: async () => {},
  refreshPortfolio: async () => {}
});

export const PortfolioProvider = ({ children }) => {
  const { user, profile, updateProfile } = useAuth();
  const [holdings, setHoldings] = useState([]);
  const [stockPrices, setStockPrices] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Computed Values
  const [holdingsValue, setHoldingsValue] = useState(0);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [pnl, setPnl] = useState(0);

  // Fetch all current stock prices
  const fetchStockPrices = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_prices')
        .select('*');
      if (error) throw error;

      const priceMap = {};
      data.forEach(stock => {
        priceMap[stock.symbol] = stock;
      });
      setStockPrices(priceMap);
    } catch (err) {
      console.error("Error fetching stock prices:", err.message);
    }
  };

  // Fetch holdings for user
  const fetchHoldings = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('holdings')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      setHoldings(data || []);
    } catch (err) {
      console.error("Error fetching holdings:", err.message);
    }
  };

  // Fetch transaction history
  const fetchTransactions = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error("Error fetching transactions:", err.message);
    }
  };

  const refreshPortfolio = async () => {
    if (!user) return;
    setLoading(true);
    await Promise.all([fetchStockPrices(), fetchHoldings(), fetchTransactions()]);
    setLoading(false);
  };

  // Trigger loading when user logs in
  useEffect(() => {
    if (user) {
      refreshPortfolio();
    } else {
      setHoldings([]);
      setTransactions([]);
      setLoading(false);
    }
  }, [user]);

  // Recalculate portfolio valuation on holdings or price changes
  useEffect(() => {
    let currentHoldingsVal = 0;
    let totalCost = 0;

    holdings.forEach(holding => {
      const livePrice = stockPrices[holding.stock_symbol]?.current_price || holding.avg_buy_price;
      currentHoldingsVal += holding.quantity * livePrice;
      totalCost += holding.quantity * holding.avg_buy_price;
    });

    const cash = profile ? Number(profile.virtual_balance) : 0;
    const totalPortfolioVal = cash + currentHoldingsVal;
    const currentPnl = currentHoldingsVal - totalCost;

    setHoldingsValue(currentHoldingsVal);
    setPortfolioValue(totalPortfolioVal);
    setPnl(currentPnl);
  }, [holdings, stockPrices, profile]);

  // Real-time stock prices & holdings updates
  useEffect(() => {
    // 1. Subscribe to stock prices changes
    const priceChannel = supabase
      .channel('live-stock-prices')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stock_prices' },
        (payload) => {
          if (payload.new) {
            setStockPrices(prev => ({
              ...prev,
              [payload.new.symbol]: payload.new
            }));
          }
        }
      )
      .subscribe();

    // 2. Subscribe to user holdings updates
    let holdingsChannel;
    if (user) {
      holdingsChannel = supabase
        .channel(`user-holdings-${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'holdings', filter: `user_id=eq.${user.id}` },
          (payload) => {
            fetchHoldings(); // re-fetch to simplify logic
          }
        )
        .subscribe();
    }

    return () => {
      supabase.removeChannel(priceChannel);
      if (holdingsChannel) supabase.removeChannel(holdingsChannel);
    };
  }, [user]);

  // Check achievements dynamically
  const checkAchievements = async (actionType) => {
    if (!user) return;
    
    try {
      // Fetch current achievements list
      const { data: currentBadges } = await supabase
        .from('achievements')
        .select('badge_name')
        .eq('user_id', user.id);
        
      const earnedNames = (currentBadges || []).map(b => b.badge_name);
      
      const awardBadge = async (badgeName, badgeIcon) => {
        if (earnedNames.includes(badgeName)) return;
        await supabase.from('achievements').insert({
          user_id: user.id,
          badge_name: badgeName,
          badge_icon: badgeIcon
        });
        alert(`🏆 Achievement Unlocked: ${badgeName}!`);
      };

      if (actionType === 'BUY' || actionType === 'SELL') {
        // First Trade Badge
        await awardBadge('First Trade', '🚀');
      }

      // Check for Profit Maker badge
      if (pnl > 5000) {
        await awardBadge('Profit Maker', '💰');
      }
    } catch (err) {
      console.error("Error checking achievements:", err);
    }
  };

  // Trade Execution Engine (BUY / SELL)
  const executeTrade = async (symbol, companyName, type, quantity, price) => {
    if (!user || !profile) throw new Error("User must be authenticated.");
    if (quantity <= 0) throw new Error("Quantity must be greater than 0.");

    const numericPrice = Number(price);
    const totalAmount = quantity * numericPrice;
    const currentBalance = Number(profile.virtual_balance);

    if (type === 'BUY') {
      // 1. Balance validation
      if (currentBalance < totalAmount) {
        throw new Error("Insufficient virtual balance.");
      }

      // 2. Add or update holdings record
      const existing = holdings.find(h => h.stock_symbol === symbol);
      if (existing) {
        const newQty = existing.quantity + quantity;
        const newAvg = ((existing.quantity * Number(existing.avg_buy_price)) + totalAmount) / newQty;
        
        const { error } = await supabase
          .from('holdings')
          .update({
            quantity: newQty,
            avg_buy_price: parseFloat(newAvg.toFixed(2))
          })
          .eq('id', existing.id);
          
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('holdings')
          .insert({
            user_id: user.id,
            stock_symbol: symbol,
            company_name: companyName,
            quantity,
            avg_buy_price: numericPrice
          });
          
        if (error) throw error;
      }

      // 3. Update profiles balance
      await updateProfile({
        virtual_balance: parseFloat((currentBalance - totalAmount).toFixed(2))
      });

    } else if (type === 'SELL') {
      // 1. Validate quantity
      const existing = holdings.find(h => h.stock_symbol === symbol);
      if (!existing || existing.quantity < quantity) {
        throw new Error("You do not hold enough shares to sell.");
      }

      const newQty = existing.quantity - quantity;

      if (newQty === 0) {
        // Delete holding
        const { error } = await supabase
          .from('holdings')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        // Decrement quantity
        const { error } = await supabase
          .from('holdings')
          .update({ quantity: newQty })
          .eq('id', existing.id);
        if (error) throw error;
      }

      // 3. Update profiles balance (Gain cash)
      await updateProfile({
        virtual_balance: parseFloat((currentBalance + totalAmount).toFixed(2))
      });
    }

    // Log the transaction
    const { error: txErr } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        stock_symbol: symbol,
        company_name: companyName,
        type,
        quantity,
        price_per_share: numericPrice,
        total_amount: totalAmount
      });

    if (txErr) console.error("Transaction logging error:", txErr.message);

    // Refresh history, holdings and check badges
    await Promise.all([fetchHoldings(), fetchTransactions()]);
    await checkAchievements(type);
  };

  return (
    <PortfolioContext.Provider
      value={{
        holdings,
        stockPrices,
        transactions,
        portfolioValue,
        holdingsValue,
        pnl,
        loading,
        executeTrade,
        fetchTransactions,
        refreshPortfolio
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => useContext(PortfolioContext);
