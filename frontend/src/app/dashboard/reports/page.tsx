'use client';

import DashboardPDF from '@/components/reports/DashboardPDF';
import GoalsPDF from '@/components/reports/GoalsPDF';
import MonthlyReportPDF from '@/components/reports/MonthlyReportPDF';
import SavingsPDF from '@/components/reports/SavingsPDF';
import TransactionsPDF from '@/components/reports/TransactionsPDF';
import {
    incomeRulesApi,
    savingsGoalsApi,
    statsApi,
    transactionsApi
} from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
    generateDashboardExcel,
    generateGoalsExcel,
    generateSavingsExcel,
    generateTransactionsExcel
} from '@/lib/excelGenerators';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import {
    ArrowLeftRight,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Download,
    FileBarChart,
    FileSpreadsheet,
    FileText,
    Loader2,
    PieChart,
    PiggyBank,
    Target
} from 'lucide-react';
import { useState } from 'react';

export default function ReportsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthLabel = currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Common wrapper for report generation with loading state
  const runReport = async (name: string, type: 'PDF' | 'EXCEL', generator: () => Promise<void>) => {
    setIsLoading(true);
    try {
      await generator();
    } catch (err) {
      console.error(`Error generating ${name} ${type}:`, err);
      // Optional: show error toast here
    } finally {
      setIsLoading(false);
    }
  };

  // --- REPORT GENERATORS ---

  const generateMonthlyConsolidated = async (format: 'PDF' | 'EXCEL') => {
    const month = currentMonth.getMonth() + 1;
    const year = currentMonth.getFullYear();

    // Fetch everything
    const [stats, rules, transactions, savings] = await Promise.all([
      statsApi.getOverview(),
      incomeRulesApi.getAll(month, year),
      transactionsApi.getAll({ startDate: new Date(year, month - 1, 1).toISOString(), endDate: new Date(year, month, 0).toISOString(), limit: 100 }),
      savingsGoalsApi.getAll()
    ]);

    if (format === 'PDF') {
      const baseIncome = rules.success ? (rules as any).baseIncome : 0;
      const doc = (
        <MonthlyReportPDF
          userName={user?.name || 'Usuário'}
          generatedAt={new Date()}
          month={monthLabel}
          dashboard={{
            balance: stats.data.balance,
            income: stats.data.income,
            expense: stats.data.expense,
          }}
          budgets={rules.success ? rules.data.map(r => ({
            name: r.name,
            budget: (baseIncome * r.percentage) / 100,
            spent: 0, 
            utilization: 0
          })) : []}
          transactions={transactions.data.map(t => ({
            date: t.date,
            description: t.description,
            category: t.category?.name || t.incomeRule?.name || 'Sem categoria',
            amount: Number(t.amount),
            type: t.type
          }))}
          savings={savings.success ? savings.data.map(s => ({
            name: s.name,
            target: s.targetAmount,
            current: s.currentAmount,
            progress: s.progress
          })) : []}
        />
      );

      const blob = await pdf(doc).toBlob();
      saveAs(blob, `Kaptal_Consolidado_${monthLabel.replace(' ', '_')}.pdf`);
    } else {
      // For consolidated Excel, we can just trigger multiple or create a combined one if library supports
      // In this version, we'll just generate the Dashboard Excel as it's the most high-level
      generateDashboardExcel({
        userName: user?.name || 'Usuário',
        month: monthLabel,
        overview: {
          balance: stats.data.balance,
          income: stats.data.income,
          expense: stats.data.expense,
        },
        monthlyHistory: [],
        recentTransactions: transactions.data.map(t => ({
          ...t,
          amount: Number(t.amount),
          category: t.category?.name || t.incomeRule?.name || 'Sem categoria'
        }))
      });
    }
  };

  const generateContextReport = async (page: 'dashboard' | 'goals' | 'transactions' | 'savings', format: 'PDF' | 'EXCEL') => {
    const month = currentMonth.getMonth() + 1;
    const year = currentMonth.getFullYear();

    if (page === 'dashboard') {
      const stats = await statsApi.getOverview();
      const history = await statsApi.getMonthly();
      const txs = await transactionsApi.getAll({ limit: 10 });
      const insights = await statsApi.getInsights();
      
      const recentTransactions = txs.data.map(t => ({
        id: t.id,
        date: t.date,
        description: t.description,
        category: t.category ? { name: t.category.name, icon: t.category.icon } : null,
        amount: Number(t.amount),
        type: t.type
      }));

      if (format === 'PDF') {
        const doc = <DashboardPDF 
          userName={user?.name || 'Usuário'} 
          generatedAt={new Date()} 
          month={monthLabel} 
          overview={{
            balance: stats.data.balance,
            income: stats.data.income,
            expense: stats.data.expense,
          }}
          insights={insights.data}
          monthlyHistory={history.data} 
          recentTransactions={recentTransactions} 
        />;
        const blob = await pdf(doc).toBlob();
        saveAs(blob, `Kaptal_Resumo_${monthLabel.replace(' ', '_')}.pdf`);
      } else {
        generateDashboardExcel({
          userName: user?.name || 'Usuário',
          month: monthLabel,
          overview: {
            balance: stats.data.balance,
            income: stats.data.income,
            expense: stats.data.expense,
          },
          monthlyHistory: history.data,
          recentTransactions: recentTransactions.map(t => ({
            ...t,
            category: t.category?.name || 'Sem categoria'
          }))
        });
      }
    } else if (page === 'goals') {
      const rulesRes = await incomeRulesApi.getAll(month, year);
      const baseIncome = rulesRes.success ? (rulesRes as any).baseIncome : 0;
      
      const categoriesForPDF = rulesRes.success ? rulesRes.data.map(r => ({
        name: r.name,
        icon: r.icon,
        percentage: r.percentage,
        budget: (baseIncome * r.percentage) / 100,
        spent: 0,
        remaining: (baseIncome * r.percentage) / 100,
        utilizationPercentage: 0,
        subitems: r.items.map(i => ({ name: i.name, spent: 0 }))
      })) : [];

      if (format === 'PDF') {
        const doc = <GoalsPDF 
          userName={user?.name || 'Usuário'} 
          generatedAt={new Date()} 
          month={monthLabel} 
          baseIncome={baseIncome} 
          categories={categoriesForPDF}
          totals={{ 
            totalBudget: baseIncome, 
            totalSpent: 0, 
            totalPercentage: 0 
          }} 
        />;
        const blob = await pdf(doc).toBlob();
        saveAs(blob, `Kaptal_Orcamento_${monthLabel.replace(' ', '_')}.pdf`);
      } else {
        generateGoalsExcel({
          userName: user?.name || 'Usuário',
          month: monthLabel,
          baseIncome: baseIncome,
          categories: categoriesForPDF,
          totals: { totalBudget: baseIncome, totalSpent: 0, totalRemaining: baseIncome }
        });
      }
    } else if (page === 'transactions') {
      const res = await transactionsApi.getAll({ 
        startDate: new Date(year, month - 1, 1).toISOString(), 
        endDate: new Date(year, month, 0).toISOString(), 
        limit: 1000 
      });
      const data = res.data;
      const income = data.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + Number(t.amount), 0);
      const expense = data.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + Number(t.amount), 0);

      if (format === 'PDF') {
        const doc = <TransactionsPDF 
          userName={user?.name || 'Usuário'} 
          generatedAt={new Date()} 
          period={monthLabel} 
          transactions={data.map(t => ({
            id: t.id,
            date: t.date,
            description: t.description,
            category: t.category?.name || t.incomeRule?.name || 'Sem categoria',
            amount: Number(t.amount),
            type: t.type as 'INCOME' | 'EXPENSE'
          }))} 
          totals={{ income, expense, balance: income - expense, count: data.length }} 
        />;
        const blob = await pdf(doc).toBlob();
        saveAs(blob, `Kaptal_Extrato_${monthLabel.replace(' ', '_')}.pdf`);
      } else {
        generateTransactionsExcel({
          userName: user?.name || 'Usuário',
          period: monthLabel,
          transactions: data.map(t => ({
            date: t.date,
            description: t.description,
            category: t.category?.name || t.incomeRule?.name || 'Sem categoria',
            type: t.type as 'INCOME' | 'EXPENSE',
            amount: Number(t.amount)
          })),
          totals: { income, expense, balance: income - expense }
        });
      }
    } else if (page === 'savings') {
      const res = await savingsGoalsApi.getAll();
      const goals = res.success ? res.data : [];
      
      if (format === 'PDF') {
        const doc = <SavingsPDF 
          userName={user?.name || 'Usuário'} 
          generatedAt={new Date()} 
          goals={goals.map(g => ({
            ...g,
            targetAmount: Number(g.targetAmount),
            currentAmount: Number(g.currentAmount),
            remaining: Number(g.targetAmount) - Number(g.currentAmount),
            deposits: (g as any).deposits?.map((d: any) => ({ ...d, amount: Number(d.amount) })) || []
          }))} 
          totals={{
            totalTarget: goals.reduce((acc, g) => acc + g.targetAmount, 0),
            totalSaved: goals.reduce((acc, g) => acc + g.currentAmount, 0),
            activeGoals: goals.filter(g => !g.isCompleted).length,
            completedGoals: goals.filter(g => g.isCompleted).length,
          }} 
        />;
        const blob = await pdf(doc).toBlob();
        saveAs(blob, `Kaptal_Metas.pdf`);
      } else {
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
      }
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Relatórios</h1>
        <p className="opacity-60 text-sm sm:text-base">Gere documentos profissionais das suas finanças</p>
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 rounded-xl bg-current/5 hover:bg-current/10 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-black capitalize min-w-[180px] text-center text-lg">
          {monthLabel}
        </span>
        <button
          onClick={handleNextMonth}
          className="p-2 rounded-xl bg-current/5 hover:bg-current/10 transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Main Consolidated Report */}
      <div className="glass-card p-8 border-2 border-primary-500/20 bg-primary-500/[0.02]">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-20 h-20 rounded-3xl bg-primary-500 flex items-center justify-center text-white shadow-xl shadow-primary-500/20">
            <FileBarChart className="w-10 h-10" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-black mb-2">Relatório Mensal Consolidado</h2>
            <p className="opacity-60 max-w-xl font-medium">
              Uma visão completa e integrada de tudo o que aconteceu no seu mês: dashboard, categorias de gastos, extrato detalhado e metas de economia.
            </p>
          </div>
          <div className="flex flex-col gap-3 min-w-[200px]">
            <button
              onClick={() => runReport('Consolidado', 'PDF', () => generateMonthlyConsolidated('PDF'))}
              disabled={isLoading}
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-500/10 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
              Baixar PDF
            </button>
            <button
              onClick={() => runReport('Consolidado', 'EXCEL', () => generateMonthlyConsolidated('EXCEL'))}
              disabled={isLoading}
              className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileSpreadsheet className="w-5 h-5" />}
              Gerar Excel
            </button>
          </div>
        </div>
      </div>

      {/* Specific Section Reports */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Dashboard */}
        <ReportCard 
          title="Resumo" 
          icon={<PieChart className="w-6 h-6" />}
          description="Evolução patrimonial e resumo de saldos"
          onPdf={() => runReport('Dashboard', 'PDF', () => generateContextReport('dashboard', 'PDF'))}
          onExcel={() => runReport('Dashboard', 'EXCEL', () => generateContextReport('dashboard', 'EXCEL'))}
          isLoading={isLoading}
        />
        
        {/* Goals */}
        <ReportCard 
          title="Gastos" 
          icon={<Target className="w-6 h-6" />}
          description="Distribuição por categorias e limites"
          onPdf={() => runReport('Gastos', 'PDF', () => generateContextReport('goals', 'PDF'))}
          onExcel={() => runReport('Gastos', 'EXCEL', () => generateContextReport('goals', 'EXCEL'))}
          isLoading={isLoading}
        />

        {/* Transactions */}
        <ReportCard 
          title="Extrato" 
          icon={<ArrowLeftRight className="w-6 h-6" />}
          description="Lista detalhada de todas as movimentações"
          onPdf={() => runReport('Extrato', 'PDF', () => generateContextReport('transactions', 'PDF'))}
          onExcel={() => runReport('Extrato', 'EXCEL', () => generateContextReport('transactions', 'EXCEL'))}
          isLoading={isLoading}
        />

        {/* Savings */}
        <ReportCard 
          title="Metas" 
          icon={<PiggyBank className="w-6 h-6" />}
          description="Progresso dos seus objetivos de economia"
          onPdf={() => runReport('Metas', 'PDF', () => generateContextReport('savings', 'PDF'))}
          onExcel={() => runReport('Metas', 'EXCEL', () => generateContextReport('savings', 'EXCEL'))}
          isLoading={isLoading}
        />
      </div>

      {/* Premium Features Info */}
      <div className="glass-card p-6 bg-amber-500/[0.02] border border-amber-500/20">
        <div className="flex gap-4 items-start">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-amber-600 mb-1">Recursos Premium</h3>
            <p className="opacity-70 text-sm font-medium leading-relaxed">
              Exportação para Excel e Relatórios Consolidados são recursos exclusivos para assinantes Kaptal Pro. Aproveite o controle total da sua vida financeira com ferramentas de nível profissional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportCard({ title, icon, description, onPdf, onExcel, isLoading }: any) {
  return (
    <div className="glass-card p-6 hover:shadow-xl hover:shadow-primary-500/5 transition-all group">
      <div className="w-12 h-12 rounded-2xl bg-current/5 flex items-center justify-center mb-4 group-hover:bg-primary-500 group-hover:text-white transition-all">
        {icon}
      </div>
      <h3 className="font-black text-lg mb-1">{title}</h3>
      <p className="text-sm opacity-50 font-medium leading-tight mb-6 h-10 overflow-hidden">
        {description}
      </p>
      <div className="flex flex-col gap-2">
        <button
          onClick={onPdf}
          disabled={isLoading}
          className="text-xs font-bold py-2 px-3 rounded-lg bg-current/5 hover:bg-current/10 flex items-center justify-between transition-all"
        >
          <span>Versão PDF</span>
          <Download className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onExcel}
          disabled={isLoading}
          className="text-xs font-bold py-2 px-3 rounded-lg text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 flex items-center justify-between transition-all"
        >
          <span>Arquivo Excel</span>
          <FileSpreadsheet className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
