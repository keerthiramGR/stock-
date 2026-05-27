-- Seed: lessons
TRUNCATE public.lessons CASCADE;

INSERT INTO public.lessons (id, title, content, level, order_index, rupees_reward) VALUES
('b1111111-1111-1111-1111-111111111111', 'What is the Stock Market?', 
'### Introduction to the Stock Market

At its core, a **stock** (also called a share or equity) represents fractional ownership in a company. When you buy a stock, you are buying a tiny slice of that company''s assets and earnings.

#### 1. Why do companies issue stocks?
Companies need money (capital) to grow, build new products, pay off debt, or expand. Instead of borrowing from a bank, they list themselves on public exchanges and sell shares to the public in an **Initial Public Offering (IPO)**.

#### 2. Stock Exchanges
Stock exchanges are secure marketplaces where buyers and sellers trade shares of public companies. In India, the two primary stock exchanges are:
- **BSE (Bombay Stock Exchange)**: Established in 1875, it is Asia''s oldest stock exchange. Its benchmark index is the **SENSEX** (representing top 30 companies).
- **NSE (National Stock Exchange)**: Established in 1992, it introduced electronic trading in India. Its benchmark index is the **NIFTY 50** (representing top 50 companies).

#### 3. How trading works
Once a company has completed its IPO, its shares trade on the secondary market (the exchange). When you buy a share, you buy it from another investor who wants to sell it, not from the company itself. The prices are dictated entirely by supply and demand.

#### Summary Checklist:
- [x] A share represents ownership in a business.
- [x] SENSEX tracks the BSE, Nifty 50 tracks the NSE.
- [x] Stock exchanges facilitate secondary trading.', 
'beginner', 1, 1000.00),

('b2222222-2222-2222-2222-222222222222', 'How Stock Prices Move', 
'### The Mechanics of Stock Price Fluctuations

Have you ever wondered why a stock price changes second-by-second? The short answer is: **Supply and Demand**.

#### 1. Buyers vs. Sellers
- **Demand (Buyers)**: When more people want to buy a stock than sell it, the price goes up.
- **Supply (Sellers)**: When more people want to sell a stock than buy it, the price goes down.

#### 2. Bid and Ask Prices
Every stock transaction requires a buyer and a seller.
- **Bid**: The maximum price a buyer is willing to pay.
- **Ask (or Offer)**: The minimum price a seller is willing to accept.
- **Bid-Ask Spread**: The difference between the highest bid and the lowest ask. If a stock is highly liquid (traded in large volumes), this spread is very narrow (e.g., a few paise).

#### 3. Market Sentiment & Drivers
What makes buyers want to buy or sellers want to sell?
- **Earnings Reports**: Companies announce profits every quarter. Good performance drives demand up.
- **Economic News**: Interest rate changes by the RBI, inflation metrics, or GDP growth.
- **Industry Trends**: If electric vehicles are booming, EV battery manufacturers might see price increases.', 
'beginner', 2, 1000.00),

('c1111111-1111-1111-1111-111111111111', 'Understanding Candlestick Charts', 
'### Introduction to Technical Charts

A candlestick chart is a style of financial chart used to describe price movements of a security, derivative, or currency. Each "candle" represents a specific time frame (e.g., 1 minute, 5 minutes, 1 day).

#### 1. Anatomy of a Candlestick
Each candle tells a story of the battle between buyers (bulls) and sellers (bears) using 4 price points:
1. **Open (O)**: The price at which trading started for the period.
2. **Close (C)**: The price at which trading finished.
3. **High (H)**: The highest price reached during the period.
4. **Low (L)**: The lowest price reached.

#### 2. Bullish vs. Bearish Candles
- **Green Candle (Bullish)**: The closing price is higher than the opening price. The body shows the distance from Open (bottom) to Close (top).
- **Red Candle (Bearish)**: The closing price is lower than the opening price. The body shows the distance from Open (top) to Close (bottom).
- **Wicks (Shadows)**: The thin lines above and below the body show the High and Low prices of that period.

#### 3. Key Single Candle Patterns
- **Doji**: Open and Close prices are almost equal. It signifies market indecision.
- **Hammer**: A small body at the top with a long lower wick. It indicates sellers tried to push prices down, but buyers fought back and pushed it up near the open. It represents a potential bullish reversal.', 
'intermediate', 3, 1000.00),

