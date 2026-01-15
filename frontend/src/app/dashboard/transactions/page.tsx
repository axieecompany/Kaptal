"use client";

import ReportButton from '@/components/reports/ReportButton';
import TransactionsPDF from '@/components/reports/TransactionsPDF';
import {
    categoriesApi,
    incomeRulesApi,
    transactionsApi,
    type Category,
    type IncomeRule,
    type Transaction,
    type TransactionFilters
} from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { generateTransactionsExcel } from '@/lib/excelGenerators';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import {
    ArrowDownCircle,
    ArrowUpCircle,
    ChevronLeft,
    ChevronRight,
    Filter,
    Loader2,
    Pencil,
    Plus,
    Trash2,
    X
} from 'lucide-react';
import { useEffect, useState } from 'react';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR');
}

// Transaction Modal (Create/Edit)
function TransactionModal({ 
  isOpen, 
  onClose, 
  onSave,
  categories,
  editTransaction
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onSave: () => void;
  categories: Category[];
  editTransaction?: Transaction | null;
}) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [ruleItemId, setRuleItemId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Installment fields
  const [isInstallment, setIsInstallment] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState('');
  
  // Dynamic rules based on selected date
  const [rules, setRules] = useState<IncomeRule[]>([]);
  const [isLoadingRules, setIsLoadingRules] = useState(false);

  // Load rules when date changes
  useEffect(() => {
    const loadRulesForDate = async () => {
      if (!isOpen) return;
      
      setIsLoadingRules(true);
      try {
        const selectedDate = new Date(date);
        const month = selectedDate.getMonth() + 1;
        const year = selectedDate.getFullYear();
        
        const rulesRes = await incomeRulesApi.getAll(month, year);
        if (rulesRes.success) {
          setRules(rulesRes.data);
        } else {
          setRules([]);
        }
      } catch (err) {
        console.error('Error loading rules for date:', err);
        setRules([]);
      } finally {
        setIsLoadingRules(false);
      }
    };
    
    loadRulesForDate();
  }, [date, isOpen]);

  useEffect(() => {
    if (editTransaction) {
      setDescription(editTransaction.description);
      setAmount(String(editTransaction.amount));
      setType(editTransaction.type);
      setDate(new Date(editTransaction.date).toISOString().split('T')[0]);
      
      // Use incomeRuleId as categoryId for UI if available, otherwise use categoryId
      setCategoryId(editTransaction.incomeRuleId || editTransaction.categoryId);
      
      // @ts-ignore - ruleItem might exist
      setRuleItemId(editTransaction.ruleItem?.id || null);
    } else {
      setDescription('');
      setAmount('');
      setType('EXPENSE');
      setDate(new Date().toISOString().split('T')[0]);
      setCategoryId(null);
      setRuleItemId(null);
      setIsInstallment(false);
      setTotalInstallments('');
    }
  }, [editTransaction, isOpen]);

  // Reset category when date changes (if the selected category doesn't exist in new month)
  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    // Reset selections since rules will change
    setCategoryId(null);
    setRuleItemId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;

    setIsLoading(true);
    setError('');

    try {
      let finalIncomeRuleId: string | null = null;
      let finalCategoryId: string | null = categoryId;

      // If we have a ruleItemId, find the parent rule
      if (ruleItemId) {
        const parentRule = rules.find(r => r.items?.some(i => i.id === ruleItemId));
        if (parentRule) {
          finalIncomeRuleId = parentRule.id;
        }
        finalCategoryId = null; // Clear categoryId if using rule/subitem
      } 
      // If we have a categoryId but it's actually a Rule ID (from our select logic)
      // We assume everything selected from the current dropdown is a Rule or Item
      else if (categoryId) {
        // Check if this ID exists in rules list
        const isRule = rules.some(r => r.id === categoryId);
        if (isRule) {
          finalIncomeRuleId = categoryId;
          finalCategoryId = null;
        }
      }

      const data = {
        description,
        amount: parseFloat(amount),
        type,
        date: new Date(date).toISOString(),
        categoryId: finalCategoryId,
        ruleItemId,
        incomeRuleId: finalIncomeRuleId,
        ...(isInstallment && totalInstallments && {
          isInstallment: true,
          totalInstallments: parseInt(totalInstallments),
        }),
      };

      if (editTransaction) {
        await transactionsApi.update(editTransaction.id, data);
      } else {
        await transactionsApi.create(data);
      }
      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar transação');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedDateObj = new Date(date);
  const monthLabel = selectedDateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="glass-card p-6 w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">
            {editTransaction ? 'Editar Transação' : 'Nova Transação'}
          </h2>
          <button onClick={onClose} className="opacity-40 hover:opacity-100 transition-opacity">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Type Selector */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                type === 'EXPENSE'
                  ? 'bg-red-500/20 text-red-500 ring-2 ring-red-500'
                  : 'bg-current/5 opacity-60 hover:opacity-100 hover:bg-current/10'
              }`}
            >
              <ArrowDownCircle className="w-5 h-5" />
              Despesa
            </button>
            <button
              type="button"
              onClick={() => setType('INCOME')}
              className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                type === 'INCOME'
                  ? 'bg-emerald-500/20 text-emerald-500 ring-2 ring-emerald-500'
                  : 'bg-current/5 opacity-60 hover:opacity-100 hover:bg-current/10'
              }`}
            >
              <ArrowUpCircle className="w-5 h-5" />
              Receita
            </button>
          </div>

          <div>
            <label className="input-label">Descrição</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
              placeholder="Ex: Almoço no restaurante"
              required
            />
          </div>

          <div>
            <label className="input-label">Valor</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field"
              placeholder="0,00"
              required
            />
          </div>

          <div>
            <label className="input-label">Data</label>
            <input
              type="date"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="input-label flex items-center gap-2">
              Categoria
              {isLoadingRules && <Loader2 className="w-3 h-3 animate-spin" />}
              <span className="text-xs opacity-40 font-normal">({monthLabel})</span>
            </label>
            <select
              value={
                ruleItemId ? `item:${ruleItemId}` : 
                categoryId ? `rule:${categoryId}` : 
                ''
              }
              onChange={(e) => {
                const value = e.target.value;
                
                // Check if value is a ruleItemId (format starts with "item:")
                if (value.startsWith('item:')) {
                  const itemId = value.replace('item:', '');
                  setRuleItemId(itemId);
                  setCategoryId(null);
                } else if (value.startsWith('rule:')) {
                  // It's a rule (main category)
                  const ruleId = value.replace('rule:', '');
                  setCategoryId(ruleId);
                  setRuleItemId(null);
                } else {
                  // Empty or other
                  setCategoryId(null);
                  setRuleItemId(null);
                }
              }}
              className="input-field"
              disabled={isLoadingRules}
            >
              <option value="" className="bg-[var(--sidebar-bg)]">Sem categoria</option>
              
              {/* Rules with subitems - each rule as its own optgroup */}
              {rules.map((rule) => (
                <optgroup key={rule.id} label={`${rule.icon} ${rule.name}`} className="bg-[var(--sidebar-bg)]">
                  {/* The rule itself as main category */}
                  <option value={`rule:${rule.id}`} className="bg-[var(--sidebar-bg)] font-sans">
                    {rule.icon} {rule.name} (Geral)
                  </option>
                  {/* Subitems */}
                  {rule.items && rule.items.map((item) => (
                    <option 
                      key={item.id} 
                      value={`item:${item.id}`}
                      className="bg-[var(--sidebar-bg)] font-sans"
                    >
                      └ {item.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {rules.length === 0 && !isLoadingRules && (
              <p className="text-orange-500 text-xs mt-1 font-medium">
                Nenhuma categoria encontrada para {monthLabel}. Configure as categorias na página de Gastos.
              </p>
            )}
            {ruleItemId && (() => {
              // Find the selected subitem name
              let selectedItemName = '';
              for (const rule of rules) {
                const item = rule.items?.find(i => i.id === ruleItemId);
                if (item) {
                  selectedItemName = `${rule.icon} ${rule.name} → ${item.name}`;
                  break;
                }
              }
              return selectedItemName ? (
                <p className="text-primary-500 text-sm mt-1 font-medium">
                  {selectedItemName}
                </p>
              ) : null;
            })()}
          </div>

          {/* Installment section - only for expenses */}
          {type === 'EXPENSE' && !editTransaction && (
            <div className="space-y-3 p-4 rounded-xl bg-current/5 border border-current/10">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInstallment}
                  onChange={(e) => {
                    setIsInstallment(e.target.checked);
                    if (!e.target.checked) setTotalInstallments('');
                  }}
                  className="w-4 h-4 rounded border-current/20 text-primary-500 focus:ring-primary-500"
                />
                <span className="font-medium">Compra parcelada?</span>
              </label>
              
              {isInstallment && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <label className="input-label">Número de parcelas</label>
                  <input
                    type="number"
                    min="2"
                    max="48"
                    value={totalInstallments}
                    onChange={(e) => setTotalInstallments(e.target.value)}
                    className="input-field"
                    placeholder="Ex: 6"
                    required={isInstallment}
                  />
                  {totalInstallments && amount && (
                    <p className="text-primary-500 text-xs mt-2 font-medium">
                      {totalInstallments}x de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(amount))} = Total {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(amount) * parseInt(totalInstallments))}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="text-red-500 text-sm font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || !description.trim() || !amount || (isInstallment && !totalInstallments)}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            {editTransaction ? 'Salvar Alterações' : isInstallment ? `Criar ${totalInstallments || ''} Parcelas` : 'Adicionar Transação'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Delete Confirmation Modal
function DeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  transaction,
  isLoading
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onConfirm: () => void;
  transaction: Transaction | null;
  isLoading: boolean;
}) {
  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="glass-card p-8 w-full max-w-sm relative z-10 animate-in fade-in zoom-in duration-200">
        <h2 className="text-xl font-bold mb-4">Excluir Transação</h2>
        <p className="opacity-60 mb-6 font-medium leading-relaxed">
          Tem certeza que deseja excluir <span className="text-current font-bold underline decoration-red-500/30">"{transaction.description}"</span>?
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancelar
          </button>
          <button 
            onClick={onConfirm} 
            disabled={isLoading}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 active:scale-95"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [rules, setRules] = useState<IncomeRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [deleteTransaction, setDeleteTransaction] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState<TransactionFilters>({ page: 1, limit: 10 });
  const [showFilters, setShowFilters] = useState(false);

  // Helper to fetch all transactions for reports
  const fetchAllForReport = async () => {
    try {
      // Fetch without pagination limit to get all records for the report
      const reportFilters = { ...filters, limit: 1000, page: 1 };
      const res = await transactionsApi.getAll(reportFilters);
      return res.data;
    } catch (err) {
      console.error('Error fetching data for report:', err);
      return transactions; // Fallback to current page
    }
  };

  const handleGeneratePDF = async () => {
    const allData = await fetchAllForReport();
    const period = filters.startDate && filters.endDate 
      ? `${new Date(filters.startDate).toLocaleDateString('pt-BR')} - ${new Date(filters.endDate).toLocaleDateString('pt-BR')}`
      : 'Período Completo';

    const income = allData.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + Number(t.amount), 0);
    const expense = allData.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + Number(t.amount), 0);

    const doc = (
      <TransactionsPDF
        userName={user?.name || 'Usuário'}
        generatedAt={new Date()}
        period={period}
        transactions={allData.map(t => ({
          id: t.id,
          date: t.date,
          description: t.description,
          category: t.category?.name || t.incomeRule?.name || 'Sem categoria',
          amount: Number(t.amount),
          type: t.type
        }))}
        totals={{
          income,
          expense,
          balance: income - expense,
          count: allData.length
        }}
      />
    );

    const blob = await pdf(doc).toBlob();
    saveAs(blob, `Kaptal_Extrato_${period.replace(/\s/g, '_')}.pdf`);
  };

  const handleGenerateExcel = async () => {
    const allData = await fetchAllForReport();
    const period = filters.startDate && filters.endDate 
      ? `${new Date(filters.startDate).toLocaleDateString('pt-BR')} - ${new Date(filters.endDate).toLocaleDateString('pt-BR')}`
      : 'Período Completo';

    const income = allData.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + Number(t.amount), 0);
    const expense = allData.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + Number(t.amount), 0);

    generateTransactionsExcel({
      userName: user?.name || 'Usuário',
      period,
      transactions: allData.map(t => ({
        date: t.date,
        description: t.description,
        category: t.category?.name || t.incomeRule?.name || 'Sem categoria',
        type: t.type,
        amount: Number(t.amount)
      })),
      totals: {
        income,
        expense,
        balance: income - expense
      }
    });
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const month = new Date().getMonth() + 1;
      const year = new Date().getFullYear();
      
      const [transactionsRes, categoriesRes, rulesRes] = await Promise.all([
        transactionsApi.getAll(filters),
        categoriesApi.getAllFlat(),
        incomeRulesApi.getAll(month, year),
      ]);
      setTransactions(transactionsRes.data);
      setPagination(transactionsRes.pagination);
      setCategories(categoriesRes.data);
      if (rulesRes.success) {
        setRules(rulesRes.data);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleFilterChange = (key: keyof TransactionFilters, value: string | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleEdit = (transaction: Transaction) => {
    setEditTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTransaction) return;
    setIsDeleting(true);
    try {
      await transactionsApi.delete(deleteTransaction.id);
      setDeleteTransaction(null);
      loadData();
    } catch (err) {
      console.error('Error deleting transaction:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditTransaction(null);
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Transações</h1>
          <p className="opacity-60 text-sm sm:text-base">Gerencie suas receitas e despesas</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <ReportButton
            onGeneratePDF={handleGeneratePDF}
            onGenerateExcel={handleGenerateExcel}
            label="Relatório"
          />
          <button
            onClick={() => { setEditTransaction(null); setIsModalOpen(true); }}
            className="btn-primary flex items-center justify-center gap-2 flex-1 sm:flex-initial shadow-emerald-500/10"
          >
            <Plus className="w-5 h-5" />
            Nova Transação
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-medium ${
              showFilters ? 'bg-primary-500/10 text-primary-500' : 'bg-current/5 opacity-60 hover:opacity-100'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={() => handleFilterChange('type', undefined)}
              className={`px-4 py-2 rounded-xl transition-all font-medium ${
                !filters.type ? 'bg-primary-500/10 text-primary-500' : 'bg-current/5 opacity-60 hover:opacity-100'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => handleFilterChange('type', 'EXPENSE')}
              className={`px-4 py-2 rounded-xl transition-all font-medium ${
                filters.type === 'EXPENSE' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-current/5 opacity-60 hover:opacity-100'
              }`}
            >
              Despesas
            </button>
            <button
              onClick={() => handleFilterChange('type', 'INCOME')}
              className={`px-4 py-2 rounded-xl transition-all font-medium ${
                filters.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-current/5 opacity-60 hover:opacity-100'
              }`}
            >
              Receitas
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-current/10 grid md:grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-200">
            <div>
              <label className="input-label">Data Início</label>
              <input
                type="date"
                value={filters.startDate?.split('T')[0] || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                className="input-field !border-none"
              />
            </div>
            <div>
              <label className="input-label">Data Fim</label>
              <input
                type="date"
                value={filters.endDate?.split('T')[0] || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                className="input-field !border-none"
              />
            </div>
            <div>
              <label className="input-label">Categoria</label>
              <select
                value={filters.categoryId || ''}
                onChange={(e) => handleFilterChange('categoryId', e.target.value || undefined)}
                className="input-field"
              >
                <option value="" className="bg-[var(--sidebar-bg)]">Todas</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-[var(--sidebar-bg)] font-sans">
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Transactions List */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : transactions.length > 0 ? (
          <>
            <div className="thin-divide">
              {transactions.map((transaction) => (
                <div 
                  key={transaction.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-5 hover:bg-current/[0.02] transition-colors group gap-3"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      transaction.type === 'INCOME' 
                        ? 'bg-emerald-500/10 border border-emerald-500/20' 
                        : 'bg-red-500/10 border border-red-500/20'
                    }`}>
                      <span className="text-lg sm:text-xl">
                        {transaction.category?.icon || 
                         transaction.incomeRule?.icon || 
                         (transaction.ruleItem?.rule?.icon) || 
                         (transaction.type === 'INCOME' ? '💰' : '💸')}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold truncate text-sm sm:text-base">{transaction.description}</p>
                      <p className="opacity-40 text-xs sm:text-sm truncate font-medium">
                        {transaction.category?.name || 
                         transaction.incomeRule?.name || 
                         (transaction.ruleItem ? `${transaction.ruleItem.rule?.name} → ${transaction.ruleItem.name}` : null) || 
                         'Sem categoria'} • {formatDate(transaction.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6">
                    <span className={`text-base sm:text-lg font-black tabular-nums ${
                      transaction.type === 'INCOME' ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                      {transaction.type === 'INCOME' ? '+' : '-'}
                      {formatCurrency(Number(transaction.amount))}
                    </span>
                    <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="p-2 rounded-lg bg-current/5 hover:bg-current/10 opacity-60 hover:opacity-100 transition-all"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTransaction(transaction)}
                        className="p-2 rounded-lg bg-current/5 hover:bg-red-500/20 opacity-60 hover:opacity-100 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="p-4 thin-border-t flex items-center justify-between bg-current/[0.01]">
              <p className="opacity-40 text-sm font-medium">
                Mostrando {transactions.length} de {pagination.total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="p-2 rounded-lg bg-current/5 hover:bg-current/10 disabled:opacity-20 disabled:cursor-not-allowed opacity-60"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="opacity-60 text-sm px-2 font-bold tabular-nums">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-2 rounded-lg bg-current/5 hover:bg-current/10 disabled:opacity-20 disabled:cursor-not-allowed opacity-60"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-current/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 opacity-20" />
            </div>
            <p className="opacity-40 mb-6 font-medium">Nenhuma transação encontrada</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary"
            >
              Adicionar primeira transação
            </button>
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={loadData}
        categories={categories}
        editTransaction={editTransaction}
      />

      {/* Delete Modal */}
      <DeleteModal
        isOpen={!!deleteTransaction}
        onClose={() => setDeleteTransaction(null)}
        onConfirm={handleDelete}
        transaction={deleteTransaction}
        isLoading={isDeleting}
      />
    </div>
  );
}
