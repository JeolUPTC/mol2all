import { Injectable, Logger } from '@nestjs/common'
import * as nodemailer from 'nodemailer'

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)
  private transporter: nodemailer.Transporter | null = null

  constructor() {
    if (process.env.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    }
  }

  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    const subject = 'Restablece tu contraseña — MOL2ALL'
    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:12px">
        <h1 style="color:#818cf8;font-size:28px;margin:0 0 8px">MOL2ALL</h1>
        <p style="color:#94a3b8;margin:0 0 24px;font-size:14px">Plataforma educativa de estequiometría</p>
        <h2 style="color:#e2e8f0;font-size:18px;margin:0 0 12px">Restablece tu contraseña</h2>
        <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px">
          Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo.
          Este enlace expira en <strong style="color:#e2e8f0">1 hora</strong>.
        </p>
        <a href="${resetUrl}"
           style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
          Restablecer contraseña
        </a>
        <p style="color:#475569;font-size:12px;margin:24px 0 0">
          Si no solicitaste este cambio, ignora este correo. Tu contraseña no será modificada.
        </p>
        <p style="color:#334155;font-size:11px;margin:8px 0 0;word-break:break-all">${resetUrl}</p>
      </div>
    `

    if (this.transporter) {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM ?? 'MOL2ALL <noreply@mol2all.edu>',
        to,
        subject,
        html,
      })
    } else {
      // Dev fallback: log to console
      this.logger.warn(`[DEV] Password reset URL for ${to}:\n${resetUrl}`)
    }
  }
}