('c2222222-2222-2222-2222-222222222222', 'Market Orders vs. Limit Orders', 
'### How to Buy and Sell: Order Types

When you want to execute a paper trade or a real trade, you must choose how you want the order to execute.

#### 1. Market Orders
A **Market Order** tells your broker to buy or sell a stock immediately at the best available current price.
- **Advantage**: Guaranteed execution. Your order will go through almost instantly.
- **Disadvantage**: Price is not guaranteed. In volatile markets, you might pay slightly more (or receive slightly less) than the last traded price. This is called **slippage**.

#### 2. Limit Orders
A **Limit Order** tells your broker to execute a trade only at a specific price or better.
- **Buy Limit**: Execute only at the limit price or lower.
- **Sell Limit**: Execute only at the limit price or higher.
- **Advantage**: Price is guaranteed. You will never pay more than your limit price.
- **Disadvantage**: Execution is not guaranteed. If the stock price doesn''t reach your limit, your trade will remain unfilled.

#### Key Summary:
Use **Market Orders** for quick execution in liquid stocks. Use **Limit Orders** to prevent paying too much in volatile or low-volume stocks.', 
'intermediate', 4, 1000.00),

('a1111111-1111-1111-1111-111111111111', 'Key Financial Ratios', 
'### Fundamental Analysis: Evaluating a Business

Fundamental analysis is the process of examining a company''s financial statements (balance sheet, profit & loss, cash flow) to determine its intrinsic value. Here are four vital ratios:

#### 1. Price-to-Earnings (P/E) Ratio
- **Formula**: `Market Price per Share / Earnings per Share (EPS)`
- **Meaning**: Tells you how much investors are willing to pay for every rupee of earnings. A high P/E could mean the stock is overvalued or that investors expect high growth in the future.

#### 2. Debt-to-Equity (D/E) Ratio
- **Formula**: `Total Liabilities / Shareholders'' Equity`
- **Meaning**: Measures a company''s financial leverage. A ratio of 1.5 means the company has ₹1.50 of debt for every ₹1.00 of equity. Highly leveraged companies are riskier during recessions.

#### 3. Return on Equity (ROE)
- **Formula**: `Net Income / Shareholders'' Equity`
- **Meaning**: Measures how effectively a company is using shareholders'' money to generate profits. An ROE above 15% is generally considered strong.

#### 4. Dividend Yield
- **Formula**: `Annual Dividend per Share / Stock Price`
- **Meaning**: The percentage return a company pays to shareholders in dividends. Ideal for passive income investors.', 
'advanced', 5, 1000.00),

('a2222222-2222-2222-2222-222222222222', 'Risk Management & Diversification', 
'### Protecting Your Portfolio: Risk Control

Warren Buffett''s Rule No. 1 is "Never lose money." Rule No. 2 is "Never forget Rule No. 1." In investing, managing risk is more important than chasing maximum returns.

#### 1. Diversification
"Don''t put all your eggs in one basket." If you invest 100% of your money in a single stock, and that company goes bankrupt, you lose everything. By spreading your capital across different sectors (IT, Banking, Pharma, Energy) and asset classes (Stocks, Gold, Mutual Funds), you protect your portfolio.

#### 2. The Stop-Loss Order
A stop-loss order is an order placed with a broker to sell a security when it reaches a certain price. It is designed to limit an investor''s loss on a position. For example, if you buy TCS at ₹3,400, you might set a stop-loss at ₹3,200 to limit your maximum loss to ~6%.

#### 3. Risk-Reward Ratio (R:R)
Before entering any trade, assess the potential profit versus the potential loss.
- A healthy trade should have an R:R of at least **1:2**.
- This means you are risking ₹10 to make ₹20. Even if only 40% of your trades are successful, you will remain profitable over time!', 
'advanced', 6, 1000.00);


-- Seed: quiz_questions
TRUNCATE public.quiz_questions CASCADE;

INSERT INTO public.quiz_questions (question, options, correct_option, explanation, category, difficulty) VALUES
-- Basics
(
  'What does buying a stock represent?',
  '["A loan to the company which they pay back with interest", "Fractional ownership in the company", "A membership card that lets you buy their products for free", "A guarantee that the company will never go bankrupt"]',
  1,
  'Stocks represent equity or fractional ownership in a corporation, giving you a claim on a portion of the company''s assets and earnings.',
  'basics',
  'easy'
),
(
  'Which of the following is the oldest stock exchange in Asia?',
  '["National Stock Exchange (NSE)", "Bombay Stock Exchange (BSE)", "Shanghai Stock Exchange", "Tokyo Stock Exchange"]',
  1,
  'The Bombay Stock Exchange (BSE), established in 1875, is Asia''s oldest stock exchange.',
  'basics',
  'easy'
),
(
  'What is the benchmark index of the National Stock Exchange (NSE)?',
  '["SENSEX", "NIFTY 50", "NASDAQ", "NIFTY BANK"]',
  1,
  'The NIFTY 50 is the benchmark stock market index for the National Stock Exchange of India, representing the weighted average of 50 of the largest Indian companies.',
  'basics',
  'easy'
),

