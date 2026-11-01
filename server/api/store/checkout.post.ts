// ============================================================================
// FILE: server/api/store/checkout.post.ts
// DESKRIPSI: Endpoint POST Checkout Pembeli (Atomic Stock Lock & Buat Invoice)
// ============================================================================

import { z } from 'zod'
import { StorefrontRepository } from '../../services/StorefrontRepository'

const checkoutSchema = z.object({
  variant_id: z.string().min(1, 'Silakan pilih paket terlebih dahulu'),
  customer_email: z
    .string()
    .trim()
    .email('Masukkan alamat Gmail aktif yang valid untuk menerima Invoice'),
  custom_gmail_account: z
    .string()
    .trim()
    .email('Format alamat Custom Gmail tidak valid')
    .nullable()
    .optional()
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, r => checkoutSchema.safeParse(r))

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: body.error.issues[0]?.message || 'Data pemesanan tidak valid.'
    })
  }

  const repo = new StorefrontRepository(event)
  const result = await repo.createCheckoutInvoice({
    variantId: body.data.variant_id,
    customerEmail: body.data.customer_email,
    customGmailAccount: body.data.custom_gmail_account
  })

  return {
    success: true,
    invoiceId: result.invoiceId,
    invoiceToken: result.invoiceToken
  }
})
