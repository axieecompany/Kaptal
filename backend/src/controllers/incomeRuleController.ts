import { IncomeRule, RuleItem } from '@prisma/client';
import type { Request, Response } from 'express';
import { prisma } from '../config/database.js';

type IncomeRuleWithItems = IncomeRule & { items: RuleItem[] };

export const incomeRuleController = {
  // Get all income rules for the authenticated user for a specific month
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Não autorizado' });
        return;
      }

      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      const year = parseInt(req.query.year as string) || new Date().getFullYear();

      // Try to get rules for the specific month
      let rules = await prisma.incomeRule.findMany({
        where: { userId, month, year },
        orderBy: { createdAt: 'asc' },
        include: { items: { orderBy: { createdAt: 'asc' } } },
      });

      let usingFallback = false;
      let fallbackMonth = month;
      let fallbackYear = year;

      // If no rules for this month, try to get from previous months
      if (rules.length === 0) {
        // Get most recent rules before this month
        const previousRules = await prisma.incomeRule.findMany({
          where: {
            userId,
            OR: [
              { year: { lt: year } },
              { year, month: { lt: month } },
            ],
          },
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          take: 1,
        });

        if (previousRules.length > 0) {
          fallbackMonth = previousRules[0].month;
          fallbackYear = previousRules[0].year;

          rules = await prisma.incomeRule.findMany({
            where: { userId, month: fallbackMonth, year: fallbackYear },
            orderBy: { createdAt: 'asc' },
            include: { items: { orderBy: { createdAt: 'asc' } } },
          });
          usingFallback = true;
        }
      }

      // Calculate total percentage
      const totalPercentage = rules.reduce(
        (sum: number, rule: IncomeRule) => sum + Number(rule.percentage),
        0
      );

      // Get base income (from first rule or default)
      const baseIncome = rules.length > 0 ? Number(rules[0].baseIncome) : 5000;

      // FETCH SPENDING DATA FOR ALL RULES AND ITEMS IN ONE GO
      // 1. Define date range for the requested month
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59);

      // 2. Fetch all transactions for this user in this month
      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          type: 'EXPENSE',
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
          OR: [
            { incomeRuleId: { in: rules.map(r => r.id) } },
            { ruleItemId: { in: rules.flatMap(r => r.items.map(i => i.id)) } }
          ]
        }
      });

      // 3. Aggregate spending
      const ruleSpendingMap = new Map<string, number>();
      const itemSpendingMap = new Map<string, number>();

      transactions.forEach(t => {
        if (t.incomeRuleId) {
          ruleSpendingMap.set(t.incomeRuleId, (ruleSpendingMap.get(t.incomeRuleId) || 0) + Number(t.amount));
        }
        if (t.ruleItemId) {
          itemSpendingMap.set(t.ruleItemId, (itemSpendingMap.get(t.ruleItemId) || 0) + Number(t.amount));
          
          // Also count towards the parent rule if not already counted via incomeRuleId
          // This ensures that transactions assigned ONLY to an item are still reflected in the rule total
          const item = rules.flatMap(r => r.items).find(i => i.id === t.ruleItemId);
          if (item && !t.incomeRuleId) {
            ruleSpendingMap.set(item.ruleId, (ruleSpendingMap.get(item.ruleId) || 0) + Number(t.amount));
          }
        }
      });

      res.json({
        success: true,
        data: rules.map((rule: IncomeRuleWithItems) => {
          const totalSpent = ruleSpendingMap.get(rule.id) || 0;
          const budgetAmount = (baseIncome * Number(rule.percentage)) / 100;
          
          return {
            ...rule,
            percentage: Number(rule.percentage),
            baseIncome: Number(rule.baseIncome),
            spending: {
              totalSpent,
              budgetAmount,
              remaining: budgetAmount - totalSpent,
              percentage: budgetAmount > 0 ? (totalSpent / budgetAmount) * 100 : 0,
              isOverBudget: totalSpent > budgetAmount,
            },
            items: rule.items.map((item: RuleItem) => {
              const itemSpent = itemSpendingMap.get(item.id) || 0;
              const itemBudget = Number(item.amount);
              return {
                ...item,
                amount: itemBudget,
                spending: {
                  totalSpent: itemSpent,
                  remaining: itemBudget - itemSpent,
                  percentage: itemBudget > 0 ? (itemSpent / itemBudget) * 100 : 0,
                  isOverBudget: itemSpent > itemBudget,
                }
              };
            }),
          };
        }),
        totalPercentage,
        baseIncome,
        month: usingFallback ? fallbackMonth : month,
        year: usingFallback ? fallbackYear : year,
        usingFallback,
        requestedMonth: month,
        requestedYear: year,
      });
    } catch (error) {
      console.error('Error fetching income rules:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar regras de distribuição',
      });
    }
  },

  // Create a new income rule
  async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Não autorizado' });
        return;
      }

      const { name, percentage, color, icon, month, year, baseIncome } = req.body;

      // Validate required fields
      if (!name || percentage === undefined || !month || !year) {
        res.status(400).json({
          success: false,
          message: 'Nome, porcentagem, mês e ano são obrigatórios',
        });
        return;
      }

      // Validate percentage (allow 0)
      if (percentage < 0 || percentage > 100) {
        res.status(400).json({
          success: false,
          message: 'Porcentagem deve ser entre 0 e 100',
        });
        return;
      }

      // Check if adding this rule would exceed 100%
      const existingRules = await prisma.incomeRule.findMany({
        where: { userId, month, year },
      });

      const currentTotal = existingRules.reduce(
        (sum: number, rule: IncomeRule) => sum + Number(rule.percentage),
        0
      );

      if (currentTotal + percentage > 100) {
        res.status(400).json({
          success: false,
          message: `Porcentagem total excederia 100%. Disponível: ${(100 - currentTotal).toFixed(2)}%`,
        });
        return;
      }

      const rule = await prisma.incomeRule.create({
        data: {
          name,
          percentage,
          color: color || '#6366f1',
          icon: icon || '💰',
          month,
          year,
          baseIncome: baseIncome || 5000,
          userId,
        },
        include: { items: true },
      });

      res.status(201).json({
        success: true,
        data: {
          ...rule,
          percentage: Number(rule.percentage),
          baseIncome: Number(rule.baseIncome),
          items: [],
        },
      });
    } catch (error) {
      console.error('Error creating income rule:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao criar regra de distribuição',
      });
    }
  },

  // Copy rules from one month to another
  async copyFromMonth(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Não autorizado' });
        return;
      }

      const { fromMonth, fromYear, toMonth, toYear, baseIncome } = req.body;

      if (!fromMonth || !fromYear || !toMonth || !toYear) {
        res.status(400).json({
          success: false,
          message: 'Mês e ano de origem e destino são obrigatórios',
        });
        return;
      }

      // Check if target month already has rules
      const existingRules = await prisma.incomeRule.findMany({
        where: { userId, month: toMonth, year: toYear },
      });

      if (existingRules.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Já existem regras para este mês. Delete-as primeiro.',
        });
        return;
      }

      // Get source rules with their items
      const sourceRules = await prisma.incomeRule.findMany({
        where: { userId, month: fromMonth, year: fromYear },
        include: { items: true },
      });

      if (sourceRules.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Não há regras no mês de origem',
        });
        return;
      }

      // Copy each rule with its items
      for (const sourceRule of sourceRules) {
        const newRule = await prisma.incomeRule.create({
          data: {
            name: sourceRule.name,
            percentage: sourceRule.percentage,
            color: sourceRule.color,
            icon: sourceRule.icon,
            month: toMonth,
            year: toYear,
            baseIncome: baseIncome || sourceRule.baseIncome,
            userId,
          },
        });

        // Copy items
        for (const item of sourceRule.items) {
          await prisma.ruleItem.create({
            data: {
              name: item.name,
              amount: item.amount,
              ruleId: newRule.id,
            },
          });
        }
      }

      res.json({
        success: true,
        message: `${sourceRules.length} regras copiadas com sucesso`,
      });
    } catch (error) {
      console.error('Error copying rules:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao copiar regras',
      });
    }
  },

  // Update an income rule
  async update(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Não autorizado' });
        return;
      }

      const { id } = req.params;
      const { name, percentage, color, icon, baseIncome } = req.body;

      // Check if rule exists and belongs to user
      const existingRule = await prisma.incomeRule.findFirst({
        where: { id, userId },
      });

      if (!existingRule) {
        res.status(404).json({
          success: false,
          message: 'Regra não encontrada',
        });
        return;
      }

      // If updating percentage, validate it
      if (percentage !== undefined) {
        if (percentage < 0 || percentage > 100) {
          res.status(400).json({
            success: false,
            message: 'Porcentagem deve ser entre 0 e 100',
          });
          return;
        }

        // Check if updating this rule would exceed 100%
        const otherRules = await prisma.incomeRule.findMany({
          where: { 
            userId, 
            id: { not: id },
            month: existingRule.month,
            year: existingRule.year,
          },
        });

        const otherTotal = otherRules.reduce(
          (sum: number, rule: IncomeRule) => sum + Number(rule.percentage),
          0
        );

        if (otherTotal + percentage > 100) {
          res.status(400).json({
            success: false,
            message: `Porcentagem total excederia 100%. Disponível: ${(100 - otherTotal).toFixed(2)}%`,
          });
          return;
        }
      }

      const updatedRule = await prisma.incomeRule.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(percentage !== undefined && { percentage }),
          ...(color && { color }),
          ...(icon && { icon }),
          ...(baseIncome !== undefined && { baseIncome }),
        },
        include: { items: true },
      });

      // If updating baseIncome, update all rules in the same month
      if (baseIncome !== undefined) {
        await prisma.incomeRule.updateMany({
          where: { 
            userId, 
            month: existingRule.month, 
            year: existingRule.year,
          },
          data: { baseIncome },
        });
      }

      res.json({
        success: true,
        data: {
          ...updatedRule,
          percentage: Number(updatedRule.percentage),
          baseIncome: Number(updatedRule.baseIncome),
          items: updatedRule.items.map((item: RuleItem) => ({
            ...item,
            amount: Number(item.amount),
          })),
        },
      });
    } catch (error) {
      console.error('Error updating income rule:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar regra de distribuição',
      });
    }
  },

  // Delete an income rule
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Não autorizado' });
        return;
      }

      const { id } = req.params;

      // Check if rule exists and belongs to user
      const existingRule = await prisma.incomeRule.findFirst({
        where: { id, userId },
      });

      if (!existingRule) {
        res.status(404).json({
          success: false,
          message: 'Regra não encontrada',
        });
        return;
      }

      await prisma.incomeRule.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Regra excluída com sucesso',
      });
    } catch (error) {
      console.error('Error deleting income rule:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao excluir regra de distribuição',
      });
    }
  },

  // Add item to a rule
  async addItem(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Não autorizado' });
        return;
      }

      const { ruleId } = req.params;
      const { name, amount } = req.body;

      // Validate required fields
      if (!name || amount === undefined) {
        res.status(400).json({
          success: false,
          message: 'Nome e valor são obrigatórios',
        });
        return;
      }

      // Check if rule exists and belongs to user
      const rule = await prisma.incomeRule.findFirst({
        where: { id: ruleId, userId },
        include: { items: true },
      });

      if (!rule) {
        res.status(404).json({
          success: false,
          message: 'Regra não encontrada',
        });
        return;
      }

      const item = await prisma.ruleItem.create({
        data: {
          name,
          amount,
          ruleId,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          ...item,
          amount: Number(item.amount),
        },
      });
    } catch (error) {
      console.error('Error adding item:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao adicionar item',
      });
    }
  },

  // Update an item
  async updateItem(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Não autorizado' });
        return;
      }

      const { ruleId, itemId } = req.params;
      const { name, amount } = req.body;

      // Check if rule exists and belongs to user
      const rule = await prisma.incomeRule.findFirst({
        where: { id: ruleId, userId },
      });

      if (!rule) {
        res.status(404).json({
          success: false,
          message: 'Regra não encontrada',
        });
        return;
      }

      // Check if item exists
      const existingItem = await prisma.ruleItem.findFirst({
        where: { id: itemId, ruleId },
      });

      if (!existingItem) {
        res.status(404).json({
          success: false,
          message: 'Item não encontrado',
        });
        return;
      }

      const updatedItem = await prisma.ruleItem.update({
        where: { id: itemId },
        data: {
          ...(name && { name }),
          ...(amount !== undefined && { amount }),
        },
      });

      res.json({
        success: true,
        data: {
          ...updatedItem,
          amount: Number(updatedItem.amount),
        },
      });
    } catch (error) {
      console.error('Error updating item:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar item',
      });
    }
  },

  // Delete an item
  async deleteItem(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Não autorizado' });
        return;
      }

      const { ruleId, itemId } = req.params;

      // Check if rule exists and belongs to user
      const rule = await prisma.incomeRule.findFirst({
        where: { id: ruleId, userId },
      });

      if (!rule) {
        res.status(404).json({
          success: false,
          message: 'Regra não encontrada',
        });
        return;
      }

      // Check if item exists
      const existingItem = await prisma.ruleItem.findFirst({
        where: { id: itemId, ruleId },
      });

      if (!existingItem) {
        res.status(404).json({
          success: false,
          message: 'Item não encontrado',
        });
        return;
      }

      await prisma.ruleItem.delete({
        where: { id: itemId },
      });

      res.json({
        success: true,
        message: 'Item excluído com sucesso',
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao excluir item',
      });
    }
  },

  // Reset rules for a specific month to defaults
  async resetToDefaults(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Não autorizado' });
        return;
      }

      const { month, year, baseIncome } = req.body;

      if (!month || !year || !baseIncome) {
        res.status(400).json({
          success: false,
          message: 'Mês, ano e renda base são obrigatórios',
        });
        return;
      }

      // Default rules configuration
      const DEFAULT_RULES = [
        { name: 'Metas', percentage: 10, color: '#f59e0b', icon: '🎯' },
        { name: 'Conforto', percentage: 15, color: '#3b82f6', icon: '✨' },
        { name: 'Prazeres', percentage: 10, color: '#ec4899', icon: '🎉' },
        { name: 'Custo Fixo', percentage: 35, color: '#ef4444', icon: '🏠' },
        { name: 'Liberdade Financeira', percentage: 25, color: '#22c55e', icon: '💰' },
        { name: 'Conhecimento', percentage: 5, color: '#8b5cf6', icon: '📚' },
      ];

      // Delete all existing rules for this month (cascade deletes items)
      await prisma.incomeRule.deleteMany({
        where: { userId, month, year },
      });

      // Create new default rules
      const createdRules = [];
      for (const rule of DEFAULT_RULES) {
        const newRule = await prisma.incomeRule.create({
          data: {
            name: rule.name,
            percentage: rule.percentage,
            color: rule.color,
            icon: rule.icon,
            month,
            year,
            baseIncome,
            userId,
          },
          include: { items: true },
        });
        createdRules.push({
          ...newRule,
          percentage: Number(newRule.percentage),
          baseIncome: Number(newRule.baseIncome),
          items: [],
        });
      }

      res.json({
        success: true,
        message: 'Categorias redefinidas com sucesso para este mês',
        data: createdRules,
      });
    } catch (error) {
      console.error('Error resetting rules:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao redefinir categorias',
      });
    }
  },

  // Get spending for a specific rule item
  async getItemSpending(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Não autorizado' });
        return;
      }

      const { ruleId, itemId } = req.params;

      // Verify the rule item belongs to the user
      const ruleItem = await prisma.ruleItem.findFirst({
        where: {
          id: itemId,
          ruleId,
          rule: { userId },
        },
        include: {
          rule: true,
        },
      });

      if (!ruleItem) {
        res.status(404).json({
          success: false,
          message: 'Subitem não encontrado',
        });
        return;
      }

      // Calculate the date range for the month from the rule
      const startOfMonth = new Date(ruleItem.rule.year, ruleItem.rule.month - 1, 1);
      const endOfMonth = new Date(ruleItem.rule.year, ruleItem.rule.month, 0, 23, 59, 59);

      // Get all transactions for this rule item in the same month
      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          ruleItemId: itemId,
          type: 'EXPENSE',
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        orderBy: { date: 'desc' },
      });

      // Calculate total spent
      const totalSpent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const budgetAmount = Number(ruleItem.amount);
      const remaining = budgetAmount - totalSpent;
      const percentage = budgetAmount > 0 ? (totalSpent / budgetAmount) * 100 : 0;

      res.json({
        success: true,
        data: {
          ruleItem: {
            id: ruleItem.id,
            name: ruleItem.name,
            budget: budgetAmount,
          },
          totalSpent,
          remaining,
          percentage: Math.round(percentage * 100) / 100,
          isOverBudget: totalSpent > budgetAmount,
          overAmount: totalSpent > budgetAmount ? totalSpent - budgetAmount : 0,
          transactionCount: transactions.length,
        },
      });
    } catch (error) {
      console.error('Error getting item spending:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar gastos do subitem',
      });
    }
  },

  // Get total spending for a rule (including items and direct spending)
  async getRuleSpending(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Não autorizado' });
        return;
      }

      const { ruleId } = req.params;

      const rule = await prisma.incomeRule.findFirst({
        where: { id: ruleId, userId },
      });

      if (!rule) {
        res.status(404).json({ success: false, message: 'Regra não encontrada' });
        return;
      }

      const startOfMonth = new Date(rule.year, rule.month - 1, 1);
      const endOfMonth = new Date(rule.year, rule.month, 0, 23, 59, 59);

      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          type: 'EXPENSE',
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
          OR: [
            { incomeRuleId: ruleId },
            { ruleItem: { ruleId } }
          ]
        },
      });

      const totalSpent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const budgetAmount = (Number(rule.baseIncome) * Number(rule.percentage)) / 100;

      res.json({
        success: true,
        data: {
          ruleId: rule.id,
          totalSpent,
          budgetAmount,
          remaining: budgetAmount - totalSpent,
          percentage: budgetAmount > 0 ? (totalSpent / budgetAmount) * 100 : 0,
          isOverBudget: totalSpent > budgetAmount,
          transactionCount: transactions.length,
        },
      });
    } catch (error) {
      console.error('Error getting rule spending:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar gastos da regra',
      });
    }
  },
};
