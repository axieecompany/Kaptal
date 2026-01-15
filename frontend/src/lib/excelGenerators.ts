import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

// Type definitions
interface SheetData {
  name: string;
  data: Record<string, unknown>[];
  headers?: string[];
}

// Helper to format currency for Excel
function formatCurrencyValue(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Helper to format date for Excel
function formatDateValue(date: Date | string): string {
  return new Date(date).toLocaleDateString('pt-BR');
}

// Generate Excel workbook with multiple sheets
export function generateExcelWorkbook(
  sheets: SheetData[],
  filename: string
): void {
  const workbook = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    // If headers provided, use them; otherwise get from first data row
    const headers = sheet.headers || (sheet.data.length > 0 ? Object.keys(sheet.data[0]) : []);
    
    // Create worksheet data with headers
    const wsData = [headers];
    
    // Add data rows
    sheet.data.forEach((row) => {
      const rowData = headers.map((header) => {
        const value = row[header];
        // Format values appropriately
        if (value === null || value === undefined) return '';
        if (typeof value === 'number') return value;
        if (value instanceof Date) return formatDateValue(value);
        return String(value);
      });
      wsData.push(rowData);
    });

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    const colWidths = headers.map((header) => {
      // Calculate max width based on header and data
      let maxWidth = header.length;
      sheet.data.forEach((row) => {
        const value = row[header];
        const strValue = value ? String(value) : '';
        maxWidth = Math.max(maxWidth, strValue.length);
      });
      return { wch: Math.min(maxWidth + 2, 50) }; // Max width of 50
    });
    worksheet['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name.substring(0, 31)); // Sheet names max 31 chars
  });

  // Generate file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}.xlsx`);
}

// Dashboard Excel generator
interface DashboardExcelData {
  userName: string;
  month: string;
  overview: {
    balance: number;
    income: number;
    expense: number;
  };
  monthlyHistory: Array<{
    month: string;
    year: number;
    income: number;
    expense: number;
  }>;
  recentTransactions: Array<{
    date: string;
    description: string;
    category: string;
    amount: number;
    type: string;
  }>;
}

export function generateDashboardExcel(data: DashboardExcelData): void {
  const sheets: SheetData[] = [
    {
      name: 'Resumo',
      headers: ['Métrica', 'Valor'],
      data: [
        { 'Métrica': 'Saldo do Mês', 'Valor': formatCurrencyValue(data.overview.balance) },
        { 'Métrica': 'Receitas', 'Valor': formatCurrencyValue(data.overview.income) },
        { 'Métrica': 'Despesas', 'Valor': formatCurrencyValue(data.overview.expense) },
      ],
    },
    {
      name: 'Histórico Mensal',
      headers: ['Mês', 'Ano', 'Receitas', 'Despesas', 'Saldo'],
      data: data.monthlyHistory.map((item) => ({
        'Mês': item.month,
        'Ano': item.year,
        'Receitas': formatCurrencyValue(item.income),
        'Despesas': formatCurrencyValue(item.expense),
        'Saldo': formatCurrencyValue(item.income - item.expense),
      })),
    },
    {
      name: 'Transações Recentes',
      headers: ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor'],
      data: data.recentTransactions.map((tx) => ({
        'Data': formatDateValue(tx.date),
        'Descrição': tx.description,
        'Categoria': tx.category,
        'Tipo': tx.type === 'INCOME' ? 'Receita' : 'Despesa',
        'Valor': formatCurrencyValue(tx.amount),
      })),
    },
  ];

  generateExcelWorkbook(sheets, `Kaptal_Dashboard_${data.month}`);
}

// Goals (Budget) Excel generator
interface GoalsExcelData {
  userName: string;
  month: string;
  baseIncome: number;
  categories: Array<{
    name: string;
    icon: string;
    percentage: number;
    budget: number;
    spent: number;
    remaining: number;
    utilizationPercentage: number;
  }>;
  totals: {
    totalBudget: number;
    totalSpent: number;
    totalRemaining: number;
  };
}

