'use client';

import {
    CreateDividendData,
    CreateHoldingData,
    dividendsApi,
    holdingsApi,
    HoldingsSummary,
    StockHolding,
} from '@/lib/api';
import {
    BarChart3,
    CircleDollarSign,
    Edit3,
    PieChart,
    Plus,
    RefreshCw,
    Trash2,
    TrendingDown,
    TrendingUp,
    Wallet,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const DIVIDEND_TYPES = [
  { value: 'DIVIDEND', label: 'Dividendo' },
  { value: 'JCP', label: 'JCP' },
  { value: 'RENDIMENTO', label: 'Rendimento' },
  { value: 'BONUS', label: 'Bonificação' },
  { value: 'OTHER', label: 'Outro' },
] as const;

const DIVIDEND_TYPE_COLORS: Record<string, string> = {
  DIVIDEND: '#10b981',
  JCP: '#6366f1',
  RENDIMENTO: '#f59e0b',
  BONUS: '#ec4899',
  OTHER: '#64748b',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR');
}

// Simple Pie Chart Component
function DividendPieChart({ data }: { data: Record<string, number> }) {
  const total = Object.values(data).reduce((sum, val) => sum + val, 0);
  if (total === 0) return null;

  const entries = Object.entries(data).filter(([, val]) => val > 0);
  let cumulativePercent = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="transform -rotate-90">
          {entries.map(([type, value], index) => {
            const percent = (value / total) * 100;
            const dashArray = `${percent} ${100 - percent}`;
            const dashOffset = -cumulativePercent;
            cumulativePercent += percent;
            
            return (
              <circle
                key={type}
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={DIVIDEND_TYPE_COLORS[type] || '#64748b'}
                strokeWidth="20"
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                style={{ transition: 'all 0.3s ease' }}
              />
            );
          })}
        </svg>
      </div>
      <div className="space-y-2">
        {entries.map(([type, value]) => (
          <div key={type} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: DIVIDEND_TYPE_COLORS[type] }}
            />
            <span className="opacity-60">{DIVIDEND_TYPES.find(t => t.value === type)?.label || type}</span>
            <span className="font-bold ml-auto">{formatCurrency(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Bar Chart for Monthly Dividends
function MonthlyDividendChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12);
  
  if (entries.length === 0) return null;

  const maxValue = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-1 h-32">
        {entries.map(([month, value]) => {
          const height = (value / maxValue) * 100;
          const [year, monthNum] = month.split('-');
          const monthLabel = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('pt-BR', { month: 'short' });
          
          return (
            <div key={month} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full relative">
                <div
                  className="w-full bg-primary-500/80 rounded-t-sm transition-all duration-300 hover:bg-primary-500"
                  style={{ height: `${height}%`, minHeight: value > 0 ? '4px' : '0' }}
                />
              </div>
              <span className="text-[9px] opacity-40 uppercase tracking-wider">{monthLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const [holdings, setHoldings] = useState<StockHolding[]>([]);
  const [summary, setSummary] = useState<HoldingsSummary | null>(null);
  const [dividendData, setDividendData] = useState<{
    byType: Record<string, number>;
    byMonth: Record<string, number>;
    summary: { total: number; monthlyAverage: number };
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Modal states
  const [showAddHolding, setShowAddHolding] = useState(false);
  const [showAddDividend, setShowAddDividend] = useState(false);
  const [editingHolding, setEditingHolding] = useState<StockHolding | null>(null);
  const [selectedHoldingForDividend, setSelectedHoldingForDividend] = useState<string>('');

  // Form states
  const [holdingForm, setHoldingForm] = useState<CreateHoldingData>({
    symbol: '',
    quantity: 0,
    averagePrice: 0,
    averageCost: 0,
  });
  const [dividendForm, setDividendForm] = useState<CreateDividendData>({
    holdingId: '',
    amount: 0,
    type: 'DIVIDEND',
    date: new Date().toISOString().split('T')[0],
  });

  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    try {
      const [holdingsRes, dividendsRes] = await Promise.all([
        holdingsApi.getAll(),
        dividendsApi.getAll(),
      ]);

      if (holdingsRes.success) {
        setHoldings(holdingsRes.data.holdings);
        setSummary(holdingsRes.data.summary);
      }

      if (dividendsRes.success) {
        setDividendData({
          byType: dividendsRes.data.byType,
          byMonth: dividendsRes.data.byMonth,
          summary: dividendsRes.data.summary,
        });
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddHolding = async () => {
    if (!holdingForm.symbol || holdingForm.quantity <= 0 || holdingForm.averagePrice <= 0) return;

    try {
      await holdingsApi.create(holdingForm);
      setShowAddHolding(false);
      setHoldingForm({ symbol: '', quantity: 0, averagePrice: 0, averageCost: 0 });
      fetchData(true);
    } catch (error) {
      console.error('Error adding holding:', error);
    }
  };

  const handleUpdateHolding = async () => {
    if (!editingHolding) return;

    try {
      await holdingsApi.update(editingHolding.id, holdingForm);
      setEditingHolding(null);
      setHoldingForm({ symbol: '', quantity: 0, averagePrice: 0, averageCost: 0 });
      fetchData(true);
    } catch (error) {
      console.error('Error updating holding:', error);
    }
  };

  const handleDeleteHolding = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este ativo?')) return;

    try {
      await holdingsApi.delete(id);
      fetchData(true);
    } catch (error) {
      console.error('Error deleting holding:', error);
    }
  };

  const handleAddDividend = async () => {
    if (!dividendForm.holdingId || dividendForm.amount <= 0) return;

    try {
      await dividendsApi.create(dividendForm);
      setShowAddDividend(false);
      setDividendForm({
        holdingId: '',
        amount: 0,
        type: 'DIVIDEND',
        date: new Date().toISOString().split('T')[0],
      });
      fetchData(true);
    } catch (error) {
      console.error('Error adding dividend:', error);
    }
  };

  const openEditHolding = (holding: StockHolding) => {
    setEditingHolding(holding);
    setHoldingForm({
      symbol: holding.symbol,
      quantity: holding.quantity,
      averagePrice: holding.averagePrice,
      averageCost: holding.averageCost,
    });
  };

  const openAddDividend = (holdingId?: string) => {
    setSelectedHoldingForDividend(holdingId || '');
    setDividendForm({
      holdingId: holdingId || '',
      amount: 0,
      type: 'DIVIDEND',
      date: new Date().toISOString().split('T')[0],
    });
    setShowAddDividend(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 animate-spin opacity-40" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 w-full max-w-full">
      {/* Header */}
      <div className="py-2">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Minha Carteira</h1>
            {lastUpdate && (
              <p className="opacity-40 text-[10px] sm:text-xs font-bold uppercase tracking-wider mt-0.5">
                Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
            <button
              onClick={() => setShowAddHolding(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Adicionar Ativo</span>
              <span className="sm:hidden">Ativo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <p className="text-[10px] uppercase opacity-40 font-bold tracking-wider">Investido</p>
                <p className="text-lg font-black">{formatCurrency(summary.totalInvested)}</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] uppercase opacity-40 font-bold tracking-wider">Valor Atual</p>
                <p className="text-lg font-black">{formatCurrency(summary.totalValue)}</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                summary.totalProfit >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'
              }`}>
                {summary.totalProfit >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div>
                <p className="text-[10px] uppercase opacity-40 font-bold tracking-wider">Lucro/Prejuízo</p>
                <p className={`text-lg font-black ${summary.totalProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {formatCurrency(summary.totalProfit)}
                </p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <CircleDollarSign className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] uppercase opacity-40 font-bold tracking-wider">Proventos/Mês</p>
                <p className="text-lg font-black">
                  {formatCurrency(dividendData?.summary.monthlyAverage || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Holdings Table */}
      <div className="glass-card overflow-hidden w-full max-w-full">
        <div className="p-4 thin-border-b bg-current/[0.01] flex items-center justify-between">
          <div>
            <h2 className="font-black text-lg">Meus Ativos</h2>
            <p className="opacity-40 text-xs font-bold uppercase tracking-wider">
              {holdings.length} ativos cadastrados
            </p>
          </div>
          <button
            onClick={() => openAddDividend()}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Registrar Provento</span>
            <span className="sm:hidden">Provento</span>
          </button>
        </div>

        {holdings.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-current/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 opacity-20" />
            </div>
            <p className="opacity-40 font-bold mb-2">Nenhum ativo cadastrado</p>
            <p className="opacity-30 text-sm mb-4">Comece adicionando suas ações e FIIs</p>
            <button
              onClick={() => setShowAddHolding(true)}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar Primeiro Ativo
            </button>
          </div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-current/5">
              {holdings.map((holding) => (
                <div key={holding.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                        holding.profit >= 0
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-red-500/10 text-red-500'
                      }`}>
                        {holding.symbol.slice(0, 4)}
                      </div>
                      <div>
                        <p className="font-bold">{holding.symbol}</p>
                        <p className="text-xs opacity-40 truncate max-w-[140px]">
                          {holding.companyName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openAddDividend(holding.id)}
                        className="p-2 hover:bg-current/10 rounded-lg transition-colors"
                      >
                        <CircleDollarSign className="w-4 h-4 opacity-40" />
                      </button>
                      <button
                        onClick={() => openEditHolding(holding)}
                        className="p-2 hover:bg-current/10 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4 opacity-40" />
                      </button>
                      <button
                        onClick={() => handleDeleteHolding(holding.id)}
                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500/60" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="opacity-40 text-xs">Qtd</span>
                      <p className="font-medium">{holding.quantity}</p>
                    </div>
                    <div className="text-right">
                      <span className="opacity-40 text-xs">PM</span>
                      <p className="font-medium">{formatCurrency(holding.averagePrice)}</p>
                    </div>
                    <div>
                      <span className="opacity-40 text-xs">Cotação</span>
                      <p className="font-bold">{holding.currentPrice > 0 ? formatCurrency(holding.currentPrice) : '-'}</p>
                    </div>
                    <div className="text-right">
                      <span className="opacity-40 text-xs">Valor Atual</span>
                      <p className="font-bold">{formatCurrency(holding.currentValue)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs opacity-40">Lucro/Prejuízo</span>
                    <span className={`font-bold ${holding.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {formatCurrency(holding.profit)} ({formatPercent(holding.profitPercent)})
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[10px] uppercase opacity-40 font-bold tracking-wider thin-border-b">
                    <th className="p-4">Ativo</th>
                    <th className="p-4 text-right">Qtd</th>
                    <th className="p-4 text-right">PM</th>
                    <th className="p-4 text-right">Cotação</th>
                    <th className="p-4 text-right">Investido</th>
                    <th className="p-4 text-right">Valor Atual</th>
                    <th className="p-4 text-right">Lucro/Prejuízo</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="thin-divide">
                  {holdings.map((holding) => (
                    <tr
                      key={holding.id}
                      className="hover:bg-current/[0.02] transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                            holding.profit >= 0
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'bg-red-500/10 text-red-500'
                          }`}>
                            {holding.symbol.slice(0, 4)}
                          </div>
                          <div>
                            <p className="font-bold">{holding.symbol}</p>
                            <p className="text-xs opacity-40 truncate max-w-[120px]">
                              {holding.companyName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right font-medium tabular-nums">
                        {holding.quantity}
                      </td>
                      <td className="p-4 text-right font-medium tabular-nums">
                        {formatCurrency(holding.averagePrice)}
                      </td>
                      <td className="p-4 text-right font-bold tabular-nums">
                        {holding.currentPrice > 0 ? formatCurrency(holding.currentPrice) : '-'}
                      </td>
                      <td className="p-4 text-right font-medium tabular-nums">
                        {formatCurrency(holding.totalInvested)}
                      </td>
                      <td className="p-4 text-right font-bold tabular-nums">
                        {formatCurrency(holding.currentValue)}
                      </td>
                      <td className="p-4 text-right">
                        <div className={`font-bold tabular-nums ${
                          holding.profit >= 0 ? 'text-emerald-500' : 'text-red-500'
                        }`}>
                          {formatCurrency(holding.profit)}
                          <span className="text-xs ml-1 opacity-60">
                            ({formatPercent(holding.profitPercent)})
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openAddDividend(holding.id)}
                            className="p-2 hover:bg-current/10 rounded-lg transition-colors"
                            title="Registrar provento"
                          >
                            <CircleDollarSign className="w-4 h-4 opacity-40" />
                          </button>
                          <button
                            onClick={() => openEditHolding(holding)}
                            className="p-2 hover:bg-current/10 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4 opacity-40" />
                          </button>
                          <button
                            onClick={() => handleDeleteHolding(holding.id)}
                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4 text-red-500/60" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Dividends Charts */}
      {dividendData && (dividendData.summary.total > 0 || Object.keys(dividendData.byMonth).length > 0) && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* By Type */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 opacity-40" />
              <h3 className="font-bold">Proventos por Tipo</h3>
            </div>
            <DividendPieChart data={dividendData.byType} />
          </div>

          {/* By Month */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 opacity-40" />
              <h3 className="font-bold">Proventos por Mês</h3>
            </div>
            <MonthlyDividendChart data={dividendData.byMonth} />
            <div className="mt-4 pt-4 flex justify-between text-sm">
              <span className="opacity-40">Total 12 meses</span>
              <span className="font-bold">{formatCurrency(dividendData.summary.total)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Holding Modal */}
      {(showAddHolding || editingHolding) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {editingHolding ? 'Editar Ativo' : 'Adicionar Ativo'}
              </h3>
              <button
                onClick={() => {
                  setShowAddHolding(false);
                  setEditingHolding(null);
                  setHoldingForm({ symbol: '', quantity: 0, averagePrice: 0, averageCost: 0 });
                }}
                className="p-2 hover:bg-current/10 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase opacity-40 mb-2">
                  Símbolo (ex: PETR4)
                </label>
                <input
                  type="text"
                  value={holdingForm.symbol}
                  onChange={(e) => setHoldingForm({ ...holdingForm, symbol: e.target.value.toUpperCase() })}
                  className="input-field"
                  placeholder="PETR4"
                  disabled={!!editingHolding}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase opacity-40 mb-2">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    value={holdingForm.quantity || ''}
                    onChange={(e) => setHoldingForm({ ...holdingForm, quantity: parseInt(e.target.value) || 0 })}
                    className="input-field"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase opacity-40 mb-2">
                    Preço Médio
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={holdingForm.averagePrice || ''}
                    onChange={(e) => setHoldingForm({ ...holdingForm, averagePrice: parseFloat(e.target.value) || 0 })}
                    className="input-field"
                    placeholder="35.50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase opacity-40 mb-2">
                  Custo Médio (opcional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={holdingForm.averageCost || ''}
                  onChange={(e) => setHoldingForm({ ...holdingForm, averageCost: parseFloat(e.target.value) || 0 })}
                  className="input-field"
                  placeholder="35.60"
                />
                <p className="text-xs opacity-30 mt-1">Inclui taxas de corretagem</p>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={() => {
                  setShowAddHolding(false);
                  setEditingHolding(null);
                }}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={editingHolding ? handleUpdateHolding : handleAddHolding}
                className="btn-primary flex-1"
                disabled={!holdingForm.symbol || holdingForm.quantity <= 0 || holdingForm.averagePrice <= 0}
              >
                {editingHolding ? 'Salvar' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Dividend Modal */}
      {showAddDividend && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Registrar Provento</h3>
              <button
                onClick={() => setShowAddDividend(false)}
                className="p-2 hover:bg-current/10 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase opacity-40 mb-2">
                  Ativo
                </label>
                <select
                  value={dividendForm.holdingId}
                  onChange={(e) => setDividendForm({ ...dividendForm, holdingId: e.target.value })}
                  className="input-field"
                >
                  <option value="">Selecione um ativo</option>
                  {holdings.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.symbol} - {h.companyName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase opacity-40 mb-2">
                    Valor
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={dividendForm.amount || ''}
                    onChange={(e) => setDividendForm({ ...dividendForm, amount: parseFloat(e.target.value) || 0 })}
                    className="input-field"
                    placeholder="150.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase opacity-40 mb-2">
                    Tipo
                  </label>
                  <select
                    value={dividendForm.type}
                    onChange={(e) => setDividendForm({ ...dividendForm, type: e.target.value as any })}
                    className="input-field"
                  >
                    {DIVIDEND_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase opacity-40 mb-2">
                  Data
                </label>
                <input
                  type="date"
                  value={dividendForm.date}
                  onChange={(e) => setDividendForm({ ...dividendForm, date: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={() => setShowAddDividend(false)}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddDividend}
                className="btn-primary flex-1"
                disabled={!dividendForm.holdingId || dividendForm.amount <= 0}
              >
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex flex-col items-center gap-4 pt-4">
        <p className="text-center opacity-20 text-[10px] font-black uppercase tracking-[0.3em]">
          * Cotações via Brapi API • Kaptal Intelligence System
        </p>
      </div>
    </div>
  );
}
