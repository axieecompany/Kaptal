import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';

const budgetSchema = z.object({
  categoryId: z.string().uuid('ID da categoria inválido'),
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
  amount: z.number().positive('Valor deve ser positivo'),
});

export async function getCategoryBudgets(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Não autorizado' });
      return;
    }

    const { month, year } = req.query;
    const now = new Date();
    const targetMonth = month ? parseInt(month as string) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year as string) : now.getFullYear();

    // Get all budgets for the month
    const budgets = await prisma.categoryBudget.findMany({
      where: {
        userId,
        month: targetMonth,
        year: targetYear,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          },
        },
      },
    });

    // Calculate date range for the month
    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    // Get spending per category
    const spending = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: startOfMonth, lte: endOfMonth },
        categoryId: { not: null },
      },
      _sum: { amount: true },
    });

    // Create a map of categoryId -> spent amount
    const spendingMap = new Map<string, number>();
    for (const item of spending) {
      if (item.categoryId) {
        spendingMap.set(item.categoryId, item._sum.amount?.toNumber() || 0);
      }
    }

    // Calculate totals
    let totalBudget = 0;
    let totalSpent = 0;

    const budgetData = budgets.map((budget) => {
      const budgetAmount = Number(budget.amount);
      const spent = spendingMap.get(budget.categoryId) || 0;
      const remaining = budgetAmount - spent;
      const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;

      totalBudget += budgetAmount;
      totalSpent += spent;

      return {
        id: budget.id,
        categoryId: budget.categoryId,
        categoryName: budget.category.name,
        categoryIcon: budget.category.icon,
        categoryColor: budget.category.color,
        budget: budgetAmount,
        spent,
        remaining,
        percentage: Math.round(percentage * 100) / 100,
      };
    });

    const totalPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const totalSavings = totalBudget - totalSpent;

    res.json({
      success: true,
      data: {
        budgets: budgetData,
        totals: {
          totalBudget,
          totalSpent,
          percentage: Math.round(totalPercentage * 100) / 100,
          savings: totalSavings,
        },
        month: targetMonth,
        year: targetYear,
      },
    });
  } catch (error) {
    console.error('Error getting category budgets:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar orçamentos' });
  }
}

export async function setCategoryBudget(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Não autorizado' });
      return;
    }

    const validation = budgetSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { categoryId, month, year, amount } = validation.data;

    // Verify category belongs to user
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId },
    });

    if (!category) {
      res.status(404).json({ success: false, message: 'Categoria não encontrada' });
      return;
    }

    const budget = await prisma.categoryBudget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId,
          categoryId,
          month,
          year,
        },
      },
      update: {
        amount: new Prisma.Decimal(amount),
      },
      create: {
        userId,
        categoryId,
        month,
        year,
        amount: new Prisma.Decimal(amount),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: { ...budget, amount: Number(budget.amount) },
    });
  } catch (error) {
    console.error('Error setting category budget:', error);
    res.status(500).json({ success: false, message: 'Erro ao definir orçamento' });
  }
}

export async function deleteCategoryBudget(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Não autorizado' });
      return;
    }

    const { categoryId } = req.params;
    const { month, year } = req.query;

    if (!month || !year) {
      res.status(400).json({ success: false, message: 'Mês e ano são obrigatórios' });
      return;
    }

    await prisma.categoryBudget.delete({
      where: {
        userId_categoryId_month_year: {
          userId,
          categoryId,
          month: parseInt(month as string),
          year: parseInt(year as string),
        },
      },
    });

    res.json({ success: true, message: 'Orçamento removido' });
  } catch (error) {
    console.error('Error deleting category budget:', error);
    res.status(500).json({ success: false, message: 'Erro ao remover orçamento' });
  }
}
