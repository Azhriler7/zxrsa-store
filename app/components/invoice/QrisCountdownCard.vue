<!-- ==========================================================================
 FILE: app/components/invoice/QrisCountdownCard.vue
 DESKRIPSI: Komponen QRIS Dinamis & Timer 10 Menit Bergaya Swiss Editorial Grid
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

const toast = useToast()
const qrDataUrl = ref<string>('')
const qrDownloadHiResUrl = ref<string>('')
const remainingSeconds = ref<number>(0)
const isDownloading = ref(false)

function updateRemainingTime() {
  const now = Date.now()
  const exp = new Date(props.expiresAt).getTime()
  const diff = Math.max(0, Math.floor((exp - now) / 1000))
  remainingSeconds.value = diff

  if (diff === 0) {
    emit('expired')
  }
}

const minutesFormatted = computed(() =>
  Math.floor(remainingSeconds.value / 60).toString().padStart(2, '0')
)

const secondsFormatted = computed(() =>
  (remainingSeconds.value % 60).toString().padStart(2, '0')
)

const progressPercentage = computed(() => {
  return Math.min(100, Math.max(0, Math.round((remainingSeconds.value / 600) * 100)))
})

async function renderQrisImages() {
  if (!props.qrisString) return
  try {
    qrDataUrl.value = await QRCode.toDataURL(props.qrisString, {
      width: 340,
      margin: 2,
      color: {
        dark: '#111827',
        light: '#ffffff'
      }
    })

    qrDownloadHiResUrl.value = await QRCode.toDataURL(props.qrisString, {
      width: 720,
      margin: 4,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
  } catch {
    qrDataUrl.value = ''
  }
}

onMounted(async () => {
  updateRemainingTime()
  await renderQrisImages()
})

watch(() => props.qrisString, () => {
  renderQrisImages()
})

useIntervalFn(() => {
  updateRemainingTime()
}, 1000)

function downloadQrisAsImage() {
  const targetUrl = qrDownloadHiResUrl.value || qrDataUrl.value
  if (!targetUrl) return

  isDownloading.value = true
  try {
    const link = document.createElement('a')
    link.href = targetUrl
    link.download = `QRIS-ZXRSA-${props.totalAmountFormatted.replace(/[^0-9]/g, '')}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.add({
      title: 'Gambar QRIS Berhasil Diunduh!',
      description: 'Silakan buka aplikasi m-Banking / e-Wallet Anda lalu pilih menu Scan dari Galeri.',
      color: 'success'
    })
  } finally {
    isDownloading.value = false
  }
}
</script>

<template>
  <div class="border border-[#E5E7EB] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#111111] divide-y divide-[#E5E7EB] dark:divide-[#262626]">
    <!-- BAGIAN 1: COUNTDOWN TIMER 10 MENIT SWISS EDITORIAL -->
    <div class="p-6 sm:p-8 space-y-4">
      <div class="flex items-center justify-between text-xs font-mono uppercase tracking-[0.15em] text-[#6B7280] dark:text-[#9CA3AF]">
        <span>Batas Waktu Pembayaran QRIS</span>
        <span>Durasi Kunci: 10 Menit</span>
      </div>

      <div class="flex items-baseline justify-between gap-4">
        <div class="font-mono text-4xl sm:text-5xl font-black tracking-[-0.04em] text-[#111827] dark:text-[#FAFAFA]">
          {{ minutesFormatted }}<span class="opacity-40">:</span>{{ secondsFormatted }}
        </div>
        <div class="text-right">
          <span class="font-mono text-[10px] uppercase tracking-widest text-[#6B7280] dark:text-[#737373] block">
            Nominal Otomatis
          </span>
          <span class="font-mono text-2xl sm:text-3xl font-black text-[#111827] dark:text-[#FAFAFA]">
            {{ totalAmountFormatted }}
          </span>
        </div>
      </div>

      <!-- GARIS PROGRESS MINIMALIS 2PX -->
      <div class="w-full h-0.5 bg-[#E5E7EB] dark:bg-[#262626] overflow-hidden">
        <div
          class="h-full transition-all duration-1000"
          :class="remainingSeconds <= 60 ? 'bg-red-600 dark:bg-red-400' : 'bg-[#111827] dark:bg-[#FAFAFA]'"
          :style="{ width: `${progressPercentage}%` }"
        />
      </div>
    </div>

    <!-- BAGIAN 2: KANVAS VISUAL QRIS BERSIH -->
    <div class="p-8 sm:p-10 flex flex-col items-center justify-center space-y-6 bg-[#FAFAFA] dark:bg-[#0A0A0A]">
      <div class="p-5 bg-[#FFFFFF] border border-[#E5E7EB]">
        <img
          v-if="qrDataUrl"
          :src="qrDataUrl"
          alt="QRIS Dinamis ZXRSA Store"
          class="w-64 h-64 sm:w-72 sm:h-72 object-contain mx-auto"
        >
        <div
          v-else
          class="w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center font-mono text-xs uppercase tracking-widest text-[#6B7280]"
        >
          Membuat Kode QRIS...
        </div>
      </div>

      <p class="text-xs text-[#6B7280] dark:text-[#9CA3AF] text-center max-w-md leading-relaxed">
        Pindai menggunakan aplikasi m-Banking atau E-Wallet. Pastikan nominal transfer tepat sesuai angka di atas agar terverifikasi otomatis.
      </p>
    </div>

    <!-- BAGIAN 3: TOMBOL UNDUH MINIMALIS TANPA IKON DEKORATIF -->
    <div class="p-6 bg-[#FFFFFF] dark:bg-[#111111]">
      <button
        type="button"
        :disabled="!qrDataUrl || isDownloading"
        class="w-full py-4 px-6 text-xs font-bold uppercase tracking-[0.14em] bg-[#111827] text-[#FFFFFF] dark:bg-[#FAFAFA] dark:text-[#0A0A0A] hover:opacity-85 transition-opacity disabled:opacity-50 cursor-pointer"
        @click="downloadQrisAsImage"
      >
        {{ isDownloading ? 'Mengunduh Gambar...' : 'Download Gambar QRIS (.PNG)' }}
      </button>
    </div>
  </div>
</template>
