import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
// Use service role key to write to stock_prices, bypass RLS
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY in environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Supported Indian Stocks details
const WATCHLIST = [
  { symbol: 'RELIANCE', company: 'Reliance Industries Ltd.', basePrice: 2460.50 },
  { symbol: 'TCS', company: 'Tata Consultancy Services Ltd.', basePrice: 3420.75 },
  { symbol: 'INFY', company: 'Infosys Ltd.', basePrice: 1445.20 },
  { symbol: 'HDFCBANK', company: 'HDFC Bank Ltd.', basePrice: 1610.10 },
  { symbol: 'ICICIBANK', company: 'ICICI Bank Ltd.', basePrice: 940.40 },
  { symbol: 'TATAMOTORS', company: 'Tata Motors Ltd.', basePrice: 620.80 },
  { symbol: 'SBIN', company: 'State Bank of India', basePrice: 575.30 },
  { symbol: 'BHARTIARTL', company: 'Bharti Airtel Ltd.', basePrice: 865.15 },
  { symbol: 'ITC', company: 'ITC Ltd.', basePrice: 440.90 },
  { symbol: 'LTIM', company: 'LTIMindtree Ltd.', basePrice: 4850.00 }
];

// In-memory cache for stock prices to calculate random walk adjustments
const currentPrices = {};
WATCHLIST.forEach(stock => {
  currentPrices[stock.symbol] = {
    symbol: stock.symbol,
    company_name: stock.company,
    current_price: stock.basePrice,
    change_percent: 0.0,
    high_price: stock.basePrice,
    low_price: stock.basePrice,
    previous_close: stock.basePrice,
    updated_at: new Date().toISOString()
  };
});

// Helper: Fetch stock data from Yahoo Finance
async function fetchYahooStock(symbol) {
  const yahooSymbol = `${symbol}.NS`;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=1d&interval=1m`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Yahoo Finance responded with status ${response.status}`);
    }
    
    const data = await response.json();
    const result = data?.chart?.result?.[0];
    if (!result) {
      throw new Error("No chart result found in Yahoo Finance response");
    }
    
    const meta = result.meta;
    const currentPrice = meta.regularMarketPrice;
    const previousClose = meta.previousClose || meta.chartPreviousClose;
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;
    
    return {
      current_price: currentPrice,
      change_percent: parseFloat(changePercent.toFixed(2)),
      high_price: meta.regularMarketDayHigh || currentPrice,
      low_price: meta.regularMarketDayLow || currentPrice,
      previous_close: previousClose
    };
  } catch (error) {
    // Return null to trigger fallback simulator
    return null;
  }
}

// Generate highly-realistic mock price fluctuation
function generateMockFluctuation(symbol) {
  const cached = currentPrices[symbol];
  const stock = WATCHLIST.find(s => s.symbol === symbol);
  const basePrice = stock ? stock.basePrice : 100.00;
  
  // Drift towards base price if it moves too far, with random walk
  const diffPct = (cached.current_price - basePrice) / basePrice;
  const correctionDrift = -diffPct * 0.05; // 5% pull towards center
  
  // Random fluctuation: between -0.3% and +0.3%
  const randomChange = (Math.random() - 0.5) * 0.006 + correctionDrift;
  const newPrice = Math.max(1.0, cached.current_price * (1 + randomChange));
  
  const previousClose = cached.previous_close || basePrice;
  const change = newPrice - previousClose;
  const changePercent = (change / previousClose) * 100;
  
  const high = Math.max(cached.high_price, newPrice);
  const low = Math.min(cached.low_price, newPrice);
  
  const updated = {
    ...cached,
    current_price: parseFloat(newPrice.toFixed(2)),
    change_percent: parseFloat(changePercent.toFixed(2)),
    high_price: parseFloat(high.toFixed(2)),
    low_price: parseFloat(low.toFixed(2)),
    updated_at: new Date().toISOString()
  };
  
  currentPrices[symbol] = updated;
  return updated;
}

// Main Polling Loop to Update Stocks
async function updateStockPrices() {
  const updates = [];
  
  for (const stock of WATCHLIST) {
    let priceData = await fetchYahooStock(stock.symbol);
    
    if (priceData) {
      // Successfully fetched live Yahoo Finance data
      const updated = {
        symbol: stock.symbol,
        company_name: stock.company,
        current_price: parseFloat(priceData.current_price.toFixed(2)),
        change_percent: priceData.change_percent,
        high_price: parseFloat(priceData.high_price.toFixed(2)),
        low_price: parseFloat(priceData.low_price.toFixed(2)),
        updated_at: new Date().toISOString()
      };
      // Save to cache
      currentPrices[stock.symbol] = {
        ...updated,
        previous_close: priceData.previous_close
      };
      updates.push(updated);
    } else {
      // Fall back to high-fidelity simulator
      const mockUpdated = generateMockFluctuation(stock.symbol);
      updates.push({
        symbol: mockUpdated.symbol,
        company_name: mockUpdated.company_name,
        current_price: mockUpdated.current_price,
        change_percent: mockUpdated.change_percent,
        high_price: mockUpdated.high_price,
        low_price: mockUpdated.low_price,
        updated_at: mockUpdated.updated_at
      });
    }
  }
  
  // Write to Supabase using bulk upsert
  try {
    const { error } = await supabase
      .from('stock_prices')
      .upsert(updates, { onConflict: 'symbol' });
      
    if (error) {
      console.error("Error upserting stock prices to Supabase:", error.message);
    }
  } catch (err) {
    console.error("Supabase upsert connection error:", err.message);
  }
}

