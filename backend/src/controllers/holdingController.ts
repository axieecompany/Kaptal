import type { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { fetchStockQuotes } from '../services/brapiService.js';

export const holdingController = {
  // Get all holdings for user with current quotes
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const holdings = await prisma.stockHolding.findMany({
        where: { userId },
        include: {
          dividends: {
            orderBy: { date: 'desc' },
            take: 5,
          },
        },
        orderBy: { symbol: 'asc' },
      });

      // Fetch current quotes from Brapi
      const symbols = holdings.map(h => h.symbol);
      const quotes = symbols.length > 0 ? await fetchStockQuotes(symbols) : {};

      const holdingsWithQuotes = holdings.map(holding => {
        const quote = quotes[holding.symbol];
        const currentPrice = quote?.regularMarketPrice || 0;
        const averagePrice = Number(holding.averagePrice);
        const quantity = holding.quantity;
        
        const totalInvested = averagePrice * quantity;
        const currentValue = currentPrice * quantity;
        const profit = currentValue - totalInvested;
        const profitPercent = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;

        return {
          ...holding,
          averagePrice,
          averageCost: Number(holding.averageCost),
          currentPrice,
          totalInvested,
          currentValue,
          profit,
          profitPercent,
          companyName: quote?.longName || holding.name || holding.symbol,
          dividends: holding.dividends.map(d => ({
            ...d,
            amount: Number(d.amount),
          })),
        };
      });

      // Calculate totals
      const totalInvested = holdingsWithQuotes.reduce((sum, h) => sum + h.totalInvested, 0);
      const totalValue = holdingsWithQuotes.reduce((sum, h) => sum + h.currentValue, 0);
      const totalProfit = totalValue - totalInvested;
      const totalProfitPercent = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

      res.json({
        success: true,
        data: {
          holdings: holdingsWithQuotes,
          summary: {
            totalInvested,
            totalValue,
            totalProfit,
            totalProfitPercent,
            holdingsCount: holdings.length,
          },
        },
      });
    } catch (error) {
      console.error('Error fetching holdings:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Create new holding
  async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { symbol, quantity, averagePrice, averageCost, name } = req.body;

      if (!symbol || !quantity || !averagePrice) {
        res.status(400).json({
          success: false,
          message: 'Símbolo, quantidade e preço médio são obrigatórios',
        });
        return;
      }

      // Check if holding already exists
      const existing = await prisma.stockHolding.findUnique({
        where: { userId_symbol: { userId, symbol: symbol.toUpperCase() } },
      });

      if (existing) {
        res.status(400).json({
          success: false,
          message: 'Você já possui este ativo cadastrado. Edite a quantidade existente.',
        });
        return;
      }

      const holding = await prisma.stockHolding.create({
        data: {
          symbol: symbol.toUpperCase(),
          name,
          quantity,
          averagePrice,
          averageCost: averageCost || averagePrice,
          userId,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          ...holding,
          averagePrice: Number(holding.averagePrice),
          averageCost: Number(holding.averageCost),
        },
      });
    } catch (error) {
      console.error('Error creating holding:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Update holding
  async update(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const { quantity, averagePrice, averageCost, name } = req.body;

      const existing = await prisma.stockHolding.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        res.status(404).json({ success: false, message: 'Ativo não encontrado' });
        return;
      }

      const holding = await prisma.stockHolding.update({
        where: { id },
        data: {
          ...(quantity !== undefined && { quantity }),
          ...(averagePrice !== undefined && { averagePrice }),
          ...(averageCost !== undefined && { averageCost }),
          ...(name !== undefined && { name }),
        },
      });

      res.json({
        success: true,
        data: {
          ...holding,
          averagePrice: Number(holding.averagePrice),
          averageCost: Number(holding.averageCost),
        },
      });
    } catch (error) {
      console.error('Error updating holding:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Delete holding
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      const existing = await prisma.stockHolding.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        res.status(404).json({ success: false, message: 'Ativo não encontrado' });
        return;
      }

      await prisma.stockHolding.delete({ where: { id } });

      res.json({ success: true, message: 'Ativo excluído com sucesso' });
    } catch (error) {
      console.error('Error deleting holding:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
};
