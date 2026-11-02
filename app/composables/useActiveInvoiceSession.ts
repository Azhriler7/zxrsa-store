// ============================================================================
// FILE: app/composables/useActiveInvoiceSession.ts
// DESKRIPSI: Composable Penyimpan Session Invoice Aktif di Browser Pembeli
//            agar pembeli bisa kembali ke halaman QRIS kapan saja.
// ============================================================================

export interface ActiveInvoiceSessionItem {
  invoiceId: string
  invoiceToken: string
  productName: string
  variantName: string
  totalAmount: number
  status: 'lunas' | 'pending' | 'expired' | 'dibatalkan' | 'failed'
  expiresAt: string
}

export function useActiveInvoiceSession() {
  // Tersimpan di Cookie Browser Pembeli selama 24 jam
  const activeInvoice = useCookie<ActiveInvoiceSessionItem | null>('zxrsa_buyer_active_invoice', {
    maxAge: 60 * 60 * 24,
    sameSite: 'lax',
    default: () => null
  })

  function saveInvoiceSession(item: ActiveInvoiceSessionItem) {
    activeInvoice.value = item
  }

  function clearInvoiceSession() {
    activeInvoice.value = null
  }

  return {
    activeInvoice,
    saveInvoiceSession,
    clearInvoiceSession
  }
}
