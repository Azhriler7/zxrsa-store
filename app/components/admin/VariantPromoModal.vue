<!-- ==========================================================================
 FILE: app/components/admin/VariantPromoModal.vue
 DESKRIPSI: Komponen Lego Modal CRUD Paket Varian dengan Master Switch Promo,
            Promo Harian Berulang (Lingkaran S M T W T F S), Promo Tanggal
            Spesifik, dan Validasi Tanggal Mulai >= Hari Ini.
=========================================================================== -->
<script setup lang="ts">
export interface VariantModalInitialData {
  id?: string
  product_id: string
  product_name?: string
  name: string
  duration: string
  price: number
  promo_price: number | null
  promo_day_of_week?: string | null
  promo_specific_date?: string | null
  promo_start_at: string | null
  promo_end_at: string | null
  is_custom_gmail: boolean
  is_active: boolean
}

const props = defineProps<{
  initialData: VariantModalInitialData | null
}>()

const isOpen = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ saved: [] }>()
const toast = useToast()

// Daftar Hari untuk Promo Harian Berulang (0 = Sunday s/d 6 = Saturday)
const weekDays = [
  { index: '0', short: 'S', full: 'Sunday (Minggu)' },
  { index: '1', short: 'M', full: 'Monday (Senin)' },
  { index: '2', short: 'T', full: 'Tuesday (Selasa)' },
  { index: '3', short: 'W', full: 'Wednesday (Rabu)' },
  { index: '4', short: 'T', full: 'Thursday (Kamis)' },
  { index: '5', short: 'F', full: 'Friday (Jumat)' },
  { index: '6', short: 'S', full: 'Saturday (Sabtu)' }
]

// Batas minimal input tanggal (Hari ini format YYYY-MM-DD dan YYYY-MM-DDTHH:mm)
const minTodayDate = computed(() => {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
})

const minTodayDateTime = computed(() => {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
})

const state = reactive({
  name: '',
  duration: '30 Hari',
  price: 20000,
  promo_price: null as number | null,
  promo_specific_date: '',
  promo_start_at: '',
  promo_end_at: '',
  is_custom_gmail: false,
  is_active: true
})

// Toggle On/Off Master Promo & Sub-Mode Promo
const isMasterPromoEnabled = ref(false)
const enableRecurringDays = ref(false)
const selectedDayIndices = ref<string[]>([])
const enableSpecificDate = ref(false)
const enableDateRange = ref(false)

watch(
  () => [props.initialData, isOpen.value],
  () => {
    if (props.initialData) {
      state.name = props.initialData.name
      state.duration = props.initialData.duration
      state.price = props.initialData.price
      state.promo_price = props.initialData.promo_price
      state.promo_specific_date = props.initialData.promo_specific_date || ''
      state.promo_start_at = props.initialData.promo_start_at || ''
      state.promo_end_at = props.initialData.promo_end_at || ''
      state.is_custom_gmail = props.initialData.is_custom_gmail
      state.is_active = props.initialData.is_active

      // Set status switch berdasarkan data yang tersimpan
      isMasterPromoEnabled.value = Boolean(props.initialData.promo_price && props.initialData.promo_price > 0)

      const savedDays = (props.initialData.promo_day_of_week || '')
        .split(',')
        .map(d => d.trim())
        .filter(Boolean)
      selectedDayIndices.value = savedDays
      enableRecurringDays.value = savedDays.length > 0

      enableSpecificDate.value = Boolean(props.initialData.promo_specific_date)
      enableDateRange.value = Boolean(props.initialData.promo_start_at || props.initialData.promo_end_at)
    }
  },
  { immediate: true }
)

function toggleDayCircle(dayIndex: string) {
  const idx = selectedDayIndices.value.indexOf(dayIndex)
  if (idx >= 0) {
    selectedDayIndices.value.splice(idx, 1)
  } else {
    selectedDayIndices.value.push(dayIndex)
  }
}

const isSaving = ref(false)

