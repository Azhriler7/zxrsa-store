<!-- ==========================================================================
 FILE: app/components/storefront/ActiveInvoiceBanner.vue
 DESKRIPSI: Section Card Pesanan Aktif Pembeli (Tanpa Tombol Tutup Saat
            Status Masih Pending atau Lunas agar Tidak Rawan Salah Pencet).
=========================================================================== -->
<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'

const { activeInvoice, saveInvoiceSession, clearInvoiceSession } = useActiveInvoiceSession()

const remainingSeconds = ref(0)
const isRefreshing = ref(false)

function calculateRemainingSeconds() {
  if (!activeInvoice.value?.expiresAt) {
    remainingSeconds.value = 0
    return
  }
  const diff = new Date(activeInvoice.value.expiresAt).getTime() - Date.now()
  remainingSeconds.value = Math.max(0, Math.floor(diff / 1000))

  if (remainingSeconds.value === 0 && activeInvoice.value.status === 'pending') {
    syncLatestInvoiceStatus()
  }
}

async function syncLatestInvoiceStatus() {
  if (!activeInvoice.value?.invoiceToken) return
  isRefreshing.value = true
  try {
    const res = await $fetch(`/api/store/invoice/${activeInvoice.value.invoiceToken}`)
    if (res?.invoice) {
      saveInvoiceSession({
        invoiceId: res.invoice.id,
        invoiceToken: res.invoice.invoice_token,
        productName: res.invoice.product_name,
        variantName: `${res.invoice.variant_name} (${res.invoice.duration})`,
        totalAmount: res.invoice.total_amount,
        status: res.invoice.status,
        expiresAt: res.invoice.expires_at
      })
      calculateRemainingSeconds()
    }
  } catch {
    clearInvoiceSession()
  } finally {
    isRefreshing.value = false
  }
}

onMounted(() => {
  if (activeInvoice.value) {
    calculateRemainingSeconds()
    syncLatestInvoiceStatus()
  }
})

useIntervalFn(() => {
  if (activeInvoice.value?.status === 'pending') {
    calculateRemainingSeconds()
  }
}, 1000)

useIntervalFn(() => {
  if (activeInvoice.value?.status === 'pending') {
    syncLatestInvoiceStatus()
  }
}, 6000)

const formattedTimer = computed(() => {
  const mins = Math.floor(remainingSeconds.value / 60).toString().padStart(2, '0')
  const secs = (remainingSeconds.value % 60).toString().padStart(2, '0')
  return `${mins}:${secs}`
})

function formatRupiah(val: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}
</script>

<template>
  <section
    v-if="activeInvoice"
    class="py-6 bg-primary/5 border-t border-default"
  >
    <UContainer class="max-w-4xl">
      <UCard class="border-2 border-primary/50 shadow-lg bg-default">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <UBadge
                color="primary"
                variant="solid"
                size="sm"
                icon="i-lucide-receipt"
              >
                Pesanan Terakhir Anda
              </UBadge>
              <span class="font-mono text-xs font-bold text-muted">
                #{{ activeInvoice.invoiceId }}
              </span>
              <CommonInvoiceStatusBadge :status="activeInvoice.status" />

              <UBadge
                v-if="activeInvoice.status === 'pending' && remainingSeconds > 0"
                color="warning"
                variant="subtle"
                size="sm"
                icon="i-lucide-timer"
              >
                Sisa Waktu QRIS: {{ formattedTimer }}
              </UBadge>
            </div>

            <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h3 class="text-base sm:text-lg font-extrabold text-highlighted">
                {{ activeInvoice.productName }} — {{ activeInvoice.variantName }}
              </h3>
              <span class="font-mono text-lg font-extrabold text-primary">
                {{ formatRupiah(activeInvoice.totalAmount) }}
              </span>
            </div>

            <p class="text-xs text-muted">
              <template v-if="activeInvoice.status === 'pending'">
                Kode QRIS Anda masih aktif! Klik tombol di samping untuk kembali membuka kode QRIS Anda.
              </template>
              <template v-else-if="activeInvoice.status === 'lunas'">
                Pembayaran telah Lunas! Klik tombol di samping untuk melihat detail akun dan invoice Anda.
              </template>
              <template v-else>
                Waktu pembayaran untuk pesanan ini telah berakhir ({{ activeInvoice.status.toUpperCase() }}).
              </template>
            </p>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <UButton
              :to="`/invoice/${activeInvoice.invoiceToken}`"
              :color="activeInvoice.status === 'lunas' ? 'success' : 'primary'"
              size="lg"
              :icon="activeInvoice.status === 'lunas' ? 'i-lucide-key-round' : 'i-lucide-qr-code'"
              :label="activeInvoice.status === 'lunas' ? 'Lihat Akun & Invoice' : 'Buka Kembali QRIS'"
              :loading="isRefreshing"
            />

            <!-- TOMBOL SEMBUNYIKAN HANYA MUNCUL JIKA SUDAH EXPIRED / DIBATALKAN / FAILED -->
            <UTooltip
              v-if="activeInvoice.status !== 'pending' && activeInvoice.status !== 'lunas'"
              text="Tutup pemberitahuan pesanan yang sudah kedaluwarsa ini"
            >
              <UButton
                color="neutral"
                variant="ghost"
                size="sm"
                icon="i-lucide-x"
                @click="clearInvoiceSession"
              />
            </UTooltip>
          </div>
        </div>
      </UCard>
    </UContainer>
  </section>
</template>
