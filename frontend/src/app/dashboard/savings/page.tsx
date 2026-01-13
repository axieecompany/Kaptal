"use client";

import {
    savingsGoalsApi,
    type CreateSavingsGoalData,
    type SavingsGoal
} from '@/lib/api';
import {
    Calendar,
    Check,
    ChevronDown,
    ChevronUp,
    Clock,
    DollarSign,
    Loader2,
    Plus,
    Target,
    Trash2,
    TrendingUp,
    X
} from 'lucide-react';
import { useEffect, useState } from 'react';

// Available icons for goals
const AVAILABLE_ICONS = [
  '🎯', '📱', '✈️', '🏠', '🚗', '💻', '📚', '💍', '🎓', '🏖️',
  '🎮', '👕', '🎸', '📷', '⌚', '💎', '🏋️', '🎁', '🛋️', '🔧',
];

// Available colors
const AVAILABLE_COLORS = [
  '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#6366f1', '#14b8a6', '#f97316',
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR');
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'completed': return 'text-green-400';
    case 'on_track': return 'text-blue-400';
    case 'behind': return 'text-orange-400';
    case 'overdue': return 'text-red-400';
    default: return 'text-white/60';
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'completed': return '✅ Concluída!';
    case 'on_track': return '📈 No caminho certo';
    case 'behind': return '⚠️ Atrasado';
    case 'overdue': return '❌ Prazo vencido';
    default: return '';
  }
}

