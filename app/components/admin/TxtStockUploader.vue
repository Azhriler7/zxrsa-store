<!-- ==========================================================================
 FILE: app/components/admin/TxtStockUploader.vue
 DESKRIPSI: Komponen Lego Upload File .txt & Pop-up Keluarkan Stok Terpilih
            (Sinkronisasi Increment/Decrement dengan Checkbox List Stok).
=========================================================================== -->
<script setup lang="ts">
export interface VariantOption {
  id: string
  label: string
  availableStock: number
}

interface StockItemRow {
  id: number
  accountLabel: string
  formatType: string
  createdAt: string
}

const props = defineProps<{
  variantOptions: VariantOption[]
}>()

const emit = defineEmits<{ uploaded: [] }>()
const toast = useToast()

const selectedVariantId = ref('')
const rawTxtContent = ref('')
const isSubmitting = ref(false)

// State untuk Pop-Up Pilih & Keluarkan Stok
const isStockPickerOpen = ref(false)
const isLoadingStocks = ref(false)
const availableStockList = ref<StockItemRow[]>([])
const selectedStockIds = ref<number[]>([])

const currentVariantInfo = computed(() =>
  props.variantOptions.find(v => v.id === selectedVariantId.value) || null
)

// Total stok maksimal yang tersedia pada paket terpilih
const maxStockCount = computed(() => availableStockList.value.length)

// Jumlah yang sedang dicentang saat ini (selaras dengan checkbox)
const selectedCount = computed(() => selectedStockIds.value.length)

// ----------------------------------------------------------------------------
// [SECTION: BUKA POP-UP & MUAT DAFTAR STOK PAKET TERPILIH]
// ----------------------------------------------------------------------------
async function openStockPickerModal() {
  if (!selectedVariantId.value) return
  isStockPickerOpen.value = true
  isLoadingStocks.value = true
  selectedStockIds.value = []

  try {
    const res = await $fetch('/api/admin/stocks-list', {
      query: { variant_id: selectedVariantId.value }
    })
    availableStockList.value = res.stocks || []
  } catch {
    toast.add({
      title: 'Gagal Memuat Stok',
      description: 'Tidak dapat mengambil daftar stok untuk paket ini.',
      color: 'error'
    })
  } finally {
    isLoadingStocks.value = false
  }
}

// ----------------------------------------------------------------------------
// [SECTION: SINKRONISASI TOMBOL INCREMENT / DECREMENT DENGAN CHECKBOX]
// ----------------------------------------------------------------------------
function handleIncrementSelection() {
  if (selectedStockIds.value.length >= maxStockCount.value) return

  // Cari stok pertama yang belum dicentang, lalu tambahkan ke daftar centang
  const nextUnchecked = availableStockList.value.find(
    item => !selectedStockIds.value.includes(item.id)
  )
  if (nextUnchecked) {
    selectedStockIds.value.push(nextUnchecked.id)
  }
}

function handleDecrementSelection() {
  if (selectedStockIds.value.length <= 0) return
  // Lepas centang pada item terakhir yang dipilih
  selectedStockIds.value.pop()
}

function toggleCheckboxItem(stockId: number) {
  const index = selectedStockIds.value.indexOf(stockId)
  if (index >= 0) {
    selectedStockIds.value.splice(index, 1)
  } else if (selectedStockIds.value.length < maxStockCount.value) {
    selectedStockIds.value.push(stockId)
  }
}

function selectAllStocks() {
  if (selectedStockIds.value.length === maxStockCount.value) {
    selectedStockIds.value = []
  } else {
    selectedStockIds.value = availableStockList.value.map(s => s.id)
  }
}

// ----------------------------------------------------------------------------
// [SECTION: LIVE PREVIEW PEMISAHAN BARIS .TXT]
// ----------------------------------------------------------------------------
const previewParsedLines = computed(() => {
  if (!rawTxtContent.value.trim()) return []
  return rawTxtContent.value
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .map((line, idx) => {
      const parts = line.split('|').map(p => p.trim())
      const isValid = (parts.length === 2 || parts.length >= 3) && (parts[0]?.includes('@') ?? false)
      return {
        lineNumber: idx + 1,
        email: parts[0] || '-',
        password: parts[1] || '-',
        extraLink: parts.slice(2).join('|') || null,
        format: parts.length >= 3 ? '3 Kolom (+Link)' : '2 Kolom',
        isValid
      }
    })
})

function handleTxtFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    rawTxtContent.value = String(reader.result || '')
    toast.add({
      title: 'File .txt Terbaca',
      description: `Berhasil memuat ${previewParsedLines.value.length} baris dari ${file.name}`,
      color: 'primary',
      icon: 'i-lucide-file-text'
    })
  }
  reader.readAsText(file)
}

async function handleUploadStocks() {
  if (!selectedVariantId.value) {
    toast.add({ title: 'Pilih Paket', description: 'Silakan pilih paket tujuan terlebih dahulu.', color: 'warning' })
    return
  }

  isSubmitting.value = true
  try {
    const res = await $fetch('/api/admin/stocks', {
      method: 'POST',
      body: {
        action: 'add_txt',
        variant_id: selectedVariantId.value,
        raw_txt_content: rawTxtContent.value
      }
    })

    toast.add({
      title: 'Stok Berhasil Dienkripsi & Disimpan',
      description: `${res.insertedCount} akun berhasil masuk ke database D1.`,
      color: 'success',
      icon: 'i-lucide-shield-check'
    })

    rawTxtContent.value = ''
    emit('uploaded')
  } catch (err: unknown) {
    const msg = (err as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Gagal mengunggah stok.'
    toast.add({ title: 'Gagal Upload', description: msg, color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}

// ----------------------------------------------------------------------------
// [SECTION: EKSEKUSI KELUARKAN STOK YANG DICENTANG DI POP-UP]
// ----------------------------------------------------------------------------
async function handleConfirmRemoveSelectedStocks() {
  if (!selectedVariantId.value || selectedStockIds.value.length === 0) return
  isSubmitting.value = true

  try {
    const res = await $fetch('/api/admin/stocks', {
      method: 'POST',
      body: {
        action: 'reduce_selected',
        variant_id: selectedVariantId.value,
        stock_ids: selectedStockIds.value
      }
    })

    toast.add({
      title: 'Stok Berhasil Dikeluarkan',
      description: `${res.reducedCount} akun terpilih telah dihapus dari stok tersedia.`,
      color: 'success',
      icon: 'i-lucide-trash-2'
    })

    isStockPickerOpen.value = false
    selectedStockIds.value = []
    emit('uploaded')
  } catch (err: unknown) {
    const msg = (err as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Gagal mengurangi stok.'
    toast.add({ title: 'Kesalahan', description: msg, color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- KOLOM KIRI: INPUT FILE .TXT -->
    <UCard class="lg:col-span-2">
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-base font-bold text-highlighted">
              Upload File .txt & Pemisah Stok Otomatis
            </h2>
            <p class="text-xs text-muted">
              Mendukung 1 file .txt berisi banyak akun (`email|pw` maupun `email | pw | link_generator`)
            </p>
          </div>
          <UBadge
            color="primary"
            variant="subtle"
            icon="i-lucide-lock"
          >
            AES-256-GCM Encrypted
          </UBadge>
        </div>
      </template>

      <div class="space-y-4">
        <UFormField
          label="1. Pilih Varian Paket Tujuan"
          required
        >
          <select
            v-model="selectedVariantId"
            class="w-full rounded-md border border-default bg-default px-3 py-2 text-sm text-highlighted focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option
              value=""
              disabled
            >
              -- Pilih Paket Aplikasi (Non-Custom Gmail) --
            </option>
            <option
              v-for="opt in variantOptions"
              :key="opt.id"
              :value="opt.id"
            >
              {{ opt.label }} (Stok Ready: {{ opt.availableStock }})
            </option>
          </select>
        </UFormField>

        <UFormField label="2. Pilih File .txt dari Komputer Anda">
          <input
            type="file"
            accept=".txt"
            class="block w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
            @change="handleTxtFileChange"
          >
        </UFormField>

        <UFormField label="Atau Tempel / Edit Langsung Isi .txt di Bawah Ini (1 Baris = 1 Akun)">
          <UTextarea
            v-model="rawTxtContent"
            :rows="7"
            class="w-full font-mono text-xs"
            placeholder="62vy1o0l@acqf.poj.me|masuk123&#10;hifidxhen672@ydah.me | Masuk12345- | https://generator.email/ydah.me/hifidxhen672"
          />
        </UFormField>

        <div class="flex justify-end">
          <UButton
            icon="i-lucide-upload-cloud"
            color="primary"
            label="Enkripsi & Simpan Semua Akun ke Database"
            :loading="isSubmitting"
            :disabled="previewParsedLines.length === 0 || !selectedVariantId"
            @click="handleUploadStocks"
          />
        </div>
      </div>
    </UCard>

    <!-- KOLOM KANAN: PREVIEW BARIS & TOMBOL BUKA POP-UP KURANGI STOK -->
    <div class="space-y-6">
      <UCard>
        <template #header>
          <h3 class="text-sm font-bold text-highlighted">
            Preview Pembacaan Baris ({{ previewParsedLines.length }} Akun)
          </h3>
        </template>

        <div
          v-if="previewParsedLines.length === 0"
          class="text-xs text-muted py-6 text-center"
        >
          Belum ada file `.txt` yang dimasukkan.
        </div>

        <div
          v-else
          class="max-h-60 overflow-y-auto space-y-2 pr-1"
        >
          <div
            v-for="item in previewParsedLines"
            :key="item.lineNumber"
            class="p-2 rounded border text-xs font-mono"
            :class="item.isValid ? 'border-default bg-elevated/40' : 'border-error bg-error/10'"
          >
            <div class="flex justify-between items-center">
              <span class="font-bold">#{{ item.lineNumber }} {{ item.email }}</span>
              <UBadge
                :color="item.isValid ? 'success' : 'error'"
                size="xs"
                variant="subtle"
              >
                {{ item.isValid ? item.format : 'Invalid' }}
              </UBadge>
            </div>
            <div class="text-muted truncate">
              PW: {{ item.password }} <span v-if="item.extraLink">| Link: {{ item.extraLink }}</span>
            </div>
          </div>
        </div>
      </UCard>

      <!-- KARTU PEMBUKA POP-UP PILIH & KELUARKAN STOK -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-highlighted">
              Keluarkan / Kurangi Stok Tersedia
            </h3>
            <UBadge
              v-if="currentVariantInfo"
              color="neutral"
              variant="subtle"
              size="xs"
            >
              Tersedia: {{ currentVariantInfo.availableStock }}
            </UBadge>
          </div>
        </template>

        <div class="space-y-3">
          <p class="text-xs text-muted leading-relaxed">
            Pilih paket di samping terlebih dahulu, lalu klik tombol di bawah untuk memilih akun mana saja yang ingin dikeluarkan dari daftar stok.
          </p>

          <UButton
            color="error"
            variant="subtle"
            icon="i-lucide-list-checks"
            label="Pilih & Keluarkan Stok..."
            block
            :disabled="!selectedVariantId || (currentVariantInfo?.availableStock ?? 0) <= 0"
            @click="openStockPickerModal"
          />
        </div>
      </UCard>
    </div>

    <!-- POP-UP MODAL PILIH STOK DENGAN INCREMENT/DECREMENT & CHECKBOX SELARAS -->
    <UModal
      v-model:open="isStockPickerOpen"
      title="Pilih Stok Akun yang Ingin Dikeluarkan"
      description="Gunakan tombol (-) / (+) atau centang langsung akun di bawah ini yang ingin dihapus dari stok."
    >
      <template #body>
        <div class="space-y-4">
          <!-- HEADER NAMA PAKET & KONTROL INCREMENT / DECREMENT -->
          <div class="p-3.5 rounded-xl bg-elevated border border-default flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="truncate">
              <span class="text-xs text-muted block">Paket Terpilih:</span>
              <strong class="text-sm text-highlighted truncate block">
                {{ currentVariantInfo?.label || '-' }}
              </strong>
            </div>

            <!-- TOMBOL DECREMENT [-] | COUNTER | INCREMENT [+] -->
            <div class="flex items-center gap-2 shrink-0">
              <UButton
                color="neutral"
                variant="outline"
                size="sm"
                icon="i-lucide-minus"
                :disabled="selectedCount <= 0"
                @click="handleDecrementSelection"
              />

              <div class="px-3 py-1 rounded-md bg-default border border-default font-mono text-sm font-bold text-center min-w-20">
                <span class="text-error">{{ selectedCount }}</span>
                <span class="text-muted"> / {{ maxStockCount }}</span>
              </div>

              <UButton
                color="neutral"
                variant="outline"
                size="sm"
                icon="i-lucide-plus"
                :disabled="selectedCount >= maxStockCount"
                @click="handleIncrementSelection"
              />
            </div>
          </div>

          <!-- BARIS AKSI CEPAT PILIH SEMUA -->
          <div class="flex items-center justify-between text-xs px-1">
            <span class="text-muted">
              Daftar Akun Ready ({{ maxStockCount }} Stok):
            </span>
            <button
              v-if="maxStockCount > 0"
              type="button"
              class="text-primary font-semibold hover:underline cursor-pointer"
              @click="selectAllStocks"
            >
              {{ selectedCount === maxStockCount ? 'Lepas Semua Centang' : 'Centang Semua Stok' }}
            </button>
          </div>

          <!-- AREA SCROLLABLE DAFTAR AKUN BESERTA CHECKBOX DI SAMPING KIRI -->
          <div
            v-if="isLoadingStocks"
            class="py-10 text-center text-xs text-muted"
          >
            Memuat dan mendekripsi daftar stok...
          </div>

          <div
            v-else-if="maxStockCount === 0"
            class="py-8 text-center text-xs text-muted"
          >
            Stok untuk paket ini sudah kosong (0 akun).
          </div>

          <div
            v-else
            class="max-h-72 overflow-y-auto space-y-2 pr-1 border border-default rounded-lg p-2 bg-default"
          >
            <div
              v-for="(stock, index) in availableStockList"
              :key="stock.id"
              class="flex items-center gap-3 p-2.5 rounded-lg border transition-colors cursor-pointer select-none"
              :class="
                selectedStockIds.includes(stock.id)
                  ? 'border-error/60 bg-error/10'
                  : 'border-default bg-elevated/30 hover:bg-elevated'
              "
              @click="toggleCheckboxItem(stock.id)"
            >
              <input
                type="checkbox"
                :checked="selectedStockIds.includes(stock.id)"
                class="w-4 h-4 rounded text-error focus:ring-error cursor-pointer shrink-0"
                @click.stop="toggleCheckboxItem(stock.id)"
              >

              <div class="flex-1 min-w-0 font-mono text-xs">
                <div class="flex items-center justify-between gap-2">
                  <span class="font-bold text-highlighted truncate">
                    #{{ index + 1 }} — {{ stock.accountLabel }}
                  </span>
                  <UBadge
                    color="neutral"
                    variant="subtle"
                    size="xs"
                    class="shrink-0"
                  >
                    ID: {{ stock.id }}
                  </UBadge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex items-center justify-between w-full">
          <span class="text-xs text-muted">
            Terpilih: <strong class="text-error">{{ selectedCount }} akun</strong>
          </span>

          <div class="flex gap-2">
            <UButton
              color="neutral"
              variant="subtle"
              label="Batal"
              :disabled="isSubmitting"
              @click="isStockPickerOpen = false"
            />
            <UButton
              color="error"
              icon="i-lucide-trash-2"
              :label="`Keluarkan ${selectedCount} Stok Terpilih`"
              :loading="isSubmitting"
              :disabled="selectedCount === 0"
              @click="handleConfirmRemoveSelectedStocks"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