// Initialize Stock Prices on Startup
async function initStockPrices() {
  console.log("Initializing stock prices...");
  await updateStockPrices();
  console.log("Stock prices initialized.");
  
  // Run polling scheduler every 10 seconds
  setInterval(async () => {
    try {
      await updateStockPrices();
    } catch (err) {
      console.error("Scheduled stock update failed:", err.message);
    }
  }, 10000);
}

// REST API: Get Historical Price Data
app.get('/api/stocks/:symbol/history', async (req, res) => {
  const { symbol } = req.params;
  const range = req.query.range || '1d'; // '1d' | '1w' | '1m' | '1y'
  
  const stock = WATCHLIST.find(s => s.symbol.toUpperCase() === symbol.toUpperCase());
  if (!stock) {
    return res.status(404).json({ error: 'Stock symbol not found' });
  }

  // Format Yahoo query parameters
  let yahooRange = '1d';
  let yahooInterval = '5m';
  
  switch (range) {
    case '1w':
      yahooRange = '5d';
      yahooInterval = '15m';
      break;
    case '1m':
      yahooRange = '1mo';
      yahooInterval = '1d';
      break;
    case '1y':
      yahooRange = '1y';
      yahooInterval = '1d';
      break;
    default:
      yahooRange = '1d';
      yahooInterval = '5m';
  }

  const yahooSymbol = `${symbol}.NS`;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=${yahooRange}&interval=${yahooInterval}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance responded with status ${response.status}`);
    }

    const data = await response.json();
    const chartData = data?.chart?.result?.[0];
    if (!chartData) {
      throw new Error("No chart result in Yahoo response");
    }

    const timestamps = chartData.timestamp || [];
    const quote = chartData.indicators.quote[0];
    const opens = quote.open || [];
    const highs = quote.high || [];
    const lows = quote.low || [];
    const closes = quote.close || [];
    const volumes = quote.volume || [];
    
    // Map to custom candle format
    const formatted = [];
    for (let i = 0; i < timestamps.length; i++) {
      // Filters null elements out
      if (closes[i] !== null && opens[i] !== null) {
        formatted.push({
          time: new Date(timestamps[i] * 1000).toISOString(),
          open: parseFloat(opens[i].toFixed(2)),
          high: parseFloat(highs[i].toFixed(2)),
          low: parseFloat(lows[i].toFixed(2)),
          close: parseFloat(closes[i].toFixed(2)),
          volume: volumes[i] ? Math.round(volumes[i]) : 0
        });
      }
    }

    if (formatted.length === 0) {
      throw new Error("Empty formatted data from Yahoo");
    }

    return res.json(formatted);

  } catch (error) {
    // Generate high-fidelity simulated historical data if Yahoo request fails
    const mockData = generateMockHistory(symbol, range);
    return res.json(mockData);
  }
});

// Helper: Generate Mock Historical Data based on stock base values
function generateMockHistory(symbol, range) {
  const stock = WATCHLIST.find(s => s.symbol === symbol) || { basePrice: 100, symbol };
  const basePrice = stock.basePrice;
  const cached = currentPrices[symbol] || { current_price: basePrice };
  const finalPrice = cached.current_price;
  
  let points = 24;
  let intervalMs = 60 * 60 * 1000; // 1 hour for 1D
  
  if (range === '1w') {
    points = 35; // 7 points per day * 5 trading days
    intervalMs = 4 * 60 * 60 * 1000;
  } else if (range === '1m') {
    points = 30; // 30 days
    intervalMs = 24 * 60 * 60 * 1000;
  } else if (range === '1y') {
    points = 250; // ~250 trading days
    intervalMs = 24 * 60 * 60 * 1000;
  }
  
  const history = [];
  let currentVal = basePrice * 0.95; // start slightly lower
  const step = (finalPrice - currentVal) / points; // linear trend to end at current price
  
  const now = Date.now();
  
  for (let i = 0; i < points; i++) {
    const time = new Date(now - (points - i) * intervalMs).toISOString();
    
    // Add random volatility on top of the trend line
    const trendPrice = currentVal + (i * step);
    const noise = trendPrice * (Math.random() - 0.5) * 0.04; // 4% max noise
    const close = Math.max(1.0, parseFloat((trendPrice + noise).toFixed(2)));
    
    // Create OHLC candle
    const openNoise = close * (Math.random() - 0.5) * 0.01;
    const open = parseFloat((close + openNoise).toFixed(2));
    const high = parseFloat((Math.max(open, close) * (1 + Math.random() * 0.015)).toFixed(2));
    const low = parseFloat((Math.min(open, close) * (1 - Math.random() * 0.015)).toFixed(2));
    const volume = Math.floor(Math.random() * 1000000) + 100000;
    
    history.push({
      time,
      open,
      high,
      low,
      close,
      volume
    });
  }
  
  // Make the last point exactly match current_price
  const lastIndex = history.length - 1;
  if (lastIndex >= 0) {
    history[lastIndex].close = finalPrice;
    if (history[lastIndex].open > finalPrice) {
      history[lastIndex].high = Math.max(history[lastIndex].open, finalPrice);
      history[lastIndex].low = Math.min(history[lastIndex].close, history[lastIndex].low);
    } else {
      history[lastIndex].high = Math.max(history[lastIndex].close, history[lastIndex].high);
      history[lastIndex].low = Math.min(history[lastIndex].open, history[lastIndex].low);
    }
  }
  
  return history;
}

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  initStockPrices();
});
