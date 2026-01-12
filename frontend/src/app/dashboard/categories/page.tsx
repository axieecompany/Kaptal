'use client';

import { categoriesApi, statsApi, type Category, type CategoryStat } from '@/lib/api';
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
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

// Extended icons list
const ICONS = [
  '📦', '🛒', '🍔', '🚗', '🏠', '💊', '🎮', '📱', '👕', '💼', '✈️', '📚',
  '🍕', '🍺', '☕', '🎬', '🎵', '🏋️', '💇', '🐕', '🐈', '👶', '🎁', '💐',
  '⛽', '🚌', '🚕', '🏥', '💉', '🦷', '👓', '💻', '🖥️', '📺', '🎧', '📷',
  '🛋️', '🛏️', '🚿', '🧹', '🧺', '💡', '📧', '📞', '🎓', '📝', '✂️', '🔧',
  '🎂', '🍰', '🍦', '🥤', '🍿', '🎪', '🎡', '🏖️', '⛷️', '🎾', '⚽', '🏀'
];

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
  '#f43f5e', '#d946ef', '#a855f7', '#0ea5e9', '#10b981',
];

// Donut Chart Component - Larger and improved
function DonutChart({ stats, total }: { stats: CategoryStat[]; total: number }) {
  if (!stats.length || total === 0) {
    return (
      <div className="w-48 h-48 rounded-full bg-white/10 flex items-center justify-center">
        <span className="text-white/40 text-sm">Sem dados</span>
      </div>
    );
  }

  let currentAngle = 0;
  const segments = stats.slice(0, 6).map((stat) => {
    const percentage = (stat.total / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    return { ...stat, startAngle, angle, percentage };
  });

  return (
    <div className="relative w-48 h-48">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        {segments.map((segment, index) => {
          const radius = 40;
          const circumference = 2 * Math.PI * radius;
          const strokeDasharray = (segment.angle / 360) * circumference;
          const strokeDashoffset = -(segment.startAngle / 360) * circumference;
          
          return (
            <circle
              key={index}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={segment.categoryColor}
              strokeWidth="18"
              strokeDasharray={`${strokeDasharray} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-white/60">Total</p>
          <p className="text-lg font-bold text-white">{formatCurrency(total)}</p>
        </div>
      </div>
    </div>
  );
}

// Category Modal (Create/Edit)
function CategoryModal({ 
  isOpen, 
  onClose, 
  onSave,
  categories,
  editCategory
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onSave: () => void;
  categories: Category[];
  editCategory?: Category | null;
}) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📦');
  const [color, setColor] = useState('#6366f1');
  const [parentId, setParentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAllIcons, setShowAllIcons] = useState(false);

  useEffect(() => {
    if (editCategory) {
      setName(editCategory.name);
      setIcon(editCategory.icon);
      setColor(editCategory.color);
      setParentId(editCategory.parentId);
    } else {
      setName('');
      setIcon('📦');
      setColor('#6366f1');
      setParentId(null);
    }
  }, [editCategory, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      if (editCategory) {
        await categoriesApi.update(editCategory.id, { name, icon, color, parentId });
      } else {
        await categoriesApi.create({ name, icon, color, parentId });
      }
      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar categoria');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const displayIcons = showAllIcons ? ICONS : ICONS.slice(0, 12);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="glass-card p-6 w-full max-w-md relative z-10 animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {editCategory ? 'Editar Categoria' : 'Nova Categoria'}
          </h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="input-label">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Ex: Alimentação"
              required
            />
          </div>

          <div>
            <label className="input-label">Ícone</label>
            <div className="grid grid-cols-6 gap-2">
              {displayIcons.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={`p-2 rounded-xl text-xl transition-all ${
                    icon === i 
                      ? 'bg-primary-500/30 ring-2 ring-primary-500' 
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowAllIcons(!showAllIcons)}
              className="text-primary-400 text-sm mt-2 hover:text-primary-300"
            >
              {showAllIcons ? 'Mostrar menos' : `Ver todos (${ICONS.length})`}
            </button>
          </div>

          <div>
            <label className="input-label">Cor</label>
            <div className="grid grid-cols-5 gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-full aspect-square rounded-xl transition-all ${
                    color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="input-label">Categoria Pai (opcional)</label>
            <select
              value={parentId || ''}
              onChange={(e) => setParentId(e.target.value || null)}
              className="input-field"
            >
              <option value="">Nenhuma (categoria principal)</option>
              {categories
                .filter(cat => cat.id !== editCategory?.id)
                .map((cat) => (
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
            disabled={isLoading || !name.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            {editCategory ? 'Salvar Alterações' : 'Criar Categoria'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Category List Item
function CategoryListItem({ 
  category, 
  onEdit,
  onDelete,
  stats,
  total
}: { 
  category: Category;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
  stats: CategoryStat[];
  total: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const stat = stats.find(s => s.categoryId === category.id);
  const amount = stat?.total || 0;
  const percentage = total > 0 && amount > 0 ? (amount / total) * 100 : 0;
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div>
      <div className="flex items-center gap-3 py-3 group">
        {hasChildren ? (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-5 h-5 flex items-center justify-center text-white/40"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        ) : (
          <div className="w-5" />
        )}
        
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ backgroundColor: `${category.color}20` }}
        >
          {category.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-white font-medium truncate">{category.name}</span>
            <span className="text-white font-semibold">{formatCurrency(amount)}</span>
          </div>
          {percentage > 0 && (
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${percentage}%`, backgroundColor: category.color }}
              />
            </div>
          )}
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(category)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(category)}
            className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-400"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div className="ml-6 border-l border-white/10 pl-4">
          {category.children!.map((child) => (
            <CategoryListItem
              key={child.id}
              category={child}
              onEdit={onEdit}
              onDelete={onDelete}
              stats={stats}
              total={total}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Delete Confirmation Modal
function DeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  category,
  isLoading
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onConfirm: () => void;
  category: Category | null;
  isLoading: boolean;
}) {
  if (!isOpen || !category) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="glass-card p-6 w-full max-w-sm relative z-10 animate-fade-in">
        <h2 className="text-xl font-bold text-white mb-4">Excluir Categoria</h2>
        <p className="text-white/60 mb-6">
          Tem certeza que deseja excluir <strong className="text-white">{category.icon} {category.name}</strong>?
          As transações vinculadas ficarão sem categoria.
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

export default function CategoriesPage() {
  const [stats, setStats] = useState<CategoryStat[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const loadData = async () => {
    try {
      const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);

      const [statsRes, categoriesRes, allCategoriesRes] = await Promise.all([
        statsApi.getByCategory(start.toISOString(), end.toISOString()),
        categoriesApi.getAll(),
        categoriesApi.getAllFlat(),
      ]);

      setStats(statsRes.data.stats);
      setTotal(statsRes.data.total);
      setCategories(categoriesRes.data);
      setAllCategories(allCategoriesRes.data);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  const handleEdit = (category: Category) => {
    setEditCategory(category);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteCategory) return;
    setIsDeleting(true);
    try {
      await categoriesApi.delete(deleteCategory.id);
      setDeleteCategory(null);
      loadData();
    } catch (err) {
      console.error('Error deleting category:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditCategory(null);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    if (nextMonth <= new Date()) {
      setCurrentMonth(nextMonth);
    }
  };

  const monthLabel = currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Categorias</h1>
          <p className="text-white/60">Gerencie suas categorias de gastos</p>
        </div>
        <button
          onClick={() => { setEditCategory(null); setIsModalOpen(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nova Categoria
        </button>
      </div>

      {/* Overview Card - Improved Layout */}
      <div className="glass-card p-8">
        <div className="flex flex-col lg:flex-row items-center gap-8 mb-8">
          {/* Large Donut Chart */}
          <div className="flex flex-col items-center">
            <DonutChart stats={stats} total={total} />
            <div className="mt-4 text-center">
              <p className="text-white/60 text-sm">Total de Gastos</p>
              <p className="text-4xl font-bold text-white mt-1">{formatCurrency(total)}</p>
            </div>
          </div>
          
          {/* Stats Summary */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
            {stats.slice(0, 6).map((stat) => (
              <div 
                key={stat.categoryId} 
                className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: stat.categoryColor }}
                  />
                  <span className="text-white/60 text-sm truncate">{stat.categoryName}</span>
                </div>
                <p className="text-white font-semibold">{formatCurrency(stat.total)}</p>
                <p className="text-white/40 text-xs">
                  {((stat.total / total) * 100).toFixed(1)}% do total
                </p>
              </div>
            ))}
          </div>
          
          {/* Month Selector */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-white font-medium capitalize min-w-[140px] text-center text-sm">
              {monthLabel}
            </span>
            <button
              onClick={handleNextMonth}
              disabled={currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear()}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Categories List */}
        <div className="border-t border-white/10 pt-4">
          <h3 className="text-sm font-medium text-white/60 mb-4">SUAS CATEGORIAS</h3>
          
          {categories.length > 0 ? (
            <div className="space-y-1">
              {categories.map((category) => (
                <CategoryListItem
                  key={category.id}
                  category={category}
                  onEdit={handleEdit}
                  onDelete={setDeleteCategory}
                  stats={stats}
                  total={total}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-white/40 mb-4">Nenhuma categoria cadastrada</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-secondary"
              >
                Criar primeira categoria
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Category Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={loadData}
        categories={allCategories}
        editCategory={editCategory}
      />

      {/* Delete Modal */}
      <DeleteModal
        isOpen={!!deleteCategory}
        onClose={() => setDeleteCategory(null)}
        onConfirm={handleDelete}
        category={deleteCategory}
        isLoading={isDeleting}
      />
    </div>
  );
}