export default function SavingsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  
  // Form states
  const [formData, setFormData] = useState<CreateSavingsGoalData>({
    name: '',
    targetAmount: 0,
    deadline: '',
    icon: '🎯',
    color: '#6366f1',
  });
  const [depositAmount, setDepositAmount] = useState('');
  const [depositNote, setDepositNote] = useState('');

  const loadGoals = async () => {
    try {
      setError(null);
      const res = await savingsGoalsApi.getAll();
      if (res.success) {
        setGoals(res.data);
      }
    } catch (err) {
      console.error('Error loading goals:', err);
      setError('Erro ao carregar metas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const handleCreateGoal = async () => {
    if (!formData.name || !formData.targetAmount || !formData.deadline) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    setIsSaving(true);
    try {
      await savingsGoalsApi.create(formData);
      await loadGoals();
      setShowNewGoalModal(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar meta');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeposit = async () => {
    if (!selectedGoal || !depositAmount) return;

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Valor inválido');
      return;
    }

    setIsSaving(true);
    try {
      await savingsGoalsApi.deposit(selectedGoal.id, {
        amount,
        note: depositNote || undefined,
      });
      await loadGoals();
      setShowDepositModal(false);
      setDepositAmount('');
      setDepositNote('');
      setSelectedGoal(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer depósito');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) return;

    try {
      await savingsGoalsApi.delete(goalId);
      await loadGoals();
    } catch (err) {
      console.error('Error deleting goal:', err);
      setError('Erro ao excluir meta');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      targetAmount: 0,
      deadline: '',
      icon: '🎯',
      color: '#6366f1',
    });
    setError(null);
  };

  const openDepositModal = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setShowDepositModal(true);
  };

  // Statistics
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const completedGoals = goals.filter(g => g.isCompleted).length;
  const activeGoals = goals.filter(g => !g.isCompleted).length;

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Metas de Economia</h1>
          <p className="text-white/60 text-sm sm:text-base">Defina objetivos e acompanhe seu progresso</p>
        </div>
        <button
          onClick={() => setShowNewGoalModal(true)}
          className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          Nova Meta
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 flex items-center justify-between">
          <span className="text-sm sm:text-base">{error}</span>
          <button onClick={() => setError(null)} className="p-1 hover:bg-white/10 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-card p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
            </div>
          </div>
          <p className="text-white/60 text-xs sm:text-sm">Metas Ativas</p>
          <p className="text-xl sm:text-2xl font-bold text-white">{activeGoals}</p>
        </div>
        
        <div className="glass-card p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Check className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
            </div>
          </div>
          <p className="text-white/60 text-xs sm:text-sm">Concluídas</p>
          <p className="text-xl sm:text-2xl font-bold text-white">{completedGoals}</p>
        </div>
        
        <div className="glass-card p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
            </div>
          </div>
          <p className="text-white/60 text-xs sm:text-sm">Total Guardado</p>
          <p className="text-lg sm:text-2xl font-bold text-green-400 truncate">{formatCurrency(totalSaved)}</p>
        </div>
        
        <div className="glass-card p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
            </div>
          </div>
          <p className="text-white/60 text-xs sm:text-sm">Meta Total</p>
          <p className="text-lg sm:text-2xl font-bold text-white truncate">{formatCurrency(totalTarget)}</p>
        </div>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {goals.length === 0 ? (
          <div className="glass-card p-8 sm:p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-500/20 flex items-center justify-center">
              <Target className="w-8 h-8 text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Nenhuma meta ainda</h3>
            <p className="text-white/60 mb-6 text-sm sm:text-base">Crie sua primeira meta de economia e comece a guardar dinheiro!</p>
            <button
              onClick={() => setShowNewGoalModal(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Criar Meta
            </button>
          </div>
        ) : (
          goals.map((goal) => (
            <div key={goal.id} className="glass-card overflow-hidden">
              {/* Goal Header */}
              <div 
                className="p-4 sm:p-6 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setExpandedGoal(expandedGoal === goal.id ? null : goal.id)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div 
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0"
                      style={{ backgroundColor: `${goal.color}20` }}
                    >
                      {goal.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-white text-base sm:text-lg">{goal.name}</h3>
                        <span className={`text-xs sm:text-sm ${getStatusColor(goal.status)}`}>
                          {getStatusText(goal.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 text-white/60 text-xs sm:text-sm mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                          {formatDate(goal.deadline)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                          {goal.monthsRemaining} {goal.monthsRemaining === 1 ? 'mês' : 'meses'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="text-right">
                      <p className="text-green-400 font-bold text-base sm:text-lg">
                        {formatCurrency(goal.currentAmount)}
                      </p>
                      <p className="text-white/40 text-xs sm:text-sm">
                        de {formatCurrency(goal.targetAmount)}
                      </p>
                    </div>
                    {expandedGoal === goal.id ? (
                      <ChevronUp className="w-5 h-5 text-white/60" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-white/60" />
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="h-2 sm:h-3 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${goal.progress}%`, 
                        backgroundColor: goal.color 
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs sm:text-sm">
                    <span className="text-white/60">{goal.progress.toFixed(1)}%</span>
                    <span className="text-white/60">
                      Faltam: {formatCurrency(goal.remaining)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedGoal === goal.id && (
                <div className="border-t border-white/10 p-4 sm:p-6 bg-white/5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="p-3 sm:p-4 bg-white/5 rounded-xl">
                      <p className="text-white/60 text-xs sm:text-sm">Você precisa guardar</p>
                      <p className="text-white font-bold text-lg sm:text-xl">
                        {formatCurrency(goal.monthlyRequired)}<span className="text-sm font-normal text-white/60">/mês</span>
                      </p>
                    </div>
                    <div className="p-3 sm:p-4 bg-white/5 rounded-xl">
                      <p className="text-white/60 text-xs sm:text-sm">Prazo</p>
                      <p className="text-white font-bold text-lg sm:text-xl">
                        {goal.monthsRemaining} {goal.monthsRemaining === 1 ? 'mês' : 'meses'}
                      </p>
                    </div>
                  </div>

                  {/* Recent Deposits */}
                  {goal.deposits.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-white/80 font-medium mb-2 text-sm sm:text-base">Últimos Depósitos</h4>
                      <div className="space-y-2">
                        {goal.deposits.slice(0, 3).map((deposit) => (
                          <div key={deposit.id} className="flex justify-between items-center p-2 sm:p-3 bg-white/5 rounded-lg">
                            <div className="min-w-0 flex-1">
                              <p className="text-white text-sm sm:text-base truncate">{deposit.note || 'Depósito'}</p>
                              <p className="text-white/40 text-xs">{formatDate(deposit.date)}</p>
                            </div>
                            <span className="text-green-400 font-medium text-sm sm:text-base flex-shrink-0 ml-2">
                              +{formatCurrency(deposit.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    {!goal.isCompleted && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDepositModal(goal);
                        }}
                        className="btn-primary flex items-center justify-center gap-2 flex-1"
                      >
                        <DollarSign className="w-5 h-5" />
                        Depositar
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGoal(goal.id);
                      }}
                      className="btn-secondary flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/20"
                    >
                      <Trash2 className="w-5 h-5" />
                      <span className="sm:hidden">Excluir</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* New Goal Modal */}
      {showNewGoalModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white">Nova Meta</h3>
              <button 
                onClick={() => { setShowNewGoalModal(false); resetForm(); }}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Icon Selection */}
              <div>
                <label className="text-white/60 text-sm mb-2 block">Ícone</label>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
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

              {/* Name */}
              <div>
                <label className="text-white/60 text-sm mb-2 block">Nome da Meta</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field w-full"
                  placeholder="Ex: iPhone 15, Viagem para Europa"
                />
              </div>

              {/* Target Amount */}
              <div>
                <label className="text-white/60 text-sm mb-2 block">Valor Alvo</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.targetAmount || ''}
                    onChange={(e) => setFormData({ ...formData, targetAmount: parseFloat(e.target.value) || 0 })}
                    className="input-field w-full pl-12"
                    placeholder="6.000,00"
                  />
                </div>
              </div>

              {/* Deadline */}
              <div>
                <label className="text-white/60 text-sm mb-2 block">Prazo</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="input-field w-full"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Color */}
              <div>
                <label className="text-white/60 text-sm mb-2 block">Cor</label>
                <div className="flex gap-2 flex-wrap">
                  {AVAILABLE_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-lg transition-all ${
                        formData.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0f0f1a]' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Monthly Estimate */}
              {formData.targetAmount > 0 && formData.deadline && (
                <div className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-xl">
                  <p className="text-primary-400 text-sm">
                    {(() => {
                      const deadline = new Date(formData.deadline);
                      const now = new Date();
                      const months = Math.max(1, 
                        (deadline.getFullYear() - now.getFullYear()) * 12 + 
                        (deadline.getMonth() - now.getMonth())
                      );
                      const monthly = formData.targetAmount / months;
                      return `Você precisará guardar ${formatCurrency(monthly)} por mês`;
                    })()}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowNewGoalModal(false); resetForm(); }}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateGoal}
                  disabled={isSaving || !formData.name || !formData.targetAmount || !formData.deadline}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {isSaving && <Loader2 className="w-5 h-5 animate-spin" />}
                  Criar Meta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && selectedGoal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-4 sm:p-6 w-full max-w-md animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ backgroundColor: `${selectedGoal.color}20` }}
                >
                  {selectedGoal.icon}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white">Depositar</h3>
                  <p className="text-white/60 text-sm">{selectedGoal.name}</p>
                </div>
              </div>
              <button 
                onClick={() => { setShowDepositModal(false); setSelectedGoal(null); }}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Current Progress */}
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/60">Progresso atual</span>
                  <span className="text-white">{selectedGoal.progress.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full"
                    style={{ width: `${selectedGoal.progress}%`, backgroundColor: selectedGoal.color }}
                  />
                </div>
                <p className="text-white/40 text-xs mt-2">
                  Faltam {formatCurrency(selectedGoal.remaining)}
                </p>
              </div>

              {/* Amount */}
              <div>
                <label className="text-white/60 text-sm mb-2 block">Valor do Depósito</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="input-field w-full pl-12 text-xl"
                    placeholder="500,00"
                    autoFocus
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="text-white/60 text-sm mb-2 block">Observação (opcional)</label>
                <input
                  type="text"
                  value={depositNote}
                  onChange={(e) => setDepositNote(e.target.value)}
                  className="input-field w-full"
                  placeholder="Ex: Bônus do trabalho"
                />
              </div>

              {/* Quick amounts */}
              <div>
                <label className="text-white/60 text-sm mb-2 block">Valores rápidos</label>
                <div className="grid grid-cols-3 gap-2">
                  {[100, 200, 500].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setDepositAmount(amount.toString())}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white text-sm transition-colors"
                    >
                      {formatCurrency(amount)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowDepositModal(false); setSelectedGoal(null); }}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeposit}
                  disabled={isSaving || !depositAmount}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {isSaving && <Loader2 className="w-5 h-5 animate-spin" />}
                  Depositar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
