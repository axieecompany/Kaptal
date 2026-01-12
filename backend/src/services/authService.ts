import { TokenType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';
import type { JwtPayload, LoginRequest, RegisterRequest } from '../types/index.js';
import { generateToken, generateVerificationCode } from '../utils/jwt.js';
import { sendLoginVerificationEmail, sendVerificationEmail } from './emailService.js';

const CODE_EXPIRATION_MINUTES = 15;

export async function registerUser(data: RegisterRequest) {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    if (existingUser.emailVerified) {
      throw new Error('Este email já está cadastrado');
    }
    // User exists but not verified - update and resend code
    const hashedPassword = await bcrypt.hash(data.password, 12);
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name: data.name,
        password: hashedPassword,
      },
    });

    // Invalidate old tokens
    await prisma.verificationToken.updateMany({
      where: { userId: existingUser.id, type: TokenType.EMAIL_VERIFICATION },
      data: { used: true },
    });

    // Create new verification token
    const code = generateVerificationCode();
    await prisma.verificationToken.create({
      data: {
        token: code,
        type: TokenType.EMAIL_VERIFICATION,
        expiresAt: new Date(Date.now() + CODE_EXPIRATION_MINUTES * 60 * 1000),
        userId: existingUser.id,
      },
    });

    await sendVerificationEmail(data.email, data.name, code);
    return { userId: existingUser.id };
  }

  // Create new user
  const hashedPassword = await bcrypt.hash(data.password, 12);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      password: hashedPassword,
    },
  });

  // Create verification token
  const code = generateVerificationCode();
  await prisma.verificationToken.create({
    data: {
      token: code,
      type: TokenType.EMAIL_VERIFICATION,
      expiresAt: new Date(Date.now() + CODE_EXPIRATION_MINUTES * 60 * 1000),
      userId: user.id,
    },
  });

  await sendVerificationEmail(data.email, data.name, code);
  return { userId: user.id };
}

export async function verifyEmail(email: string, code: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      tokens: {
        where: {
          type: TokenType.EMAIL_VERIFICATION,
          used: false,
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  if (user.emailVerified) {
    throw new Error('Email já foi verificado');
  }

  const token = user.tokens[0];
  if (!token) {
    throw new Error('Código de verificação não encontrado');
  }

  if (token.token !== code) {
    throw new Error('Código de verificação inválido');
  }

  if (new Date() > token.expiresAt) {
    throw new Error('Código de verificação expirado');
  }

  // Mark token as used and verify email
  await prisma.$transaction([
    prisma.verificationToken.update({
      where: { id: token.id },
      data: { used: true },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    }),
  ]);

  return { success: true };
}

export async function initiateLogin(data: LoginRequest) {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new Error('Credenciais inválidas');
  }

  if (!user.emailVerified) {
    throw new Error('Por favor, verifique seu email antes de fazer login');
  }

  const isValidPassword = await bcrypt.compare(data.password, user.password);
  if (!isValidPassword) {
    throw new Error('Credenciais inválidas');
  }

  // Invalidate old login tokens
  await prisma.verificationToken.updateMany({
    where: { userId: user.id, type: TokenType.LOGIN_VERIFICATION },
    data: { used: true },
  });

  // Create login verification token
  const code = generateVerificationCode();
  await prisma.verificationToken.create({
    data: {
      token: code,
      type: TokenType.LOGIN_VERIFICATION,
      expiresAt: new Date(Date.now() + CODE_EXPIRATION_MINUTES * 60 * 1000),
      userId: user.id,
    },
  });

  await sendLoginVerificationEmail(data.email, user.name, code);
  return { success: true };
}

export async function verifyLogin(email: string, code: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      tokens: {
        where: {
          type: TokenType.LOGIN_VERIFICATION,
          used: false,
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  const token = user.tokens[0];
  if (!token) {
    throw new Error('Código de verificação não encontrado');
  }

  if (token.token !== code) {
    throw new Error('Código de verificação inválido');
  }

  if (new Date() > token.expiresAt) {
    throw new Error('Código de verificação expirado');
  }

  // Mark token as used
  await prisma.verificationToken.update({
    where: { id: token.id },
    data: { used: true },
  });

  // Generate JWT
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
  };
  const jwtToken = generateToken(payload);

  return {
    token: jwtToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  };
}

export async function resendCode(email: string, type: TokenType) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  if (type === TokenType.EMAIL_VERIFICATION && user.emailVerified) {
    throw new Error('Email já foi verificado');
  }

  // Invalidate old tokens of this type
  await prisma.verificationToken.updateMany({
    where: { userId: user.id, type },
    data: { used: true },
  });

  // Create new token
  const code = generateVerificationCode();
  await prisma.verificationToken.create({
    data: {
      token: code,
      type,
      expiresAt: new Date(Date.now() + CODE_EXPIRATION_MINUTES * 60 * 1000),
      userId: user.id,
    },
  });

  // Send appropriate email
  if (type === TokenType.EMAIL_VERIFICATION) {
    await sendVerificationEmail(email, user.name, code);
  } else {
    await sendLoginVerificationEmail(email, user.name, code);
  }

  return { success: true };
}
