<!-- ==========================================================================
 FILE: app/pages/invoice/[token].vue
 DESKRIPSI: Halaman Dynamic Invoice Pembeli Bergaya Swiss Editorial Grid
=========================================================================== -->
<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'

const route = useRoute()
const config = useRuntimeConfig()
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

const isPolling = ref(false)
const { pause } = useIntervalFn(async () => {
  if (data.value?.invoice?.status === 'pending' && !isPolling.value) {
    isPolling.value = true
    try {
      await refresh()
    } finally {
      isPolling.value = false
    }
  } else if (data.value?.invoice?.status && data.value.invoice.status !== 'pending') {
    pause()
  }
}, 1500)

onMounted(() => {
  const handleVisibilityOrFocus = () => {
    if (document.visibilityState === 'visible' && data.value?.invoice?.status === 'pending') {
      refresh()
    }
  }
  window.addEventListener('visibilitychange', handleVisibilityOrFocus)
  window.addEventListener('focus', handleVisibilityOrFocus)
})

const waConfirmUrl = computed(() => {
  const inv = data.value?.invoice
  if (!inv) return `https://wa.me/${config.public.whatsappNumber}`
  const text = encodeURIComponent(
    `Halo Admin ZXRSA Store, saya sudah melakukan pembayaran QRIS namun status masih ${inv.status.toUpperCase()}.\n\n`
    + `• No. Invoice: ${inv.id}\n`
    + `• Paket: ${inv.product_name} (${inv.variant_name})\n`
    + `• Total Tagihan: Rp ${inv.total_amount}\n`
    + `• Email: ${inv.customer_email}\n\n`
    + `Mohon dibantu verifikasi. Terima kasih!`
  )
  return `https://wa.me/${config.public.whatsappNumber}?text=${text}`
})

