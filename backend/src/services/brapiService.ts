// Brapi API Service - Free tier (up to 2000 requests/month)
// Documentation: https://brapi.dev/docs
// 
// FREE symbols (no token needed): PETR4, MGLU3, VALE3, ITUB4
// For all other stocks/FIIs, you need a token from brapi.dev

const BRAPI_BASE_URL = 'https://brapi.dev/api';
const BRAPI_TOKEN = process.env.BRAPI_TOKEN || '';

// Symbols that work without authentication
const FREE_SYMBOLS = ['PETR4', 'MGLU3', 'VALE3', 'ITUB4'];

interface BrapiQuote {
  symbol: string;
  shortName: string;
  longName: string;
  currency: string;
  regularMarketPrice: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketDayRange: string;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketTime: string;
  regularMarketVolume: number;
  regularMarketPreviousClose: number;
  regularMarketOpen: number;
  fiftyTwoWeekRange: string;
  fiftyTwoWeekLow: number;
  fiftyTwoWeekHigh: number;
  logourl?: string;
}

interface BrapiResponse {
  results?: BrapiQuote[];
  error?: boolean;
  message?: string;
  requestedAt?: string;
  took?: string;
}

export async function fetchStockQuotes(symbols: string[]): Promise<Record<string, BrapiQuote>> {
  if (symbols.length === 0) return {};

  const quotes: Record<string, BrapiQuote> = {};

  // Helper to add delay between requests
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // If we have a token, fetch one by one (free plan limitation)
  if (BRAPI_TOKEN) {
    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      try {
        // Add small delay between requests to avoid rate limiting
        if (i > 0) await delay(200);
        
        const url = `${BRAPI_BASE_URL}/quote/${symbol}?token=${BRAPI_TOKEN}`;
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json() as BrapiResponse;
          if (data.results && data.results.length > 0) {
            quotes[data.results[0].symbol] = data.results[0];
          
          }
        } else {
          const text = await response.text();
          console.error(`✗ Brapi error for ${symbol}: ${response.status} - ${text}`);
        }
      } catch (error) {
        console.error(`✗ Error fetching quote for ${symbol}:`, error);
      }
    }
    return quotes;
  }

  // Without token, only fetch free symbols one by one
  const freeSymbols = symbols.filter(s => FREE_SYMBOLS.includes(s.toUpperCase()));
  
  for (const symbol of freeSymbols) {
    try {
      const url = `${BRAPI_BASE_URL}/quote/${symbol}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json() as BrapiResponse;
        if (data.results && data.results.length > 0) {
          quotes[symbol] = data.results[0];
        }
      }
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error);
    }
  }
  
  // Log warning if some symbols were not fetched
  const unfetchedSymbols = symbols.filter(s => !quotes[s] && !FREE_SYMBOLS.includes(s.toUpperCase()));
  if (unfetchedSymbols.length > 0) {
    console.warn(
      `⚠️  Cannot fetch quotes for: ${unfetchedSymbols.join(', ')}. ` +
      `Add BRAPI_TOKEN to .env to fetch FIIs and other stocks. ` +
      `Get your free token at: https://brapi.dev/dashboard`
    );
  }

  return quotes;
}

export async function fetchSingleQuote(symbol: string): Promise<BrapiQuote | null> {
  const quotes = await fetchStockQuotes([symbol]);
  return quotes[symbol] || null;
}

// Search for stocks/assets (requires token for full list)
export async function searchStocks(query: string): Promise<{ symbol: string; name: string }[]> {
  try {
    const headers: Record<string, string> = {};
    if (BRAPI_TOKEN) {
      headers['Authorization'] = `Bearer ${BRAPI_TOKEN}`;
    }

    const url = `${BRAPI_BASE_URL}/available`;
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      // Return free symbols as fallback
      return FREE_SYMBOLS
        .filter(s => s.toLowerCase().includes(query.toLowerCase()))
        .map(symbol => ({ symbol, name: symbol }));
    }

    const data = await response.json() as { stocks?: string[] };
    const stocks: string[] = data.stocks || [];
    
    const lowerQuery = query.toLowerCase();
    return stocks
      .filter(s => s.toLowerCase().includes(lowerQuery))
      .slice(0, 10)
      .map(symbol => ({ symbol, name: symbol }));
  } catch (error) {
    console.error('Error searching stocks:', error);
    return [];
  }
}
