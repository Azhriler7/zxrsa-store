<!-- ==========================================================================
 FILE: app/components/admin/ProductFormModal.vue
 DESKRIPSI: Komponen Lego Modal Form CRUD Produk Aplikasi (Slug Otomatis)
=========================================================================== -->
<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

export interface ProductFormInitialData {
  id?: string
  name: string
  description: string | null
  usage_rules: string
  image_url?: string | null
  promo_badge: string | null
  is_active: boolean
}

const props = defineProps<{
  initialData?: ProductFormInitialData | null
}>()

const isOpen = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ saved: [] }>()
const toast = useToast()

const schema = z.object({
  name: z.string().min(2, 'Nama aplikasi wajib diisi'),
  description: z.string().optional(),
  usage_rules: z.string().min(5, 'Aturan pemakaian wajib diisi untuk ditampilkan di Invoice'),
  promo_badge: z.string().optional(),
  is_active: z.boolean()
})

type Schema = z.output<typeof schema>

const state = reactive<Schema>({
  name: '',
  description: '',
  usage_rules: '1. Dilarang mengubah password atau profil akun.\n2. Gunakan sesuai batas perangkat yang ditentukan.\n3. Melanggar aturan akan menghanguskan garansi.',
  promo_badge: '',
  is_active: true
})

watch(
  () => [props.initialData, isOpen.value],
  () => {
    if (props.initialData) {
      state.name = props.initialData.name
      state.description = props.initialData.description || ''
      state.usage_rules = props.initialData.usage_rules
      state.promo_badge = props.initialData.promo_badge || ''
      state.is_active = props.initialData.is_active
    } else {
      state.name = ''
      state.description = ''
      state.usage_rules = '1. Dilarang mengubah password atau profil akun.\n2. Gunakan sesuai batas perangkat yang ditentukan.\n3. Melanggar aturan akan menghanguskan garansi.'
      state.promo_badge = ''
      state.is_active = true
    }
  },
  { immediate: true }
)

const isSaving = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  isSaving.value = true
  try {
    await $fetch('/api/admin/products', {
      method: 'POST',
      body: {
        id: props.initialData?.id,
        ...event.data
      }
    })

    toast.add({
      title: 'Produk Tersimpan',
      description: `Aplikasi ${event.data.name} berhasil disimpan.`,
      color: 'success',
      icon: 'i-lucide-check-circle'
    })

    isOpen.value = false
    emit('saved')
  } catch (err: unknown) {
    const msg = (err as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Gagal menyimpan produk.'
    toast.add({ title: 'Kesalahan', description: msg, color: 'error' })
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="initialData?.id ? 'Edit Aplikasi Premium' : 'Tambah Aplikasi Premium Baru'"
    description="Atur informasi aplikasi dan aturan garansi yang akan muncul di Invoice pembeli."
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
            label="Nama Aplikasi"
            name="name"
            required
          >
            <UInput
              v-model="state.name"
              placeholder="Contoh: Alight Motion Pro"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Label Badge Promo (Opsional)"
            name="promo_badge"
          >
            <UInput
              v-model="state.promo_badge"
              placeholder="Contoh: BEST SELLER / HOT PROMO"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField
          label="Deskripsi Singkat"
          name="description"
        >
          <UTextarea
            v-model="state.description"
            :rows="2"
            class="w-full"
            placeholder="Fitur unggulan aplikasi..."
          />
        </UFormField>

        <UFormField
          label="Aturan Pemakaian & Garansi (Muncul di Invoice & Email)"
          name="usage_rules"
          required
        >
          <UTextarea
            v-model="state.usage_rules"
            :rows="4"
            class="w-full font-mono text-xs"
          />
        </UFormField>

        <div class="flex items-center justify-between pt-2">
          <UCheckbox
            v-model="state.is_active"
            label="Tampilkan produk ini di halaman pembeli"
          />

          <div class="flex gap-2">
            <UButton
              color="neutral"
              variant="subtle"
              label="Batal"
              @click="isOpen = false"
            />
            <UButton
              type="submit"
              color="primary"
              label="Simpan Produk"
              :loading="isSaving"
            />
          </div>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
