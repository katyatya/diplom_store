import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createTransport, type Transporter } from "nodemailer";

export type SendMailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

const SMTP_TIMEOUT_MS = 15_000;

function stripEnvValue(value: string | undefined): string {
  return value?.trim().replace(/^["']|["']$/g, "") ?? "";
}

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly smtpHost: string | null;
  private readonly fromAddress: string;
  readonly adminOrderNotificationEmail: string;

  constructor(private readonly config: ConfigService) {
    this.adminOrderNotificationEmail =
      stripEnvValue(this.config.get<string>("ADMIN_ORDER_NOTIFICATION_EMAIL")) ||
      "katet.tetet@mail.ru";

    const host = stripEnvValue(this.config.get<string>("SMTP_HOST"));
    const portRaw = stripEnvValue(this.config.get<string>("SMTP_PORT"));
    const user = stripEnvValue(this.config.get<string>("SMTP_USER"));
    const pass = stripEnvValue(this.config.get<string>("SMTP_PASS"));
    this.fromAddress =
      stripEnvValue(this.config.get<string>("SMTP_FROM")) || user || "noreply@fashionstore.local";
    this.smtpHost = host || null;

    if (host && user && pass) {
      const port = portRaw ? Number(portRaw) : 465;
      const secure = port === 465;
      this.transporter = createTransport({
        host,
        port,
        secure,
        requireTLS: port === 587,
        auth: { user, pass },
        connectionTimeout: SMTP_TIMEOUT_MS,
        greetingTimeout: SMTP_TIMEOUT_MS,
        socketTimeout: SMTP_TIMEOUT_MS,
      });
      this.logger.log(
        `SMTP configured (${host}:${port}, secure=${secure}). Order notifications → ${this.adminOrderNotificationEmail}`,
      );
      return;
    }

    this.transporter = null;
    this.logger.warn(
      "SMTP is not configured (SMTP_HOST, SMTP_USER, SMTP_PASS). Order notification emails are disabled.",
    );
  }

  get isConfigured(): boolean {
    return this.transporter !== null;
  }

  async onModuleInit(): Promise<void> {
    if (!this.transporter || !this.smtpHost) return;

    try {
      await this.transporter.verify();
      this.logger.log(`SMTP connection verified (${this.smtpHost})`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `SMTP connection failed (${this.smtpHost}): ${message}. ` +
          "Check SMTP_PASS (Mail.ru: пароль для внешнего приложения), port 465/587, and network access to smtp.mail.ru.",
      );
    }
  }

  async sendMail(payload: SendMailPayload): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(
        `Skipped email "${payload.subject}" to ${payload.to}: SMTP is not configured`,
      );
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html ?? payload.text.replace(/\n/g, "<br>"),
      });
      this.logger.log(
        `Email sent to ${payload.to}: "${payload.subject}" (${info.messageId ?? "no message id"})`,
      );
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send email "${payload.subject}" to ${payload.to}: ${message}`);
      return false;
    }
  }
}
