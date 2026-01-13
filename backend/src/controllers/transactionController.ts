import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';

const createTransactionSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().positive('Valor deve ser positivo'),
  type: z.enum(['INCOME', 'EXPENSE']).default('EXPENSE'),
  date: z.string().datetime().optional(),
  categoryId: z.string().uuid().optional().nullable(),
  ruleItemId: z.string().uuid().optional().nullable(),
  incomeRuleId: z.string().uuid().optional().nullable(),
});

const updateTransactionSchema = createTransactionSchema.partial();

const listTransactionsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  incomeRuleId: z.string().uuid().optional(),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
});

export async function getTransactions(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Não autorizado' });
      return;
    }

    const validation = listTransactionsSchema.safeParse(req.query);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Parâmetros inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { page, limit, startDate, endDate, categoryId, incomeRuleId, type } = validation.data;

    const where: Prisma.TransactionWhereInput = { userId };

    if (startDate) where.date = { ...where.date as object, gte: new Date(startDate) };
    if (endDate) where.date = { ...where.date as object, lte: new Date(endDate) };
    if (categoryId) where.categoryId = categoryId;
    if (incomeRuleId) where.incomeRuleId = incomeRuleId;
    if (type) where.type = type;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { 
          category: true,
          incomeRule: true,
          ruleItem: {
            include: {
              rule: true
            }
          }
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar transações' });
  }
}

export async function createTransaction(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Não autorizado' });
      return;
    }

    const validation = createTransactionSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { description, amount, type, date, categoryId, ruleItemId, incomeRuleId } = validation.data;

    // Verify category belongs to user if provided
    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, userId },
      });
      if (!category) {
        res.status(400).json({ success: false, message: 'Categoria não encontrada' });
        return;
      }
    }

    // Verify income rule belongs to user if provided
    if (incomeRuleId) {
      const incomeRule = await prisma.incomeRule.findFirst({
        where: { id: incomeRuleId, userId },
      });
      if (!incomeRule) {
        res.status(400).json({ success: false, message: 'Regra de orçamento não encontrada' });
        return;
      }
    }

    // Verify rule item belongs to user if provided
    if (ruleItemId) {
      const ruleItem = await prisma.ruleItem.findFirst({
        where: { 
          id: ruleItemId,
          rule: { userId }
        },
      });
      if (!ruleItem) {
        res.status(400).json({ success: false, message: 'Subitem de orçamento não encontrado' });
        return;
      }
    }

    const transaction = await prisma.transaction.create({
      data: {
        description,
        amount: new Prisma.Decimal(amount),
        type,
        date: date ? new Date(date) : new Date(),
        categoryId,
        incomeRuleId,
        ruleItemId,
        userId,
      },
      include: { 
        category: true,
        incomeRule: true,
        ruleItem: {
          include: {
            rule: true
          }
        }
      },
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ success: false, message: 'Erro ao criar transação' });
  }
}

export async function updateTransaction(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Não autorizado' });
      return;
    }

    const validation = updateTransactionSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const existing = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Transação não encontrada' });
      return;
    }

    const { amount, date, incomeRuleId, ...rest } = validation.data;
    
    // Verify income rule belongs to user if provided
    if (incomeRuleId) {
      const incomeRule = await prisma.incomeRule.findFirst({
        where: { id: incomeRuleId, userId },
      });
      if (!incomeRule) {
        res.status(400).json({ success: false, message: 'Regra de orçamento não encontrada' });
        return;
      }
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...rest,
        ...(amount !== undefined && { amount: new Prisma.Decimal(amount) }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(incomeRuleId !== undefined && { incomeRuleId }),
      },
      include: { 
        category: true,
        incomeRule: true,
        ruleItem: {
          include: {
            rule: true
          }
        }
      },
    });

    res.json({ success: true, data: transaction });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar transação' });
  }
}

export async function deleteTransaction(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Não autorizado' });
      return;
    }

    const existing = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Transação não encontrada' });
      return;
    }

    await prisma.transaction.delete({ where: { id } });

    res.json({ success: true, message: 'Transação deletada' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ success: false, message: 'Erro ao deletar transação' });
  }
}
