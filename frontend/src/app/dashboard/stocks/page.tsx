'use client';

import {
    RefreshCw,
    Search,
    TrendingDown,
    TrendingUp
} from 'lucide-react';
import { useEffect, useState } from 'react';

// Simulated stock data
const STOCKS = [
  { symbol: 'PETR4', name: 'Petrobras PN', price: 38.42, change: 1.23 },
  { symbol: 'VALE3', name: 'Vale ON', price: 67.89, change: -0.54 },
  { symbol: 'ITUB4', name: 'Itaú Unibanco PN', price: 32.15, change: 0.87 },
  { symbol: 'BBDC4', name: 'Bradesco PN', price: 15.67, change: -0.32 },
  { symbol: 'ABEV3', name: 'Ambev ON', price: 12.45, change: 0.15 },
  { symbol: 'MGLU3', name: 'Magazine Luiza ON', price: 2.34, change: -5.21 },
  { symbol: 'WEGE3', name: 'WEG ON', price: 35.78, change: 2.45 },
  { symbol: 'RENT3', name: 'Localiza ON', price: 48.92, change: 1.67 },
  { symbol: 'BBAS3', name: 'Banco do Brasil ON', price: 54.23, change: 0.89 },
  { symbol: 'SUZB3', name: 'Suzano ON', price: 52.11, change: -1.23 },
  { symbol: 'ELET3', name: 'Eletrobras ON', price: 41.56, change: 0.45 },
  { symbol: 'LREN3', name: 'Lojas Renner ON', price: 14.23, change: -2.31 },
];

const CURRENCIES = [
  { symbol: 'USD', name: 'Dólar Americano', value: 5.12, change: 0.34, icon: '🇺🇸' },
  { symbol: 'EUR', name: 'Euro', value: 5.54, change: 0.21, icon: '🇪🇺' },
  { symbol: 'BTC', name: 'Bitcoin', value: 522345.00, change: 2.15, icon: '₿' },
  { symbol: 'GBP', name: 'Libra Esterlina', value: 6.42, change: -0.12, icon: '🇬🇧' },
];

function formatCurrency(value: number): string {
  if (value >= 1000) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(value);
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Currency Carousel Component
function CurrencyCarousel({ currencies }: { currencies: typeof CURRENCIES }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % currencies.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [currencies.length]);

  return (
    <div className="relative overflow-hidden">
      <div 
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {currencies.map((currency) => (
          <div 
            key={currency.symbol}
            className="min-w-full px-2"
          >
            <div className="glass-card p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{currency.icon}</span>
                  <div>
                    <p className="text-white font-bold text-lg">{currency.name}</p>
                    <p className="text-white/60">{currency.symbol}/BRL</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{formatCurrency(currency.value)}</p>
                  <span className={`flex items-center justify-end gap-1 ${currency.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {currency.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {currency.change >= 0 ? '+' : ''}{currency.change.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Dots */}
      <div className="flex justify-center gap-2 mt-4">
        {currencies.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex ? 'bg-primary-400 w-6' : 'bg-white/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function StocksPage() {
  const [stocks, setStocks] = useState(STOCKS);
  const [currencies, setCurrencies] = useState(CURRENCIES);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');

  const refreshData = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setStocks(stocks.map(s => ({
      ...s,
      price: s.price * (1 + (Math.random() - 0.5) * 0.02),
      change: s.change + (Math.random() - 0.5) * 0.5,
    })));
    
    setCurrencies(currencies.map(c => ({
      ...c,
      value: c.value * (1 + (Math.random() - 0.5) * 0.01),
      change: c.change + (Math.random() - 0.5) * 0.2,
    })));
    
    setLastUpdate(new Date());
    setIsRefreshing(false);
  };

  useEffect(() => {
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredStocks = stocks.filter(stock => 
    stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Fixo */}
      <div className="sticky top-0 z-10 bg-[#0a0a14]/95 backdrop-blur-xl -mx-6 lg:-mx-8 px-6 lg:px-8 py-4 border-b border-white/10">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Ações</h1>
            <p className="text-white/60 text-sm">
              Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
            </p>
          </div>
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Currency Carousel */}
      <div>
        <h2 className="text-sm font-medium text-white/60 mb-3">COTAÇÕES</h2>
        <CurrencyCarousel currencies={currencies} />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          type="text"
          placeholder="Buscar por nome ou código..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field pl-12"
        />
      </div>

      {/* Stocks List */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Ações B3</h2>
          <p className="text-white/40 text-sm">{filteredStocks.length} ações encontradas</p>
        </div>
        
        <div className="divide-y divide-white/10">
          {filteredStocks.map((stock) => (
            <div 
              key={stock.symbol}
              className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${
                  stock.change >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {stock.symbol.slice(0, 4)}
                </div>
                <div>
                  <p className="text-white font-medium">{stock.symbol}</p>
                  <p className="text-white/40 text-sm">{stock.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-white">{formatCurrency(stock.price)}</p>
                <span className={`flex items-center justify-end gap-1 text-sm ${
                  stock.change >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {stock.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                </span>
              </div>
            </div>
          ))}

          {filteredStocks.length === 0 && (
            <div className="p-8 text-center text-white/40">
              Nenhuma ação encontrada para "{searchTerm}"
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-center text-white/40 text-xs">
        * Dados simulados para demonstração
      </p>
    </div>
  );
}
