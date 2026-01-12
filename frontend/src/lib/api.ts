import type {
    AuthResponse,
    LoginData,
    RegisterData,
    ResendCodeData,
    VerifyData
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
  
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new Error('Sessão expirada. Por favor, faça login novamente.');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Algo deu errado');
  }

  return data;
}

export const authApi = {
  register: (data: RegisterData): Promise<AuthResponse> =>
    fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  verifyEmail: (data: VerifyData): Promise<AuthResponse> =>
    fetchApi('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: LoginData): Promise<AuthResponse> =>
    fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  verifyLogin: (data: VerifyData): Promise<AuthResponse> =>
    fetchApi('/auth/verify-login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resendCode: (data: ResendCodeData): Promise<AuthResponse> =>
    fetchApi('/auth/resend-code', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: (token: string): Promise<AuthResponse> =>
    fetchApi('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
};

// Categories API
export const categoriesApi = {
  getAll: () => fetchApi<{ success: boolean; data: Category[] }>('/categories'),
  getAllFlat: () => fetchApi<{ success: boolean; data: Category[] }>('/categories/all'),
  create: (data: CreateCategoryData) => 
    fetchApi<{ success: boolean; data: Category }>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<CreateCategoryData>) =>
    fetchApi<{ success: boolean; data: Category }>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/categories/${id}`, {
      method: 'DELETE',
    }),
};

// Transactions API
export const transactionsApi = {
  getAll: (params?: TransactionFilters) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    if (params?.categoryId) searchParams.set('categoryId', params.categoryId);
    if (params?.type) searchParams.set('type', params.type);
    
    const query = searchParams.toString();
    return fetchApi<TransactionsResponse>(`/transactions${query ? `?${query}` : ''}`);
  },
  create: (data: CreateTransactionData) =>
    fetchApi<{ success: boolean; data: Transaction }>('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<CreateTransactionData>) =>
    fetchApi<{ success: boolean; data: Transaction }>(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/transactions/${id}`, {
      method: 'DELETE',
    }),
};

// Stats API
export const statsApi = {
  getOverview: () => fetchApi<OverviewResponse>('/stats/overview'),
  getByCategory: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const query = params.toString();
    return fetchApi<CategoryStatsResponse>(`/stats/by-category${query ? `?${query}` : ''}`);
  },
  getMonthly: () => fetchApi<MonthlyHistoryResponse>('/stats/monthly'),
};

// Category Budgets API
export const categoryBudgetsApi = {
  getByMonth: (month: number, year: number) => 
    fetchApi<{ success: boolean; data: BudgetsData }>(`/category-budgets?month=${month}&year=${year}`),
  
  set: (data: { categoryId: string; month: number; year: number; amount: number }) =>
    fetchApi<{ success: boolean; data: any }>('/category-budgets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  delete: (categoryId: string, month: number, year: number) =>
    fetchApi<{ success: boolean }>(`/category-budgets/${categoryId}?month=${month}&year=${year}`, {
      method: 'DELETE',
    }),
};

// Income Rules API
export interface RuleItem {
  id: string;
  name: string;
  amount: number;
  ruleId: string;
}

export interface IncomeRule {
  id: string;
  name: string;
  percentage: number;
  color: string;
  icon: string;
  items: RuleItem[];
}

export interface CreateIncomeRuleData {
  name: string;
  percentage: number;
  color?: string;
  icon?: string;
}

export interface CreateRuleItemData {
  name: string;
  amount: number;
}

export const incomeRulesApi = {
  getAll: () => 
    fetchApi<{ success: boolean; data: IncomeRule[]; totalPercentage: number }>('/income-rules'),
  
  create: (data: CreateIncomeRuleData) =>
    fetchApi<{ success: boolean; data: IncomeRule }>('/income-rules', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: Partial<CreateIncomeRuleData>) =>
    fetchApi<{ success: boolean; data: IncomeRule }>(`/income-rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/income-rules/${id}`, {
      method: 'DELETE',
    }),

  // Item methods
  addItem: (ruleId: string, data: CreateRuleItemData) =>
    fetchApi<{ success: boolean; data: RuleItem }>(`/income-rules/${ruleId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  updateItem: (ruleId: string, itemId: string, data: Partial<CreateRuleItemData>) =>
    fetchApi<{ success: boolean; data: RuleItem }>(`/income-rules/${ruleId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  deleteItem: (ruleId: string, itemId: string) =>
    fetchApi<{ success: boolean }>(`/income-rules/${ruleId}/items/${itemId}`, {
      method: 'DELETE',
    }),
};

// Types
export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  parentId: string | null;
  children?: Category[];
  _count?: { transactions: number };
}

export interface CreateCategoryData {
  name: string;
  icon?: string;
  color?: string;
  parentId?: string | null;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  categoryId: string | null;
  category: Category | null;
}

export interface CreateTransactionData {
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  date?: string;
  categoryId?: string | null;
}

export interface TransactionFilters {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  type?: 'INCOME' | 'EXPENSE';
}

export interface TransactionsResponse {
  success: boolean;
  data: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface OverviewResponse {
  success: boolean;
  data: {
    income: number;
    expense: number;
    balance: number;
    recentTransactions: Transaction[];
    period: { start: string; end: string };
  };
}

export interface CategoryStat {
  categoryId: string | null;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  parentId: string | null;
  parentName: string | null;
  total: number;
}

export interface CategoryStatsResponse {
  success: boolean;
  data: {
    stats: CategoryStat[];
    total: number;
    period: { start: string; end: string };
  };
}

export interface MonthlyHistoryResponse {
  success: boolean;
  data: {
    month: string;
    year: number;
    income: number;
    expense: number;
  }[];
}

export interface Budget {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  budget: number;
  spent: number;
  remaining: number;
  percentage: number;
}

export interface BudgetsData {
  budgets: Budget[];
  totals: {
    totalBudget: number;
    totalSpent: number;
    percentage: number;
    savings: number;
  };
  month: number;
  year: number;
}

export default authApi;
