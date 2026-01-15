'use client';

import { statsApi, type InsightsResponse, type MonthlyHistoryResponse, type OverviewResponse } from '@/lib/api';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  Flame,
  Loader2,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { useEffect, useState } from 'react';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
}

export default function DashboardPage() {
  const [overview, setOverview] = useState<OverviewResponse['data'] | null>(null);
  const [monthly, setMonthly] = useState<MonthlyHistoryResponse['data'] | null>(null);
  const [insights, setInsights] = useState<InsightsResponse['data'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [overviewRes, monthlyRes, insightsRes] = await Promise.all([
          statsApi.getOverview(),
          statsApi.getMonthly(),
          statsApi.getInsights(),
        ]);
        setOverview(overviewRes.data);
        setMonthly(monthlyRes.data);
        setInsights(insightsRes.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  const maxMonthlyValue = monthly 
    ? Math.max(...monthly.map(m => Math.max(m.income, m.expense))) 
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="opacity-60">Visão geral das suas finanças</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Balance */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-primary-500" />
            </div>
            <span className={`text-sm font-medium px-2 py-1 rounded-lg ${
              (overview?.balance || 0) >= 0 
                ? 'bg-emerald-500/10 text-emerald-500' 
                : 'bg-red-500/10 text-red-500'
            }`}>
              {(overview?.balance || 0) >= 0 ? 'Positivo' : 'Negativo'}
            </span>
          </div>
          <p className="opacity-60 text-sm mb-1">Saldo do Mês</p>
          <p className={`text-2xl font-bold ${
            (overview?.balance || 0) >= 0 ? '' : 'text-red-500'
          }`}>
            {formatCurrency(overview?.balance || 0)}
          </p>
        </div>

        {/* Income */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-500" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="opacity-60 text-sm mb-1">Receitas</p>
          <p className="text-2xl font-bold text-emerald-500">
            {formatCurrency(overview?.income || 0)}
          </p>
        </div>

        {/* Expenses */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-500" />
            </div>
            <ArrowDownRight className="w-5 h-5 text-red-500" />
          </div>
          <p className="opacity-60 text-sm mb-1">Despesas</p>
          <p className="text-2xl font-bold text-red-500">
            {formatCurrency(overview?.expense || 0)}
          </p>
        </div>
      </div>

      {/* Insights Metrics */}
      {insights && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Days Until Broke */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                insights.daysUntilBroke === null ? 'bg-emerald-500/10' :
                insights.daysUntilBroke <= 7 ? 'bg-red-500/10' : 
                insights.daysUntilBroke <= 15 ? 'bg-amber-500/10' : 'bg-emerald-500/10'
              }`}>
                <AlertTriangle className={`w-5 h-5 ${
                  insights.daysUntilBroke === null ? 'text-emerald-500' :
                  insights.daysUntilBroke <= 7 ? 'text-red-500' : 
                  insights.daysUntilBroke <= 15 ? 'text-amber-500' : 'text-emerald-500'
                }`} />
              </div>
              <div>
                <p className="opacity-50 text-xs">Dias até acabar</p>
                <p className={`text-xl font-bold ${
                  insights.daysUntilBroke === null ? 'text-emerald-500' :
                  insights.daysUntilBroke <= 7 ? 'text-red-500' : 
                  insights.daysUntilBroke <= 15 ? 'text-amber-500' : 'text-emerald-500'
                }`}>
                  {insights.daysUntilBroke === null ? '∞' : `${insights.daysUntilBroke} dias`}
                </p>
              </div>
            </div>
            <p className="text-xs opacity-40">
              Gasto médio: {formatCurrency(insights.dailyAverage)}/dia
            </p>
          </div>

          {/* End of Month Projection */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="opacity-50 text-xs">Projeção do Mês</p>
                <p className="text-xl font-bold text-blue-500">
                  {formatCurrency(insights.endOfMonthProjection.projected)}
                </p>
              </div>
            </div>
            <p className="text-xs opacity-40">
              Faltam {insights.endOfMonthProjection.daysRemaining} dias
            </p>
          </div>

          {/* Pending Installments */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="opacity-50 text-xs">Parcelas Pendentes</p>
                <p className="text-xl font-bold text-amber-500">
                  {formatCurrency(insights.pendingInstallments.total)}
                </p>
              </div>
            </div>
            <p className="text-xs opacity-40">
              {insights.pendingInstallments.count} parcela{insights.pendingInstallments.count !== 1 ? 's' : ''} restante{insights.pendingInstallments.count !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Savings Streak */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                insights.savingsStreak.current > 0 ? 'bg-orange-500/10' : 'bg-gray-500/10'
              }`}>
                <Flame className={`w-5 h-5 ${
                  insights.savingsStreak.current > 0 ? 'text-orange-500' : 'text-gray-500'
                }`} />
              </div>
              <div>
                <p className="opacity-50 text-xs">Streak de Economia</p>
                <p className={`text-xl font-bold ${
                  insights.savingsStreak.current > 0 ? 'text-orange-500' : 'text-gray-500'
                }`}>
                  {insights.savingsStreak.current} {insights.savingsStreak.current === 1 ? 'mês' : 'meses'}
                </p>
              </div>
            </div>
            <p className="text-xs opacity-40">
              Melhor: {insights.savingsStreak.best} meses
            </p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Chart */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-6">Histórico Mensal</h2>
          <div className="space-y-4">
            {monthly?.map((month, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="opacity-60">{month.month} {month.year}</span>
                  <div className="flex gap-4">
                    <span className="text-emerald-500">{formatCurrency(month.income)}</span>
                    <span className="text-red-500">{formatCurrency(month.expense)}</span>
                  </div>
                </div>
                <div className="flex gap-1 h-2">
                  <div 
                    className="bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${maxMonthlyValue ? (month.income / maxMonthlyValue) * 100 : 0}%` }}
                  />
                  <div 
                    className="bg-red-500 rounded-full transition-all"
                    style={{ width: `${maxMonthlyValue ? (month.expense / maxMonthlyValue) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}

            {(!monthly || monthly.length === 0) && (
              <p className="opacity-40 text-center py-8">
                Nenhum dado disponível
              </p>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-6">Transações Recentes</h2>
          <div className="space-y-3">
            {overview?.recentTransactions?.map((transaction) => (
              <div 
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-xl bg-current/5 hover:bg-current/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    transaction.type === 'INCOME' 
                      ? 'bg-emerald-500/10' 
                      : 'bg-red-500/10'
                  }`}>
                    <span className="text-lg">
                      {transaction.category?.icon || (transaction.type === 'INCOME' ? '💰' : '💸')}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="opacity-40 text-sm">
                      {transaction.category?.name || 'Sem categoria'} • {formatDate(transaction.date)}
                    </p>
                  </div>
                </div>
                <span className={`font-semibold ${
                  transaction.type === 'INCOME' ? 'text-emerald-500' : 'text-red-500'
                }`}>
                  {transaction.type === 'INCOME' ? '+' : '-'}
                  {formatCurrency(Number(transaction.amount))}
                </span>
              </div>
            ))}

            {(!overview?.recentTransactions || overview.recentTransactions.length === 0) && (
              <p className="opacity-40 text-center py-8">
                Nenhuma transação ainda
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
