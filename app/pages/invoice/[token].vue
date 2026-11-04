<!-- ==========================================================================
 FILE: app/pages/invoice/[token].vue
 DESKRIPSI: Halaman Dynamic Invoice Pembeli (Anti-Error 500 SSR Saat Dibuka
            dari Link Gmail, Timer 5 Menit, & Download Gambar QRIS).
=========================================================================== -->
<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'

const route = useRoute()
const token = computed(() => String(route.params.token || '').trim())

const { data, status, error, refresh } = await useFetch(() => `/api/store/invoice/${token.value}`, {
  retry: 1
})

const { saveInvoiceSession } = useActiveInvoiceSession()

useSeoMeta({
  title: () => `Invoice ${data.value?.invoice?.id || 'Pembayaran'} — ZXRSA Store`,
  robots: 'noindex, nofollow'
})

const isReviewPopupOpen = ref(false)

watch(
  () => data.value?.invoice,
  (inv) => {
    if (inv) {
      saveInvoiceSession({
        invoiceId: inv.id,
        invoiceToken: inv.invoice_token,
        productName: inv.product_name,
        variantName: `${inv.variant_name} (${inv.duration})`,
        totalAmount: inv.total_amount,
        status: inv.status,
        expiresAt: inv.expires_at
      })

      if (inv.status === 'lunas' && !inv.has_reviewed) {
        isReviewPopupOpen.value = true
      }
    }
  },
  { immediate: true }
)

const { pause } = useIntervalFn(async () => {
  if (data.value?.invoice?.status === 'pending') {
    await refresh()
  } else {
    pause()
  }
}, 4000)

