"use client";

import {
    categoriesApi,
    categoryBudgetsApi,
    incomeRulesApi,
    type BudgetsData,
    type Category,
    type IncomeRule
} from '@/lib/api';
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    DollarSign,
    Loader2,
    PiggyBank,
    Plus,
    TrendingUp,
    Wallet,
    X
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function GoalsPage() {
  const [budgetsData, setBudgetsData] = useState<BudgetsData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [incomeRules, setIncomeRules] = useState<IncomeRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');

  // Income form state
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [incomeValue, setIncomeValue] = useState('');
  const [incomeDistribution, setIncomeDistribution] = useState<{ rule: IncomeRule; amount: number }[]>([]);

  const loadData = async () => {
    try {
      const month = currentMonth.getMonth() + 1;
      const year = currentMonth.getFullYear();
      
      // Load budgets, categories, and income rules in parallel
      const [budgetsRes, categoriesRes, rulesRes] = await Promise.all([
        categoryBudgetsApi.getByMonth(month, year),
        categoriesApi.getAll(),
        incomeRulesApi.getAll()
      ]);
      
      if (budgetsRes.success) {
        setBudgetsData(budgetsRes.data);
      }
      
      if (categoriesRes.success) {
        setCategories(categoriesRes.data);
      }

      if (rulesRes.success) {
        setIncomeRules(rulesRes.data);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    loadData();
  }, [currentMonth]);

  // Calculate income distribution when income value changes
  useEffect(() => {
    if (incomeValue && incomeRules.length > 0) {
      const value = parseFloat(incomeValue);
      if (!isNaN(value) && value > 0) {
        const distribution = incomeRules.map(rule => ({
          rule,
          amount: (value * rule.percentage) / 100
        }));
        setIncomeDistribution(distribution);
      } else {
        setIncomeDistribution([]);
      }
    } else {
      setIncomeDistribution([]);
    }
  }, [incomeValue, incomeRules]);

  const handleAddBudget = async () => {
    if (!selectedCategoryId || !budgetAmount) return;
    setIsSaving(true);
    try {
      const res = await categoryBudgetsApi.set({
        categoryId: selectedCategoryId,
        month: currentMonth.getMonth() + 1,
        year: currentMonth.getFullYear(),
        amount: parseFloat(budgetAmount),
      });

      if (res.success) {
        loadData();
        setShowForm(false);
        setSelectedCategoryId('');
        setBudgetAmount('');
      }
    } catch (err) {
      console.error('Error saving budget:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBudget = async (categoryId: string) => {
    try {
      const month = currentMonth.getMonth() + 1;
      const year = currentMonth.getFullYear();
      
      const res = await categoryBudgetsApi.delete(categoryId, month, year);
      if (res.success) {
        loadData();
      }
    } catch (err) {
      console.error('Error deleting budget:', err);
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleAddIncome = () => {
    setShowIncomeForm(true);
    setIncomeValue('');
    setIncomeDistribution([]);
    setError(null);
  };

  const handleConfirmIncome = async () => {
    if (incomeDistribution.length === 0) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const month = currentMonth.getMonth() + 1;
      const year = currentMonth.getFullYear();
      
      // For each rule in the distribution:
      // 1. Check if a category with the same name exists
      // 2. If not, create the category
      // 3. Create/update the budget for that category
      
      for (const { rule, amount } of incomeDistribution) {
        let categoryId: string | null = null;
        
        // Try to find existing category with same name
        const existingCategory = categories.find(
          cat => cat.name.toLowerCase() === rule.name.toLowerCase()
        );
        
        if (existingCategory) {
          categoryId = existingCategory.id;
        } else {
          // Create new category based on the rule
          const createRes = await categoriesApi.create({
            name: rule.name,
            icon: rule.icon,
            color: rule.color,
          });
          
          if (createRes.success) {
            categoryId = createRes.data.id;
          }
        }
        
        if (categoryId) {
          // Create/update budget for this category
          await categoryBudgetsApi.set({
            categoryId,
            month,
            year,
            amount,
          });
        }
      }
      
      setShowIncomeForm(false);
      setIncomeValue('');
      setIncomeDistribution([]);
      
      // Reload data to show updated state
      await loadData();
    } catch (err: any) {
      console.error('Error processing income:', err);
      setError(err.message || 'Erro ao processar renda');
    } finally {
      setIsSaving(false);
    }
  };

  const monthLabel = currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  // Get categories without budget for this month
  const categoriesWithoutBudget = categories.filter(
    cat => !budgetsData?.budgets.some(b => b.categoryId === cat.id)
  );

  // Categories with positive savings
  const savingsCategories = budgetsData?.budgets.filter(b => b.remaining > 0) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Metas</h1>
        <p className="text-white/60">Defina orçamentos por categoria e acompanhe seus gastos</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="p-1 hover:bg-white/10 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Month Selector */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-white font-medium capitalize min-w-[160px] text-center text-lg">
          {monthLabel}
        </span>
        <button
          onClick={handleNextMonth}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Action Buttons */}
      {!showForm && !showIncomeForm && (
        <div className="flex flex-wrap gap-3 justify-end">
          <button
            onClick={handleAddIncome}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg shadow-green-500/20"
          >
            <DollarSign className="w-5 h-5" />
            Adicionar Renda
          </button>
          {categoriesWithoutBudget.length > 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Adicionar Orçamento
            </button>
          )}
        </div>
      )}

      {/* Income Form */}
      {showIncomeForm && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            Adicionar Renda Mensal
          </h3>
          
          {incomeRules.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-white/60 mb-4">
                Você ainda não configurou regras de distribuição.
              </p>
              <Link
                href="/dashboard/rules"
                className="btn-primary inline-flex items-center gap-2"
              >
                Configurar Regras
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <label className="text-white/60 text-sm mb-2 block">Valor da Renda</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={incomeValue}
                    onChange={(e) => setIncomeValue(e.target.value)}
                    className="input-field w-full pl-12 text-xl"
                    placeholder="5.000,00"
                    autoFocus
                  />
                </div>
              </div>

              {/* Distribution Preview */}
              {incomeDistribution.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-white/80 font-medium mb-4">Distribuição Automática:</h4>
                  <div className="space-y-3">
                    {incomeDistribution.map(({ rule, amount }) => (
                      <div 
                        key={rule.id} 
                        className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                            style={{ backgroundColor: `${rule.color}20` }}
                          >
                            {rule.icon}
                          </div>
                          <div>
                            <span className="text-white font-medium">{rule.name}</span>
                            <span className="text-white/40 text-sm ml-2">({rule.percentage}%)</span>
                          </div>
                        </div>
                        <span className="text-green-400 font-bold text-lg">
                          {formatCurrency(amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Total */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                    <span className="text-white font-semibold">Total</span>
                    <span className="text-green-400 font-bold text-xl">
                      {formatCurrency(incomeDistribution.reduce((sum, d) => sum + d.amount, 0))}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleConfirmIncome}
                  disabled={isSaving || incomeDistribution.length === 0}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-5 h-5 animate-spin" />}
                  Confirmar e Criar Orçamentos
                </button>
                <button
                  onClick={() => {
                    setShowIncomeForm(false);
                    setIncomeValue('');
                    setIncomeDistribution([]);
                  }}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Add Budget Form */}
      {showForm && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Definir Orçamento</h3>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <label className="text-white/60 text-sm mb-2 block">Categoria</label>
              <div className="relative">
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="input-field w-full appearance-none pr-10"
                >
                  <option value="">Selecione uma categoria</option>
                  {categoriesWithoutBudget.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" />
              </div>
            </div>
            <div className="flex-1">
              <label className="text-white/60 text-sm mb-2 block">Valor do Orçamento</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                className="input-field w-full"
                placeholder="Ex: 500.00"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleAddBudget}
                disabled={isSaving || !selectedCategoryId || !budgetAmount}
                className="btn-primary flex items-center gap-2"
              >
                {isSaving && <Loader2 className="w-5 h-5 animate-spin" />}
                Salvar
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setSelectedCategoryId('');
                  setBudgetAmount('');
                }}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Table */}
      {budgetsData && budgetsData.budgets.length > 0 ? (
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary-400" />
            Resumo
          </h3>
          
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Categoria</th>
                  <th className="text-right py-3 px-4 text-white/60 font-medium">Valor Gasto</th>
                  <th className="text-right py-3 px-4 text-white/60 font-medium">Devo Gastar</th>
                  <th className="text-right py-3 px-4 text-white/60 font-medium">Utilizado</th>
                  <th className="text-right py-3 px-4 text-white/60 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {budgetsData.budgets.map((item) => (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.categoryIcon}</span>
                        <span className="text-white font-medium">{item.categoryName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-red-400 font-medium">{formatCurrency(item.spent)}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-green-400 font-medium">{formatCurrency(item.budget)}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className={`font-medium ${
                        item.percentage >= 100 ? 'text-red-400' :
                        item.percentage >= 80 ? 'text-orange-400' :
                        item.percentage >= 50 ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {item.percentage.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleDeleteBudget(item.categoryId)}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                        title="Remover orçamento"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals - Improved Layout */}
          <div className="mt-8 pt-8 border-t border-white/10">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Total Gasto Card */}
              <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 rounded-2xl p-6 border border-red-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-red-400" />
                  </div>
                  <span className="text-white/60 text-sm font-medium">Total Gastos</span>
                </div>
                <p className="text-red-400 text-3xl font-bold">{formatCurrency(budgetsData.totals.totalSpent)}</p>
                <p className="text-white/40 text-sm mt-2">Valor gasto no mês</p>
              </div>

              {/* Total Orçamento Card */}
              <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-2xl p-6 border border-green-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-green-400" />
                  </div>
                  <span className="text-white/60 text-sm font-medium">Total a Gastar</span>
                </div>
                <p className="text-green-400 text-3xl font-bold">{formatCurrency(budgetsData.totals.totalBudget)}</p>
                <p className="text-white/40 text-sm mt-2">Orçamento definido</p>
              </div>

              {/* Percentage Card with Circle */}
              <div className="bg-gradient-to-br from-primary-500/20 to-primary-600/10 rounded-2xl p-6 border border-primary-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-white/60 text-sm font-medium block mb-4">Utilizado</span>
                    <p className={`text-3xl font-bold ${
                      budgetsData.totals.percentage >= 100 ? 'text-red-400' :
                      budgetsData.totals.percentage >= 80 ? 'text-orange-400' :
                      budgetsData.totals.percentage >= 50 ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>
                      {budgetsData.totals.percentage.toFixed(1)}%
                    </p>
                    <p className="text-white/40 text-sm mt-2">do orçamento total</p>
                  </div>
                  {/* Progress Circle */}
                  <div className="relative w-24 h-24">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="12"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke={
                          budgetsData.totals.percentage >= 100 ? '#ef4444' :
                          budgetsData.totals.percentage >= 80 ? '#f97316' :
                          budgetsData.totals.percentage >= 50 ? '#eab308' :
                          '#22c55e'
                        }
                        strokeWidth="12"
                        strokeDasharray={`${Math.min(budgetsData.totals.percentage, 100) * 2.64} 264`}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {Math.round(budgetsData.totals.percentage)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-10 h-10 text-primary-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-4">Nenhum orçamento definido</h2>
          <p className="text-white/60 mb-6">
            Adicione sua renda para criar orçamentos automaticamente em {monthLabel}.
          </p>
        </div>
      )}

      {/* Savings Cards */}
      {savingsCategories.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-green-400" />
            Economia por Categoria
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savingsCategories.map((item) => (
              <div key={item.id} className="glass-card p-5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${item.categoryColor}20` }}
                  >
                    {item.categoryIcon}
                  </div>
                  <h4 className="text-white font-semibold">{item.categoryName}</h4>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-white/60 text-sm">Gasto:</span>
                    <span className="text-red-400 font-medium">{formatCurrency(item.spent)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60 text-sm">Orçamento:</span>
                    <span className="text-white font-medium">{formatCurrency(item.budget)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/10">
                    <span className="text-green-400 text-sm flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      Economizou:
                    </span>
                    <span className="text-green-400 font-bold">{formatCurrency(item.remaining)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
