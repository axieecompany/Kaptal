import { TokenType } from '@prisma/client';
import type { Request, Response } from 'express';
import * as authService from '../services/authService.js';
import {
    formatZodErrors,
    loginSchema,
    registerSchema,
    resendCodeSchema,
    verifyEmailSchema,
    verifyLoginSchema,
} from '../utils/validation.js';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const validation = registerSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: formatZodErrors(validation.error),
      });
      return;
    }

    const result = await authService.registerUser(validation.data);
    
    res.status(201).json({
      success: true,
      message: 'Usuário registrado com sucesso. Verifique seu email.',
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao registrar usuário';
    res.status(400).json({
      success: false,
      message,
    });
  }
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  try {
    const validation = verifyEmailSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: formatZodErrors(validation.error),
      });
      return;
    }

    await authService.verifyEmail(validation.data.email, validation.data.code);
    
    res.json({
      success: true,
      message: 'Email verificado com sucesso. Você já pode fazer login.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao verificar email';
    res.status(400).json({
      success: false,
      message,
    });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const validation = loginSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: formatZodErrors(validation.error),
      });
      return;
    }

    await authService.initiateLogin(validation.data);
    
    res.json({
      success: true,
      message: 'Código de verificação enviado para seu email.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao fazer login';
    res.status(400).json({
      success: false,
      message,
    });
  }
}

export async function verifyLogin(req: Request, res: Response): Promise<void> {
  try {
    const validation = verifyLoginSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: formatZodErrors(validation.error),
      });
      return;
    }

    const result = await authService.verifyLogin(validation.data.email, validation.data.code);
    
    res.json({
      success: true,
      message: 'Login realizado com sucesso.',
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao verificar login';
    res.status(400).json({
      success: false,
      message,
    });
  }
}

export async function resendCode(req: Request, res: Response): Promise<void> {
  try {
    const validation = resendCodeSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: formatZodErrors(validation.error),
      });
      return;
    }

    const tokenType = validation.data.type as TokenType;
    await authService.resendCode(validation.data.email, tokenType);
    
    res.json({
      success: true,
      message: 'Código reenviado com sucesso.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao reenviar código';
    res.status(400).json({
      success: false,
      message,
    });
  }
}

export async function me(req: Request, res: Response): Promise<void> {
  try {
    const { prisma } = await import('../config/database.js');
    
    const user = await prisma.user.findUnique({
      where: { id: req.user?.userId },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
      return;
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar usuário';
    res.status(500).json({
      success: false,
      message,
    });
  }
}
