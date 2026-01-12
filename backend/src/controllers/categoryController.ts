import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';

const createCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  icon: z.string().optional().default('📦'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida').optional().default('#6366f1'),
  parentId: z.string().uuid().optional().nullable(),
});

const updateCategorySchema = createCategorySchema.partial();

export async function getCategories(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Não autorizado' });
      return;
    }

    const categories = await prisma.category.findMany({
      where: { userId, parentId: null },
      include: {
        children: {
          include: {
            children: true,
            _count: { select: { transactions: true } },
          },
          orderBy: { name: 'asc' },
        },
        _count: { select: { transactions: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar categorias' });
  }
}

export async function getAllCategories(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Não autorizado' });
      return;
    }

    const categories = await prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error getting all categories:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar categorias' });
  }
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Não autorizado' });
      return;
    }

    const validation = createCategorySchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { name, icon, color, parentId } = validation.data;

    // Verify parent belongs to user if provided
    if (parentId) {
      const parent = await prisma.category.findFirst({
        where: { id: parentId, userId },
      });
      if (!parent) {
        res.status(400).json({ success: false, message: 'Categoria pai não encontrada' });
        return;
      }
    }

    const category = await prisma.category.create({
      data: {
        name,
        icon,
        color,
        parentId,
        userId,
      },
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ success: false, message: 'Erro ao criar categoria' });
  }
}

export async function updateCategory(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Não autorizado' });
      return;
    }

    const validation = updateCategorySchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const existing = await prisma.category.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Categoria não encontrada' });
      return;
    }

    const category = await prisma.category.update({
      where: { id },
      data: validation.data,
    });

    res.json({ success: true, data: category });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar categoria' });
  }
}

export async function deleteCategory(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Não autorizado' });
      return;
    }

    const existing = await prisma.category.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Categoria não encontrada' });
      return;
    }

    await prisma.category.delete({ where: { id } });

    res.json({ success: true, message: 'Categoria deletada' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ success: false, message: 'Erro ao deletar categoria' });
  }
}
