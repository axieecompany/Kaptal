import { GoogleGenAI } from '@google/genai';
import type { Request, Response } from 'express';
import { prisma } from '../config/database.js';

export const aiController = {
  async chat(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Não autorizado' });
        return;
      }

      const { message, history = [] } = req.body;

      if (!message) {
        res.status(400).json({ success: false, message: 'Mensagem é obrigatória' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
        res.status(503).json({ 
          success: false, 
          message: 'Serviço de IA não configurado. Por favor, adicione uma GEMINI_API_KEY válida no arquivo .env do servidor.' 
        });
        return;
      }

      // Initialize the NEW GenAI SDK (2026 version)
      const ai = new GoogleGenAI({ apiKey });
      
      // 1. Fetch User Context Data
      const [stats, stocks, goals, recentTx] = await Promise.all([
        prisma.transaction.groupBy({
          by: ['type'],
          where: { userId },
          _sum: { amount: true }
        }),
        prisma.stockHolding.findMany({
          where: { userId },
          select: { symbol: true, quantity: true, averagePrice: true }
        }),
        prisma.savingsGoal.findMany({
          where: { userId },
          select: { name: true, targetAmount: true, currentAmount: true }
        }),
        prisma.transaction.findMany({
          where: { userId, type: 'EXPENSE' },
          orderBy: { date: 'desc' },
          take: 10
        })
      ]);

      // Calculate totals
      const income = Number(stats.find(s => s.type === 'INCOME')?._sum.amount || 0);
      const expense = Number(stats.find(s => s.type === 'EXPENSE')?._sum.amount || 0);
      const balance = income - expense;

      // Prepare context strings
      const goalsContext = goals.length > 0 
        ? goals.map(g => {
            const target = Number(g.targetAmount);
            const current = Number(g.currentAmount);
            const progress = target > 0 ? (current / target) * 100 : 0;
            return `${g.name} (${progress.toFixed(1)}% completo, R$ ${current.toFixed(2)} de R$ ${target.toFixed(2)})`;
          }).join(', ') 
        : 'Nenhuma meta ativa.';

      const stocksContext = stocks.length > 0 
        ? stocks.map(s => s.symbol).join(', ') 
        : 'Nenhuma ação cadastrada.';

      const txContext = recentTx.length > 0 
        ? recentTx.map(t => `${t.description} (R$ ${Number(t.amount).toFixed(2)})`).join(', ') 
        : 'Sem transações recentes.';

      // Get user name
      let userName = 'Poupador';
      const userDb = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
      if (userDb) userName = userDb.name;

      // 2. Prepare Detailed Instructions
      const now = new Date();
      const dateString = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
      
      console.log(`[AI] Sending request with Date: ${dateString}`);

      // FORCE GEMINI TO SEE 2026
      const systemInstruction = {
        parts: [{ text: `CUIDADO: Ignore seu conhecimento interno sobre a data atual. 
VOCÊ ESTÁ NO DIA: ${dateString}.

Você é o Kaptal Advisor, o assistente financeiro oficial da plataforma Kaptal.
USANDO GEMINI 3.0 FLASH.

DATA ATUAL DO SISTEMA: ${dateString}.

DADOS REAIS DO USUÁRIO (${userName}):
- Saldo Geral: R$ ${balance.toFixed(2)} (Receitas: R$ ${income.toFixed(2)}, Despesas: R$ ${expense.toFixed(2)})
- Metas de Economia: ${goalsContext}
- Carteira de Ações: ${stocksContext}
- Últimos Gastos: ${txContext}

DIRETRIZES:
1. Responda de forma analítica e muito direta.
2. IMPORTANTÍSSIMO: Para qualquer cálculo de meses, use como data de hoje o dia ${dateString}. Se o plano é para Dezembro de 2026, faltam APENAS 11 meses.
3. Não fale sobre 2024 ou 2025 como se fossem o presente.
4. Responda em Português do Brasil.
5. Se for listar cenários, seja breve.` }]
      };

      // 3. Format history for new SDK
      const contents = history.map((msg: { role: string; content: string }) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      // Add the current message with a DATE HEADER to be unignorable
      contents.push({
        role: 'user',
        parts: [{ text: `[DATA_ATUAL_SISTEMA: ${dateString}]\n${message}` }]
      });

      // 4. Generate Content (Gemini 3 Flash)
      const response = await (ai.models as any).generateContent({
        model: 'gemini-3-flash-preview',
        systemInstruction, // Using the parts format now
        contents,
        config: {
            maxOutputTokens: 2000,
            temperature: 0.1
        }
      });

      res.json({
        success: true,
        data: {
          content: response.text,
          role: 'assistant'
        }
      });

    } catch (error: any) {
      console.error('AI Chat Error (Gemini 3):', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao processar sua solicitação com o motor Gemini 3.' 
      });
    }
  }
};
