<!-- ==========================================================================
 FILE: app/components/admin/TxtStockUploader.vue
 DESKRIPSI: Komponen Lego Upload File .txt & Live Preview Pemisahan Stok Akun
=========================================================================== -->
<script setup lang="ts">
export interface VariantOption {
  id: string
  label: string
  availableStock: number
}

defineProps<{
  variantOptions: VariantOption[]
}>()

const emit = defineEmits<{ uploaded: [] }>()
const toast = useToast()

const selectedVariantId = ref('')
const rawTxtContent = ref('')
const isSubmitting = ref(false)
const reduceAmount = ref(1)
const isConfirmReduceOpen = ref(false)

// ----------------------------------------------------------------------------
// [SECTION: LIVE PREVIEW PEMISAHAN BARIS .TXT DI SISI CLIENT]
// Mendukung format 2 kolom (email|pw) & 3 kolom (email | pw | link)
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

// Membaca file .txt yang dipilih dari komputer Admin
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

// ----------------------------------------------------------------------------
// [SECTION: SUBMIT TAMBAH STOK TERENKRIPSI KE D1]
// ----------------------------------------------------------------------------
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
// [SECTION: KURANGI STOK AVAILABLE DENGAN KONFIRMASI]
// ----------------------------------------------------------------------------
async function handleConfirmReduceStock() {
  if (!selectedVariantId.value) return
  isSubmitting.value = true
  try {
    await $fetch('/api/admin/stocks', {
      method: 'POST',
      body: {
        action: 'reduce',
        variant_id: selectedVariantId.value,
        amount: reduceAmount.value
      }
    })

    toast.add({
      title: 'Stok Dikurangi',
      description: `Berhasil menghapus ${reduceAmount.value} stok available.`,
      color: 'neutral',
      icon: 'i-lucide-trash-2'
    })

    isConfirmReduceOpen.value = false
    emit('uploaded')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- KOLOM KIRI: INPUT FILE .TXT & KONTROL TAMBAH/KURANGI STOK -->
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

    <!-- KOLOM KANAN: LIVE PREVIEW PEMISAHAN & FITUR KURANGI STOK -->
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

      <!-- FITUR KURANGI STOK -->
      <UCard>
        <template #header>
          <h3 class="text-sm font-bold text-highlighted">
            Kurangi Stok Tersedia
          </h3>
        </template>

        <div class="space-y-3">
          <UFormField label="Jumlah Stok yang Ingin Dihapus">
            <UInput
              v-model="reduceAmount"
              type="number"
              min="1"
              class="w-full"
            />
          </UFormField>

          <UButton
            color="error"
            variant="subtle"
            icon="i-lucide-minus-circle"
            label="Kurangi Stok Paket Terpilih"
            block
            :disabled="!selectedVariantId"
            @click="isConfirmReduceOpen = true"
          />
        </div>
      </UCard>
    </div>

    <!-- DIALOG KONFIRMASI KURANGI STOK -->
    <CommonConfirmDialog
      v-model:open="isConfirmReduceOpen"
      title="Konfirmasi Pengurangan Stok"
      :description="`Apakah Anda yakin ingin menghapus ${reduceAmount} stok berstatus 'available' dari paket terpilih?`"
      confirm-label="Ya, Kurangi Stok"
      confirm-color="error"
      :loading="isSubmitting"
      @confirm="handleConfirmReduceStock"
    />
  </div>
</template>
