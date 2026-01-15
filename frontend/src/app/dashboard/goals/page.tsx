"use client";

import React from 'react';

import {
  categoryBudgetsApi,
  incomeRulesApi,
  type BudgetsData,
  type CreateIncomeRuleData,
  type IncomeRule,
  type RuleItem
} from '@/lib/api';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  DollarSign,
  Edit2,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  TrendingUp,
  Wallet,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';

// Available icons for categories
const AVAILABLE_ICONS = [
  '🏠', '💰', '✨', '🎯', '🎉', '📚', '🚗', '💳', '🛒', '🍔',
  '🏥', '📱', '🎬', '✈️', '👕', '💡', '🎮', '🏋️', '💅', '🐕',
];

// Default rules
const DEFAULT_RULES = [
  { name: 'Moradia', percentage: 35, color: '#ef4444', icon: '🏠' },
  { name: 'Saúde', percentage: 10, color: '#22c55e', icon: '🏥' },
  { name: 'Transporte', percentage: 15, color: '#3b82f6', icon: '🚗' },
  { name: 'Despesas Pessoais', percentage: 5, color: '#ec4899', icon: '💵' },
  { name: 'Educação', percentage: 5, color: '#8b5cf6', icon: '📚' },
  { name: 'Lazer', percentage: 10, color: '#f59e0b', icon: '🎉' },
  { name: 'Outros', percentage: 5, color: '#6b7280', icon: '📦' },
  { name: 'Despesas Temporárias', percentage: 15, color: '#06b6d4', icon: '⏰' },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function GoalsPage() {
  const [budgetsData, setBudgetsData] = useState<BudgetsData | null>(null);
  const [incomeRules, setIncomeRules] = useState<IncomeRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [baseIncome, setBaseIncome] = useState(0);
  const [hasRulesForCurrentMonth, setHasRulesForCurrentMonth] = useState(false);

  // Modals
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [editingPercentage, setEditingPercentage] = useState<IncomeRule | null>(null);

  // Form data
  const [tempIncome, setTempIncome] = useState('');
  const [tempPercentage, setTempPercentage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedRuleForSubcategory, setSelectedRuleForSubcategory] = useState<IncomeRule | null>(null);
  const [newCategory, setNewCategory] = useState<Omit<CreateIncomeRuleData, 'month' | 'year' | 'baseIncome'>>({
    name: '',
    percentage: 0,
    color: '#6366f1',
    icon: '💰',
  });
  const [newSubcategory, setNewSubcategory] = useState({ name: '' });
  const [editingSubitem, setEditingSubitem] = useState<{ ruleId: string; item: RuleItem } | null>(null);
  const [subitemError, setSubitemError] = useState('');
  const [subItemSpending, setSubItemSpending] = useState<Map<string, { totalSpent: number; isOverBudget: boolean; overAmount: number }>>(new Map());
  const [ruleSpending, setRuleSpending] = useState<Map<string, { totalSpent: number; isOverBudget: boolean; overAmount: number }>>(new Map());

  // Calculate totals from rule spending for real-time updates
  const calculatedTotals = React.useMemo(() => {
    let totalSpent = 0;
    const totalBudget = baseIncome;

    ruleSpending.forEach((data) => {
      totalSpent += data.totalSpent;
    });

    const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return { totalSpent, totalBudget, percentage };
  }, [ruleSpending, baseIncome]);

  const loadData = async () => {
    try {
      const month = currentMonth.getMonth() + 1;
      const year = currentMonth.getFullYear();
      
      const [budgetsRes, rulesRes] = await Promise.all([
        categoryBudgetsApi.getByMonth(month, year),
        incomeRulesApi.getAll(month, year)
      ]);
      
      if (budgetsRes.success) {
        setBudgetsData(budgetsRes.data);
      }

      if (rulesRes.success) {
        const isCurrentMonthRules = !rulesRes.usingFallback;
        setHasRulesForCurrentMonth(isCurrentMonthRules);
        
        if (isCurrentMonthRules) {
          setIncomeRules(rulesRes.data);
          setBaseIncome(rulesRes.baseIncome || 0);
          
          // MAP SPENDING DATA DIRECTLY FROM RESPONSE
          const ruleMap = new Map<string, { totalSpent: number; isOverBudget: boolean; overAmount: number }>();
          const itemMap = new Map<string, { totalSpent: number; isOverBudget: boolean; overAmount: number }>();

          rulesRes.data.forEach(rule => {
            if (rule.spending) {
              ruleMap.set(rule.id, {
                totalSpent: rule.spending.totalSpent,
                isOverBudget: rule.spending.isOverBudget,
                overAmount: rule.spending.totalSpent > rule.spending.budgetAmount 
                  ? rule.spending.totalSpent - rule.spending.budgetAmount 
                  : 0
              });
            }

            if (rule.items) {
              rule.items.forEach(item => {
                if (item.spending) {
                  itemMap.set(item.id, {
                    totalSpent: item.spending.totalSpent,
                    isOverBudget: item.spending.isOverBudget,
                    overAmount: item.spending.totalSpent > item.amount 
                      ? item.spending.totalSpent - item.amount 
                      : 0
                  });
                }
              });
            }
          });

          setRuleSpending(ruleMap);
          setSubItemSpending(itemMap);
        } else {
          setIncomeRules([]);
          setBaseIncome(0);
          setSubItemSpending(new Map());
          setRuleSpending(new Map());
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };



  const createDefaultRules = async (month: number, year: number, income: number) => {
    // Use resetToDefaults which also handles pending installment linking
    await incomeRulesApi.resetToDefaults(month, year, income);
  };

  useEffect(() => {
    setIsLoading(true);
    loadData();
  }, [currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  // Save base income
  const handleSaveIncome = async () => {
    const value = parseFloat(tempIncome);
    if (isNaN(value) || value <= 0) return;

    setIsSaving(true);
    try {
      const month = currentMonth.getMonth() + 1;
      const year = currentMonth.getFullYear();

      if (hasRulesForCurrentMonth && incomeRules.length > 0) {
        // Update existing rules
        await incomeRulesApi.update(incomeRules[0].id, { baseIncome: value });
      } else {
        // Create new default rules for this month
        await createDefaultRules(month, year, value);
      }
      
      setShowIncomeModal(false);
      setTempIncome('');
      await loadData();
    } catch (err) {
      console.error('Error saving income:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Save percentage
  const handleSavePercentage = async () => {
    if (!editingPercentage) return;
    const value = parseFloat(tempPercentage);
    if (isNaN(value) || value < 0) return;

    setIsSaving(true);
    setErrorMessage('');
    try {
      await incomeRulesApi.update(editingPercentage.id, { percentage: value });
      setEditingPercentage(null);
      setTempPercentage('');
      await loadData();
    } catch (err: any) {
      console.error('Error saving percentage:', err);
      setErrorMessage(err.message || 'Erro ao salvar porcentagem');
    } finally {
      setIsSaving(false);
    }
  };

  // Add category
  const handleAddCategory = async () => {
    if (!newCategory.name) return;

    setIsSaving(true);
    setErrorMessage('');
    try {
      const month = currentMonth.getMonth() + 1;
      const year = currentMonth.getFullYear();
      
      await incomeRulesApi.create({
        ...newCategory,
        month,
        year,
        baseIncome,
      });
      
      setShowCategoryModal(false);
      setNewCategory({ name: '', percentage: 0, color: '#6366f1', icon: '💰' });
      await loadData();
    } catch (err: any) {
      console.error('Error adding category:', err);
      setErrorMessage(err.message || 'Erro ao adicionar categoria');
    } finally {
      setIsSaving(false);
    }
  };

  // Add subcategory
  const handleAddSubcategory = async () => {
    if (!selectedRuleForSubcategory || !newSubcategory.name.trim()) return;

    // Check for duplicate name
    const existingItem = selectedRuleForSubcategory.items.find(
      item => item.name.toLowerCase() === newSubcategory.name.trim().toLowerCase()
    );
    if (existingItem) {
      setSubitemError('Já existe um subitem com esse nome nesta categoria');
      return;
    }

    setIsSaving(true);
    setSubitemError('');
    try {
      await incomeRulesApi.addItem(selectedRuleForSubcategory.id, {
        name: newSubcategory.name.trim(),
        amount: 0, // No budget, just tracking
      });
      
      setShowSubcategoryModal(false);
      setSelectedRuleForSubcategory(null);
      setNewSubcategory({ name: '' });
      await loadData();
    } catch (err) {
      console.error('Error adding subcategory:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete subcategory
  const handleDeleteSubcategory = async (ruleId: string, itemId: string) => {
    try {
      await incomeRulesApi.deleteItem(ruleId, itemId);
      await loadData();
    } catch (err) {
      console.error('Error deleting subcategory:', err);
    }
  };

  // Edit subcategory
  const handleEditSubitem = async () => {
    if (!editingSubitem || !newSubcategory.name.trim()) return;

    // Check for duplicate name (excluding current item)
    const parentRule = incomeRules.find(r => r.id === editingSubitem.ruleId);
    if (parentRule) {
      const existingItem = parentRule.items.find(
        item => item.id !== editingSubitem.item.id && 
                item.name.toLowerCase() === newSubcategory.name.trim().toLowerCase()
      );
      if (existingItem) {
        setSubitemError('Já existe um subitem com esse nome nesta categoria');
        return;
      }
    }

    setIsSaving(true);
    setSubitemError('');
    try {
      await incomeRulesApi.updateItem(editingSubitem.ruleId, editingSubitem.item.id, {
        name: newSubcategory.name.trim(),
        amount: 0, // No budget tracking
      });
      
      setEditingSubitem(null);
      setNewSubcategory({ name: '' });
      await loadData();
    } catch (err) {
      console.error('Error updating subcategory:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default categories
  const handleResetToDefaults = async () => {
    if (baseIncome <= 0) {
      alert('Por favor, defina uma renda base primeiro.');
      return;
    }

    setIsSaving(true);
    try {
      const month = currentMonth.getMonth() + 1;
      const year = currentMonth.getFullYear();

      await incomeRulesApi.resetToDefaults(month, year, baseIncome);
      
      setShowResetModal(false);
      await loadData();
    } catch (err) {
      console.error('Error resetting to defaults:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Sync installments without resetting
  const handleSyncInstallments = async () => {
    setIsSaving(true);
    try {
      const month = currentMonth.getMonth() + 1;
      const year = currentMonth.getFullYear();

      const result = await incomeRulesApi.syncInstallments(month, year);
      
      if (result.syncedCount > 0) {
        alert(`${result.syncedCount} parcela(s) sincronizada(s)!\n\nSubitens adicionados:\n${result.addedSubitems.join('\n')}`);
      } else {
        alert(result.message);
      }
      
      await loadData();
    } catch (err: any) {
      console.error('Error syncing installments:', err);
      alert(err.message || 'Erro ao sincronizar parcelas');
    } finally {
      setIsSaving(false);
    }
  };

  const monthLabel = currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const getAmountFromPercentage = (pct: number) => (baseIncome * pct) / 100;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 w-full max-w-full">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Gastos</h1>
        <p className="opacity-60 text-sm sm:text-base">Visualize a distribuição do seu orçamento por categoria</p>
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-center gap-3 sm:gap-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 rounded-xl bg-current/5 hover:bg-current/10 opacity-60 hover:opacity-100 transition-all active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-black capitalize min-w-[140px] sm:min-w-[180px] text-center text-base sm:text-lg tracking-tight">
          {monthLabel}
        </span>
        <button
          onClick={handleNextMonth}
          className="p-2 rounded-xl bg-current/5 hover:bg-current/10 opacity-60 hover:opacity-100 transition-all active:scale-95"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-end">
        <button
          onClick={() => {
            setTempIncome(baseIncome.toString());
            setShowIncomeModal(true);
          }}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/10 active:scale-95"
        >
          <DollarSign className="w-5 h-5" />
          Configurar Renda
        </button>
        <button
          onClick={() => setShowCategoryModal(true)}
          className="btn-primary flex items-center gap-2 shadow-emerald-500/10"
        >
          <Plus className="w-4 h-4" />
          Nova Categoria
        </button>
        {hasRulesForCurrentMonth && incomeRules.length > 0 && (
          <>
            <button
              onClick={handleSyncInstallments}
              disabled={isSaving}
              className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
              Sincronizar Parcelas
            </button>
            <button
              onClick={() => setShowResetModal(true)}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              Redefinir
            </button>
          </>
        )}
      </div>

      {/* Summary Table */}
      {(budgetsData && budgetsData.budgets.length > 0) || (hasRulesForCurrentMonth && incomeRules.length > 0) ? (
        <div className="glass-card overflow-hidden w-full max-w-full">
          <div className="p-6 thin-border-b bg-current/[0.01]">
            <h3 className="text-lg font-black flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary-500" />
              Resumo Operacional
            </h3>
          </div>
          
          {/* Table container with constrained width to force scroll */}
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="thin-border-b bg-current/[0.01]">
                  <th className="text-left py-4 px-3 sm:px-6 text-[10px] font-black opacity-40 uppercase tracking-widest">Categoria</th>
                  <th className="text-right py-4 px-3 sm:px-6 text-[10px] font-black opacity-40 uppercase tracking-widest">Destinado</th>
                  <th className="text-right py-4 px-3 sm:px-6 text-[10px] font-black opacity-40 uppercase tracking-widest">Valor Gasto</th>
                  <th className="text-right py-4 px-3 sm:px-6 text-[10px] font-black opacity-40 uppercase tracking-widest">Teto Gastar</th>
                  <th className="text-right py-4 px-3 sm:px-6 text-[10px] font-black opacity-40 uppercase tracking-widest">Utilizado</th>
                </tr>
              </thead>
              <tbody className="thin-divide">
                {/* If we have budgetsData, use it. Otherwise, use incomeRules directly */}
                {budgetsData && budgetsData.budgets.length > 0 ? (
                  budgetsData.budgets.map((item) => {
                    const matchingRule = incomeRules.find(r => r.name === item.categoryName);
                    const destinedPercentage = matchingRule?.percentage || 0;
                    const isExpanded = expandedCategories.has(item.categoryName);
                    const hasSubitems = matchingRule && matchingRule.items.length > 0;
                    
                    return (
                      <React.Fragment key={item.id}>
                        <tr 
                          className={`hover:bg-current/[0.02] transition-colors ${hasSubitems ? 'cursor-pointer' : ''}`}
                          onClick={() => hasSubitems && toggleCategory(item.categoryName)}
                        >
                          <td className="py-4 px-3 sm:px-6">
                            <div className="flex items-center gap-3">
                              {hasSubitems ? (
                                isExpanded ? (
                                  <ChevronUp className="w-4 h-4 opacity-40" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 opacity-40" />
                                )
                              ) : (
                                <div className="w-4" /> 
                              )}
                              <span className="text-2xl">{item.categoryIcon}</span>
                              <div className="flex flex-col">
                                <span className="font-bold text-base">{item.categoryName}</span>
                                {hasSubitems && (
                                  <span className="opacity-40 text-[10px] font-bold uppercase tracking-wider">
                                    {matchingRule.items.length} subprocessos
                                  </span>
                                )}
                              </div>
                              {matchingRule && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedRuleForSubcategory(matchingRule);
                                    setShowSubcategoryModal(true);
                                  }}
                                  className="text-primary-500 hover:text-primary-600 ml-2 p-1 hover:bg-primary-500/10 rounded-lg transition-all"
                                  title="Adicionar subcategoria"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-3 sm:px-6 text-right whitespace-nowrap">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (matchingRule) {
                                  setEditingPercentage(matchingRule);
                                  setTempPercentage(matchingRule.percentage.toString());
                                }
                              }}
                              className="inline-flex items-center gap-1.5 text-primary-500 hover:text-primary-600 transition-colors group px-2 py-1 bg-primary-500/5 rounded-lg border border-primary-500/5"
                            >
                              <span className="font-black tabular-nums">{destinedPercentage.toFixed(1)}%</span>
                              <Edit2 className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-all" />
                            </button>
                          </td>
                          <td className="py-4 px-3 sm:px-6 text-right whitespace-nowrap">
                            <span className="text-red-500 font-black tabular-nums">{formatCurrency(item.spent)}</span>
                          </td>
                          <td className="py-4 px-3 sm:px-6 text-right whitespace-nowrap">
                            <span className="text-emerald-500 font-black tabular-nums">{formatCurrency(item.budget)}</span>
                          </td>
                          <td className="py-4 px-3 sm:px-6 text-right whitespace-nowrap">
                            <span className={`font-black tabular-nums ${
                              item.percentage >= 100 ? 'text-red-500' :
                              item.percentage >= 80 ? 'text-orange-500' :
                              item.percentage >= 50 ? 'text-yellow-500' :
                              'text-emerald-500'
                            }`}>
                              {item.percentage.toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                        
                        {/* Subcategories dropdown */}
                        {isExpanded && hasSubitems && matchingRule.items.map((subitem) => {
                          const spending = subItemSpending.get(subitem.id);
                          const spent = spending?.totalSpent || 0;
                          
                          return (
                            <tr key={`${item.id}-${subitem.id}`} className="bg-current/[0.02] animate-in slide-in-from-top-2 duration-200">
                              <td className="py-3 px-6 pl-16" colSpan={3}>
                                <div className="flex items-center gap-2">
                                  <span className="opacity-20 text-xs">└</span>
                                  <span className="font-bold text-sm opacity-80">{subitem.name}</span>
                                  <div className="flex items-center gap-1 ml-2">
                                    <button
                                      onClick={() => {
                                        setEditingSubitem({ ruleId: matchingRule.id, item: subitem });
                                        setNewSubcategory({ name: subitem.name });
                                      }}
                                      className="p-1 px-1.5 rounded-lg bg-primary-500/10 hover:bg-primary-500/20 text-primary-500 transition-all"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSubcategory(matchingRule.id, subitem.id)}
                                      className="p-1 px-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-6 text-right" colSpan={2}>
                                <span className="font-black tabular-nums text-xs opacity-80">
                                  {formatCurrency(spent)} gasto
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })
                ) : (
                  // Render directly from incomeRules when no budgetsData exists
                  incomeRules.map((rule) => {
                    const budgetAmount = getAmountFromPercentage(rule.percentage);
                    const isExpanded = expandedCategories.has(rule.name);
                    const hasSubitems = rule.items.length > 0;
                    
                    return (
                      <React.Fragment key={rule.id}>
                        <tr 
                          className={`hover:bg-current/[0.02] transition-colors ${hasSubitems ? 'cursor-pointer' : ''}`}
                          onClick={() => hasSubitems && toggleCategory(rule.name)}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              {hasSubitems ? (
                                isExpanded ? (
                                  <ChevronUp className="w-4 h-4 opacity-40" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 opacity-40" />
                                )
                              ) : (
                                <div className="w-4" /> 
                              )}
                              <span className="text-2xl">{rule.icon}</span>
                              <div className="flex flex-col">
                                <span className="font-bold text-base">{rule.name}</span>
                                {hasSubitems && (
                                  <span className="opacity-40 text-[10px] font-bold uppercase tracking-wider">
                                    {rule.items.length} subprocessos
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRuleForSubcategory(rule);
                                  setShowSubcategoryModal(true);
                                }}
                                className="text-primary-500 hover:text-primary-600 ml-2 p-1 hover:bg-primary-500/10 rounded-lg transition-all"
                                title="Adicionar subcategoria"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingPercentage(rule);
                                setTempPercentage(rule.percentage.toString());
                              }}
                              className="inline-flex items-center gap-1.5 text-primary-500 hover:text-primary-600 transition-colors group px-2 py-1 bg-primary-500/5 rounded-lg border border-primary-500/5"
                            >
                              <span className="font-black tabular-nums">{rule.percentage.toFixed(1)}%</span>
                              <Edit2 className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-all" />
                            </button>
                          </td>
                          <td className="py-4 px-6 text-right">
                            {(() => {
                              const spending = ruleSpending.get(rule.id);
                              const spent = spending?.totalSpent || 0;
                              const isOver = spending?.isOverBudget || false;
                              return (
                                <div className="flex flex-col items-end">
                                  <span className={`font-black tabular-nums ${isOver ? 'text-red-500' : 'text-red-500'}`}>
                                    {formatCurrency(spent)}
                                  </span>
                                  {isOver && (
                                    <span className="text-[10px] text-red-500 font-bold uppercase tabular-nums">
                                      +{formatCurrency(spent - budgetAmount)}
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <span className="text-emerald-500 font-black tabular-nums">{formatCurrency(budgetAmount)}</span>
                          </td>
                          <td className="py-4 px-4 text-right">
                             {(() => {
                              const spending = ruleSpending.get(rule.id);
                              const percentage = spending && budgetAmount > 0 ? (spending.totalSpent / budgetAmount) * 100 : 0;
                              return (
                                <span className={`font-medium ${percentage > 100 ? 'text-red-500' : 'text-green-400'}`}>
                                  {percentage.toFixed(2)}%
                                </span>
                              );
                            })()}
                          </td>
                        </tr>
                        
                        {/* Subcategories dropdown */}
                        {isExpanded && hasSubitems && rule.items.map((subitem) => {
                          const spending = subItemSpending.get(subitem.id);
                          const spent = spending?.totalSpent || 0;
                          
                          return (
                            <tr key={`${rule.id}-${subitem.id}`} className="bg-current/[0.02] animate-in slide-in-from-top-2 duration-200">
                              <td className="py-3 px-6 pl-16" colSpan={3}>
                                <div className="flex items-center gap-2">
                                  <span className="opacity-20 text-xs">└</span>
                                  <span className="font-bold text-sm opacity-80">{subitem.name}</span>
                                  <div className="flex items-center gap-1 ml-2">
                                    <button
                                      onClick={() => {
                                        setEditingSubitem({ ruleId: rule.id, item: subitem });
                                        setNewSubcategory({ name: subitem.name });
                                      }}
                                      className="p-1 px-1.5 rounded-lg bg-primary-500/10 hover:bg-primary-500/20 text-primary-500 transition-all"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSubcategory(rule.id, subitem.id)}
                                      className="p-1 px-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-6 text-right" colSpan={2}>
                                <span className="font-black tabular-nums text-xs opacity-80">
                                  {formatCurrency(spent)} gasto
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Totals - ORIGINAL LAYOUT */}
          <div className="p-8 thin-border-t bg-current/[0.01]">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Total Gasto Card */}
              <div className="bg-red-500/5 rounded-2xl p-6 border border-red-500/10 group hover:bg-red-500/10 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-red-500" />
                  </div>
                  <span className="opacity-60 text-xs font-black uppercase tracking-widest">Total Gastos</span>
                </div>
                <p className="text-red-500 text-3xl font-black tabular-nums">{formatCurrency(budgetsData?.totals?.totalSpent || calculatedTotals.totalSpent)}</p>
                <p className="opacity-40 text-xs font-bold uppercase tracking-wider mt-2">Fluxo de saída acumulado</p>
              </div>

              {/* Total Orçamento Card */}
              <div className="bg-emerald-500/5 rounded-2xl p-6 border border-emerald-500/10 group hover:bg-emerald-500/10 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-emerald-500" />
                  </div>
                  <span className="opacity-60 text-xs font-black uppercase tracking-widest">Teto Planejado</span>
                </div>
                <p className="text-emerald-500 text-3xl font-black tabular-nums">{formatCurrency(budgetsData?.totals?.totalBudget || calculatedTotals.totalBudget)}</p>
                <p className="opacity-40 text-xs font-bold uppercase tracking-wider mt-2">Limite operacional definido</p>
              </div>

              {/* Percentage Card with Circle */}
              <div className="bg-primary-500/5 rounded-2xl p-6 border border-primary-500/5 group hover:bg-primary-500/10 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="opacity-60 text-xs font-black uppercase tracking-widest block mb-4">Eficiência</span>
                    <p className={`text-3xl font-black tabular-nums ${
                      (budgetsData?.totals?.percentage || calculatedTotals.percentage) >= 100 ? 'text-red-500' :
                      (budgetsData?.totals?.percentage || calculatedTotals.percentage) >= 80 ? 'text-orange-500' :
                      (budgetsData?.totals?.percentage || calculatedTotals.percentage) >= 50 ? 'text-yellow-500' :
                      'text-emerald-500'
                    }`}>
                      {(budgetsData?.totals?.percentage || calculatedTotals.percentage).toFixed(1)}%
                    </p>
                    <p className="opacity-40 text-xs font-bold uppercase tracking-wider mt-2">Capacidade utilizada</p>
                  </div>
                  {/* Progress Circle */}
                  <div className="relative w-24 h-24">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="12"
                        className="opacity-5"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="12"
                        strokeDasharray={`${Math.min(budgetsData?.totals?.percentage || calculatedTotals.percentage, 100) * 2.64} 264`}
                        strokeLinecap="round"
                        className={`transition-all duration-700 ease-out ${
                          (budgetsData?.totals?.percentage || calculatedTotals.percentage) >= 100 ? 'text-red-500' :
                          (budgetsData?.totals?.percentage || calculatedTotals.percentage) >= 80 ? 'text-orange-500' :
                          (budgetsData?.totals?.percentage || calculatedTotals.percentage) >= 50 ? 'text-yellow-500' :
                          'text-emerald-500'
                        }`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-black text-xs tabular-nums tracking-tighter">
                        {Math.round(budgetsData?.totals?.percentage || calculatedTotals.percentage)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card p-12 sm:p-20 text-center">
          <div className="w-24 h-24 rounded-full bg-current/5 flex items-center justify-center mx-auto mb-8">
            <Wallet className="w-12 h-12 opacity-20" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black mb-4">Pipeline Financeiro Vazio</h2>
          <p className="opacity-60 mb-10 text-sm sm:text-base max-w-md mx-auto font-medium">
            Configure seu fluxo de entrada para gerar as estratégias de alocação de capital.
          </p>
          <button
            onClick={() => setShowIncomeModal(true)}
            className="btn-primary flex items-center gap-2 mx-auto shadow-emerald-500/20"
          >
            <DollarSign className="w-5 h-5" />
            Configurar Fluxo de Caixa
          </button>
        </div>
      )}

      {/* Donut Chart and Distribution */}
      {incomeRules.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="w-full lg:w-1/3 flex flex-col items-center">
                <h3 className="text-xl font-black tracking-tight mb-6 flex items-center gap-2 self-start">
                  📊 Distribuição de Gastos
                </h3>
              
              <div className="relative flex-shrink-0">
                <svg width="220" height="220" viewBox="0 0 220 220" className="transform -rotate-90">
                  {(() => {
                    let cumulativePercentage = 0;
                    const radius = 80;
                    const circumference = 2 * Math.PI * radius;
                    const centerX = 110;
                    const centerY = 110;
                    
                    // Decide what to show in the chart: actual spent or planned budget
                    const totalSpent = Array.from(ruleSpending.values()).reduce((acc, curr) => acc + curr.totalSpent, 0);
                    const showPlanned = totalSpent === 0;

                    return incomeRules.map((rule) => {
                      const spending = ruleSpending.get(rule.id);
                      const spent = spending?.totalSpent || 0;
                      
                      let displayPercentage = 0;
                      if (showPlanned) {
                        displayPercentage = rule.percentage;
                      } else {
                        displayPercentage = totalSpent > 0 ? (spent / totalSpent) * 100 : 0;
                      }

                      if (displayPercentage <= 0) return null;

                      const strokeDasharray = (displayPercentage / 100) * circumference;
                      const strokeDashoffset = -(cumulativePercentage / 100) * circumference;
                      cumulativePercentage += displayPercentage;
                      
                      return (
                        <circle
                          key={rule.id}
                          cx={centerX}
                          cy={centerY}
                          r={radius}
                          fill="none"
                          stroke={rule.color}
                          strokeWidth="32"
                          strokeDasharray={`${strokeDasharray} ${circumference}`}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-all duration-300 hover:opacity-80"
                        />
                      );
                    });
                  })()}
                  <circle cx="110" cy="110" r="48" fill="currentColor" className="opacity-5" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold">
                    {(() => {
                      const totalSpent = Array.from(ruleSpending.values()).reduce((acc, curr) => acc + curr.totalSpent, 0);
                      return totalSpent > 0 ? formatCurrency(totalSpent) : "100%";
                    })()}
                  </span>
                  <span className="opacity-60 text-[10px] uppercase tracking-wider">
                    {Array.from(ruleSpending.values()).reduce((acc, curr) => acc + curr.totalSpent, 0) > 0 ? "Total Gasto" : "Planejado"}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Legend and Stats */}
            <div className="w-full lg:w-2/3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {incomeRules
                  .map(rule => {
                    const spending = ruleSpending.get(rule.id);
                    const spent = spending?.totalSpent || 0;
                    const totalSpent = Array.from(ruleSpending.values()).reduce((acc, curr) => acc + curr.totalSpent, 0);
                    const percentage = totalSpent > 0 ? (spent / totalSpent) * 100 : rule.percentage;
                    return { ...rule, spent, percentage, totalSpent };
                  })
                  .sort((a, b) => b.spent - a.spent || b.percentage - a.percentage)
                  .map((item) => (
                    <div 
                      key={item.id}
                      className="p-4 rounded-2xl bg-current/5 border border-current/[0.06] flex items-center gap-4 hover:bg-current/10 transition-all group"
                    >
                      <div className="text-2xl">{item.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-semibold truncate">{item.name}</p>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-current/10 opacity-60">
                            {item.percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                             <span className="opacity-40">Gasto:</span>
                             <span className={item.spent > 0 ? 'text-red-500 font-medium' : 'opacity-20'}>
                               {formatCurrency(item.spent)}
                             </span>
                          </div>
                          {item.spent > 0 && (
                             <span className="text-[10px] opacity-30 italic">
                               v. planejado {(item.percentage).toFixed(0)}%
                             </span>
                          )}
                        </div>
                        {/* Progress Bar Mini */}
                        <div className="mt-2 h-1 w-full bg-current/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary-500 transition-all duration-500" 
                            style={{ 
                              width: `${Math.min(item.percentage, 100)}%`,
                              backgroundColor: item.color 
                            }} 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}

      {/* Edit Income Modal */}
      {showIncomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowIncomeModal(false)} />
          <div className="glass-card p-8 w-full max-w-md relative z-10 border-current/[0.06] shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black tracking-tight">Fluxo de Caixa Base</h2>
                <p className="opacity-40 text-[10px] font-bold uppercase tracking-widest mt-1">Configuração de aporte mensal</p>
              </div>
              <button onClick={() => setShowIncomeModal(false)} className="p-2 hover:bg-current/5 rounded-xl opacity-40 hover:opacity-100 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 block">Montante da Renda</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-black">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={tempIncome}
                    onChange={(e) => setTempIncome(e.target.value)}
                    className="input-field w-full pl-12 font-black text-lg h-14"
                    placeholder="0,00"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveIncome}
                  disabled={isSaving}
                  className="btn-primary flex-1 h-12 flex items-center justify-center gap-2 shadow-emerald-500/10"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <DollarSign className="w-5 h-5" />}
                  Confirmar Aporte
                </button>
                <button onClick={() => setShowIncomeModal(false)} className="btn-secondary h-12 px-6">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Percentage Modal */}
      {editingPercentage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => { setEditingPercentage(null); setErrorMessage(''); }} />
          <div className="glass-card p-8 w-full max-w-md relative z-10 border-current/[0.06] shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black tracking-tight">Alocação de Recurso</h2>
                <p className="opacity-40 text-[10px] font-bold uppercase tracking-widest mt-1">Definição de teto operacional</p>
              </div>
              <button onClick={() => { setEditingPercentage(null); setErrorMessage(''); }} className="p-2 hover:bg-current/5 rounded-xl opacity-40 hover:opacity-100 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-current/[0.03] rounded-2xl border border-current/[0.03]">
                <div className="w-12 h-12 rounded-xl bg-current/5 flex items-center justify-center text-2xl shadow-inner">
                  {editingPercentage.icon}
                </div>
                <div>
                  <span className="font-black text-base block">{editingPercentage.name}</span>
                  <span className="opacity-40 text-[10px] font-black uppercase tracking-widest">Categoria Selecionada</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 block">Porcentagem do Orçamento</label>
                <div className="relative group">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={tempPercentage}
                    onChange={(e) => { setTempPercentage(e.target.value); setErrorMessage(''); }}
                    className="input-field w-full pr-12 font-black text-lg h-14"
                    placeholder="0.0"
                    autoFocus
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-500 font-black">%</span>
                </div>
                {tempPercentage && parseFloat(tempPercentage) > 0 && (
                  <p className="text-emerald-500 text-[10px] font-black uppercase tracking-wider mt-2 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> Valor Resultante: {formatCurrency(getAmountFromPercentage(parseFloat(tempPercentage)))}
                  </p>
                )}
                
                {errorMessage && (
                  <p className="text-red-500 text-[10px] font-black uppercase tracking-wider mt-2 flex items-center gap-1">
                    <X className="w-3 h-3" /> {errorMessage}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSavePercentage}
                  disabled={isSaving}
                  className="btn-primary flex-1 h-12 flex items-center justify-center gap-2 shadow-emerald-500/10"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <TrendingUp className="w-5 h-5" />}
                  Atualizar Teto
                </button>
                <button onClick={() => { setEditingPercentage(null); setErrorMessage(''); }} className="btn-secondary h-12 px-6">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => { setShowCategoryModal(false); setErrorMessage(''); }} />
          <div className="glass-card p-8 w-full max-w-md relative z-10 border-current/[0.06] shadow-2xl animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black tracking-tight">Nova Unidade Estratégica</h2>
                <p className="opacity-40 text-[10px] font-bold uppercase tracking-widest mt-1">Criação de centro de custo</p>
              </div>
              <button onClick={() => { setShowCategoryModal(false); setErrorMessage(''); }} className="p-2 hover:bg-current/5 rounded-xl opacity-40 hover:opacity-100 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 block">Identificador Visual (Ícone)</label>
                <div className="grid grid-cols-5 gap-2 p-3 bg-current/[0.03] rounded-2xl border border-current/[0.03]">
                  {AVAILABLE_ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setNewCategory({ ...newCategory, icon })}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${
                        newCategory.icon === icon 
                          ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20 scale-110' 
                          : 'bg-current/5 hover:bg-current/10 opacity-60 hover:opacity-100'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 block">Denominação</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => { setNewCategory({ ...newCategory, name: e.target.value }); setErrorMessage(''); }}
                  className="input-field w-full font-bold h-12"
                  placeholder="Ex: Investimentos"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 block">Participação no Orçamento (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={newCategory.percentage || ''}
                    onChange={(e) => { setNewCategory({ ...newCategory, percentage: parseFloat(e.target.value) || 0 }); setErrorMessage(''); }}
                    className="input-field w-full pr-12 font-black h-12"
                    placeholder="0.0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-500 font-black">%</span>
                </div>
                {newCategory.percentage > 0 && (
                  <p className="text-emerald-500 text-[10px] font-black uppercase tracking-wider mt-2 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> Valor Resultante: {formatCurrency(getAmountFromPercentage(newCategory.percentage))}
                  </p>
                )}
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 block">Identidade Cromática</label>
                <div className="flex flex-wrap gap-2 p-3 bg-current/[0.03] rounded-2xl border border-current/[0.03]">
                  {['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6366f1'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewCategory({ ...newCategory, color })}
                      className={`w-8 h-8 rounded-full transition-all hover:scale-110 ${
                        newCategory.color === color 
                          ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-background scale-110' 
                          : 'opacity-60 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {errorMessage && (
                <p className="text-red-500 text-[10px] font-black uppercase tracking-wider mt-2 flex items-center gap-1">
                  <X className="w-3 h-3" /> {errorMessage}
                </p>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddCategory}
                  disabled={isSaving || !newCategory.name}
                  className="btn-primary flex-1 h-12 flex items-center justify-center gap-2 shadow-emerald-500/10"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  Estabelecer Categoria
                </button>
                <button onClick={() => { setShowCategoryModal(false); setErrorMessage(''); }} className="btn-secondary h-12 px-6">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Subcategory Modal */}
      {showSubcategoryModal && selectedRuleForSubcategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => { setShowSubcategoryModal(false); setSubitemError(''); }} />
          <div className="glass-card p-8 w-full max-w-md relative z-10 border-current/[0.06] shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black tracking-tight">Novo Subitem</h2>
                <p className="opacity-40 text-[10px] font-bold uppercase tracking-widest mt-1">Detalhamento de gastos</p>
              </div>
              <button onClick={() => { setShowSubcategoryModal(false); setSubitemError(''); }} className="p-2 hover:bg-current/5 rounded-xl opacity-40 hover:opacity-100 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-current/[0.03] rounded-2xl border border-current/[0.03]">
                <div className="w-12 h-12 rounded-xl bg-current/5 flex items-center justify-center text-2xl shadow-inner">
                  {selectedRuleForSubcategory.icon}
                </div>
                <div>
                  <span className="font-black text-base block">{selectedRuleForSubcategory.name}</span>
                  <span className="opacity-40 text-[10px] font-black uppercase tracking-widest">Categoria Principal</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 block">Nome do Item</label>
                <input
                  type="text"
                  value={newSubcategory.name}
                  onChange={(e) => { setNewSubcategory({ name: e.target.value }); setSubitemError(''); }}
                  className="input-field w-full font-bold h-12"
                  placeholder="Ex: Aluguel, Supermercado..."
                  autoFocus
                />
              </div>

              {subitemError && (
                <p className="text-red-500 text-xs font-bold flex items-center gap-1">
                  <X className="w-3 h-3" /> {subitemError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAddSubcategory}
                  disabled={isSaving || !newSubcategory.name.trim()}
                  className="btn-primary flex-1 h-12 flex items-center justify-center gap-2 shadow-emerald-500/10"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  Vincular Item
                </button>
                <button onClick={() => { setShowSubcategoryModal(false); setSubitemError(''); }} className="btn-secondary h-12 px-6">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Subcategory Modal */}
      {editingSubitem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => { setEditingSubitem(null); setNewSubcategory({ name: '' }); setSubitemError(''); }} />
          <div className="glass-card p-8 w-full max-w-md relative z-10 border-current/[0.06] shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black tracking-tight">Editar Subitem</h2>
                <p className="opacity-40 text-[10px] font-bold uppercase tracking-widest mt-1">Ajuste de detalhamento</p>
              </div>
              <button onClick={() => { setEditingSubitem(null); setNewSubcategory({ name: '' }); setSubitemError(''); }} className="p-2 hover:bg-current/5 rounded-xl opacity-40 hover:opacity-100 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 block">Nome do Item</label>
                <input
                  type="text"
                  value={newSubcategory.name}
                  onChange={(e) => { setNewSubcategory({ name: e.target.value }); setSubitemError(''); }}
                  className="input-field w-full font-bold h-12"
                  placeholder="Ex: Aluguel, Supermercado..."
                  autoFocus
                />
              </div>

              {subitemError && (
                <p className="text-red-500 text-xs font-bold flex items-center gap-1">
                  <X className="w-3 h-3" /> {subitemError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleEditSubitem}
                  disabled={isSaving || !newSubcategory.name.trim()}
                  className="btn-primary flex-1 h-12 flex items-center justify-center gap-2 shadow-emerald-500/10"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Edit2 className="w-4 h-4" />}
                  Confirmar Edição
                </button>
                <button onClick={() => { setEditingSubitem(null); setNewSubcategory({ name: '' }); setSubitemError(''); }} className="btn-secondary h-12 px-6">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowResetModal(false)} />
          <div className="glass-card p-8 w-full max-w-md relative z-10 border-current/[0.06] shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black tracking-tight">Reinicialização Estratégica</h2>
                <p className="opacity-40 text-[10px] font-bold uppercase tracking-widest mt-1">Recuperação de parâmetros padrão</p>
              </div>
              <button onClick={() => setShowResetModal(false)} className="p-2 hover:bg-current/5 rounded-xl opacity-40 hover:opacity-100 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-6">
              <div className="p-5 bg-orange-500/5 border border-orange-500/20 rounded-2xl">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <RotateCcw className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-orange-500 font-black text-sm uppercase tracking-wider mb-2">Protocolo de Atenção</p>
                    <p className="opacity-70 text-sm leading-relaxed">
                      Esta ação irá resetar todas as categorias e porcentagens criadas para o mês de <span className="font-black">{monthLabel}</span>.
                    </p>
                    <div className="mt-4 p-3 bg-current/[0.03] rounded-xl border border-current/[0.03]">
                      <p className="opacity-40 text-[10px] font-black uppercase tracking-widest mb-2">Configuração Resultante:</p>
                      <ul className="grid grid-cols-2 gap-x-4 gap-y-1 opacity-60 text-[11px] font-bold">
                        <li className="flex justify-between"><span>Metas</span> <span>10%</span></li>
                        <li className="flex justify-between"><span>Conforto</span> <span>15%</span></li>
                        <li className="flex justify-between"><span>Prazeres</span> <span>10%</span></li>
                        <li className="flex justify-between"><span>Custo Fixo</span> <span>35%</span></li>
                        <li className="flex justify-between"><span>Liberdade</span> <span>25%</span></li>
                        <li className="flex justify-between"><span>Conhecimento</span> <span>5%</span></li>
                      </ul>
                    </div>
                    <p className="opacity-40 text-[10px] font-bold mt-4 flex items-center gap-1">
                      <X className="w-3 h-3" /> Alteração restrita ao período selecionado.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleResetToDefaults}
                  disabled={isSaving}
                  className="flex-1 h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                  Confirmar Reset
                </button>
                <button onClick={() => setShowResetModal(false)} className="btn-secondary h-12 px-6">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
