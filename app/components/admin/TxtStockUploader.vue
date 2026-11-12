<!-- ==========================================================================
 FILE: app/components/admin/TxtStockUploader.vue
 DESKRIPSI: Komponen Lego Input Stok Dinamis 3 Kolom (Email Wajib, Password &
            Link Opsional) — 100% Lolos vue-tsc Typecheck.
=========================================================================== -->
<script setup lang="ts">
export interface VariantOption {
  id: string
  label: string
  availableStock: number
}

export interface StockInputRow {
  rowKey: string
  email: string
  password: string
  link: string
}

export interface StockItemRow {
  id: number
  accountLabel: string
  formatType: string
  createdAt: string
}

const props = defineProps<{
  variantOptions: VariantOption[]
}>()

const emit = defineEmits<{
  uploaded: []
}>()

const toast = useToast()

const selectedVariantId = ref<string>('')
const isSubmitting = ref<boolean>(false)

let rowCounter = 0
function createEmptyRow(customKey?: string): StockInputRow {
  rowCounter += 1
  return {
    rowKey: customKey ?? `row-${rowCounter}-${Date.now()}`,
    email: '',
    password: '',
    link: ''
  }
}

const stockRows = ref<StockInputRow[]>([createEmptyRow('initial-row-1')])

function addNewRow(): void {
  stockRows.value.push(createEmptyRow())
}

function removeRow(index: number): void {
  if (stockRows.value.length <= 1) {
    stockRows.value = [createEmptyRow()]
    return
  }
  stockRows.value.splice(index, 1)
}

// Password & Link bersifat opsional; cukup Email yang wajib terisi
const validRowsToSave = computed<StockInputRow[]>(() =>
  stockRows.value.filter(
    (r: StockInputRow) => r.email.trim().length >= 3
  )
)

function handleTxtFileChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    const rawText = String(reader.result || '')
    const lines = rawText
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0 && l.includes('|'))

    if (lines.length === 0) {
      toast.add({
        title: 'Format .txt Tidak Dikenali',
        description: 'Pastikan baris di dalam .txt dipisahkan dengan tanda pipa (|).',
        color: 'warning'
      })
      return
    }

    stockRows.value = lines.map((line, idx) => {
      const parts = line.split('|').map(p => p.trim())
      const emailPart = parts[0] || ''
      let passwordPart = ''
      let linkPart = ''

      if (parts.length >= 3) {
        passwordPart = parts[1] || ''
        linkPart = parts.slice(2).join('|').trim()
      } else if (parts.length === 2) {
        const secondCol = parts[1] || ''
        if (/^https?:\/\//i.test(secondCol)) {
          passwordPart = ''
          linkPart = secondCol
        } else {
          passwordPart = secondCol
          linkPart = ''
        }
      }

      return {
        rowKey: `txt-${idx}-${Date.now()}`,
        email: emailPart,
        password: passwordPart,
        link: linkPart
      }
    })

    input.value = ''

    toast.add({
      title: 'File .txt Berhasil Dimuat ke Baris Input',
      description: `${stockRows.value.length} akun siap diperiksa dan disimpan.`,
      color: 'primary',
      icon: 'i-lucide-file-check'
    })
  }
  reader.readAsText(file)
}

