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
  { name: 'Metas', percentage: 10, color: '#f59e0b', icon: '🎯' },
  { name: 'Conforto', percentage: 15, color: '#3b82f6', icon: '✨' },
  { name: 'Prazeres', percentage: 10, color: '#ec4899', icon: '🎉' },
  { name: 'Custo Fixo', percentage: 35, color: '#ef4444', icon: '🏠' },
  { name: 'Liberdade Financeira', percentage: 25, color: '#22c55e', icon: '💰' },
  { name: 'Conhecimento', percentage: 5, color: '#8b5cf6', icon: '📚' },
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
  const [newSubcategory, setNewSubcategory] = useState({ name: '', amount: '' });
  const [editingSubitem, setEditingSubitem] = useState<{ ruleId: string; item: RuleItem } | null>(null);
  const [subItemSpending, setSubItemSpending] = useState<Map<string, { totalSpent: number; isOverBudget: boolean; overAmount: number }>>(new Map());
  const [ruleSpending, setRuleSpending] = useState<Map<string, { totalSpent: number; isOverBudget: boolean; overAmount: number }>>(new Map());

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
        // Only set rules if they are for the current month (not using fallback)
        const isCurrentMonthRules = !rulesRes.usingFallback;
        setHasRulesForCurrentMonth(isCurrentMonthRules);
        
        if (isCurrentMonthRules) {
          setIncomeRules(rulesRes.data);
          setBaseIncome(rulesRes.baseIncome || 0);
          
          // Load spending for all subitems and rules
          await Promise.all([
            loadSubItemSpending(rulesRes.data),
            loadRuleSpending(rulesRes.data)
          ]);
        } else {
          // Clear rules if using fallback - we want empty state
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

  const loadRuleSpending = async (rules: IncomeRule[]) => {
    const spendingMap = new Map<string, { totalSpent: number; isOverBudget: boolean; overAmount: number }>();
    
    try {
      await Promise.all(rules.map(async (rule) => {
        try {
          const spendingRes = await incomeRulesApi.getRuleSpending(rule.id);
          if (spendingRes.success) {
            spendingMap.set(rule.id, {
              totalSpent: spendingRes.data.totalSpent,
              isOverBudget: spendingRes.data.isOverBudget,
              overAmount: 0 
            });
          }
        } catch (e) {
          console.error(`Error loading spending for rule ${rule.id}`, e);
        }
      }));
      setRuleSpending(spendingMap);
    } catch (err) {
      console.error('Error loading rule spending:', err);
    }
  };

  const loadSubItemSpending = async (rules: IncomeRule[]) => {
    const spendingMap = new Map<string, { totalSpent: number; isOverBudget: boolean; overAmount: number }>();
    
    try {
      // For each rule with items, fetch spending data
      for (const rule of rules) {
        if (rule.items && rule.items.length > 0) {
          for (const item of rule.items) {
            try {
              const spendingRes = await incomeRulesApi.getItemSpending(rule.id, item.id);
              if (spendingRes.success) {
                spendingMap.set(item.id, {
                  totalSpent: spendingRes.data.totalSpent,
                  isOverBudget: spendingRes.data.isOverBudget,
                  overAmount: spendingRes.data.overAmount,
                });
              }
            } catch (err) {
              console.error(`Error loading spending for item ${item.id}:`, err);
            }
          }
        }
      }
      
      setSubItemSpending(spendingMap);
    } catch (err) {
      console.error('Error loading subitem spending:', err);
    }
  };

  const createDefaultRules = async (month: number, year: number, income: number) => {
    for (const rule of DEFAULT_RULES) {
      await incomeRulesApi.create({
        ...rule,
        month,
        year,
        baseIncome: income,
      });
    }
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
    if (!selectedRuleForSubcategory || !newSubcategory.name || !newSubcategory.amount) return;

    setIsSaving(true);
    try {
      await incomeRulesApi.addItem(selectedRuleForSubcategory.id, {
        name: newSubcategory.name,
        amount: parseFloat(newSubcategory.amount),
      });
      
      setShowSubcategoryModal(false);
      setSelectedRuleForSubcategory(null);
      setNewSubcategory({ name: '', amount: '' });
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
    if (!editingSubitem || !newSubcategory.name || !newSubcategory.amount) return;

    setIsSaving(true);
    try {
      await incomeRulesApi.updateItem(editingSubitem.ruleId, editingSubitem.item.id, {
        name: newSubcategory.name,
        amount: parseFloat(newSubcategory.amount),
      });
      
      setEditingSubitem(null);
      setNewSubcategory({ name: '', amount: '' });
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

  const monthLabel = currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const getAmountFromPercentage = (pct: number) => (baseIncome * pct) / 100;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Gastos</h1>
        <p className="text-white/60 text-sm sm:text-base">Visualize a distribuição do seu orçamento por categoria</p>
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-center gap-3 sm:gap-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-white font-medium capitalize min-w-[140px] sm:min-w-[160px] text-center text-base sm:text-lg">
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
      <div className="flex flex-wrap gap-3 justify-end">
        <button
          onClick={() => {
            setTempIncome(baseIncome.toString());
            setShowIncomeModal(true);
          }}
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg shadow-green-500/20"
        >
          <DollarSign className="w-5 h-5" />
          Adicionar Renda
        </button>
        <button
          onClick={() => setShowCategoryModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Categoria
        </button>
        {hasRulesForCurrentMonth && incomeRules.length > 0 && (
          <button
            onClick={() => setShowResetModal(true)}
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg shadow-orange-500/20"
          >
            <RotateCcw className="w-4 h-4" />
            Redefinir
          </button>
        )}
      </div>

      {/* Summary Table */}
      {(budgetsData && budgetsData.budgets.length > 0) || (hasRulesForCurrentMonth && incomeRules.length > 0) ? (
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
                  <th className="text-right py-3 px-4 text-white/60 font-medium">Destinado</th>
                  <th className="text-right py-3 px-4 text-white/60 font-medium">Valor Gasto</th>
                  <th className="text-right py-3 px-4 text-white/60 font-medium">Devo Gastar</th>
                  <th className="text-right py-3 px-4 text-white/60 font-medium">Utilizado</th>
                </tr>
              </thead>
              <tbody>
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
                          className={`border-b border-white/5 transition-colors ${hasSubitems ? 'cursor-pointer hover:bg-white/5' : ''}`}
                          onClick={() => hasSubitems && toggleCategory(item.categoryName)}
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              {hasSubitems ? (
                                isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-white/40" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-white/40" />
                                )
                              ) : (
                                <div className="w-4" /> 
                              )}
                              <span className="text-2xl">{item.categoryIcon}</span>
                              <span className="text-white font-medium">{item.categoryName}</span>
                              {hasSubitems && (
                                <span className="text-white/40 text-xs">
                                  ({matchingRule.items.length} itens)
                                </span>
                              )}
                              {matchingRule && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedRuleForSubcategory(matchingRule);
                                    setShowSubcategoryModal(true);
                                  }}
                                  className="text-primary-400 hover:text-primary-300 ml-2"
                                  title="Adicionar subcategoria"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (matchingRule) {
                                  setEditingPercentage(matchingRule);
                                  setTempPercentage(matchingRule.percentage.toString());
                                }
                              }}
                              className="inline-flex items-center gap-1 text-primary-400 hover:text-primary-300 transition-colors group"
                            >
                              <span className="font-medium">{destinedPercentage.toFixed(1)}%</span>
                              <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
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
                        </tr>
                        
                        {/* Subcategories dropdown */}
                        {isExpanded && hasSubitems && matchingRule.items.map((subitem) => {
                          const spending = subItemSpending.get(subitem.id);
                          const spent = spending?.totalSpent || 0;
                          const budgeted = Number(subitem.amount);
                          const isOver = spending?.isOverBudget || false;
                          const overAmount = spending?.overAmount || 0;
                          
                          return (
                            <tr key={`${item.id}-${subitem.id}`} className="bg-white/5">
                              <td className="py-3 px-4 pl-16" colSpan={3}>
                                <div className="flex items-center gap-2 text-white/70">
                                  <span className="text-white/40">└</span>
                                  <span>{subitem.name}</span>
                                  <button
                                    onClick={() => {
                                      setEditingSubitem({ ruleId: matchingRule.id, item: subitem });
                                      setNewSubcategory({ name: subitem.name, amount: String(subitem.amount) });
                                    }}
                                    className="p-1 rounded-lg bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 transition-colors ml-2"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSubcategory(matchingRule.id, subitem.id)}
                                    className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right" colSpan={2}>
                                <div className="flex flex-col items-end gap-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`font-medium ${isOver ? 'text-red-400' : 'text-white/70'}`}>
                                      {formatCurrency(spent)}
                                    </span>
                                    <span className="text-white/40">/</span>
                                    <span className="text-green-400 font-medium">
                                      {formatCurrency(budgeted)}
                                    </span>
                                  </div>
                                  {isOver && (
                                    <span className="text-red-400 text-xs">
                                      Ultrapassou {formatCurrency(overAmount)}
                                    </span>
                                  )}
                                </div>
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
                          className={`border-b border-white/5 transition-colors ${hasSubitems ? 'cursor-pointer hover:bg-white/5' : ''}`}
                          onClick={() => hasSubitems && toggleCategory(rule.name)}
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              {hasSubitems ? (
                                isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-white/40" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-white/40" />
                                )
                              ) : (
                                <div className="w-4" /> 
                              )}
                              <span className="text-2xl">{rule.icon}</span>
                              <span className="text-white font-medium">{rule.name}</span>
                              {hasSubitems && (
                                <span className="text-white/40 text-xs">
                                  ({rule.items.length} itens)
                                </span>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRuleForSubcategory(rule);
                                  setShowSubcategoryModal(true);
                                }}
                                className="text-primary-400 hover:text-primary-300 ml-2"
                                title="Adicionar subcategoria"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingPercentage(rule);
                                setTempPercentage(rule.percentage.toString());
                              }}
                              className="inline-flex items-center gap-1 text-primary-400 hover:text-primary-300 transition-colors group"
                            >
                              <span className="font-medium">{rule.percentage.toFixed(1)}%</span>
                              <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          </td>
                          <td className="py-4 px-4 text-right">
                            {(() => {
                              const spending = ruleSpending.get(rule.id);
                              const spent = spending?.totalSpent || 0;
                              const isOver = spending?.isOverBudget || false;
                              return (
                                <div className="flex flex-col items-end">
                                  <span className={`font-medium ${isOver ? 'text-red-500' : 'text-red-400'}`}>
                                    {formatCurrency(spent)}
                                  </span>
                                  {isOver && (
                                    <span className="text-xs text-red-500 font-bold">
                                      +{formatCurrency(spent - budgetAmount)}
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="text-green-400 font-medium">{formatCurrency(budgetAmount)}</span>
                          </td>
                          <td className="py-4 px-4 text-right">
                             {(() => {
                              const spending = ruleSpending.get(rule.id);
                              const percentage = spending ? (spending.totalSpent / budgetAmount) * 100 : 0;
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
                          const budgeted = Number(subitem.amount);
                          const isOver = spending?.isOverBudget || false;
                          const overAmount = spending?.overAmount || 0;
                          
                          return (
                            <tr key={`${rule.id}-${subitem.id}`} className="bg-white/5">
                              <td className="py-3 px-4 pl-16" colSpan={3}>
                                <div className="flex items-center gap-2 text-white/70">
                                  <span className="text-white/40">└</span>
                                  <span>{subitem.name}</span>
                                  <button
                                    onClick={() => {
                                      setEditingSubitem({ ruleId: rule.id, item: subitem });
                                      setNewSubcategory({ name: subitem.name, amount: String(subitem.amount) });
                                    }}
                                    className="p-1 rounded-lg bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 transition-colors ml-2"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSubcategory(rule.id, subitem.id)}
                                    className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right" colSpan={2}>
                                <div className="flex flex-col items-end gap-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`font-medium ${isOver ? 'text-red-400' : 'text-white/70'}`}>
                                      {formatCurrency(spent)}
                                    </span>
                                    <span className="text-white/40">/</span>
                                    <span className="text-green-400 font-medium">
                                      {formatCurrency(budgeted)}
                                    </span>
                                  </div>
                                  {isOver && (
                                    <span className="text-red-400 text-xs">
                                      Ultrapassou {formatCurrency(overAmount)}
                                    </span>
                                  )}
                                </div>
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
                <p className="text-red-400 text-3xl font-bold">{formatCurrency(budgetsData?.totals?.totalSpent || 0)}</p>
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
                <p className="text-green-400 text-3xl font-bold">{formatCurrency(budgetsData?.totals?.totalBudget || baseIncome)}</p>
                <p className="text-white/40 text-sm mt-2">Orçamento definido</p>
              </div>

              {/* Percentage Card with Circle */}
              <div className="bg-gradient-to-br from-primary-500/20 to-primary-600/10 rounded-2xl p-6 border border-primary-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-white/60 text-sm font-medium block mb-4">Utilizado</span>
                    <p className={`text-3xl font-bold ${
                      (budgetsData?.totals?.percentage || 0) >= 100 ? 'text-red-400' :
                      (budgetsData?.totals?.percentage || 0) >= 80 ? 'text-orange-400' :
                      (budgetsData?.totals?.percentage || 0) >= 50 ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>
                      {(budgetsData?.totals?.percentage || 0).toFixed(1)}%
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
                          (budgetsData?.totals?.percentage || 0) >= 100 ? '#ef4444' :
                          (budgetsData?.totals?.percentage || 0) >= 80 ? '#f97316' :
                          (budgetsData?.totals?.percentage || 0) >= 50 ? '#eab308' :
                          '#22c55e'
                        }
                        strokeWidth="12"
                        strokeDasharray={`${Math.min(budgetsData?.totals?.percentage || 0, 100) * 2.64} 264`}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {Math.round(budgetsData?.totals?.percentage || 0)}%
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
            Adicione sua renda para criar os orçamentos.
          </p>
          <button
            onClick={() => setShowIncomeModal(true)}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 mx-auto"
          >
            <DollarSign className="w-5 h-5" />
            Adicionar Renda
          </button>
        </div>
      )}

      {/* Donut Chart and Distribution */}
      {incomeRules.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="w-full lg:w-1/3 flex flex-col items-center">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2 self-start">
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
                      const budget = (baseIncome * rule.percentage) / 100;
                      
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
                          style={{ filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.2))' }}
                        />
                      );
                    });
                  })()}
                  <circle cx="110" cy="110" r="48" fill="#0f0f1a" className="filter drop-shadow-lg" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-white">
                    {(() => {
                      const totalSpent = Array.from(ruleSpending.values()).reduce((acc, curr) => acc + curr.totalSpent, 0);
                      return totalSpent > 0 ? formatCurrency(totalSpent) : "100%";
                    })()}
                  </span>
                  <span className="text-white/60 text-[10px] uppercase tracking-wider">
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
                      className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4 hover:bg-white/10 transition-all group"
                    >
                      <div className="text-2xl">{item.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-white font-semibold truncate">{item.name}</p>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                            {item.percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                             <span className="text-white/40">Gasto:</span>
                             <span className={item.spent > 0 ? 'text-red-400 font-medium' : 'text-white/20'}>
                               {formatCurrency(item.spent)}
                             </span>
                          </div>
                          {item.spent > 0 && (
                             <span className="text-[10px] text-white/30 italic">
                               v. planejado {(item.percentage).toFixed(0)}%
                             </span>
                          )}
                        </div>
                        {/* Progress Bar Mini */}
                        <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
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
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowIncomeModal(false)} />
          <div className="glass-card p-6 w-full max-w-md relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Renda Base Mensal</h2>
              <button onClick={() => setShowIncomeModal(false)} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-white/60 text-sm mb-2 block">Valor da Renda</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={tempIncome}
                    onChange={(e) => setTempIncome(e.target.value)}
                    className="input-field w-full pl-12"
                    placeholder="5000"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveIncome}
                  disabled={isSaving}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {isSaving && <Loader2 className="w-5 h-5 animate-spin" />}
                  Salvar
                </button>
                <button onClick={() => setShowIncomeModal(false)} className="btn-secondary flex-1">
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
          <div className="absolute inset-0 bg-black/50" onClick={() => { setEditingPercentage(null); setErrorMessage(''); }} />
          <div className="glass-card p-6 w-full max-w-md relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Editar Porcentagem</h2>
              <button onClick={() => { setEditingPercentage(null); setErrorMessage(''); }} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                <span className="text-2xl">{editingPercentage.icon}</span>
                <span className="text-white font-medium">{editingPercentage.name}</span>
              </div>
              <div>
                <label className="text-white/60 text-sm mb-2 block">Porcentagem (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={tempPercentage}
                  onChange={(e) => { setTempPercentage(e.target.value); setErrorMessage(''); }}
                  className="input-field w-full"
                  autoFocus
                />
                {tempPercentage && parseFloat(tempPercentage) > 0 && (
                  <p className="text-green-400 text-sm mt-2">
                    = {formatCurrency(getAmountFromPercentage(parseFloat(tempPercentage)))}
                  </p>
                )}
              </div>
              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <p className="text-red-400 text-sm">{errorMessage}</p>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleSavePercentage}
                  disabled={isSaving}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {isSaving && <Loader2 className="w-5 h-5 animate-spin" />}
                  Salvar
                </button>
                <button onClick={() => { setEditingPercentage(null); setErrorMessage(''); }} className="btn-secondary flex-1">
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
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowCategoryModal(false); setErrorMessage(''); }} />
          <div className="glass-card p-6 w-full max-w-md relative z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Nova Categoria</h2>
              <button onClick={() => { setShowCategoryModal(false); setErrorMessage(''); }} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-white/60 text-sm mb-2 block">Ícone</label>
                <div className="grid grid-cols-5 gap-2 p-3 bg-white/5 rounded-xl">
                  {AVAILABLE_ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setNewCategory({ ...newCategory, icon })}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
                        newCategory.icon === icon ? 'bg-primary-500/30 ring-2 ring-primary-400' : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-white/60 text-sm mb-2 block">Nome</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => { setNewCategory({ ...newCategory, name: e.target.value }); setErrorMessage(''); }}
                  className="input-field w-full"
                  placeholder="Ex: Investimentos"
                />
              </div>
              <div>
                <label className="text-white/60 text-sm mb-2 block">Porcentagem (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={newCategory.percentage || ''}
                  onChange={(e) => { setNewCategory({ ...newCategory, percentage: parseFloat(e.target.value) || 0 }); setErrorMessage(''); }}
                  className="input-field w-full"
                  placeholder="10"
                />
                {newCategory.percentage > 0 && (
                  <p className="text-green-400 text-sm mt-2">
                    = {formatCurrency(getAmountFromPercentage(newCategory.percentage))}
                  </p>
                )}
              </div>
              <div>
                <label className="text-white/60 text-sm mb-2 block">Cor</label>
                <div className="flex gap-2">
                  {['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6366f1'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewCategory({ ...newCategory, color })}
                      className={`w-8 h-8 rounded-lg ${newCategory.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0f0f1a]' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <p className="text-red-400 text-sm">{errorMessage}</p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleAddCategory}
                  disabled={isSaving || !newCategory.name}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {isSaving && <Loader2 className="w-5 h-5 animate-spin" />}
                  Criar
                </button>
                <button onClick={() => { setShowCategoryModal(false); setErrorMessage(''); }} className="btn-secondary flex-1">
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
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSubcategoryModal(false)} />
          <div className="glass-card p-6 w-full max-w-md relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Nova Subcategoria</h2>
              <button onClick={() => setShowSubcategoryModal(false)} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                <span className="text-2xl">{selectedRuleForSubcategory.icon}</span>
                <span className="text-white font-medium">{selectedRuleForSubcategory.name}</span>
              </div>
              <div>
                <label className="text-white/60 text-sm mb-2 block">Nome do Item</label>
                <input
                  type="text"
                  value={newSubcategory.name}
                  onChange={(e) => setNewSubcategory({ ...newSubcategory, name: e.target.value })}
                  className="input-field w-full"
                  placeholder="Ex: Água"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-white/60 text-sm mb-2 block">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newSubcategory.amount}
                  onChange={(e) => setNewSubcategory({ ...newSubcategory, amount: e.target.value })}
                  className="input-field w-full"
                  placeholder="100"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddSubcategory}
                  disabled={isSaving || !newSubcategory.name || !newSubcategory.amount}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {isSaving && <Loader2 className="w-5 h-5 animate-spin" />}
                  Adicionar
                </button>
                <button onClick={() => setShowSubcategoryModal(false)} className="btn-secondary flex-1">
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
          <div className="absolute inset-0 bg-black/50" onClick={() => { setEditingSubitem(null); setNewSubcategory({ name: '', amount: '' }); }} />
          <div className="glass-card p-6 w-full max-w-md relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Editar Subitem</h2>
              <button onClick={() => { setEditingSubitem(null); setNewSubcategory({ name: '', amount: '' }); }} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-white/60 text-sm mb-2 block">Nome do Item</label>
                <input
                  type="text"
                  value={newSubcategory.name}
                  onChange={(e) => setNewSubcategory({ ...newSubcategory, name: e.target.value })}
                  className="input-field w-full"
                  placeholder="Ex: Água"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-white/60 text-sm mb-2 block">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newSubcategory.amount}
                  onChange={(e) => setNewSubcategory({ ...newSubcategory, amount: e.target.value })}
                  className="input-field w-full"
                  placeholder="100"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleEditSubitem}
                  disabled={isSaving || !newSubcategory.name || !newSubcategory.amount}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {isSaving && <Loader2 className="w-5 h-5 animate-spin" />}
                  Salvar
                </button>
                <button onClick={() => { setEditingSubitem(null); setNewSubcategory({ name: '', amount: '' }); }} className="btn-secondary flex-1">
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
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowResetModal(false)} />
          <div className="glass-card p-6 w-full max-w-md relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Redefinir Categorias</h2>
              <button onClick={() => setShowResetModal(false)} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <RotateCcw className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-orange-400 font-medium mb-2">Atenção!</p>
                    <p className="text-white/70 text-sm">
                      Esta ação irá resetar todas as categorias e porcentagens criadas para o mês atual ({monthLabel}).
                    </p>
                    <p className="text-white/70 text-sm mt-2">
                      As categorias serão redefinidas para os valores padrão:
                    </p>
                    <ul className="text-white/60 text-sm mt-2 space-y-1 ml-4 list-disc">
                      <li>Metas: 10%</li>
                      <li>Conforto: 15%</li>
                      <li>Prazeres: 10%</li>
                      <li>Custo Fixo: 35%</li>
                      <li>Liberdade Financeira: 25%</li>
                      <li>Conhecimento: 5%</li>
                    </ul>
                    <p className="text-white/50 text-xs mt-3">
                      ⚠️ Esta ação afetará <strong>somente</strong> o mês atual. Outros meses não serão alterados.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleResetToDefaults}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all flex-1 flex items-center justify-center gap-2"
                >
                  {isSaving && <Loader2 className="w-5 h-5 animate-spin" />}
                  Confirmar Reset
                </button>
                <button onClick={() => setShowResetModal(false)} className="btn-secondary flex-1">
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
