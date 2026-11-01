<!-- ==========================================================================
 FILE: app/components/invoice/QrisCountdownCard.vue
 DESKRIPSI: Komponen Lego Render Gambar QRIS Dinamis & Countdown Timer 10 Menit
=========================================================================== -->
<script setup lang="ts">
import QRCode from 'qrcode'
import { useIntervalFn } from '@vueuse/core'

const props = defineProps<{
  qrisString: string
  expiresAt: string
  totalAmountFormatted: string
}>()

const emit = defineEmits<{
  expired: []
}>()

const qrDataUrl = ref<string>('')
const remainingSeconds = ref<number>(0)

// Generate gambar QRIS dari string payload dinamis
watch(
  () => props.qrisString,
  async (val) => {
    if (val) {
      qrDataUrl.value = await QRCode.toDataURL(val, {
        width: 280,
        margin: 2
      })
    }
  },
  { immediate: true }
)

function updateRemainingTime() {
  const diffMs = new Date(props.expiresAt).getTime() - Date.now()
  const secs = Math.max(0, Math.floor(diffMs / 1000))
  remainingSeconds.value = secs
  if (secs === 0) {
    emit('expired')
  }
}

onMounted(() => {
  updateRemainingTime()
})

useIntervalFn(() => {
  updateRemainingTime()
}, 1000)

const formattedTimer = computed(() => {
  const mins = Math.floor(remainingSeconds.value / 60).toString().padStart(2, '0')
  const secs = (remainingSeconds.value % 60).toString().padStart(2, '0')
  return `${mins}:${secs}`
})
</script>

<template>
  <UCard class="text-center border-2 border-primary/30 shadow-lg">
    <template #header>
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold uppercase text-muted">Scan QRIS Dinamis</span>
        <UBadge
          color="warning"
          variant="subtle"
          icon="i-lucide-timer"
        >
          Kedaluwarsa dalam: {{ formattedTimer }}
        </UBadge>
      </div>
    </template>

    <div class="flex flex-col items-center space-y-4 py-2">
      <div class="p-3 bg-white rounded-xl border border-default shadow-sm">
        <img
          v-if="qrDataUrl"
          :src="qrDataUrl"
          alt="QRIS Dynamic Code"
          class="w-60 h-60 object-contain"
        >
      </div>

      <div class="space-y-1">
        <p class="text-xs text-muted">
          Nominal Otomatis (Sudah Termasuk Kode Unik):
        </p>
        <p class="text-2xl font-extrabold font-mono text-primary">
          {{ totalAmountFormatted }}
        </p>
      </div>

      <p class="text-xs text-muted max-w-sm">
        Buka aplikasi M-Banking atau E-Wallet Anda, scan kode QR di atas, dan halaman ini akan otomatis terbuka begitu pembayaran terdeteksi.
      </p>
    </div>
  </UCard>
</template>
