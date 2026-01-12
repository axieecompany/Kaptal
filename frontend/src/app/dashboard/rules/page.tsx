"use client";

import {
  incomeRulesApi,
  type CreateIncomeRuleData,
  type IncomeRule,
  type RuleItem
} from '@/lib/api';
import {
  ChevronDown,
  ChevronRight,
  DollarSign,
  Edit2,
  Loader2,
  Plus,
  RefreshCw,
  Sliders,
  Trash2,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';

// Available icons for selection
const AVAILABLE_ICONS = [
  '🏠', '💰', '✨', '🎯', '🎉', '📚', '🚗', '💳', '🛒', '🍔',
  '🏥', '📱', '🎬', '✈️', '👕', '💡', '🎮', '🏋️', '💅', '🐕',
  '👶', '🎁', '💊', '📖', '🔧', '🌐', '☕', '🍕', '🎵', '💻',
];

// Default rules to pre-populate
const DEFAULT_RULES: CreateIncomeRuleData[] = [
  { name: 'Custo Fixo', percentage: 35, color: '#ef4444', icon: '🏠' },
  { name: 'Liberdade Financeira', percentage: 25, color: '#22c55e', icon: '💰' },
  { name: 'Conforto', percentage: 15, color: '#3b82f6', icon: '✨' },
  { name: 'Metas', percentage: 10, color: '#f59e0b', icon: '🎯' },
  { name: 'Prazeres', percentage: 10, color: '#ec4899', icon: '🎉' },
  { name: 'Conhecimento', percentage: 5, color: '#8b5cf6', icon: '📚' },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function RulesPage() {
  const [rules, setRules] = useState<IncomeRule[]>([]);
  const [totalPercentage, setTotalPercentage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Base income state - persisted in localStorage
  const [baseIncome, setBaseIncome] = useState<number>(5000);
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  const [tempIncome, setTempIncome] = useState('');
  
  // Expanded rules state
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());
  
  // Edit form state
  const [editingRule, setEditingRule] = useState<IncomeRule | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [formData, setFormData] = useState<CreateIncomeRuleData>({
    name: '',
    percentage: 0,
    color: '#6366f1',
    icon: '💰',
  });

  // New item form state
  const [addingItemToRule, setAddingItemToRule] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');

  // Edit item state
  const [editingItem, setEditingItem] = useState<{ ruleId: string; item: RuleItem } | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemAmount, setEditItemAmount] = useState('');

  // Reset modal state
  const [showResetModal, setShowResetModal] = useState(false);

  // Load base income from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('kaptal_base_income');
    if (saved) {
      setBaseIncome(parseFloat(saved));
    }
  }, []);

  // Save base income to localStorage
  const saveBaseIncome = () => {
    const value = parseFloat(tempIncome);
    if (!isNaN(value) && value > 0) {
      setBaseIncome(value);
      localStorage.setItem('kaptal_base_income', value.toString());
    }
    setIsEditingIncome(false);
  };

  const loadRules = async () => {
    try {
      setError(null);
      const res = await incomeRulesApi.getAll();
      if (res.success) {
        setRules(res.data);
        setTotalPercentage(res.totalPercentage);
        return res.data;
      }
      return [];
    } catch (err) {
      console.error('Error loading rules:', err);
      setError('Erro ao carregar regras');
      return [];
    }
  };

  const createDefaultRules = async () => {
    try {
      for (const rule of DEFAULT_RULES) {
        await incomeRulesApi.create(rule);
      }
      await loadRules();
    } catch (err) {
      console.error('Error creating default rules:', err);
    }
  };

  const handleReset = async () => {
    setIsSaving(true);
    try {
      // Delete all existing rules
      for (const rule of rules) {
        await incomeRulesApi.delete(rule.id);
      }
      
      // Create default rules
      await createDefaultRules();
      
      setShowResetModal(false);
      setExpandedRules(new Set());
    } catch (err) {
      console.error('Error resetting rules:', err);
      setError('Erro ao redefinir regras');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const initRules = async () => {
      setIsLoading(true);
      const loadedRules = await loadRules();
      
      // If no rules exist, create default ones automatically
      if (loadedRules.length === 0) {
        await createDefaultRules();
      }
      
      setIsLoading(false);
    };
    
    initRules();
  }, []);

  const handleUpdate = async () => {
    if (!editingRule || !formData.name) {
      setError('Nome é obrigatório');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await incomeRulesApi.update(editingRule.id, {
        name: formData.name,
        percentage: formData.percentage,
      });
      await loadRules();
      setEditingRule(null);
      resetForm();
    } catch (err: any) {
      console.error('Error saving rule:', err);
      setError(err.message || 'Erro ao salvar regra');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name) {
      setError('Nome é obrigatório');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await incomeRulesApi.create(formData);
      await loadRules();
      setShowNewForm(false);
      resetForm();
    } catch (err: any) {
      console.error('Error creating rule:', err);
      setError(err.message || 'Erro ao criar regra');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (rule: IncomeRule) => {
    setEditingRule(rule);
    setShowNewForm(false);
    setFormData({
      name: rule.name,
      percentage: rule.percentage,
      color: rule.color,
      icon: rule.icon,
    });
    setError(null);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      percentage: 0,
      color: '#6366f1',
      icon: '💰',
    });
    setError(null);
  };

  const cancelEdit = () => {
    setEditingRule(null);
    setShowNewForm(false);
    resetForm();
  };

  const startNewRule = () => {
    setShowNewForm(true);
    setEditingRule(null);
    resetForm();
  };

  const toggleRuleExpanded = (ruleId: string) => {
    setExpandedRules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ruleId)) {
        newSet.delete(ruleId);
      } else {
        newSet.add(ruleId);
      }
      return newSet;
    });
  };

  // Item handlers
  const handleAddItem = async (ruleId: string) => {
    if (!newItemName || !newItemAmount) {
      setError('Nome e valor são obrigatórios');
      return;
    }

    setIsSaving(true);
    try {
      await incomeRulesApi.addItem(ruleId, {
        name: newItemName,
        amount: parseFloat(newItemAmount),
      });
      await loadRules();
      setAddingItemToRule(null);
      setNewItemName('');
      setNewItemAmount('');
    } catch (err: any) {
      console.error('Error adding item:', err);
      setError(err.message || 'Erro ao adicionar item');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem || !editItemName || !editItemAmount) {
      setError('Nome e valor são obrigatórios');
      return;
    }

    setIsSaving(true);
    try {
      await incomeRulesApi.updateItem(editingItem.ruleId, editingItem.item.id, {
        name: editItemName,
        amount: parseFloat(editItemAmount),
      });
      await loadRules();
      setEditingItem(null);
      setEditItemName('');
      setEditItemAmount('');
    } catch (err: any) {
      console.error('Error updating item:', err);
      setError(err.message || 'Erro ao atualizar item');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (ruleId: string, itemId: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;

    try {
      await incomeRulesApi.deleteItem(ruleId, itemId);
      await loadRules();
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('Erro ao excluir item');
    }
  };

  const startEditItem = (ruleId: string, item: RuleItem) => {
    setEditingItem({ ruleId, item });
    setEditItemName(item.name);
    setEditItemAmount(item.amount.toString());
  };

  // Calculate value in BRL from percentage
  const getAmountFromPercentage = (percentage: number) => {
    return (baseIncome * percentage) / 100;
  };

  const availablePercentage = editingRule 
    ? 100 - (totalPercentage - editingRule.percentage)
    : 100 - totalPercentage;

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
        <h1 className="text-2xl font-bold text-white">Regras de Distribuição</h1>
        <p className="text-white/60">Defina como sua renda será distribuída entre categorias</p>
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

      {/* Base Income Card */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Renda Base Mensal</h3>
              <p className="text-white/40 text-sm">Usado para calcular os valores em reais</p>
            </div>
          </div>
          {isEditingIncome ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={tempIncome}
                onChange={(e) => setTempIncome(e.target.value)}
                className="input-field w-40"
                placeholder="5000"
                autoFocus
              />
              <button onClick={saveBaseIncome} className="btn-primary px-4 py-2">
                Salvar
              </button>
              <button 
                onClick={() => setIsEditingIncome(false)} 
                className="btn-secondary px-4 py-2"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button 
              onClick={() => {
                setTempIncome(baseIncome.toString());
                setIsEditingIncome(true);
              }}
              className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors"
            >
              <span className="text-2xl font-bold">{formatCurrency(baseIncome)}</span>
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-white/60">Porcentagem Utilizada</span>
          <div className="text-right">
            <span className={`font-bold ${totalPercentage > 100 ? 'text-red-400' : totalPercentage === 100 ? 'text-green-400' : 'text-yellow-400'}`}>
              {totalPercentage.toFixed(1)}%
            </span>
            <span className="text-white/40 text-sm ml-2">
              ({formatCurrency(getAmountFromPercentage(totalPercentage))})
            </span>
          </div>
        </div>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${
              totalPercentage > 100 ? 'bg-red-500' : 
              totalPercentage === 100 ? 'bg-green-500' : 
              'bg-primary-500'
            }`}
            style={{ width: `${Math.min(totalPercentage, 100)}%` }}
          />
        </div>
        <p className="text-white/40 text-sm mt-2">
          {totalPercentage === 100 
            ? '✓ Distribuição completa!' 
            : totalPercentage > 100
            ? `⚠️ Excedido em ${(totalPercentage - 100).toFixed(1)}%`
            : `Disponível: ${(100 - totalPercentage).toFixed(1)}% (${formatCurrency(getAmountFromPercentage(100 - totalPercentage))})`}
        </p>
      </div>

      {/* Action Buttons */}
      {!editingRule && !showNewForm && (
        <div className="flex gap-3">
          <button
            onClick={startNewRule}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nova Regra
          </button>
          <button
            onClick={() => setShowResetModal(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Redefinir
          </button>
        </div>
      )}

      {/* New Rule Form */}
      {showNewForm && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Nova Regra</h3>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-white/60 text-sm mb-2 block">Ícone</label>
              <div className="grid grid-cols-6 gap-2 p-3 bg-white/5 rounded-xl max-h-32 overflow-y-auto">
                {AVAILABLE_ICONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setFormData({ ...formData, icon })}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                      formData.icon === icon 
                        ? 'bg-primary-500/30 ring-2 ring-primary-400' 
                        : 'bg-white/5 hover:bg-white/10'
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
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field w-full"
                placeholder="Ex: Investimentos"
              />
            </div>
            <div>
              <label className="text-white/60 text-sm mb-2 block">
                % (máx: {availablePercentage.toFixed(1)}% = {formatCurrency(getAmountFromPercentage(availablePercentage))})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={availablePercentage}
                value={formData.percentage || ''}
                onChange={(e) => setFormData({ ...formData, percentage: parseFloat(e.target.value) || 0 })}
                className="input-field w-full"
                placeholder="Ex: 10"
              />
              {formData.percentage > 0 && (
                <p className="text-green-400 text-sm mt-1">
                  = {formatCurrency(getAmountFromPercentage(formData.percentage))}
                </p>
              )}
            </div>
          </div>
          <div className="mb-4">
            <label className="text-white/60 text-sm mb-2 block">Cor</label>
            <div className="flex gap-2">
              {['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6366f1'].map((color) => (
                <button
                  key={color}
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-lg transition-all ${
                    formData.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0f0f1a]' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-8 h-8 rounded-lg cursor-pointer"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={isSaving || !formData.name || formData.percentage > availablePercentage}
              className="btn-primary flex items-center gap-2"
            >
              {isSaving && <Loader2 className="w-5 h-5 animate-spin" />}
              Criar
            </button>
            <button onClick={cancelEdit} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Edit Rule Form */}
      {editingRule && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Editar: {editingRule.icon} {editingRule.name}
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-white/60 text-sm mb-2 block">Nome</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field w-full"
                placeholder="Ex: Custo Fixo"
              />
            </div>
            <div>
              <label className="text-white/60 text-sm mb-2 block">
                % (máx: {availablePercentage.toFixed(1)}% = {formatCurrency(getAmountFromPercentage(availablePercentage))})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={availablePercentage}
                value={formData.percentage || ''}
                onChange={(e) => setFormData({ ...formData, percentage: parseFloat(e.target.value) || 0 })}
                className="input-field w-full"
                placeholder="Ex: 35"
              />
              {formData.percentage > 0 && (
                <p className="text-green-400 text-sm mt-1">
                  = {formatCurrency(getAmountFromPercentage(formData.percentage))}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleUpdate}
              disabled={isSaving || !formData.name}
              className="btn-primary flex items-center gap-2"
            >
              {isSaving && <Loader2 className="w-5 h-5 animate-spin" />}
              Salvar
            </button>
            <button onClick={cancelEdit} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Rules List */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-primary-400" />
          Suas Regras
        </h3>
        
        <div className="space-y-3">
          {rules.map((rule) => {
            const isExpanded = expandedRules.has(rule.id);
            const totalItems = rule.items.reduce((sum, item) => sum + item.amount, 0);
            const ruleAmount = getAmountFromPercentage(rule.percentage);
            const remainingBudget = ruleAmount - totalItems;
            
            return (
              <div key={rule.id} className="border border-white/10 rounded-xl overflow-hidden">
                {/* Rule Header */}
                <div 
                  className={`flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors ${
                    editingRule?.id === rule.id ? 'bg-primary-500/10' : ''
                  }`}
                  onClick={() => toggleRuleExpanded(rule.id)}
                >
                  <div className="flex items-center gap-3">
                    <button className="p-1 hover:bg-white/10 rounded transition-colors">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-white/60" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-white/60" />
                      )}
                    </button>
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ backgroundColor: `${rule.color}20` }}
                    >
                      {rule.icon}
                    </div>
                    <div>
                      <span className="text-white font-medium">{rule.name}</span>
                      {rule.items.length > 0 && (
                        <span className="text-white/40 text-sm ml-2">
                          ({rule.items.length} {rule.items.length === 1 ? 'item' : 'itens'})
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full"
                          style={{ width: `${rule.percentage}%`, backgroundColor: rule.color }}
                        />
                      </div>
                      <div className="text-right min-w-[120px]">
                        <span className="text-white font-medium">
                          {rule.percentage.toFixed(1)}%
                        </span>
                        <span className="text-green-400 text-sm ml-2">
                          ({formatCurrency(ruleAmount)})
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(rule);
                      }}
                      disabled={editingRule !== null || showNewForm}
                      className="p-2 rounded-lg bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 transition-colors disabled:opacity-50"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Items */}
                {isExpanded && (
                  <div className="border-t border-white/10 bg-white/5 p-4">
                    {/* Budget Info */}
                    <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-white/5">
                      <span className="text-white/60 text-sm">Orçamento disponível:</span>
                      <span className={`font-bold ${remainingBudget < 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {formatCurrency(remainingBudget)}
                        {remainingBudget < 0 && ' (excedido)'}
                      </span>
                    </div>

                    {/* Items List */}
                    {rule.items.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {rule.items.map((item) => (
                          <div 
                            key={item.id} 
                            className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                          >
                            {editingItem?.item.id === item.id ? (
                              // Edit item inline
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  type="text"
                                  value={editItemName}
                                  onChange={(e) => setEditItemName(e.target.value)}
                                  className="input-field flex-1"
                                  placeholder="Nome"
                                />
                                <input
                                  type="number"
                                  value={editItemAmount}
                                  onChange={(e) => setEditItemAmount(e.target.value)}
                                  className="input-field w-32"
                                  placeholder="Valor"
                                />
                                <button
                                  onClick={handleUpdateItem}
                                  disabled={isSaving}
                                  className="btn-primary px-3 py-1.5 text-sm"
                                >
                                  Salvar
                                </button>
                                <button
                                  onClick={() => setEditingItem(null)}
                                  className="btn-secondary px-3 py-1.5 text-sm"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="text-white/80">{item.name}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-green-400 font-medium">
                                    {formatCurrency(item.amount)}
                                  </span>
                                  <button
                                    onClick={() => startEditItem(rule.id, item)}
                                    className="p-1.5 rounded-lg bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 transition-colors"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteItem(rule.id, item.id)}
                                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                        
                        {/* Total */}
                        <div className="flex items-center justify-between p-3 border-t border-white/10">
                          <span className="text-white/60 text-sm">Total alocado</span>
                          <span className="text-white font-bold">
                            {formatCurrency(totalItems)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Add Item Form */}
                    {addingItemToRule === rule.id ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            className="input-field flex-1"
                            placeholder="Nome (ex: Água)"
                          />
                          <input
                            type="number"
                            value={newItemAmount}
                            onChange={(e) => setNewItemAmount(e.target.value)}
                            className="input-field w-32"
                            placeholder="Valor"
                          />
                          <button
                            onClick={() => handleAddItem(rule.id)}
                            disabled={
                              isSaving || 
                              !newItemName || 
                              !newItemAmount || 
                              parseFloat(newItemAmount) > remainingBudget
                            }
                            className="btn-primary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Adicionar'}
                          </button>
                          <button
                            onClick={() => {
                              setAddingItemToRule(null);
                              setNewItemName('');
                              setNewItemAmount('');
                            }}
                            className="btn-secondary px-3 py-2"
                          >
                            Cancelar
                          </button>
                        </div>
                        {/* Warning when exceeds budget */}
                        {newItemAmount && parseFloat(newItemAmount) > remainingBudget && (
                          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                            ⚠️ Este valor excede o orçamento disponível em{' '}
                            <strong>{formatCurrency(parseFloat(newItemAmount) - remainingBudget)}</strong>
                          </div>
                        )}
                        {/* Show max available */}
                        {remainingBudget > 0 && (
                          <p className="text-white/40 text-xs">
                            Máximo disponível: {formatCurrency(remainingBudget)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingItemToRule(rule.id)}
                        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar item
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {rules.length === 0 && (
          <div className="text-center py-8 text-white/40">
            Carregando regras padrão...
          </div>
        )}
      </div>

      {/* Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card p-6 max-w-md mx-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Redefinir Regras</h3>
            </div>
            
            <p className="text-white/70 mb-6">
              Ao redefinir suas regras, todos os valores serão resetados para os padrões e as regras criadas manualmente serão excluídas.
            </p>
            
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mb-6">
              <p className="text-orange-400 text-sm">
                ⚠️ Esta ação não pode ser desfeita. Os orçamentos existentes não serão afetados.
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowResetModal(false)}
                className="btn-secondary"
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button
                onClick={handleReset}
                disabled={isSaving}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2"
              >
                {isSaving && <Loader2 className="w-5 h-5 animate-spin" />}
                Redefinir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
