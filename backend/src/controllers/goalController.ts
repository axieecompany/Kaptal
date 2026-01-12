import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';

const goalSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
  amount: z.number().positive('Valor deve ser positivo'),
});

export async function getGoal(req: Request, res: Response): Promise<void> {
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

    const goal = await prisma.monthlyGoal.findUnique({
      where: {
        userId_month_year: {
          userId,
          month: targetMonth,
          year: targetYear,
        },
      },
    });

    // Also get current spending
    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const spending = await prisma.transaction.aggregate({
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    });

    const spent = spending._sum.amount?.toNumber() || 0;
    const goalAmount = goal?.amount ? Number(goal.amount) : null;
    const remaining = goalAmount !== null ? goalAmount - spent : null;
    const percentage = goalAmount !== null && goalAmount > 0 ? (spent / goalAmount) * 100 : null;

    res.json({
      success: true,
      data: {
        goal: goal ? { ...goal, amount: Number(goal.amount) } : null,
        spent,
        remaining,
        percentage,
        month: targetMonth,
        year: targetYear,
      },
    });
  } catch (error) {
    console.error('Error getting goal:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar meta' });
  }
}

export async function setGoal(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Não autorizado' });
      return;
    }

    const validation = goalSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { month, year, amount } = validation.data;

    const goal = await prisma.monthlyGoal.upsert({
      where: {
        userId_month_year: {
          userId,
          month,
          year,
        },
      },
      update: {
        amount: new Prisma.Decimal(amount),
      },
      create: {
        userId,
        month,
        year,
        amount: new Prisma.Decimal(amount),
      },
    });

    res.json({ 
      success: true, 
      data: { ...goal, amount: Number(goal.amount) },
    });
  } catch (error) {
    console.error('Error setting goal:', error);
    res.status(500).json({ success: false, message: 'Erro ao definir meta' });
  }
}

export async function deleteGoal(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Não autorizado' });
      return;
    }

    const { month, year } = req.query;
    if (!month || !year) {
      res.status(400).json({ success: false, message: 'Mês e ano são obrigatórios' });
      return;
    }

    await prisma.monthlyGoal.delete({
      where: {
        userId_month_year: {
          userId,
          month: parseInt(month as string),
          year: parseInt(year as string),
        },
      },
    });

    res.json({ success: true, message: 'Meta removida' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ success: false, message: 'Erro ao remover meta' });
  }
}
