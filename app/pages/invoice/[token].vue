<!-- ==========================================================================
 FILE: app/pages/invoice/[token].vue
 DESKRIPSI: Halaman Dynamic Invoice Pembeli + Pop-Up Rating Otomatis Saat Lunas
=========================================================================== -->
<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'

const route = useRoute()
const token = String(route.params.token || '')

const { data, refresh } = await useFetch(`/api/store/invoice/${token}`)

useSeoMeta({
  title: () => `Invoice ${data.value?.invoice.id || ''} — ZXRSA Store`,
  robots: 'noindex, nofollow'
})

const isReviewPopupOpen = ref(false)

// Otomatis buka pop-up beri bintang & ulasan begitu status menjadi LUNAS
watch(
  () => [data.value?.invoice.status, data.value?.invoice.has_reviewed],
  ([status, hasReviewed]) => {
    if (status === 'lunas' && !hasReviewed) {
      isReviewPopupOpen.value = true
    }
  },
  { immediate: true }
)

const { pause } = useIntervalFn(async () => {
  if (data.value?.invoice.status === 'pending') {
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
    <StorefrontStickyNavbar />

    <main class="flex-1 py-10">
      <UContainer
        v-if="data?.invoice"
        class="max-w-4xl space-y-6"
      >
        <UCard>
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="font-mono text-lg font-extrabold text-highlighted">
                  {{ data.invoice.id }}
                </span>
                <CommonInvoiceStatusBadge :status="data.invoice.status" />
              </div>
              <p class="text-xs text-muted">
                Dikirim ke Gmail: <strong>{{ data.invoice.customer_email }}</strong>
              </p>
            </div>

            <div class="flex items-center gap-2">
              <UButton
                v-if="data.invoice.status === 'lunas' && !data.invoice.has_reviewed"
                icon="i-lucide-star"
                color="warning"
                variant="subtle"
                size="sm"
                label="Beri Rating & Ulasan"
                @click="isReviewPopupOpen = true"
              />
              <UButton
                icon="i-lucide-refresh-cw"
                color="neutral"
                variant="subtle"
                size="sm"
                label="Cek Status Pembayaran"
                @click="refresh()"
              />
            </div>
          </div>
        </UCard>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <InvoiceQrisCountdownCard
              v-if="data.invoice.status === 'pending'"
              :qris-string="data.invoice.qris_dynamic_string"
              :expires-at="data.invoice.expires_at"
              :total-amount-formatted="formatRupiah(data.invoice.total_amount)"
              @expired="refresh()"
            />

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
                  Batas waktu pembayaran QRIS 10 menit telah berakhir atau pesanan dibatalkan.
                </p>
              </div>
              <UButton
                to="/"
                color="primary"
                icon="i-lucide-arrow-left"
                label="Buat Pesanan Baru"
              />
            </UCard>
          </div>

          <div class="space-y-6">
            <UCard>
              <template #header>
                <h2 class="text-sm font-bold text-highlighted uppercase">
                  Rincian Pesanan & Total Harga
                </h2>
              </template>

              <div class="space-y-3 text-sm">
                <div class="flex justify-between">
                  <span class="text-muted">Aplikasi Premium:</span>
                  <span class="font-bold text-highlighted">{{ data.invoice.product_name }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted">Paket & Durasi:</span>
                  <span class="font-medium">{{ data.invoice.variant_name }} ({{ data.invoice.duration }})</span>
                </div>
                <div
                  v-if="data.invoice.is_custom_gmail"
                  class="flex justify-between"
                >
                  <span class="text-muted">Target Custom Gmail:</span>
                  <span class="font-mono text-xs font-bold text-primary">{{ data.invoice.custom_gmail_account }}</span>
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
                <div class="flex items-center gap-2 text-warning font-bold text-sm">
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
          </div>
        </div>

        <!-- LEGO POP-UP RATING & ULASAN SETELAH BAYAR -->
        <InvoiceReviewPopupModal
          v-model:open="isReviewPopupOpen"
          :invoice-token="token"
          :product-name="data.invoice.product_name"
          :variant-name="data.invoice.variant_name"
          @submitted="refresh()"
        />
      </UContainer>
    </main>

    <StorefrontFooterContact />
    <CommonFloatingWhatsApp />
  </div>
</template>