export function generateGoalsExcel(data: GoalsExcelData): void {
  const sheets: SheetData[] = [
    {
      name: 'Resumo',
      headers: ['Métrica', 'Valor'],
      data: [
        { 'Métrica': 'Renda Base', 'Valor': formatCurrencyValue(data.baseIncome) },
        { 'Métrica': 'Total Orçamento', 'Valor': formatCurrencyValue(data.totals.totalBudget) },
        { 'Métrica': 'Total Gasto', 'Valor': formatCurrencyValue(data.totals.totalSpent) },
        { 'Métrica': 'Total Restante', 'Valor': formatCurrencyValue(data.totals.totalRemaining) },
      ],
    },
    {
      name: 'Categorias',
      headers: ['Categoria', 'Ícone', 'Destinado %', 'Orçamento', 'Gasto', 'Restante', 'Utilização %'],
      data: data.categories.map((cat) => ({
        'Categoria': cat.name,
        'Ícone': cat.icon,
        'Destinado %': `${cat.percentage.toFixed(1)}%`,
        'Orçamento': formatCurrencyValue(cat.budget),
        'Gasto': formatCurrencyValue(cat.spent),
        'Restante': formatCurrencyValue(cat.remaining),
        'Utilização %': `${cat.utilizationPercentage.toFixed(1)}%`,
      })),
    },
  ];

  generateExcelWorkbook(sheets, `Kaptal_Orcamento_${data.month}`);
}

// Transactions Excel generator
interface TransactionsExcelData {
  userName: string;
  period: string;
  transactions: Array<{
    date: string;
    description: string;
    category: string;
    type: string;
    amount: number;
  }>;
  totals: {
    income: number;
    expense: number;
    balance: number;
  };
}

export function generateTransactionsExcel(data: TransactionsExcelData): void {
  const sheets: SheetData[] = [
    {
      name: 'Resumo',
      headers: ['Métrica', 'Valor'],
      data: [
        { 'Métrica': 'Período', 'Valor': data.period },
        { 'Métrica': 'Total Receitas', 'Valor': formatCurrencyValue(data.totals.income) },
        { 'Métrica': 'Total Despesas', 'Valor': formatCurrencyValue(data.totals.expense) },
        { 'Métrica': 'Saldo', 'Valor': formatCurrencyValue(data.totals.balance) },
        { 'Métrica': 'Quantidade de Transações', 'Valor': data.transactions.length },
      ],
    },
    {
      name: 'Transações',
      headers: ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor'],
      data: data.transactions.map((tx) => ({
        'Data': formatDateValue(tx.date),
        'Descrição': tx.description,
        'Categoria': tx.category,
        'Tipo': tx.type === 'INCOME' ? 'Receita' : 'Despesa',
        'Valor': formatCurrencyValue(tx.amount),
      })),
    },
  ];

  generateExcelWorkbook(sheets, `Kaptal_Extrato_${data.period.replace(/\s/g, '_')}`);
}

// Savings Goals Excel generator
interface SavingsExcelData {
  userName: string;
  goals: Array<{
    name: string;
    icon: string;
    targetAmount: number;
    currentAmount: number;
    remaining: number;
    progress: number;
    deadline: string;
    monthlyRequired: number;
    deposits: Array<{
      date: string;
      amount: number;
      note: string;
    }>;
  }>;
  totals: {
    totalTarget: number;
    totalSaved: number;
    activeGoals: number;
    completedGoals: number;
  };
}

export function generateSavingsExcel(data: SavingsExcelData): void {
  const sheets: SheetData[] = [
    {
      name: 'Resumo',
      headers: ['Métrica', 'Valor'],
      data: [
        { 'Métrica': 'Metas Ativas', 'Valor': data.totals.activeGoals },
        { 'Métrica': 'Metas Concluídas', 'Valor': data.totals.completedGoals },
        { 'Métrica': 'Total Guardado', 'Valor': formatCurrencyValue(data.totals.totalSaved) },
        { 'Métrica': 'Meta Total', 'Valor': formatCurrencyValue(data.totals.totalTarget) },
      ],
    },
    {
      name: 'Metas',
      headers: ['Meta', 'Ícone', 'Valor Alvo', 'Valor Atual', 'Faltando', 'Progresso', 'Prazo', 'Necessário/mês'],
      data: data.goals.map((goal) => ({
        'Meta': goal.name,
        'Ícone': goal.icon,
        'Valor Alvo': formatCurrencyValue(goal.targetAmount),
        'Valor Atual': formatCurrencyValue(goal.currentAmount),
        'Faltando': formatCurrencyValue(goal.remaining),
        'Progresso': `${goal.progress.toFixed(1)}%`,
        'Prazo': formatDateValue(goal.deadline),
        'Necessário/mês': formatCurrencyValue(goal.monthlyRequired),
      })),
    },
  ];

  // Add deposits sheet for each goal with deposits
  data.goals.forEach((goal) => {
    if (goal.deposits.length > 0) {
      sheets.push({
        name: `Depósitos - ${goal.name}`.substring(0, 31),
        headers: ['Data', 'Valor', 'Observação'],
        data: goal.deposits.map((dep) => ({
          'Data': formatDateValue(dep.date),
          'Valor': formatCurrencyValue(dep.amount),
          'Observação': dep.note || '-',
        })),
      });
    }
  });

  generateExcelWorkbook(sheets, `Kaptal_Metas_Economia`);
}
