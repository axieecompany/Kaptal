import { getEmailConfig } from '../config/email.js';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    const config = await getEmailConfig();
    
    const info = await config.transporter.sendMail({
      from: config.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    // Log Ethereal URL in development
    if (process.env.NODE_ENV === 'development') {
      const previewUrl = require('nodemailer').getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`📧 Email preview: ${previewUrl}`);
      }
    }

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  code: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px;">
      <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
        <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Nexi</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Finanças Pessoais</p>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #18181b; margin: 0 0 16px 0; font-size: 20px;">Olá, ${name}! 👋</h2>
          <p style="color: #52525b; margin: 0 0 24px 0; line-height: 1.6;">
            Obrigado por se registrar no Nexi! Use o código abaixo para verificar seu email:
          </p>
          <div style="background: #f4f4f5; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #6366f1;">${code}</span>
          </div>
          <p style="color: #71717a; margin: 0; font-size: 14px; text-align: center;">
            Este código expira em <strong>15 minutos</strong>.
          </p>
        </div>
        <div style="background: #f4f4f5; padding: 20px; text-align: center;">
          <p style="color: #a1a1aa; margin: 0; font-size: 12px;">
            Se você não criou uma conta no Nexi, pode ignorar este email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Verifique seu email - Nexi',
    html,
  });
}

export async function sendLoginVerificationEmail(
  email: string,
  name: string,
  code: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px;">
      <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
        <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Nexi</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Finanças Pessoais</p>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #18181b; margin: 0 0 16px 0; font-size: 20px;">Código de Login 🔐</h2>
          <p style="color: #52525b; margin: 0 0 24px 0; line-height: 1.6;">
            Olá, ${name}! Detectamos uma tentativa de login na sua conta. Use o código abaixo para confirmar:
          </p>
          <div style="background: #f4f4f5; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #6366f1;">${code}</span>
          </div>
          <p style="color: #71717a; margin: 0; font-size: 14px; text-align: center;">
            Este código expira em <strong>15 minutos</strong>.
          </p>
        </div>
        <div style="background: #f4f4f5; padding: 20px; text-align: center;">
          <p style="color: #a1a1aa; margin: 0; font-size: 12px;">
            Se não foi você que tentou fazer login, altere sua senha imediatamente.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Código de Login - Nexi',
    html,
  });
}