function formatRupiah(val: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-default">
    <!-- HEADER KHUSUS INVOICE: TOMBOL KEMBALI + LOGO TOKO -->
    <header class="sticky top-0 z-40 h-16 w-full backdrop-blur-md bg-default/85 border-b border-default">
      <UContainer class="max-w-3xl h-full flex items-center justify-between gap-4">
        <UButton
          to="/"
          color="neutral"
          variant="subtle"
          size="sm"
          icon="i-lucide-arrow-left"
          label="Kembali ke Toko"
        />

        <div class="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="ZXRSA Store"
            class="w-7 h-7 rounded-lg object-contain bg-elevated border border-default p-0.5"
          >
          <span class="text-xs font-bold text-highlighted hidden sm:inline">
            ZXRSA Official Invoice
          </span>
          <UColorModeButton size="sm" />
        </div>
      </UContainer>
    </header>

    <main class="flex-1 py-8 sm:py-12">
      <!-- LOADING SKELETON -->
      <UContainer
        v-if="status === 'pending' && !data?.invoice"
        class="max-w-2xl space-y-4"
      >
        <USkeleton class="h-24 w-full rounded-2xl animate-pulse" />
        <USkeleton class="h-96 w-full rounded-2xl animate-pulse" />
      </UContainer>

      <!-- JIKA TOKEN INVOICE TIDAK DITEMUKAN -->
      <UContainer
        v-else-if="error || !data?.invoice"
        class="max-w-xl"
      >
        <UCard class="text-center py-10 space-y-4">
          <UIcon
            name="i-lucide-file-question"
            class="w-12 h-12 text-warning mx-auto"
          />
          <div class="space-y-1.5">
            <h1 class="text-lg font-extrabold text-highlighted">
              Data Invoice Tidak Ditemukan
            </h1>
            <p class="text-xs text-muted leading-relaxed max-w-md mx-auto">
              Link invoice ini mungkin berasal dari transaksi lama sebelum database di-reset, atau kode token tidak lengkap. Silakan buat pesanan baru di halaman utama.
            </p>
          </div>
          <UButton
            to="/"
            color="primary"
            icon="i-lucide-arrow-left"
            label="Kembali ke Halaman Utama"
          />
        </UCard>
      </UContainer>

      <!-- TAMPILAN INVOICE VERTIKAL-LINEAR -->
      <UContainer
        v-else
        class="max-w-2xl space-y-6"
      >
        <UCard>
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="font-mono text-base sm:text-lg font-extrabold text-highlighted">
                  {{ data.invoice.id }}
                </span>
                <CommonInvoiceStatusBadge :status="data.invoice.status" />
              </div>
              <p class="text-xs text-muted">
                Dikirim ke Gmail: <strong class="text-highlighted">{{ data.invoice.customer_email }}</strong>
              </p>
            </div>

            <div class="flex items-center gap-2">
              <UButton
                v-if="data.invoice.status === 'lunas' && !data.invoice.has_reviewed"
                icon="i-lucide-star"
                color="warning"
                variant="subtle"
                size="sm"
                label="Beri Rating"
                @click="isReviewPopupOpen = true"
              />
              <UButton
                icon="i-lucide-refresh-cw"
                color="neutral"
                variant="subtle"
                size="sm"
                label="Cek Status"
                @click="refresh()"
              />
            </div>
          </div>
        </UCard>

        <!-- BAGIAN UTAMA: QRIS (CLIENT-ONLY AGAR TIDAK PERNAH ERROR 500 SAAT SSR DARI GMAIL) ATAU KREDENSIAL AKUN -->
        <ClientOnly v-if="data.invoice.status === 'pending'">
          <InvoiceQrisCountdownCard
            :qris-string="data.invoice.qris_dynamic_string"
            :expires-at="data.invoice.expires_at"
            :total-amount-formatted="formatRupiah(data.invoice.total_amount)"
            @expired="refresh()"
          />
          <template #fallback>
            <UCard class="py-12 text-center">
              <USkeleton class="w-64 h-64 mx-auto rounded-2xl animate-pulse" />
            </UCard>
          </template>
        </ClientOnly>

        <InvoiceCredentialDeliverCard
          v-else-if="data.invoice.status === 'lunas'"
          :is-custom-gmail="data.invoice.is_custom_gmail"
          :custom-gmail-status="data.invoice.custom_gmail_status"
          :custom-gmail-target="data.invoice.custom_gmail_account"
          :delivered-account="data.invoice.delivered_account"
        />

        <UCard
          v-else
          class="text-center py-8 space-y-4"
        >
          <UIcon
            name="i-lucide-timer-off"
            class="w-12 h-12 text-error mx-auto"
          />
          <div class="space-y-1">
            <h2 class="font-bold text-lg text-highlighted">
              Transaksi {{ data.invoice.status.toUpperCase() }}
            </h2>
            <p class="text-xs text-muted">
              Batas waktu pembayaran QRIS 5 menit telah berakhir atau pesanan dibatalkan.
            </p>
          </div>
          <UButton
            to="/"
            color="primary"
            icon="i-lucide-arrow-left"
            label="Kembali & Buat Pesanan Baru"
          />
        </UCard>

        <!-- RINCIAN PESANAN & ATURAN GARANSI -->
        <UCard>
          <template #header>
            <h2 class="text-xs font-bold text-highlighted uppercase tracking-wider">
              Rincian Pesanan & Total Harga
            </h2>
          </template>

          <div class="space-y-3 text-sm">
            <div class="flex justify-between gap-2">
              <span class="text-muted">Aplikasi Premium:</span>
              <span class="font-bold text-highlighted text-right">{{ data.invoice.product_name }}</span>
            </div>
            <div class="flex justify-between gap-2">
              <span class="text-muted">Paket & Durasi:</span>
              <span class="font-medium text-right">{{ data.invoice.variant_name }} ({{ data.invoice.duration }})</span>
            </div>
            <div
              v-if="data.invoice.variant_description"
              class="flex justify-between gap-2"
            >
              <span class="text-muted">Deskripsi Paket:</span>
              <span class="text-xs text-muted text-right max-w-xs">{{ data.invoice.variant_description }}</span>
            </div>
            <div
              v-if="data.invoice.is_custom_gmail"
              class="flex justify-between gap-2"
            >
              <span class="text-muted">Target Custom Gmail:</span>
              <span class="font-mono text-xs font-bold text-primary break-all text-right">{{ data.invoice.custom_gmail_account }}</span>
            </div>
            <div class="border-t border-default pt-2 flex justify-between">
              <span class="text-muted">Harga Paket:</span>
              <span class="font-mono">{{ formatRupiah(data.invoice.base_amount) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted">Kode Unik Verifikasi QRIS:</span>
              <span class="font-mono text-warning">+Rp {{ data.invoice.unique_code }}</span>
            </div>
            <div class="border-t border-default pt-2 flex justify-between text-base font-extrabold">
              <span>Total Bayar:</span>
              <span class="font-mono text-primary">{{ formatRupiah(data.invoice.total_amount) }}</span>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center gap-2 text-warning font-bold text-xs uppercase tracking-wider">
              <UIcon
                name="i-lucide-shield-alert"
                class="w-4 h-4"
              />
              <span>Aturan Pemakaian & Ketentuan Garansi</span>
            </div>
          </template>
          <p class="text-xs text-muted whitespace-pre-line leading-relaxed">
            {{ data.invoice.usage_rules }}
          </p>
        </UCard>

        <InvoiceReviewPopupModal
          v-model:open="isReviewPopupOpen"
          :invoice-token="token"
          :product-name="data.invoice.product_name"
          :variant-name="data.invoice.variant_name"
          @submitted="refresh()"
        />
      </UContainer>
    </main>

    <CommonFloatingWhatsApp />
  </div>
</template>
