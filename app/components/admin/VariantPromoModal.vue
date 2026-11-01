<!-- ==========================================================================
 FILE: app/components/admin/VariantPromoModal.vue
 DESKRIPSI: Komponen Lego Modal CRUD Paket Varian & Pengaturan Jadwal Promo
=========================================================================== -->
<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

export interface VariantModalInitialData {
  id?: string
  product_id: string
  product_name?: string
  name: string
  duration: string
  price: number
  promo_price: number | null
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

const schema = z.object({
  name: z.string().min(2, 'Nama paket minimal 2 karakter'),
  duration: z.string().min(2, 'Durasi wajib diisi'),
  price: z.coerce.number().int().positive('Harga harus angka bulat positif'),
  promo_price: z.preprocess(
    val => (val === '' || val === null || val === 0 ? null : Number(val)),
    z.number().int().positive().nullable().optional()
  ),
  promo_start_at: z.string().optional(),
  promo_end_at: z.string().optional(),
  is_custom_gmail: z.boolean(),
  is_active: z.boolean()
})

type Schema = z.output<typeof schema>

const state = reactive({
  name: '',
  duration: '30 Hari',
  price: 20000,
  promo_price: undefined as number | undefined,
  promo_start_at: '',
  promo_end_at: '',
  is_custom_gmail: false,
  is_active: true
})

watch(
  () => [props.initialData, isOpen.value],
  () => {
    if (props.initialData) {
      state.name = props.initialData.name
      state.duration = props.initialData.duration
      state.price = props.initialData.price
      state.promo_price = props.initialData.promo_price ?? undefined
      state.promo_start_at = props.initialData.promo_start_at || ''
      state.promo_end_at = props.initialData.promo_end_at || ''
      state.is_custom_gmail = props.initialData.is_custom_gmail
      state.is_active = props.initialData.is_active
    }
  },
  { immediate: true }
)

const isSaving = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (!props.initialData?.product_id) return
  isSaving.value = true

  try {
    await $fetch('/api/admin/variants', {
      method: 'POST',
      body: {
        id: props.initialData.id,
        product_id: props.initialData.product_id,
        ...event.data,
        promo_price: event.data.promo_price || null,
        promo_start_at: event.data.promo_start_at || null,
        promo_end_at: event.data.promo_end_at || null
      }
    })

    toast.add({
      title: 'Paket & Promo Tersimpan',
      description: `Paket ${event.data.name} berhasil disimpan.`,
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
    :title="initialData?.id ? 'Edit Paket & Waktu Promo' : `Tambah Paket (${initialData?.product_name || ''})`"
    description="Atur harga Rupiah (Integer), tipe pengiriman stok, dan jadwal aktif promo."
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField
            label="Nama Paket"
            name="name"
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
            name="duration"
            required
          >
            <UInput
              v-model="state.duration"
              placeholder="1 Tahun / 30 Hari"
              class="w-full"
            />
          </UFormField>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField
            label="Harga Normal (Rp)"
            name="price"
            required
          >
            <UInput
              v-model="state.price"
              type="number"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Harga Promo (Rp - Opsional)"
            name="promo_price"
          >
            <UInput
              v-model="state.promo_price"
              type="number"
              placeholder="Kosongkan jika tanpa promo"
              class="w-full"
            />
          </UFormField>
        </div>

        <!-- PENGATURAN WAKTU PROMO BEBAS KAPAN SAJA -->
        <div class="p-3 rounded-lg bg-elevated border border-default space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-highlighted flex items-center gap-1.5">
              <UIcon
                name="i-lucide-calendar-clock"
                class="w-4 h-4 text-primary"
              />
              Jadwal Waktu Promo (Opsional)
            </span>
            <span class="text-xs text-muted">Kosongkan jika promo berlaku terus</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UFormField
              label="Waktu Mulai Promo"
              name="promo_start_at"
            >
              <UInput
                v-model="state.promo_start_at"
                type="datetime-local"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Waktu Berakhir Promo"
              name="promo_end_at"
            >
              <UInput
                v-model="state.promo_end_at"
                type="datetime-local"
                class="w-full"
              />
            </UFormField>
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

        <div class="flex justify-end gap-2 pt-3">
          <UButton
            color="neutral"
            variant="subtle"
            label="Batal"
            @click="isOpen = false"
          />
          <UButton
            type="submit"
            color="primary"
            label="Simpan Paket"
            :loading="isSaving"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
