'use client';

import {
    categoriesApi,
    transactionsApi,
    type Category,
    type Transaction,
    type TransactionFilters
} from '@/lib/api';
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editTransaction) {
      setDescription(editTransaction.description);
      setAmount(String(editTransaction.amount));
      setType(editTransaction.type);
      setDate(new Date(editTransaction.date).toISOString().split('T')[0]);
      setCategoryId(editTransaction.categoryId);
    } else {
      setDescription('');
      setAmount('');
      setType('EXPENSE');
      setDate(new Date().toISOString().split('T')[0]);
      setCategoryId(null);
    }
  }, [editTransaction, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;

    setIsLoading(true);
    setError('');

    try {
      const data = {
        description,
        amount: parseFloat(amount),
        type,
        date: new Date(date).toISOString(),
        categoryId,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="glass-card p-6 w-full max-w-md relative z-10 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {editTransaction ? 'Editar Transação' : 'Nova Transação'}
          </h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
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
                  ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
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
                  ? 'bg-green-500/20 text-green-400 ring-2 ring-green-500'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
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
              onChange={(e) => setDate(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="input-label">Categoria</label>
            <select
              value={categoryId || ''}
              onChange={(e) => setCategoryId(e.target.value || null)}
              className="input-field"
            >
              <option value="">Sem categoria</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || !description.trim() || !amount}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            {editTransaction ? 'Salvar Alterações' : 'Adicionar Transação'}
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
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="glass-card p-6 w-full max-w-sm relative z-10 animate-fade-in">
        <h2 className="text-xl font-bold text-white mb-4">Excluir Transação</h2>
        <p className="text-white/60 mb-6">
          Tem certeza que deseja excluir <strong className="text-white">"{transaction.description}"</strong>?
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancelar
          </button>
          <button 
            onClick={onConfirm} 
            disabled={isLoading}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [deleteTransaction, setDeleteTransaction] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState<TransactionFilters>({ page: 1, limit: 10 });
  const [showFilters, setShowFilters] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [transactionsRes, categoriesRes] = await Promise.all([
        transactionsApi.getAll(filters),
        categoriesApi.getAllFlat(),
      ]);
      setTransactions(transactionsRes.data);
      setPagination(transactionsRes.pagination);
      setCategories(categoriesRes.data);
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Transações</h1>
          <p className="text-white/60">Gerencie suas receitas e despesas</p>
        </div>
        <button
          onClick={() => { setEditTransaction(null); setIsModalOpen(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nova Transação
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              showFilters ? 'bg-primary-500/20 text-primary-400' : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={() => handleFilterChange('type', undefined)}
              className={`px-4 py-2 rounded-xl transition-all ${
                !filters.type ? 'bg-primary-500/20 text-primary-400' : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => handleFilterChange('type', 'EXPENSE')}
              className={`px-4 py-2 rounded-xl transition-all ${
                filters.type === 'EXPENSE' ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              Despesas
            </button>
            <button
              onClick={() => handleFilterChange('type', 'INCOME')}
              className={`px-4 py-2 rounded-xl transition-all ${
                filters.type === 'INCOME' ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              Receitas
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-white/10 grid md:grid-cols-3 gap-4">
            <div>
              <label className="input-label">Data Início</label>
              <input
                type="date"
                value={filters.startDate?.split('T')[0] || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Data Fim</label>
              <input
                type="date"
                value={filters.endDate?.split('T')[0] || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Categoria</label>
              <select
                value={filters.categoryId || ''}
                onChange={(e) => handleFilterChange('categoryId', e.target.value || undefined)}
                className="input-field"
              >
                <option value="">Todas</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
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
            <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
          </div>
        ) : transactions.length > 0 ? (
          <>
            <div className="divide-y divide-white/10">
              {transactions.map((transaction) => (
                <div 
                  key={transaction.id}
                  className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      transaction.type === 'INCOME' 
                        ? 'bg-green-500/20' 
                        : 'bg-red-500/20'
                    }`}>
                      <span className="text-xl">
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
                  <div className="flex items-center gap-4">
                    <span className={`text-lg font-semibold ${
                      transaction.type === 'INCOME' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {transaction.type === 'INCOME' ? '+' : '-'}
                      {formatCurrency(Number(transaction.amount))}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTransaction(transaction)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-white/10 flex items-center justify-between">
              <p className="text-white/60 text-sm">
                Mostrando {transactions.length} de {pagination.total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white/60"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-white/60 text-sm px-2">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white/60"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-white/40 mb-4">Nenhuma transação encontrada</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-secondary"
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