-- Terms
(
  'What is the term "Slippage" in stock trading?',
  '["Falling asleep during market hours", "The difference between the expected price of a trade and the price at which the trade actually executes", "A sudden drop in stock price due to a system glitch", "Selling stocks at a loss intentionally"]',
  1,
  'Slippage occurs when a market order is filled at a price different from the expected price, usually due to high volatility or low liquidity between order placement and execution.',
  'terms',
  'medium'
),
(
  'If a stock is described as highly "Liquid", what does it mean?',
  '["The company manufactures beverages", "The stock can be easily bought or sold in large quantities without significantly affecting its price", "The stock''s price changes very slowly", "The stock is highly risky and volatile"]',
  1,
  'Liquidity refers to the ease with which shares of a stock can be bought or sold in the market without causing a dramatic change in its price.',
  'terms',
  'easy'
),
(
  'What does a "Limit Order" guarantee?',
  '["Instant execution of the trade", "Execution at the specific limit price or better", "A guaranteed profit on the trade", "That the stock price will rise"]',
  1,
  'A limit order guarantees the execution price (you will get your target price or better), but it does NOT guarantee execution itself (if the market never touches your limit, it will not trade).',
  'terms',
  'medium'
),

-- Charts
(
  'On a standard green candlestick chart, where is the "Open" price located?',
  '["At the top of the body", "At the bottom of the body", "At the tip of the upper wick", "At the tip of the lower wick"]',
  1,
  'For a bullish (green) candle, the closing price is higher than the opening price, meaning the open is at the bottom of the body and the close is at the top.',
  'charts',
  'medium'
),
(
  'What does a "Doji" candlestick pattern represent in technical analysis?',
  '["Strong bullish momentum", "Strong bearish momentum", "Market indecision between buyers and sellers", "A confirmed stock split announcement"]',
  2,
  'A Doji has a very small or non-existent body because the open and close prices are nearly identical, showing a state of equilibrium or indecision between bulls and bears.',
  'charts',
  'medium'
),
(
  'Which candle pattern is characterized by a small upper body and a very long lower shadow, indicating potential bullish reversal?',
  '["Doji", "Hammer", "Shooting Star", "Marubozu"]',
  1,
  'A Hammer is a bullish reversal pattern that forms during a downtream, featuring a small body at the top and a lower shadow that is at least twice the size of the body.',
  'charts',
  'medium'
),

-- News & Fundamental Analysis
(
  'How is the Price-to-Earnings (P/E) Ratio calculated?',
  '["Stock Price multiplied by EPS", "Stock Price divided by Earnings Per Share (EPS)", "Total Assets divided by Total Liabilities", "Annual Dividend divided by Stock Price"]',
  1,
  'The P/E Ratio is calculated by dividing the current market price per share by the earnings per share (EPS). It helps determine if a stock is over- or undervalued.',
  'basics',
  'medium'
),
(
  'A high Debt-to-Equity (D/E) Ratio typically suggests that a company:',
  '["Has no liabilities", "Is financing its growth heavily through debt, increasing financial risk", "Is highly profitable and pays massive dividends", "Is safer than companies with low D/E ratios"]',
  1,
  'A high Debt-to-Equity ratio indicates that a company uses a large amount of leverage (debt) to fund its operations, which increases its risk of default if revenues drop.',
  'news',
  'hard'
),
(
  'If you buy a stock at ₹1,000 and set a "Stop-Loss" order at ₹950, what are you doing?',
  '["Locking in a ₹50 profit", "Setting a target to sell if the stock goes up to make money", "Limiting your maximum potential loss to approximately 5%", "Forcing the stock price to go back up"]',
  2,
  'A stop-loss order automatically triggers a sell order when the price drops to the specified level (₹950 in this case), protecting you from further losses if the price falls lower.',
  'terms',
  'easy'
),
(
  'Which financial metric measures how efficiently a company uses shareholders'' equity to generate net profits?',
  '["P/E Ratio", "Dividend Yield", "Return on Equity (ROE)", "Debt-to-Equity Ratio"]',
  2,
  'Return on Equity (ROE) measures net income returned as a percentage of shareholders'' equity. It indicates how efficient a company is at generating profits from investor funds.',
  'news',
  'hard'
),
(
  'What is the primary benefit of portfolio "Diversification"?',
  '["It guarantees maximum possible returns", "It reduces overall risk by spreading investments across different sectors or asset classes", "It eliminates the need to pay taxes on profits", "It makes stock tracking more complex"]',
  1,
  'Diversification spreads investments across various companies, sectors, or asset classes, reducing the impact of any single asset performing poorly (reducing risk).',
  'basics',
  'easy'
),
(
  'If a company announces a quarterly earnings report that significantly beats analyst expectations, what is the most likely immediate effect on the stock price?',
  '["The stock price will drop due to panic", "The stock price will rise as demand increases", "The stock price will instantly drop to zero", "The stock exchange will suspend the stock forever"]',
  1,
  'Positive news like earnings beats increases investor confidence and drives demand, which typically pushes the stock price up.',
  'news',
  'easy'
);
