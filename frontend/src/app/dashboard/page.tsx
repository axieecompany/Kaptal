'use client';

import { statsApi, type MonthlyHistoryResponse, type OverviewResponse } from '@/lib/api';
import {
    ArrowDownRight,
    ArrowUpRight,
    Loader2,
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [overviewRes, monthlyRes] = await Promise.all([
          statsApi.getOverview(),
          statsApi.getMonthly(),
        ]);
        setOverview(overviewRes.data);
        setMonthly(monthlyRes.data);
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
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-white/60">Visão geral das suas finanças</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Balance */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-primary-400" />
            </div>
            <span className={`text-sm font-medium px-2 py-1 rounded-lg ${
              (overview?.balance || 0) >= 0 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-red-500/20 text-red-400'
            }`}>
              {(overview?.balance || 0) >= 0 ? 'Positivo' : 'Negativo'}
            </span>
          </div>
          <p className="text-white/60 text-sm mb-1">Saldo do Mês</p>
          <p className={`text-2xl font-bold ${
            (overview?.balance || 0) >= 0 ? 'text-white' : 'text-red-400'
          }`}>
            {formatCurrency(overview?.balance || 0)}
          </p>
        </div>

        {/* Income */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-white/60 text-sm mb-1">Receitas</p>
          <p className="text-2xl font-bold text-green-400">
            {formatCurrency(overview?.income || 0)}
          </p>
        </div>

        {/* Expenses */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-400" />
            </div>
            <ArrowDownRight className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-white/60 text-sm mb-1">Despesas</p>
          <p className="text-2xl font-bold text-red-400">
            {formatCurrency(overview?.expense || 0)}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Chart */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Histórico Mensal</h2>
          <div className="space-y-4">
            {monthly?.map((month, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">{month.month} {month.year}</span>
                  <div className="flex gap-4">
                    <span className="text-green-400">{formatCurrency(month.income)}</span>
                    <span className="text-red-400">{formatCurrency(month.expense)}</span>
                  </div>
                </div>
                <div className="flex gap-1 h-2">
                  <div 
                    className="bg-green-500 rounded-full transition-all"
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
              <p className="text-white/40 text-center py-8">
                Nenhum dado disponível
              </p>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Transações Recentes</h2>
          <div className="space-y-3">
            {overview?.recentTransactions?.map((transaction) => (
              <div 
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    transaction.type === 'INCOME' 
                      ? 'bg-green-500/20' 
                      : 'bg-red-500/20'
                  }`}>
                    <span className="text-lg">
                      {transaction.category?.icon || (transaction.type === 'INCOME' ? '💰' : '💸')}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{transaction.description}</p>
                    <p className="text-white/40 text-sm">
                      {transaction.category?.name || 'Sem categoria'} • {formatDate(transaction.date)}
                    </p>
                  </div>
                </div>
                <span className={`font-semibold ${
                  transaction.type === 'INCOME' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {transaction.type === 'INCOME' ? '+' : '-'}
                  {formatCurrency(Number(transaction.amount))}
                </span>
              </div>
            ))}

            {(!overview?.recentTransactions || overview.recentTransactions.length === 0) && (
              <p className="text-white/40 text-center py-8">
                Nenhuma transação ainda
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