async function handleUploadStocks(): Promise<void> {
  if (!selectedVariantId.value) {
    toast.add({
      title: 'Pilih Paket',
      description: 'Silakan pilih paket tujuan terlebih dahulu.',
      color: 'warning'
    })
    return
  }

  if (validRowsToSave.value.length === 0) {
    toast.add({
      title: 'Data Belum Lengkap',
      description: 'Isi minimal kolom Email pada baris akun.',
      color: 'warning'
    })
    return
  }

  isSubmitting.value = true
  try {
    const res = await $fetch<{ insertedCount: number }>('/api/admin/stocks', {
      method: 'POST',
      body: {
        action: 'add_structured',
        variant_id: selectedVariantId.value,
        items: validRowsToSave.value.map((r: StockInputRow) => ({
          email: r.email.trim(),
          password: r.password.trim() || null,
          link: r.link.trim() || null
        }))
      }
    })

    toast.add({
      title: 'Stok Berhasil Dienkripsi & Disimpan!',
      description: `${res.insertedCount} akun berhasil ditambahkan ke database D1.`,
      color: 'success',
      icon: 'i-lucide-shield-check'
    })

    stockRows.value = [createEmptyRow()]
    emit('uploaded')
  } catch (err: unknown) {
    const msg
      = (err as { data?: { statusMessage?: string } })?.data?.statusMessage
        || 'Gagal menyimpan stok.'
    toast.add({
      title: 'Gagal Menyimpan Stok',
      description: msg,
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}

const isStockPickerOpen = ref<boolean>(false)
const isLoadingStocks = ref<boolean>(false)
const availableStockList = ref<StockItemRow[]>([])
const selectedStockIds = ref<number[]>([])

const currentVariantInfo = computed<VariantOption | null>(() =>
  props.variantOptions.find((v: VariantOption) => v.id === selectedVariantId.value) || null
)

const maxStockCount = computed<number>(() => availableStockList.value.length)
const selectedCount = computed<number>(() => selectedStockIds.value.length)

async function openStockPickerModal(): Promise<void> {
  if (!selectedVariantId.value) return
  isStockPickerOpen.value = true
  isLoadingStocks.value = true
  selectedStockIds.value = []

  try {
    const res = await $fetch<{ stocks?: StockItemRow[] }>('/api/admin/stocks-list', {
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

function handleIncrementSelection(): void {
  if (selectedStockIds.value.length >= maxStockCount.value) return
  const nextUnchecked = availableStockList.value.find(
    (item: StockItemRow) => !selectedStockIds.value.includes(item.id)
  )
  if (nextUnchecked) {
    selectedStockIds.value.push(nextUnchecked.id)
  }
}

function handleDecrementSelection(): void {
  if (selectedStockIds.value.length <= 0) return
  selectedStockIds.value.pop()
}

function toggleCheckboxItem(stockId: number): void {
  const index = selectedStockIds.value.indexOf(stockId)
  if (index >= 0) {
    selectedStockIds.value.splice(index, 1)
  } else if (selectedStockIds.value.length < maxStockCount.value) {
    selectedStockIds.value.push(stockId)
  }
}

function selectAllStocks(): void {
  if (selectedStockIds.value.length === maxStockCount.value) {
    selectedStockIds.value = []
  } else {
    selectedStockIds.value = availableStockList.value.map((s: StockItemRow) => s.id)
  }
}

async function handleConfirmRemoveSelectedStocks(): Promise<void> {
  if (!selectedVariantId.value || selectedStockIds.value.length === 0) return
  isSubmitting.value = true

  try {
    const res = await $fetch<{ reducedCount: number }>('/api/admin/stocks', {
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
    availableStockList.value = []
    emit('uploaded')
  } catch (err: unknown) {
    const msg
      = (err as { data?: { statusMessage?: string } })?.data?.statusMessage
        || 'Gagal mengurangi stok.'
    toast.add({
      title: 'Kesalahan',
      description: msg,
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <UCard class="lg:col-span-2">
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 class="text-base font-bold text-highlighted">
              Input Stok Akun (Email Wajib, Password &amp; Link Opsional)
            </h2>
            <p class="text-xs text-muted">
              Tambah baris satu per satu atau import otomatis dari file .txt (email&#124;pw, email&#124;link, atau email &#124; pw &#124; link).
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

      <div class="space-y-5">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                v-for="opt in props.variantOptions"
                :key="opt.id"
                :value="opt.id"
              >
                {{ opt.label }} (Stok Ready: {{ opt.availableStock }})
              </option>
            </select>
          </UFormField>

          <UFormField label="2. Import Cepat dari File .txt (Opsional)">
            <input
              type="file"
              accept=".txt"
              class="block w-full text-xs text-muted file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
              @change="handleTxtFileChange"
            >
          </UFormField>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-muted">
              Daftar Baris Akun ({{ stockRows.length }} Baris)
            </span>
            <span class="text-xs text-muted">
              Kolom <strong>Password</strong> &amp; <strong>Link</strong> bersifat opsional
            </span>
          </div>

          <div class="max-h-96 overflow-y-auto space-y-2.5 pr-1">
            <div
              v-for="(rowItem, rowIndex) in stockRows"
              :key="rowItem.rowKey"
              class="p-3 rounded-xl border border-default bg-elevated/40 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
            >
              <span class="font-mono text-xs font-bold text-muted w-6 shrink-0">
                #{{ rowIndex + 1 }}
              </span>

              <input
                v-model="rowItem.email"
                type="text"
                placeholder="Email / Username (Wajib)"
                class="flex-1 min-w-0 rounded-md border border-default bg-default px-2.5 py-1.5 font-mono text-xs text-highlighted focus:outline-none focus:ring-2 focus:ring-primary"
              >

              <input
                v-model="rowItem.password"
                type="text"
                placeholder="Password (Opsional)"
                class="sm:w-40 shrink-0 rounded-md border border-default bg-default px-2.5 py-1.5 font-mono text-xs text-highlighted focus:outline-none focus:ring-2 focus:ring-primary"
              >

              <input
                v-model="rowItem.link"
                type="text"
                placeholder="Link (Opsional: https://generator.email/...)"
                class="flex-1 min-w-0 rounded-md border border-default bg-default px-2.5 py-1.5 font-mono text-xs text-highlighted focus:outline-none focus:ring-2 focus:ring-primary"
              >

              <UButton
                color="error"
                variant="subtle"
                size="sm"
                icon="i-lucide-minus"
                class="shrink-0"
                aria-label="Kurangi Baris"
                @click="removeRow(rowIndex)"
              />
            </div>
          </div>

          <div class="pt-1">
            <UButton
              color="neutral"
              variant="outline"
              size="sm"
              icon="i-lucide-plus"
              label="Tambah Baris Akun Baru"
              block
              @click="addNewRow"
            />
          </div>
        </div>

        <div class="flex items-center justify-between pt-3 border-t border-default">
          <span class="text-xs text-muted">
            Siap disimpan: <strong class="text-primary">{{ validRowsToSave.length }} Akun Valid</strong>
          </span>

          <UButton
            icon="i-lucide-upload-cloud"
            color="primary"
            :label="`Enkripsi & Simpan (${validRowsToSave.length} Akun)`"
            :loading="isSubmitting"
            :disabled="validRowsToSave.length === 0 || !selectedVariantId"
            @click="handleUploadStocks"
          />
        </div>
      </div>
    </UCard>

    <div class="space-y-6">
      <UCard>
        <template #header>
          <h3 class="text-sm font-bold text-highlighted">
            Panduan Format Fleksibel (Password &amp; Link Opsional)
          </h3>
        </template>

        <div class="space-y-3 text-xs text-muted leading-relaxed">
          <p>
            Anda bebas mengisi <strong>Email + Password</strong>, <strong>Email + Link saja</strong> (tanpa password), atau <strong>ketiganya sekaligus</strong>.
          </p>
          <div class="p-2.5 rounded-lg bg-elevated border border-default font-mono text-[11px] space-y-1.5">
            <div class="text-highlighted font-bold">
              Contoh di file .txt:
            </div>
            <div class="truncate">
              62vy1o0l@acqf.poj.me&#124;masuk123
            </div>
            <div class="truncate text-success">
              user@ydah.me &#124; https://generator.email/ydah.me/user
            </div>
            <div class="truncate text-primary">
              ewspyvens838@ydah.me &#124; Masuk12345- &#124; https://generator.email/...
            </div>
          </div>
        </div>
      </UCard>

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

    <UModal
      v-model:open="isStockPickerOpen"
      title="Pilih Stok Akun yang Ingin Dikeluarkan"
      description="Gunakan tombol (-) / (+) atau centang langsung akun di bawah ini yang ingin dihapus dari stok."
    >
      <template #body>
        <div class="space-y-4">
          <div class="p-3.5 rounded-xl bg-elevated border border-default flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="truncate">
              <span class="text-xs text-muted block">Paket Terpilih:</span>
              <strong class="text-sm text-highlighted truncate block">
                {{ currentVariantInfo?.label || '-' }}
              </strong>
            </div>

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
              v-for="(stock, stockIdx) in availableStockList"
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
                    #{{ stockIdx + 1 }} — {{ stock.accountLabel }}
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
