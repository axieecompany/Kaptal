"use client";

import ReportButton from '@/components/reports/ReportButton';
import SavingsPDF from '@/components/reports/SavingsPDF';
import {
    savingsGoalsApi,
    type CreateSavingsGoalData,
    type SavingsGoal
} from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { generateSavingsExcel } from '@/lib/excelGenerators';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
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
    case 'completed': return 'text-emerald-500';
    case 'on_track': return 'text-primary-500';
    case 'behind': return 'text-orange-500';
    case 'overdue': return 'text-red-500';
    default: return 'opacity-60';
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
  const { user } = useAuth();
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
    color: '#10b981',
  });
  const [depositAmount, setDepositAmount] = useState('');
  const [depositNote, setDepositNote] = useState('');

  // Report generation handlers
  const handleGeneratePDF = async () => {
    const totals = {
      totalTarget: goals.reduce((acc, g) => acc + g.targetAmount, 0),
      totalSaved: goals.reduce((acc, g) => acc + g.currentAmount, 0),
      activeGoals: goals.filter(g => !g.isCompleted).length,
      completedGoals: goals.filter(g => g.isCompleted).length,
    };

    const doc = (
      <SavingsPDF
        userName={user?.name || 'Usuário'}
        generatedAt={new Date()}
        goals={goals.map(g => ({
          ...g,
          targetAmount: Number(g.targetAmount),
          currentAmount: Number(g.currentAmount),
          remaining: Number(g.targetAmount) - Number(g.currentAmount),
          deposits: (g as any).deposits?.map((d: any) => ({
            ...d,
            amount: Number(d.amount)
          })) || []
        }))}
        totals={totals}
      />
    );

    const blob = await pdf(doc).toBlob();
    saveAs(blob, `Kaptal_Metas_Economia.pdf`);
  };

  const handleGenerateExcel = async () => {
    generateSavingsExcel({
      userName: user?.name || 'Usuário',
      goals: goals.map(g => ({
        name: g.name,
        icon: g.icon,
        targetAmount: Number(g.targetAmount),
        currentAmount: Number(g.currentAmount),
        remaining: Number(g.targetAmount) - Number(g.currentAmount),
        progress: g.progress,
        deadline: g.deadline,
        monthlyRequired: g.monthlyRequired,
        deposits: (g as any).deposits?.map((d: any) => ({
          date: d.date,
          amount: Number(d.amount),
          note: d.note || ''
        })) || []
      })),
      totals: {
        totalTarget: goals.reduce((acc, g) => acc + g.targetAmount, 0),
        totalSaved: goals.reduce((acc, g) => acc + g.currentAmount, 0),
        activeGoals: goals.filter(g => !g.isCompleted).length,
        completedGoals: goals.filter(g => g.isCompleted).length,
      }
    });
  };

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
      color: '#10b981',
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
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Metas de Economia</h1>
          <p className="opacity-60 text-sm sm:text-base">Poupe dinheiro para seus objetivos</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <ReportButton
            onGeneratePDF={handleGeneratePDF}
            onGenerateExcel={handleGenerateExcel}
            label="Relatório"
          />
          <button
            onClick={() => setShowNewGoalModal(true)}
            className="btn-primary flex items-center justify-center gap-2 flex-1 sm:flex-initial shadow-emerald-500/10"
          >
            <Plus className="w-5 h-5" />
            Nova Meta
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-500 flex items-center justify-between animate-in slide-in-from-top-2">
          <span className="text-sm sm:text-base font-medium">{error}</span>
          <button onClick={() => setError(null)} className="p-1 hover:bg-current/10 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-card p-4 sm:p-6 group hover:bg-current/[0.02] transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary-500/10 flex items-center justify-center">
              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-primary-500" />
            </div>
          </div>
          <p className="opacity-60 text-xs sm:text-sm font-medium">Metas Ativas</p>
          <p className="text-xl sm:text-2xl font-black">{activeGoals}</p>
        </div>
        
        <div className="glass-card p-4 sm:p-6 group hover:bg-current/[0.02] transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Check className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
            </div>
          </div>
          <p className="opacity-60 text-xs sm:text-sm font-medium">Concluídas</p>
          <p className="text-xl sm:text-2xl font-black">{completedGoals}</p>
        </div>
        
        <div className="glass-card p-4 sm:p-6 group hover:bg-current/[0.02] transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
            </div>
          </div>
          <p className="opacity-60 text-xs sm:text-sm font-medium">Total Guardado</p>
          <p className="text-lg sm:text-2xl font-black text-emerald-500 truncate tabular-nums">{formatCurrency(totalSaved)}</p>
        </div>
        
        <div className="glass-card p-4 sm:p-6 group hover:bg-current/[0.02] transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
            </div>
          </div>
          <p className="opacity-60 text-xs sm:text-sm font-medium">Meta Total</p>
          <p className="text-lg sm:text-2xl font-black truncate tabular-nums">{formatCurrency(totalTarget)}</p>
        </div>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {goals.length === 0 ? (
          <div className="glass-card p-8 sm:p-16 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-current/5 flex items-center justify-center">
              <Target className="w-8 h-8 opacity-20" />
            </div>
            <h3 className="text-lg font-bold mb-2">Nenhuma meta ainda</h3>
            <p className="opacity-60 mb-8 text-sm sm:text-base max-w-sm mx-auto font-medium">Crie sua primeira meta de economia e comece a guardar dinheiro!</p>
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
            <div key={goal.id} className="glass-card overflow-hidden group">
              {/* Goal Header */}
              <div 
                className="p-4 sm:p-6 cursor-pointer hover:bg-current/[0.02] transition-colors"
                onClick={() => setExpandedGoal(expandedGoal === goal.id ? null : goal.id)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div 
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: `${goal.color}15`, color: goal.color }}
                    >
                      {goal.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base sm:text-lg">{goal.name}</h3>
                        <span className={`text-xs sm:text-sm font-bold ${getStatusColor(goal.status)}`}>
                          {getStatusText(goal.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 opacity-60 text-xs sm:text-sm mt-1 flex-wrap font-medium">
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
                      <p className="text-emerald-500 font-black text-base sm:text-lg tabular-nums">
                        {formatCurrency(goal.currentAmount)}
                      </p>
                      <p className="opacity-40 text-xs sm:text-sm font-bold tabular-nums">
                        de {formatCurrency(goal.targetAmount)}
                      </p>
                    </div>
                    {expandedGoal === goal.id ? (
                      <ChevronUp className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <ChevronDown className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6">
                  <div className="h-2 sm:h-3 bg-current/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ 
                        width: `${goal.progress}%`, 
                        backgroundColor: goal.color 
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs sm:text-sm font-bold">
                    <span className="opacity-60 tabular-nums">{goal.progress.toFixed(1)}%</span>
                    <span className="opacity-40 tabular-nums">
                      Faltam: {formatCurrency(goal.remaining)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedGoal === goal.id && (
                <div className="border-t border-current/10 p-4 sm:p-6 bg-current/[0.01] animate-in slide-in-from-top-4 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-current/5 rounded-2xl border border-current/5">
                      <p className="opacity-60 text-xs sm:text-sm font-bold uppercase tracking-wider">Você precisa guardar</p>
                      <p className="font-black text-xl sm:text-2xl mt-1 tabular-nums">
                        {formatCurrency(goal.monthlyRequired)}<span className="text-sm font-bold opacity-40 ml-1">/mês</span>
                      </p>
                    </div>
                    <div className="p-4 bg-current/5 rounded-2xl border border-current/5">
                      <p className="opacity-60 text-xs sm:text-sm font-bold uppercase tracking-wider">Prazo</p>
                      <p className="font-black text-xl sm:text-2xl mt-1">
                        {goal.monthsRemaining} {goal.monthsRemaining === 1 ? 'mês' : 'meses'}
                      </p>
                    </div>
                  </div>

                  {/* Recent Deposits */}
                  {goal.deposits.length > 0 && (
                    <div className="mb-6">
                      <h4 className="opacity-40 text-xs font-black uppercase tracking-[0.2em] mb-3">Últimos Depósitos</h4>
                      <div className="space-y-2">
                        {goal.deposits.slice(0, 3).map((deposit) => (
                          <div key={deposit.id} className="flex justify-between items-center p-3 bg-current/5 rounded-xl border border-current/5 hover:bg-current/[0.08] transition-all">
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-sm sm:text-base truncate">{deposit.note || 'Depósito'}</p>
                              <p className="opacity-40 text-xs font-medium">{formatDate(deposit.date)}</p>
                            </div>
                            <span className="text-emerald-500 font-black text-sm sm:text-base flex-shrink-0 ml-4 tabular-nums">
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
                        className="btn-primary flex items-center justify-center gap-2 flex-1 shadow-emerald-500/10"
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
                      className="btn-secondary flex items-center justify-center gap-2 text-red-500 hover:bg-red-500/10 border-red-500/10 hover:border-red-500/20"
                    >
                      <Trash2 className="w-5 h-5" />
                      <span className="sm:hidden font-bold">Excluir Meta</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowNewGoalModal(false); resetForm(); }} />
          <div className="glass-card p-6 w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Nova Meta</h3>
              <button 
                onClick={() => { setShowNewGoalModal(false); resetForm(); }}
                className="opacity-40 hover:opacity-100 transition-opacity"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Icon Selection */}
              <div>
                <label className="input-label">Ícone</label>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {AVAILABLE_ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setFormData({ ...formData, icon })}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${
                        formData.icon === icon 
                          ? 'bg-primary-500/20 ring-2 ring-primary-500' 
                          : 'bg-current/5 hover:bg-current/10'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="input-label">Nome da Meta</label>
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
                <label className="input-label">Valor Alvo</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40 font-bold">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.targetAmount || ''}
                    onChange={(e) => setFormData({ ...formData, targetAmount: parseFloat(e.target.value) || 0 })}
                    className="input-field w-full pl-12 tabular-nums"
                    placeholder="6.000,00"
                  />
                </div>
              </div>

              {/* Deadline */}
              <div>
                <label className="input-label">Prazo</label>
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
                <label className="input-label">Cor</label>
                <div className="flex gap-2 flex-wrap">
                  {AVAILABLE_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-xl transition-all ${
                        formData.color === color ? 'ring-2 ring-current ring-offset-2 ring-offset-transparent' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Monthly Estimate */}
              {formData.targetAmount > 0 && formData.deadline && (
                <div className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-2xl animate-in slide-in-from-top-2">
                  <p className="text-primary-500 text-sm font-bold flex items-center gap-2">
                    <Clock className="w-4 h-4" />
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
              <div className="flex gap-3 pt-4">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowDepositModal(false); setSelectedGoal(null); }} />
          <div className="glass-card p-6 w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm"
                  style={{ backgroundColor: `${selectedGoal.color}15`, color: selectedGoal.color }}
                >
                  {selectedGoal.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold">Depositar</h3>
                  <p className="opacity-60 text-sm font-medium">{selectedGoal.name}</p>
                </div>
              </div>
              <button 
                onClick={() => { setShowDepositModal(false); setSelectedGoal(null); }}
                className="opacity-40 hover:opacity-100 transition-opacity"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Current Progress */}
              <div className="p-4 bg-current/5 border border-current/5 rounded-2xl">
                <div className="flex justify-between text-xs sm:text-sm mb-2 font-bold uppercase tracking-wider opacity-60">
                  <span>Progresso atual</span>
                  <span className="tabular-nums">{selectedGoal.progress.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-current/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${selectedGoal.progress}%`, backgroundColor: selectedGoal.color }}
                  />
                </div>
                <p className="opacity-40 text-[10px] sm:text-xs mt-2 font-bold tabular-nums">
                  Faltam {formatCurrency(selectedGoal.remaining)}
                </p>
              </div>

              {/* Amount */}
              <div>
                <label className="input-label">Valor do Depósito</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40 font-bold">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="input-field w-full pl-12 text-xl font-black tabular-nums"
                    placeholder="500,00"
                    autoFocus
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="input-label">Observação (opcional)</label>
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
                <label className="input-label">Valores rápidos</label>
                <div className="grid grid-cols-3 gap-2">
                  {[100, 200, 500].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setDepositAmount(amount.toString())}
                      className="p-3 bg-current/5 hover:bg-current/10 border border-current/5 rounded-xl text-sm font-bold transition-all active:scale-95 tabular-nums"
                    >
                      {amount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { setShowDepositModal(false); setSelectedGoal(null); }}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeposit}
                  disabled={isSaving || !depositAmount}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 shadow-emerald-500/10"
                >
                  {isSaving && <Loader2 className="w-5 h-5 animate-spin" />}
                  Confirmar Depósito
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
