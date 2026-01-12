import { IncomeRule, RuleItem } from '@prisma/client';
import type { Request, Response } from 'express';
import { prisma } from '../config/database.js';

type IncomeRuleWithItems = IncomeRule & { items: RuleItem[] };

export const incomeRuleController = {
  // Get all income rules for the authenticated user
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Não autorizado' });
        return;
      }

      const rules = await prisma.incomeRule.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        include: { items: { orderBy: { createdAt: 'asc' } } },
      });

      // Calculate total percentage
      const totalPercentage = rules.reduce(
        (sum: number, rule: IncomeRule) => sum + Number(rule.percentage),
        0
      );

      res.json({
        success: true,
        data: rules.map((rule: IncomeRuleWithItems) => ({
          ...rule,
          percentage: Number(rule.percentage),
          items: rule.items.map((item: RuleItem) => ({
            ...item,
            amount: Number(item.amount),
          })),
        })),
        totalPercentage,
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

      const { name, percentage, color, icon } = req.body;

      // Validate required fields
      if (!name || percentage === undefined) {
        res.status(400).json({
          success: false,
          message: 'Nome e porcentagem são obrigatórios',
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
        where: { userId },
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
          userId,
        },
        include: { items: true },
      });

      res.status(201).json({
        success: true,
        data: {
          ...rule,
          percentage: Number(rule.percentage),
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

  // Update an income rule
  async update(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Não autorizado' });
        return;
      }

      const { id } = req.params;
      const { name, percentage, color, icon } = req.body;

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
          where: { userId, id: { not: id } },
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
        },
        include: { items: true },
      });

      res.json({
        success: true,
        data: {
          ...updatedRule,
          percentage: Number(updatedRule.percentage),
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
};
