// ============================================================================
// FILE: server/services/EmailService.ts
// DESKRIPSI: Service OOP untuk merender template @vue-email dan mengirim
//            email Invoice ke Gmail pembeli via HTTP REST API (Edge Ready).
// ============================================================================

import { render } from '@vue-email/render'
import InvoiceEmail from '../emails/InvoiceEmail'

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
}

export class EmailService {
  private readonly apiKey: string
  private readonly fromAddress: string
  private readonly mainDomain: string

  constructor(options: { apiKey: string, fromAddress: string, mainDomain: string }) {
    this.apiKey = options.apiKey
    this.fromAddress = options.fromAddress || 'ZXRSA Store <noreply@zioravellune.my.id>'
    this.mainDomain = options.mainDomain || 'zioravellune.my.id'
  }

  // --------------------------------------------------------------------------
  // [SECTION: RENDER VUE-EMAIL & KIRIM KE GMAIL PEMBELI]
  // --------------------------------------------------------------------------
  public async sendInvoiceEmail(payload: SendInvoiceEmailPayload): Promise<boolean> {
    const protocol = this.mainDomain.includes('localhost') ? 'http' : 'https'
    const invoiceUrl = `${protocol}://${this.mainDomain}/invoice/${payload.invoiceToken}`

    const totalAmountFormatted = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(payload.totalAmount)

    // 1. Render komponen Vue Email menjadi string HTML utuh
    const htmlContent = await render(InvoiceEmail, {
      invoiceId: payload.invoiceId,
      productName: payload.productName,
      variantName: payload.variantName,
      duration: payload.duration,
      totalAmountFormatted,
      isCustomGmail: payload.isCustomGmail,
      customGmailTarget: payload.customGmailTarget ?? undefined,
      accountEmail: payload.accountEmail ?? undefined,
      accountPassword: payload.accountPassword ?? undefined,
      accountExtraLink: payload.accountExtraLink ?? undefined,
      usageRules: payload.usageRules,
      invoiceUrl
    })

    // Jika API Key belum diisi di environment lokal, tampilkan simulasi di console
    if (!this.apiKey) {
      console.info(`[EMAIL_SIMULATION] Mengirim Invoice ${payload.invoiceId} ke ${payload.toEmail}`)
      return true
    }

    // 2. Kirim via HTTP API Transaksional (Resend / kompatibel Cloudflare Edge)
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
      throw new Error(`[EMAIL_API_ERROR] Gagal mengirim email: ${errText}`)
    }

    return true
  }
}
