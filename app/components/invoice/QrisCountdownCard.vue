<!-- ==========================================================================
 FILE: app/components/invoice/QrisCountdownCard.vue
 DESKRIPSI: Komponen Lego QRIS Dinamis Berukuran Besar + Timer 10 Menit Desain
            Mencolok + Fitur Download QRIS sebagai Gambar (.PNG).
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

// Persentase progress bar dari total 10 menit (600 detik)
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
        dark: '#0f172a',
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
      color: 'success',
      icon: 'i-lucide-download'
    })
  } finally {
    isDownloading.value = false
  }
}
</script>

<template>
  <UCard class="border-2 border-primary/50 shadow-xl overflow-hidden">
    <div class="space-y-6 text-center">
      <!-- BANNER COUNTDOWN TIMER 10 MENIT BESAR & MENCOLOK -->
      <div
        class="p-4 sm:p-5 rounded-2xl border-2 transition-colors space-y-3"
        :class="
          remainingSeconds <= 60
            ? 'bg-error/10 border-error/50 text-error'
            : 'bg-warning/10 border-warning/40 text-warning'
        "
      >
        <div class="flex items-center justify-center gap-2 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
          <UIcon
            name="i-lucide-timer"
            class="w-5 h-5 animate-bounce"
          />
          <span>Batas Waktu Pembayaran QRIS (10 Menit)</span>
        </div>

        <!-- ANGKA DIGITAL BESAR -->
        <div class="flex items-center justify-center gap-2 sm:gap-3 font-mono">
          <div class="px-4 py-2.5 rounded-xl bg-default border border-default shadow-sm min-w-19">
            <span class="text-3xl sm:text-4xl font-extrabold text-highlighted block leading-none">
              {{ minutesFormatted }}
            </span>
            <span class="text-[10px] font-sans font-semibold text-muted uppercase mt-1 block">
              Menit
            </span>
          </div>

          <span class="text-3xl sm:text-4xl font-extrabold animate-pulse">:</span>

          <div class="px-4 py-2.5 rounded-xl bg-default border border-default shadow-sm min-w-19">
            <span class="text-3xl sm:text-4xl font-extrabold text-highlighted block leading-none">
              {{ secondsFormatted }}
            </span>
            <span class="text-[10px] font-sans font-semibold text-muted uppercase mt-1 block">
              Detik
            </span>
          </div>
        </div>

        <!-- PROGRESS BAR WAKTU TERSISA -->
        <div class="w-full h-2 rounded-full bg-default overflow-hidden">
          <div
            class="h-full transition-all duration-1000 rounded-full"
            :class="remainingSeconds <= 60 ? 'bg-error' : 'bg-warning'"
            :style="{ width: `${progressPercentage}%` }"
          />
        </div>
      </div>

      <!-- AREA GAMBAR QRIS DINAMIS BERUKURAN BESAR -->
      <div class="space-y-3">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
          <UIcon
            name="i-lucide-scan-line"
            class="w-4 h-4"
          />
          <span>QRIS Dinamis Resmi • Nominal Otomatis</span>
        </div>

        <div class="mx-auto w-fit p-4 sm:p-5 bg-white rounded-2xl shadow-lg border-2 border-slate-200">
          <img
            v-if="qrDataUrl"
            :src="qrDataUrl"
            alt="QRIS Dinamis ZXRSA Store"
            class="w-64 h-64 sm:w-72 sm:h-72 object-contain mx-auto"
          >
          <div
            v-else
            class="w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center text-xs text-slate-500"
          >
            Membuat Kode QRIS...
          </div>
        </div>
      </div>

      <!-- NOMINAL TOTAL BAYAR BESAR -->
      <div class="p-4 rounded-xl bg-elevated border border-default space-y-1">
        <span class="text-xs text-muted block font-medium">
          Total Nominal yang Otomatis Terbaca Saat Scan:
        </span>
        <div class="text-2xl sm:text-3xl font-extrabold font-mono text-primary tracking-tight">
          {{ totalAmountFormatted }}
        </div>
        <p class="text-[11px] text-muted">
          Penting: Jangan mengubah nominal di atas agar sistem memverifikasi lunas secara otomatis.
        </p>
      </div>

      <!-- TOMBOL DOWNLOAD GAMBAR QRIS -->
      <div class="pt-1">
        <UButton
          color="primary"
          size="xl"
          block
          icon="i-lucide-download"
          label="Download Gambar QRIS (.PNG)"
          class="font-bold shadow-md"
          :loading="isDownloading"
          :disabled="!qrDataUrl"
          @click="downloadQrisAsImage"
        />
      </div>
    </div>
  </UCard>
</template>
