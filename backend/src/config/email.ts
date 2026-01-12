import type { Transporter } from 'nodemailer';
import nodemailer from 'nodemailer';

interface EmailConfig {
  transporter: Transporter;
  from: string;
}

let emailConfig: EmailConfig | null = null;

export async function getEmailConfig(): Promise<EmailConfig> {
  if (emailConfig) {
    return emailConfig;
  }

  // In development, create an Ethereal test account if no SMTP credentials
  if (process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
    const testAccount = await nodemailer.createTestAccount();
    
    console.log('📧 Ethereal test account created:');
    console.log(`   User: ${testAccount.user}`);
    console.log(`   Pass: ${testAccount.pass}`);
    console.log('   View emails at: https://ethereal.email/messages');

    emailConfig = {
      transporter: nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      }),
      from: `Nexi <${testAccount.user}>`,
    };

    return emailConfig;
  }

  // Production or configured SMTP
  emailConfig = {
    transporter: nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    }),
    from: process.env.EMAIL_FROM || 'Nexi <noreply@nexi.com>',
  };

  return emailConfig;
}

export default getEmailConfig;
