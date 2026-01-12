import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';

const dateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function getOverview(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Não autorizado' });
      return;
    }

    // Get current month range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [totalIncome, totalExpense, recentTransactions] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId, type: 'INCOME', date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId, type: 'EXPENSE', date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
      }),
      prisma.transaction.findMany({
        where: { userId },
        include: { category: true },
        orderBy: { date: 'desc' },
        take: 5,
      }),
    ]);

    const income = totalIncome._sum.amount?.toNumber() || 0;
    const expense = totalExpense._sum.amount?.toNumber() || 0;

    res.json({
      success: true,
      data: {
        income,
        expense,
        balance: income - expense,
        recentTransactions,
        period: {
          start: startOfMonth.toISOString(),
          end: endOfMonth.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Error getting overview:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar resumo' });
  }
}

export async function getStatsByCategory(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Não autorizado' });
      return;
    }

    const validation = dateRangeSchema.safeParse(req.query);
    if (!validation.success) {
      res.status(400).json({ success: false, message: 'Parâmetros inválidos' });
      return;
    }

    const { startDate, endDate } = validation.data;

    // Default to current month
    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Get totals by category
    const categoryTotals = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: start, lte: end },
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    // Get category details
    const categoryIds = categoryTotals.map(c => c.categoryId).filter(Boolean) as string[];
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      include: { parent: true },
    });

    const categoryMap = new Map(categories.map(c => [c.id, c]));

    const stats = categoryTotals.map(ct => {
      const category = ct.categoryId ? categoryMap.get(ct.categoryId) : null;
      return {
        categoryId: ct.categoryId,
        categoryName: category?.name || 'Sem categoria',
        categoryIcon: category?.icon || '📦',
        categoryColor: category?.color || '#9ca3af',
        parentId: category?.parentId,
        parentName: category?.parent?.name,
        total: ct._sum.amount?.toNumber() || 0,
      };
    });

    const grandTotal = stats.reduce((sum, s) => sum + s.total, 0);

    res.json({
      success: true,
      data: {
        stats,
        total: grandTotal,
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Error getting category stats:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar estatísticas' });
  }
}

export async function getMonthlyHistory(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Não autorizado' });
      return;
    }

    // Get last 6 months
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      const [income, expense] = await Promise.all([
        prisma.transaction.aggregate({
          where: { userId, type: 'INCOME', date: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: { userId, type: 'EXPENSE', date: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
      ]);

      months.push({
        month: date.toLocaleString('pt-BR', { month: 'short' }),
        year: date.getFullYear(),
        income: income._sum.amount?.toNumber() || 0,
        expense: expense._sum.amount?.toNumber() || 0,
      });
    }

    res.json({ success: true, data: months });
  } catch (error) {
    console.error('Error getting monthly history:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar histórico' });
  }
}
