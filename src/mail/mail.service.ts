import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  async sendResetPasswordEmail(email: string, token: string) {
    const resetLink = `${process.env.DOMEN}/reset-password?token=${token}`;

    await this.transporter.sendMail({
      from: `"Edu Test" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Parolni tiklash',
      html: `
        <h2>Parolni tiklash</h2>
        <p>Parolingizni tiklash uchun quyidagi tugmani bosing:</p>
        <a href="${resetLink}" style="
          background: #4F46E5;
          color: white;
          padding: 12px 24px;
          border-radius: 6px;
          text-decoration: none;
        ">
          Parolni tiklash
        </a>
        <p>Havola 30 daqiqa davomida amal qiladi.</p>
        <p>Agar siz bu so'rovni yubormagan bo'lsangiz, ushbu xatni e'tiborsiz qoldiring.</p>
      `,
    });
  }
}
