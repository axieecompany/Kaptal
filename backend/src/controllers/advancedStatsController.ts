import type { Request, Response } from 'express';
import { prisma } from '../config/database.js';

export async function getInsights(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Não autorizado' });
      return;
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const daysInMonth = endOfMonth.getDate();
    const currentDay = now.getDate();
    const daysRemaining = daysInMonth - currentDay;

    // Get current month income and expenses
    const [totalIncome, totalExpense] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId, type: 'INCOME', date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId, type: 'EXPENSE', date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
      }),
    ]);

    const income = totalIncome._sum.amount?.toNumber() || 0;
    const expense = totalExpense._sum.amount?.toNumber() || 0;
    const balance = income - expense;

    // === 1. DAYS UNTIL BROKE ===
    const dailyAverage = currentDay > 0 ? expense / currentDay : 0;
    const daysUntilBroke = dailyAverage > 0 && balance > 0 
      ? Math.floor(balance / dailyAverage)
      : balance <= 0 ? 0 : null;

    // === 2. END OF MONTH PROJECTION ===
    const projectedExpense = expense + (dailyAverage * daysRemaining);

    // === 3. PENDING INSTALLMENTS ===
    const pendingInstallments = await prisma.transaction.findMany({
      where: {
        userId,
        isInstallment: true,
        date: { gt: now },
      },
      select: {
        amount: true,
        date: true,
        description: true,
        installmentNumber: true,
        totalInstallments: true,
      },
      orderBy: { date: 'asc' },
    });

    // Group by month
    const installmentsByMonth: { [key: string]: number } = {};
    let totalInstallmentsAmount = 0;

    for (const installment of pendingInstallments) {
      const monthKey = new Date(installment.date).toLocaleDateString('pt-BR', { 
        month: 'short', 
        year: 'numeric' 
      });
      const amount = Number(installment.amount);
      installmentsByMonth[monthKey] = (installmentsByMonth[monthKey] || 0) + amount;
      totalInstallmentsAmount += amount;
    }

    const byMonth = Object.entries(installmentsByMonth).map(([month, amount]) => ({
      month,
      amount,
    }));

    // === 4. SAVINGS STREAK ===
    // Check last 12 months to find current streak and best streak
    const months: { month: Date; income: number; expense: number; saved: boolean }[] = [];
    
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);

      const [monthIncome, monthExpense] = await Promise.all([
        prisma.transaction.aggregate({
          where: { userId, type: 'INCOME', date: { gte: monthStart, lte: monthEnd } },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: { userId, type: 'EXPENSE', date: { gte: monthStart, lte: monthEnd } },
          _sum: { amount: true },
        }),
      ]);

      const inc = monthIncome._sum.amount?.toNumber() || 0;
      const exp = monthExpense._sum.amount?.toNumber() || 0;

      months.push({
        month: monthDate,
        income: inc,
        expense: exp,
        saved: inc > 0 && exp <= inc, // Had income and didn't exceed it
      });
    }

    // Calculate current streak (starting from last completed month, skip current month)
    let currentStreak = 0;
    for (let i = 1; i < months.length; i++) {
      if (months[i].saved) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate best streak
    let bestStreak = 0;
    let tempStreak = 0;
    for (let i = 1; i < months.length; i++) {
      if (months[i].saved) {
        tempStreak++;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // Last month result
    const lastMonthResult: 'success' | 'fail' | 'pending' = 
      months[1]?.income === 0 ? 'pending' :
      months[1]?.saved ? 'success' : 'fail';

    res.json({
      success: true,
      data: {
        daysUntilBroke,
        dailyAverage,
        balance,
        endOfMonthProjection: {
          projected: projectedExpense,
          current: expense,
          daysRemaining,
        },
        pendingInstallments: {
          total: totalInstallmentsAmount,
          count: pendingInstallments.length,
          byMonth,
        },
        savingsStreak: {
          current: currentStreak,
          best: Math.max(bestStreak, currentStreak),
          lastMonthResult,
        },
      },
    });
  } catch (error) {
    console.error('Error getting insights:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar insights' });
  }
}
