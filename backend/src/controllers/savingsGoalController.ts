import type { Request, Response } from 'express';
import { prisma } from '../config/database.js';

export const savingsGoalController = {
  // Get all savings goals for user
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const goals = await prisma.savingsGoal.findMany({
        where: { userId },
        include: {
          deposits: {
            orderBy: { date: 'desc' },
            take: 5,
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const goalsWithProgress = goals.map(goal => {
        const targetAmount = Number(goal.targetAmount);
        const currentAmount = Number(goal.currentAmount);
        const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
        
        const now = new Date();
        const deadline = new Date(goal.deadline);
        const monthsRemaining = Math.max(1, 
          (deadline.getFullYear() - now.getFullYear()) * 12 + 
          (deadline.getMonth() - now.getMonth())
        );
        const remaining = targetAmount - currentAmount;
        const monthlyRequired = remaining > 0 ? remaining / monthsRemaining : 0;
        
        const expectedProgress = ((new Date().getTime() - new Date(goal.createdAt).getTime()) / 
          (deadline.getTime() - new Date(goal.createdAt).getTime())) * 100;
        
        let status: 'on_track' | 'behind' | 'completed' | 'overdue' = 'on_track';
        if (goal.isCompleted) {
          status = 'completed';
        } else if (deadline < now) {
          status = 'overdue';
        } else if (progress < expectedProgress - 10) {
          status = 'behind';
        }

        return {
          ...goal,
          targetAmount,
          currentAmount,
          progress: Math.min(100, progress),
          monthlyRequired,
          monthsRemaining,
          remaining,
          status,
          deposits: goal.deposits.map(d => ({
            ...d,
            amount: Number(d.amount),
          })),
        };
      });

      res.json({ success: true, data: goalsWithProgress });
    } catch (error) {
      console.error('Error fetching savings goals:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Create new savings goal
  async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { name, targetAmount, deadline, icon, color } = req.body;

      if (!name || !targetAmount || !deadline) {
        res.status(400).json({ 
          success: false, 
          message: 'Nome, valor alvo e prazo são obrigatórios' 
        });
        return;
      }

      const goal = await prisma.savingsGoal.create({
        data: {
          name,
          targetAmount,
          deadline: new Date(deadline),
          icon: icon || '🎯',
          color: color || '#6366f1',
          userId,
        },
      });

      res.status(201).json({ 
        success: true, 
        data: {
          ...goal,
          targetAmount: Number(goal.targetAmount),
          currentAmount: Number(goal.currentAmount),
        },
      });
    } catch (error) {
      console.error('Error creating savings goal:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Update savings goal
  async update(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const { name, targetAmount, deadline, icon, color, isCompleted } = req.body;

      const existing = await prisma.savingsGoal.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        res.status(404).json({ success: false, message: 'Meta não encontrada' });
        return;
      }

      const goal = await prisma.savingsGoal.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(targetAmount && { targetAmount }),
          ...(deadline && { deadline: new Date(deadline) }),
          ...(icon && { icon }),
          ...(color && { color }),
          ...(typeof isCompleted === 'boolean' && { isCompleted }),
        },
      });

      res.json({ 
        success: true, 
        data: {
          ...goal,
          targetAmount: Number(goal.targetAmount),
          currentAmount: Number(goal.currentAmount),
        },
      });
    } catch (error) {
      console.error('Error updating savings goal:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Delete savings goal
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      const existing = await prisma.savingsGoal.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        res.status(404).json({ success: false, message: 'Meta não encontrada' });
        return;
      }

      await prisma.savingsGoal.delete({ where: { id } });

      res.json({ success: true, message: 'Meta excluída com sucesso' });
    } catch (error) {
      console.error('Error deleting savings goal:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Make a deposit to a goal
  async deposit(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const { amount, note, date } = req.body;

      if (!amount || amount <= 0) {
        res.status(400).json({ 
          success: false, 
          message: 'Valor do depósito deve ser maior que zero' 
        });
        return;
      }

      const goal = await prisma.savingsGoal.findFirst({
        where: { id, userId },
      });

      if (!goal) {
        res.status(404).json({ success: false, message: 'Meta não encontrada' });
        return;
      }

      const [deposit, updatedGoal] = await prisma.$transaction([
        prisma.savingsDeposit.create({
          data: {
            amount,
            note,
            date: date ? new Date(date) : new Date(),
            goalId: id,
          },
        }),
        prisma.savingsGoal.update({
          where: { id },
          data: {
            currentAmount: {
              increment: amount,
            },
          },
        }),
      ]);

      const newCurrentAmount = Number(updatedGoal.currentAmount);
      const targetAmount = Number(updatedGoal.targetAmount);
      
      if (newCurrentAmount >= targetAmount && !updatedGoal.isCompleted) {
        await prisma.savingsGoal.update({
          where: { id },
          data: { isCompleted: true },
        });
      }

      res.status(201).json({ 
        success: true, 
        data: {
          deposit: {
            ...deposit,
            amount: Number(deposit.amount),
          },
          goal: {
            ...updatedGoal,
            targetAmount,
            currentAmount: newCurrentAmount,
            isCompleted: newCurrentAmount >= targetAmount,
          },
        },
      });
    } catch (error) {
      console.error('Error making deposit:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get deposits for a goal
  async getDeposits(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      const goal = await prisma.savingsGoal.findFirst({
        where: { id, userId },
      });

      if (!goal) {
        res.status(404).json({ success: false, message: 'Meta não encontrada' });
        return;
      }

      const deposits = await prisma.savingsDeposit.findMany({
        where: { goalId: id },
        orderBy: { date: 'desc' },
      });

      res.json({ 
        success: true, 
        data: deposits.map(d => ({
          ...d,
          amount: Number(d.amount),
        })),
      });
    } catch (error) {
      console.error('Error fetching deposits:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Delete a deposit
  async deleteDeposit(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id, depositId } = req.params;

      const goal = await prisma.savingsGoal.findFirst({
        where: { id, userId },
      });

      if (!goal) {
        res.status(404).json({ success: false, message: 'Meta não encontrada' });
        return;
      }

      const deposit = await prisma.savingsDeposit.findFirst({
        where: { id: depositId, goalId: id },
      });

      if (!deposit) {
        res.status(404).json({ success: false, message: 'Depósito não encontrado' });
        return;
      }

      await prisma.$transaction([
        prisma.savingsDeposit.delete({ where: { id: depositId } }),
        prisma.savingsGoal.update({
          where: { id },
          data: {
            currentAmount: {
              decrement: deposit.amount,
            },
            isCompleted: false,
          },
        }),
      ]);

      res.json({ success: true, message: 'Depósito excluído com sucesso' });
    } catch (error) {
      console.error('Error deleting deposit:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
};