async function handleSaveVariant() {
  if (!props.initialData?.product_id) return

  if (state.name.trim().length < 2) {
    toast.add({ title: 'Nama Paket Wajib Diisi', description: 'Masukkan nama paket minimal 2 karakter.', color: 'warning' })
    return
  }

  if (!state.price || state.price <= 0) {
    toast.add({ title: 'Harga Normal Tidak Valid', description: 'Harga normal harus lebih dari Rp 0.', color: 'warning' })
    return
  }

  // Validasi hanya jika Master Switch Promo sedang DINYALAKAN
  let finalPromoPrice: number | null = null
  let finalDayOfWeek: string | null = null
  let finalSpecificDate: string | null = null
  let finalStartAt: string | null = null
  let finalEndAt: string | null = null

  if (isMasterPromoEnabled.value) {
    const numericPromo = Number(state.promo_price || 0)
    if (!numericPromo || numericPromo <= 0 || numericPromo >= state.price) {
      toast.add({
        title: 'Harga Promo Tidak Valid',
        description: 'Saat tombol Promo dinyalakan, Harga Promo wajib diisi dan harus lebih murah dari Harga Normal.',
        color: 'warning'
      })
      return
    }
    finalPromoPrice = Math.floor(numericPromo)

    if (enableRecurringDays.value && selectedDayIndices.value.length > 0) {
      finalDayOfWeek = selectedDayIndices.value.sort().join(',')
    }

    if (enableSpecificDate.value && state.promo_specific_date) {
      finalSpecificDate = state.promo_specific_date
    }

    if (enableDateRange.value) {
      if (state.promo_start_at) {
        const startDayStr = state.promo_start_at.slice(0, 10)
        if (startDayStr < minTodayDate.value) {
          toast.add({
            title: 'Tanggal Mulai Promo Tidak Valid!',
            description: 'Tanggal awal promo tidak boleh kurang dari hari ini.',
            color: 'error',
            icon: 'i-lucide-calendar-x'
          })
          return
        }
        finalStartAt = state.promo_start_at
      }

      if (state.promo_end_at) {
        if (finalStartAt && new Date(state.promo_end_at) <= new Date(finalStartAt)) {
          toast.add({
            title: 'Tanggal Berakhir Tidak Valid!',
            description: 'Waktu berakhir promo harus lebih besar dari waktu mulai promo.',
            color: 'error'
          })
          return
        }
        finalEndAt = state.promo_end_at
      }
    }
  }

  isSaving.value = true
  try {
    await $fetch('/api/admin/variants', {
      method: 'POST',
      body: {
        id: props.initialData.id,
        product_id: props.initialData.product_id,
        name: state.name.trim(),
        duration: state.duration.trim(),
        price: Math.floor(Number(state.price)),
        promo_price: finalPromoPrice,
        promo_day_of_week: finalDayOfWeek,
        promo_specific_date: finalSpecificDate,
        promo_start_at: finalStartAt,
        promo_end_at: finalEndAt,
        is_custom_gmail: state.is_custom_gmail,
        is_active: state.is_active
      }
    })

    toast.add({
      title: 'Paket & Promo Tersimpan',
      description: `Paket ${state.name} berhasil diperbarui.`,
      color: 'success',
      icon: 'i-lucide-check-circle'
    })

    isOpen.value = false
    emit('saved')
  } catch (err: unknown) {
    const msg = (err as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Gagal menyimpan paket.'
    toast.add({ title: 'Kesalahan', description: msg, color: 'error' })
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="initialData?.id ? 'Edit Paket & Pengaturan Promo' : `Tambah Paket (${initialData?.product_name || ''})`"
    description="Harga promo bersifat opsional. Gunakan tombol ON/OFF di bawah untuk mengatur jadwal promo."
  >
    <template #body>
      <div class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField
            label="Nama Paket"
            required
          >
            <UInput
              v-model="state.name"
              placeholder="Private 1 Tahun"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Durasi Aktif"
            required
          >
            <UInput
              v-model="state.duration"
              placeholder="1 Tahun / 30 Hari"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField
          label="Harga Normal (Rp)"
          required
        >
          <UInput
            v-model="state.price"
            type="number"
            class="w-full"
          />
        </UFormField>

        <!-- MASTER BUTTON ON/OFF PROMO -->
        <div class="p-4 rounded-xl border border-default bg-elevated/50 space-y-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <span class="text-sm font-bold text-highlighted flex items-center gap-1.5">
                <UIcon
                  name="i-lucide-percent"
                  class="w-4 h-4 text-primary"
                />
                Status Promo Paket Ini
              </span>
              <span class="text-xs text-muted block">
                Matikan jika paket ini menggunakan Harga Normal saja (Tanpa Promo)
              </span>
            </div>

            <UButton
              size="sm"
              :color="isMasterPromoEnabled ? 'success' : 'neutral'"
              :variant="isMasterPromoEnabled ? 'solid' : 'subtle'"
              :icon="isMasterPromoEnabled ? 'i-lucide-toggle-right' : 'i-lucide-toggle-left'"
              :label="isMasterPromoEnabled ? 'PROMO NYALA (ON)' : 'PROMO MATI (OFF)'"
              @click="isMasterPromoEnabled = !isMasterPromoEnabled"
            />
          </div>

          <!-- PANEL PENGATURAN HARGA & JADWAL PROMO (MUNCUL SAAT PROMO ON) -->
          <div
            v-if="isMasterPromoEnabled"
            class="space-y-4 pt-3 border-t border-default"
          >
            <UFormField
              label="Harga Promo Diskon (Rp)"
              required
            >
              <UInput
                v-model="state.promo_price"
                type="number"
                placeholder="Contoh: 15000"
                class="w-full"
              />
            </UFormField>

            <!-- OPSI 1: PROMO HARIAN BERULANG (S M T W T F S MELINGKAR) -->
            <div class="p-3 rounded-lg bg-default border border-default space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-xs font-bold text-highlighted block">
                    Promo Harian Berulang
                  </span>
                  <span class="text-[11px] text-muted">
                    Otomatis ubah harga menjadi promo setiap hari yang dilingkari (Misal: F = Setiap Jumat)
                  </span>
                </div>
                <UButton
                  size="xs"
                  :color="enableRecurringDays ? 'primary' : 'neutral'"
                  :variant="enableRecurringDays ? 'solid' : 'outline'"
                  :label="enableRecurringDays ? 'ON' : 'OFF'"
                  @click="enableRecurringDays = !enableRecurringDays"
                />
              </div>

              <div
                v-if="enableRecurringDays"
                class="flex items-center justify-between sm:justify-start sm:gap-3 pt-1"
              >
                <UTooltip
                  v-for="day in weekDays"
                  :key="day.index"
                  :text="day.full"
                  :delay-duration="0"
                >
                  <button
                    type="button"
                    class="w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center transition-all cursor-pointer focus:outline-none"
                    :class="
                      selectedDayIndices.includes(day.index)
                        ? 'bg-primary text-white ring-2 ring-primary ring-offset-2 ring-offset-default shadow-sm'
                        : 'text-muted hover:ring-2 hover:ring-primary/50 hover:bg-primary/10 hover:text-highlighted'
                    "
                    @click="toggleDayCircle(day.index)"
                  >
                    {{ day.short }}
                  </button>
                </UTooltip>
              </div>
            </div>

            <!-- OPSI 2: PROMO TANGGAL SPESIFIK (MISAL 1 AGUSTUS / TANGGAL KEMBAR) -->
            <div class="p-3 rounded-lg bg-default border border-default space-y-2.5">
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-xs font-bold text-highlighted block">
                    Promo Tanggal Spesifik (1 Hari Tertentu)
                  </span>
                  <span class="text-[11px] text-muted">
                    Misalnya khusus tanggal 1 Agustus atau tanggal kembar
                  </span>
                </div>
                <UButton
                  size="xs"
                  :color="enableSpecificDate ? 'primary' : 'neutral'"
                  :variant="enableSpecificDate ? 'solid' : 'outline'"
                  :label="enableSpecificDate ? 'ON' : 'OFF'"
                  @click="enableSpecificDate = !enableSpecificDate"
                />
              </div>

              <div v-if="enableSpecificDate">
                <UInput
                  v-model="state.promo_specific_date"
                  type="date"
                  :min="minTodayDate"
                  class="w-full"
                />
              </div>
            </div>

            <!-- OPSI 3: PROMO RENTANG TANGGAL & WAKTU (MULAI >= HARI INI) -->
            <div class="p-3 rounded-lg bg-default border border-default space-y-2.5">
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-xs font-bold text-highlighted block">
                    Promo Rentang Tanggal & Jam
                  </span>
                  <span class="text-[11px] text-muted">
                    Tanggal mulai promo minimal hari ini ({{ minTodayDate }})
                  </span>
                </div>
                <UButton
                  size="xs"
                  :color="enableDateRange ? 'primary' : 'neutral'"
                  :variant="enableDateRange ? 'solid' : 'outline'"
                  :label="enableDateRange ? 'ON' : 'OFF'"
                  @click="enableDateRange = !enableDateRange"
                />
              </div>

              <div
                v-if="enableDateRange"
                class="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                <UFormField label="Waktu Mulai (Min: Hari Ini)">
                  <UInput
                    v-model="state.promo_start_at"
                    type="datetime-local"
                    :min="minTodayDateTime"
                    class="w-full"
                  />
                </UFormField>

                <UFormField label="Waktu Berakhir">
                  <UInput
                    v-model="state.promo_end_at"
                    type="datetime-local"
                    :min="state.promo_start_at || minTodayDateTime"
                    class="w-full"
                  />
                </UFormField>
              </div>
            </div>

            <p class="text-[11px] text-muted italic">
              *Tip: Jika ketiga jadwal di atas dibiarkan OFF sementara tombol utama PROMO NYALA (ON), maka Harga Promo akan aktif terus setiap hari.
            </p>
          </div>
        </div>

        <div class="space-y-2 pt-1">
          <UCheckbox
            v-model="state.is_custom_gmail"
            label="Paket Custom Gmail (Pembeli input Gmail sendiri & dikonfirmasi manual oleh Admin)"
          />
          <UCheckbox
            v-model="state.is_active"
            label="Paket aktif dan dapat dibeli"
          />
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <UButton
            color="neutral"
            variant="subtle"
            label="Batal"
            @click="isOpen = false"
          />
          <UButton
            color="primary"
            label="Simpan Paket"
            :loading="isSaving"
            @click="handleSaveVariant"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
