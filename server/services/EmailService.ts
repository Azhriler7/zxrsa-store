// ============================================================================
// FILE: server/services/EmailService.ts
// DESKRIPSI: Service OOP Pengiriman Email Resmi via Resend API menggunakan
//            Native Edge HTML Builder (100% Bebas Crash 500 di Cloudflare Workers).
// ============================================================================

export interface SendInvoiceEmailPayload {
  toEmail: string
  invoiceId: string
  invoiceToken: string
  productName: string
  variantName: string
  duration: string
  totalAmount: number
  isCustomGmail: boolean
  customGmailTarget?: string | null
  accountEmail?: string | null
  accountPassword?: string | null
  accountExtraLink?: string | null
  usageRules: string
  tutorialText?: string | null
}

export class EmailService {
  private readonly apiKey: string
  private readonly fromAddress: string
  private readonly mainDomain: string

  constructor(options: { apiKey: string, fromAddress: string, mainDomain: string }) {
    this.apiKey = (options.apiKey || '').trim()
    this.fromAddress = (options.fromAddress || 'ZXRSA Store <noreply@zxrsa.biz.id>').trim()

    const rawDomain = (options.mainDomain || 'zxrsa.biz.id')
      .trim()
      .replace(/^https?:\/\//, '')
      .replace(/\/+$/, '')

    this.mainDomain = rawDomain.includes('localhost') ? 'zxrsa.biz.id' : rawDomain
  }

  private static escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  private buildInvoiceHtml(payload: SendInvoiceEmailPayload, invoiceUrl: string, totalFormatted: string): string {
    const esc = EmailService.escapeHtml
    const product = esc(payload.productName)
    const variant = esc(payload.variantName)
    const duration = esc(payload.duration)
    const rules = esc(payload.usageRules || '-').replace(/\n/g, '<br/>')
    const tutorial = payload.tutorialText ? esc(payload.tutorialText).replace(/\n/g, '<br/>') : ''

    const credentialBlock = payload.isCustomGmail
      ? `
        <h3 style="color:#38bdf8;margin:0 0 8px 0;font-size:15px;">Akun Custom Gmail Anda Telah Diaktifkan!</h3>
        <p style="margin:0;font-size:13px;color:#cbd5e1;line-height:1.6;">
          Paket premium untuk alamat Gmail Anda (<strong>${esc(payload.customGmailTarget || '-')}</strong>) telah selesai diproses dan dikonfirmasi oleh Admin kami.
        </p>
      `
      : `
        <h3 style="color:#38bdf8;margin:0 0 10px 0;font-size:15px;">Detail Kredensial Akun Anda</h3>
        <p style="margin:0 0 6px 0;font-size:13px;color:#f8fafc;font-family:monospace;">
          Email / Akun: <strong>${esc(payload.accountEmail || '-')}</strong>
        </p>
        <p style="margin:0 0 6px 0;font-size:13px;color:#f8fafc;font-family:monospace;">
          Password: <strong>${esc(payload.accountPassword || '-')}</strong>
        </p>
        ${
          payload.accountExtraLink
            ? `<p style="margin:6px 0 0 0;font-size:13px;color:#38bdf8;font-family:monospace;">
                 Link: <a href="${esc(payload.accountExtraLink)}" style="color:#38bdf8;text-decoration:underline;">${esc(payload.accountExtraLink)}</a>
               </p>`
            : ''
        }
      `

    const tutorialSection = tutorial
      ? `
        <div style="margin-top:20px;padding:14px;background-color:#0f172a;border-radius:8px;border:1px solid #334155;">
          <h4 style="color:#38bdf8;margin:0 0 6px 0;font-size:14px;">Panduan & Tutorial Penggunaan:</h4>
          <p style="margin:0;font-size:12px;color:#cbd5e1;line-height:1.6;">${tutorial}</p>
        </div>
      `
      : ''

    return `<!DOCTYPE html>
<html lang="id">
<head><meta charset="utf-8"/></head>
<body style="background-color:#0f172a;font-family:sans-serif;padding:24px 12px;color:#f8fafc;margin:0;">
  <div style="max-width:560px;margin:0 auto;background-color:#1e293b;border-radius:12px;padding:28px;border:1px solid #334155;">
    <h2 style="color:#38bdf8;margin:0 0 4px 0;font-size:20px;">ZXRSA Store — Official Invoice</h2>
    <p style="color:#94a3b8;margin:0;font-size:13px;">Nomor Transaksi: ${esc(payload.invoiceId)} • Status: LUNAS</p>
    <hr style="border:none;border-top:1px solid #334155;margin:20px 0;"/>
    <p style="margin:0 0 8px 0;font-size:14px;color:#e2e8f0;">Aplikasi Premium: <strong>${product}</strong></p>
    <p style="margin:0 0 8px 0;font-size:14px;color:#e2e8f0;">Paket & Durasi: <strong>${variant} (${duration})</strong></p>
    <p style="margin:0;font-size:15px;color:#4ade80;font-weight:bold;">Total Pembayaran: ${esc(totalFormatted)}</p>
    <hr style="border:none;border-top:1px solid #334155;margin:20px 0;"/>
    <div style="background-color:#0f172a;padding:16px;border-radius:8px;border:1px solid #0284c7;">
      ${credentialBlock}
    </div>
    ${tutorialSection}
    <div style="margin-top:20px;">
      <h4 style="color:#fbbf24;margin:0 0 6px 0;font-size:14px;">Aturan Pemakaian & Ketentuan Garansi:</h4>
      <p style="margin:0;font-size:12px;color:#cbd5e1;line-height:1.6;">${rules}</p>
    </div>
  </div>
</body>
</html>`
  }

  public async sendInvoiceEmail(payload: SendInvoiceEmailPayload): Promise<boolean> {
    const invoiceUrl = `https://${this.mainDomain}/invoice/${payload.invoiceToken}`

    const totalAmountFormatted = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(payload.totalAmount)

    const htmlContent = this.buildInvoiceHtml(payload, invoiceUrl, totalAmountFormatted)

    if (!this.apiKey) {
      console.info(`[EMAIL_SIMULATION] Mengirim Invoice ${payload.invoiceId} ke ${payload.toEmail} (${invoiceUrl})`)
      return true
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: this.fromAddress,
        to: [payload.toEmail],
        subject: `Invoice Lunas #${payload.invoiceId} — ${payload.productName}`,
        html: htmlContent
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Resend API menolak pengiriman (${response.status}): ${errText}`)
    }

    return true
  }
}
