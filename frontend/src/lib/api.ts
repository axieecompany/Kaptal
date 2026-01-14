import type {
    AuthResponse,
    LoginData,
    RegisterData,
    ResendCodeData,
    VerifyData
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Custom error class for API errors - extends Error for proper inheritance
export class ApiError extends Error {
  isApiError = true;
  
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// Suppress Next.js error overlay for API errors in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason instanceof ApiError) {
      // Prevent the error from showing in Next.js error overlay
      event.preventDefault();
    }
  });
}

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
    return Promise.reject(new ApiError('Sessão expirada. Por favor, faça login novamente.'));
  }

  const data = await response.json();

  if (!response.ok) {
    return Promise.reject(new ApiError(data.message || 'Algo deu errado'));
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
  rule?: IncomeRule;
  spending?: {
    totalSpent: number;
    remaining: number;
    percentage: number;
    isOverBudget: boolean;
  };
}

export interface IncomeRule {
  id: string;
  name: string;
  percentage: number;
  color: string;
  icon: string;
  month: number;
  year: number;
  baseIncome: number;
  items: RuleItem[];
  spending?: {
    totalSpent: number;
    budgetAmount: number;
    remaining: number;
    percentage: number;
    isOverBudget: boolean;
  };
}

export interface CreateIncomeRuleData {
  name: string;
  percentage: number;
  color?: string;
  icon?: string;
  month: number;
  year: number;
  baseIncome?: number;
}

export interface CreateRuleItemData {
  name: string;
  amount: number;
}

export interface GetRulesResponse {
  success: boolean;
  data: IncomeRule[];
  totalPercentage: number;
  baseIncome: number;
  month: number;
  year: number;
  usingFallback: boolean;
  requestedMonth: number;
  requestedYear: number;
}

