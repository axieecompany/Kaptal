import type { Request, Response } from 'express';
import { prisma } from '../config/database.js';

export const dividendController = {
  // Get all dividends for a holding
  async getByHolding(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { holdingId } = req.params;

      const holding = await prisma.stockHolding.findFirst({
        where: { id: holdingId, userId },
      });

      if (!holding) {
        res.status(404).json({ success: false, message: 'Ativo não encontrado' });
        return;
      }

      const dividends = await prisma.dividend.findMany({
        where: { holdingId },
        orderBy: { date: 'desc' },
      });

      res.json({
        success: true,
        data: dividends.map(d => ({
          ...d,
          amount: Number(d.amount),
        })),
      });
    } catch (error) {
      console.error('Error fetching dividends:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get all dividends for user (for charts)
  async getAllForUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      // Get dividends from last 12 months
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const dividends = await prisma.dividend.findMany({
        where: {
          holding: { userId },
          date: { gte: twelveMonthsAgo },
        },
        include: {
          holding: {
            select: { symbol: true, name: true },
          },
        },
        orderBy: { date: 'desc' },
      });

      // Group by type for pie chart
      const byType = dividends.reduce((acc, d) => {
        const type = d.type;
        if (!acc[type]) acc[type] = 0;
        acc[type] += Number(d.amount);
        return acc;
      }, {} as Record<string, number>);

      // Group by month for bar chart
      const byMonth = dividends.reduce((acc, d) => {
        const month = new Date(d.date).toISOString().slice(0, 7); // YYYY-MM
        if (!acc[month]) acc[month] = 0;
        acc[month] += Number(d.amount);
        return acc;
      }, {} as Record<string, number>);

      // Calculate averages
      const totalAmount = dividends.reduce((sum, d) => sum + Number(d.amount), 0);
      const monthlyAverage = totalAmount / 12;

      res.json({
        success: true,
        data: {
          dividends: dividends.map(d => ({
            ...d,
            amount: Number(d.amount),
          })),
          byType,
          byMonth,
          summary: {
            total: totalAmount,
            monthlyAverage,
            count: dividends.length,
          },
        },
      });
    } catch (error) {
      console.error('Error fetching dividends:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Create dividend
  async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { holdingId, amount, type, date } = req.body;

      if (!holdingId || !amount || !type) {
        res.status(400).json({
          success: false,
          message: 'Ativo, valor e tipo são obrigatórios',
        });
        return;
      }

      const holding = await prisma.stockHolding.findFirst({
        where: { id: holdingId, userId },
      });

      if (!holding) {
        res.status(404).json({ success: false, message: 'Ativo não encontrado' });
        return;
      }

      const dividend = await prisma.dividend.create({
        data: {
          amount,
          type,
          date: date ? new Date(date) : new Date(),
          holdingId,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          ...dividend,
          amount: Number(dividend.amount),
        },
      });
    } catch (error) {
      console.error('Error creating dividend:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Delete dividend
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      const dividend = await prisma.dividend.findFirst({
        where: { id },
        include: { holding: true },
      });

      if (!dividend || dividend.holding.userId !== userId) {
        res.status(404).json({ success: false, message: 'Provento não encontrado' });
        return;
      }

      await prisma.dividend.delete({ where: { id } });

      res.json({ success: true, message: 'Provento excluído com sucesso' });
    } catch (error) {
      console.error('Error deleting dividend:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
};
