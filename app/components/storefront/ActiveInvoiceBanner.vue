<!-- ==========================================================================
 FILE: app/components/storefront/ActiveInvoiceBanner.vue
 DESKRIPSI: Baris Status Invoice Aktif Bergaya Swiss Editorial (Mempertahankan
            Sinkronisasi Otomatis & Hitung Mundur QRIS).
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
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val)
}
</script>

<template>
  <section
    v-if="activeInvoice"
    class="w-full bg-[#FFFFFF] dark:bg-[#111111] border-b border-[#E5E7EB] dark:border-[#262626]"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-4 text-xs">
      <div class="flex flex-wrap items-center gap-3">
        <CommonInvoiceStatusBadge :status="activeInvoice.status" />

        <span class="font-mono font-bold text-[#111827] dark:text-[#FAFAFA]">
          #{{ activeInvoice.invoiceId }}
        </span>

        <span class="text-[#4B5563] dark:text-[#A3A3A3]">
          {{ activeInvoice.productName }} — {{ activeInvoice.variantName }}
        </span>

        <span class="font-mono font-extrabold text-[#111827] dark:text-[#FAFAFA]">
          ({{ formatRupiah(activeInvoice.totalAmount) }})
        </span>

        <span
          v-if="activeInvoice.status === 'pending' && remainingSeconds > 0"
          class="px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider border border-[#E5E7EB] dark:border-[#262626] text-[#111827] dark:text-[#FAFAFA]"
        >
          Sisa Waktu: {{ formattedTimer }}
        </span>
      </div>

      <div class="flex items-center gap-4">
        <NuxtLink
          :to="`/invoice/${activeInvoice.invoiceToken}`"
          class="px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider bg-[#111827] text-[#FFFFFF] dark:bg-[#FAFAFA] dark:text-[#0A0A0A] hover:opacity-85 transition-opacity"
        >
          {{ isRefreshing ? 'Memuat...' : (activeInvoice.status === 'lunas' ? 'Lihat Akun & Invoice' : 'Buka Kembali QRIS') }}
        </NuxtLink>

        <button
          v-if="activeInvoice.status !== 'pending' && activeInvoice.status !== 'lunas'"
          type="button"
          class="font-mono text-[11px] uppercase tracking-wider text-[#6B7280] dark:text-[#737373] hover:text-[#111827] dark:hover:text-[#FAFAFA] cursor-pointer"
          @click="clearInvoiceSession()"
        >
          Tutup
        </button>
      </div>
    </div>
  </section>
</template>