export const incomeRulesApi = {
  getAll: (month?: number, year?: number) => {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<GetRulesResponse>(`/income-rules${query}`);
  },
  
  create: (data: CreateIncomeRuleData) =>
    fetchApi<{ success: boolean; data: IncomeRule }>('/income-rules', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  copyFromMonth: (fromMonth: number, fromYear: number, toMonth: number, toYear: number, baseIncome?: number) =>
    fetchApi<{ success: boolean; message: string }>('/income-rules/copy-from-month', {
      method: 'POST',
      body: JSON.stringify({ fromMonth, fromYear, toMonth, toYear, baseIncome }),
    }),
  
  update: (id: string, data: Partial<CreateIncomeRuleData> & { baseIncome?: number }) =>
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

  getItemSpending: (ruleId: string, itemId: string) =>
    fetchApi<{
      success: boolean;
      data: {
        ruleItem: { id: string; name: string; budget: number };
        totalSpent: number;
        remaining: number;
        percentage: number;
        isOverBudget: boolean;
        overAmount: number;
        transactionCount: number;
      };
    }>(`/income-rules/${ruleId}/items/${itemId}/spending`),

  getRuleSpending: (ruleId: string) =>
    fetchApi<{
      success: boolean;
      data: {
        ruleId: string;
        totalSpent: number;
        budgetAmount: number;
        remaining: number;
        percentage: number;
        isOverBudget: boolean;
        transactionCount: number;
      };
    }>(`/income-rules/${ruleId}/spending`),

  resetToDefaults: (month: number, year: number, baseIncome: number) =>
    fetchApi<{ success: boolean; message: string; data: IncomeRule[] }>('/income-rules/reset-to-defaults', {
      method: 'POST',
      body: JSON.stringify({ month, year, baseIncome }),
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
  ruleItemId?: string | null;
  ruleItem?: RuleItem | null;
  incomeRuleId?: string | null;
  incomeRule?: IncomeRule | null;
  // Installment fields
  isInstallment?: boolean;
  installmentNumber?: number | null;
  totalInstallments?: number | null;
  installmentGroupId?: string | null;
}

export interface CreateTransactionData {
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  date?: string;
  categoryId?: string | null;
  ruleItemId?: string | null;
  incomeRuleId?: string | null;
  // Installment fields
  isInstallment?: boolean;
  totalInstallments?: number;
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

// Savings Goals
export interface SavingsDeposit {
  id: string;
  amount: number;
  note: string | null;
  date: string;
  goalId: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  icon: string;
  color: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  progress: number;
  monthlyRequired: number;
  monthsRemaining: number;
  remaining: number;
  status: 'on_track' | 'behind' | 'completed' | 'overdue';
  deposits: SavingsDeposit[];
}

export interface CreateSavingsGoalData {
  name: string;
  targetAmount: number;
  deadline: string;
  icon?: string;
  color?: string;
}

export interface SavingsGoalResponse {
  success: boolean;
  data: SavingsGoal[];
}

export const savingsGoalsApi = {
  getAll: (): Promise<SavingsGoalResponse> =>
    fetchApi('/savings-goals'),

  create: (data: CreateSavingsGoalData): Promise<{ success: boolean; data: SavingsGoal }> =>
    fetchApi('/savings-goals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<CreateSavingsGoalData & { isCompleted: boolean }>): Promise<{ success: boolean; data: SavingsGoal }> =>
    fetchApi(`/savings-goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<{ success: boolean; message: string }> =>
    fetchApi(`/savings-goals/${id}`, {
      method: 'DELETE',
    }),

  deposit: (id: string, data: { amount: number; note?: string; date?: string }): Promise<{ success: boolean; data: { deposit: SavingsDeposit; goal: SavingsGoal } }> =>
    fetchApi(`/savings-goals/${id}/deposit`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getDeposits: (id: string): Promise<{ success: boolean; data: SavingsDeposit[] }> =>
    fetchApi(`/savings-goals/${id}/deposits`),

  deleteDeposit: (goalId: string, depositId: string): Promise<{ success: boolean; message: string }> =>
    fetchApi(`/savings-goals/${goalId}/deposits/${depositId}`, {
      method: 'DELETE',
    }),
};

// Holdings (Stocks Portfolio)
export interface StockHolding {
  id: string;
  symbol: string;
  name: string | null;
  quantity: number;
  averagePrice: number;
  averageCost: number;
  currentPrice: number;
  totalInvested: number;
  currentValue: number;
  profit: number;
  profitPercent: number;
  companyName: string;
  dividends: Dividend[];
}

export interface Dividend {
  id: string;
  amount: number;
  type: 'DIVIDEND' | 'JCP' | 'RENDIMENTO' | 'BONUS' | 'OTHER';
  date: string;
  holdingId: string;
}

export interface HoldingsSummary {
  totalInvested: number;
  totalValue: number;
  totalProfit: number;
  totalProfitPercent: number;
  holdingsCount: number;
}

export interface HoldingsResponse {
  success: boolean;
  data: {
    holdings: StockHolding[];
    summary: HoldingsSummary;
  };
}

export interface DividendsSummary {
  total: number;
  monthlyAverage: number;
  count: number;
}

export interface DividendsResponse {
  success: boolean;
  data: {
    dividends: (Dividend & { holding: { symbol: string; name: string | null } })[];
    byType: Record<string, number>;
    byMonth: Record<string, number>;
    summary: DividendsSummary;
  };
}

export interface CreateHoldingData {
  symbol: string;
  quantity: number;
  averagePrice: number;
  averageCost?: number;
  name?: string;
}

export interface CreateDividendData {
  holdingId: string;
  amount: number;
  type: 'DIVIDEND' | 'JCP' | 'RENDIMENTO' | 'BONUS' | 'OTHER';
  date?: string;
}

export const holdingsApi = {
  getAll: (): Promise<HoldingsResponse> =>
    fetchApi('/holdings'),

  create: (data: CreateHoldingData): Promise<{ success: boolean; data: StockHolding }> =>
    fetchApi('/holdings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<CreateHoldingData>): Promise<{ success: boolean; data: StockHolding }> =>
    fetchApi(`/holdings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<{ success: boolean; message: string }> =>
    fetchApi(`/holdings/${id}`, {
      method: 'DELETE',
    }),
};

export const dividendsApi = {
  getAll: (): Promise<DividendsResponse> =>
    fetchApi('/dividends'),

  getByHolding: (holdingId: string): Promise<{ success: boolean; data: Dividend[] }> =>
    fetchApi(`/dividends/holding/${holdingId}`),

  create: (data: CreateDividendData): Promise<{ success: boolean; data: Dividend }> =>
    fetchApi('/dividends', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<{ success: boolean; message: string }> =>
    fetchApi(`/dividends/${id}`, {
      method: 'DELETE',
    }),
};

export default authApi;