function formatRupiah(val: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#FAFAFA] dark:bg-[#0A0A0A] text-[#111827] dark:text-[#FAFAFA]">
    <header class="sticky top-0 z-40 h-14 w-full bg-[#FAFAFA]/95 dark:bg-[#0A0A0A]/95 backdrop-blur-xs border-b border-[#E5E7EB] dark:border-[#262626]">
      <div class="max-w-4xl mx-auto px-4 sm:px-8 h-full flex items-center justify-between gap-4">
        <NuxtLink
          to="/"
          class="text-xs font-mono uppercase tracking-wider text-[#111827] dark:text-[#FAFAFA] hover:opacity-70"
        >
          ← Kembali ke Katalog
        </NuxtLink>

        <div class="flex items-center gap-3">
          <span class="font-mono text-xs uppercase tracking-widest text-[#6B7280] dark:text-[#737373] hidden sm:inline">
            Official Invoice Document
          </span>
          <UColorModeButton
            size="sm"
            variant="ghost"
            color="neutral"
          />
        </div>
      </div>
    </header>

    <main class="flex-1 py-10 sm:py-16">
      <div
        v-if="status === 'pending' && !data?.invoice"
        class="max-w-2xl mx-auto px-4 space-y-4"
      >
        <USkeleton class="h-24 w-full" />
        <USkeleton class="h-96 w-full" />
      </div>

      <div
        v-else-if="error || !data?.invoice"
        class="max-w-xl mx-auto px-4"
      >
        <div class="border border-[#E5E7EB] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#111111] p-10 text-center space-y-4">
          <h1 class="text-lg font-bold tracking-tight">
            Dokumen Invoice Tidak Ditemukan
          </h1>
          <p class="text-xs text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed max-w-md mx-auto">
            Tautan invoice ini tidak ditemukan atau sudah kadaluarsa. Silakan buat pesanan baru di halaman katalog.
          </p>
          <NuxtLink
            to="/"
            class="inline-block px-6 py-2.5 text-xs font-bold uppercase tracking-wider bg-[#111827] text-[#FFFFFF] dark:bg-[#FAFAFA] dark:text-[#0A0A0A]"
          >
            Kembali ke Katalog
          </NuxtLink>
        </div>
      </div>

      <div
        v-else
        class="max-w-2xl mx-auto px-4 space-y-6"
      >
        <!-- HEADER DOKUMEN INVOICE -->
        <div class="border border-[#E5E7EB] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#111111] p-6 flex flex-wrap items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="flex items-center gap-3">
              <span class="font-mono text-lg font-black tracking-tight">
                {{ data.invoice.id }}
              </span>
              <CommonInvoiceStatusBadge :status="data.invoice.status" />
            </div>
            <p class="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
              Arsip dikirim ke: <strong class="font-mono text-[#111827] dark:text-[#FAFAFA]">{{ data.invoice.customer_email }}</strong>
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button
              v-if="data.invoice.status === 'lunas' && !data.invoice.has_reviewed"
              type="button"
              class="px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-[#111827] dark:border-[#FAFAFA] cursor-pointer"
              @click="isReviewPopupOpen = true"
            >
              Beri Ulasan
            </button>
            <button
              type="button"
              class="px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-[#E5E7EB] dark:border-[#262626] hover:border-[#111827] dark:hover:border-[#FAFAFA] cursor-pointer"
              @click="refresh()"
            >
              Segarkan Status
            </button>
          </div>
        </div>

        <ClientOnly v-if="data.invoice.status === 'pending'">
          <InvoiceQrisCountdownCard
            :qris-string="data.invoice.qris_dynamic_string"
            :expires-at="data.invoice.expires_at"
            :total-amount-formatted="formatRupiah(data.invoice.total_amount)"
            @expired="refresh()"
          />
          <template #fallback>
            <div class="border border-[#E5E7EB] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#111111] py-12 text-center">
              <USkeleton class="w-64 h-64 mx-auto" />
            </div>
          </template>
        </ClientOnly>

        <div
          v-if="data.invoice.status === 'pending' || data.invoice.status === 'expired'"
          class="border border-[#E5E7EB] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#111111] p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left"
        >
          <div class="space-y-0.5">
            <h3 class="text-xs font-bold">
              Sudah Transfer Sesuai Nominal Namun Status Belum Berubah?
            </h3>
            <p class="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
              Klik Segarkan Status di atas, atau kirim bukti bayar ke WhatsApp Admin untuk verifikasi manual.
            </p>
          </div>
          <a
            :href="waConfirmUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="px-4 py-2 text-xs font-mono uppercase tracking-wider border border-[#111827] dark:border-[#FAFAFA] shrink-0"
          >
            Konfirmasi WhatsApp
          </a>
        </div>

        <InvoiceCredentialDeliverCard
          v-else-if="data.invoice.status === 'lunas'"
          :is-custom-gmail="data.invoice.is_custom_gmail"
          :custom-gmail-status="data.invoice.custom_gmail_status"
          :custom-gmail-target="data.invoice.custom_gmail_account"
          :delivered-account="data.invoice.delivered_account"
        />

        <div
          v-else
          class="border border-[#E5E7EB] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#111111] text-center p-10 space-y-4"
        >
          <h2 class="font-bold text-lg">
            Transaksi {{ data.invoice.status.toUpperCase() }}
          </h2>
          <p class="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
            Batas waktu pembayaran QRIS 10 menit telah berakhir atau pesanan dibatalkan.
          </p>
          <NuxtLink
            to="/"
            class="inline-block px-6 py-2.5 text-xs font-bold uppercase tracking-wider bg-[#111827] text-[#FFFFFF] dark:bg-[#FAFAFA] dark:text-[#0A0A0A]"
          >
            Buat Pesanan Baru
          </NuxtLink>
        </div>

        <!-- RINCIAN TAGIHAN SWISS GRID -->
        <div class="border border-[#E5E7EB] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#111111] p-6 space-y-4">
          <div class="border-b border-[#E5E7EB] dark:border-[#262626] pb-3">
            <h2 class="font-mono text-xs uppercase tracking-[0.15em] text-[#6B7280] dark:text-[#737373]">
              Rincian Pesanan &amp; Komponen Biaya
            </h2>
          </div>

          <div class="space-y-2.5 text-xs sm:text-sm">
            <div class="flex justify-between gap-2">
              <span class="text-[#6B7280] dark:text-[#9CA3AF]">Produk Aplikasi</span>
              <span class="font-bold text-right">{{ data.invoice.product_name }}</span>
            </div>
            <div class="flex justify-between gap-2">
              <span class="text-[#6B7280] dark:text-[#9CA3AF]">Varian &amp; Durasi</span>
              <span class="font-mono text-right">{{ data.invoice.variant_name }} ({{ data.invoice.duration }})</span>
            </div>
            <div
              v-if="data.invoice.variant_description"
              class="flex justify-between gap-2"
            >
              <span class="text-[#6B7280] dark:text-[#9CA3AF]">Spesifikasi</span>
              <span class="text-xs text-[#6B7280] dark:text-[#9CA3AF] text-right max-w-xs">{{ data.invoice.variant_description }}</span>
            </div>
            <div
              v-if="data.invoice.is_custom_gmail"
              class="flex justify-between gap-2"
            >
              <span class="text-[#6B7280] dark:text-[#9CA3AF]">Target Custom Gmail</span>
              <span class="font-mono text-xs font-bold break-all text-right">{{ data.invoice.custom_gmail_account }}</span>
            </div>
            <div class="border-t border-[#E5E7EB] dark:border-[#262626] pt-2.5 flex justify-between">
              <span class="text-[#6B7280] dark:text-[#9CA3AF]">Harga Paket</span>
              <span class="font-mono">{{ formatRupiah(data.invoice.base_amount) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-[#6B7280] dark:text-[#9CA3AF]">Biaya Layanan QRIS (0,3%)</span>
              <span class="font-mono">+{{ formatRupiah(data.invoice.service_fee || Math.ceil(data.invoice.base_amount * 0.003)) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-[#6B7280] dark:text-[#9CA3AF]">Kode Unik Verifikasi</span>
              <span class="font-mono">+Rp {{ data.invoice.unique_code }}</span>
            </div>
            <div class="border-t border-[#E5E7EB] dark:border-[#262626] pt-3 flex justify-between text-base font-black">
              <span>Total Tagihan</span>
              <span class="font-mono">{{ formatRupiah(data.invoice.total_amount) }}</span>
            </div>
          </div>
        </div>

        <!-- KARTU TUTORIAL PENGGUNAAN (HANYA MUNCUL SETELAH LUNAS) -->
        <div
          v-if="data.invoice.status === 'lunas' && data.invoice.tutorial_text"
          class="border border-[#E5E7EB] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#111111] p-6 space-y-3"
        >
          <h3 class="font-mono text-xs font-bold uppercase tracking-[0.15em]">
            Panduan &amp; Tutorial Penggunaan Akun
          </h3>
          <p class="text-xs text-[#4B5563] dark:text-[#D1D5DB] whitespace-pre-line leading-relaxed">
            {{ data.invoice.tutorial_text }}
          </p>
        </div>

        <!-- KARTU ATURAN PEMAKAIAN & GARANSI (HANYA MUNCUL SETELAH LUNAS) -->
        <div
          v-if="data.invoice.status === 'lunas' && data.invoice.usage_rules"
          class="border border-[#E5E7EB] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#111111] p-6 space-y-3"
        >
          <h3 class="font-mono text-xs font-bold uppercase tracking-[0.15em]">
            Aturan Pemakaian &amp; Ketentuan Garansi
          </h3>
          <p class="text-xs text-[#6B7280] dark:text-[#9CA3AF] whitespace-pre-line leading-relaxed">
            {{ data.invoice.usage_rules }}
          </p>
        </div>

        <InvoiceReviewPopupModal
          v-model:open="isReviewPopupOpen"
          :invoice-token="token"
          :product-name="data.invoice.product_name"
          :variant-name="data.invoice.variant_name"
          @submitted="refresh()"
        />
      </div>
    </main>

    <CommonFloatingWhatsApp />
  </div>
</template>
