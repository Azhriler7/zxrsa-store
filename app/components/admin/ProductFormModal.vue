<!-- ==========================================================================
 FILE: app/components/admin/ProductFormModal.vue
 DESKRIPSI: Komponen Lego Modal Form CRUD Produk Aplikasi (Aturan & Tutorial
            kini berada di tiap Paket).
=========================================================================== -->
<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

export interface ProductFormInitialData {
  id?: string
  name: string
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
const config = useRuntimeConfig()

const defaultRepo = String(config.public.githubIconRepo || 'Azhriler7/Azhriler7-my-public-assets')
const defaultFolder = String(config.public.githubIconFolder || 'zxrsa-store-asset')

const githubRepoInput = useCookie<string>('zxrsa_gh_icon_repo', {
  maxAge: 60 * 60 * 24 * 365,
  default: () => defaultRepo
})

const githubFolderInput = useCookie<string>('zxrsa_gh_icon_folder', {
  maxAge: 60 * 60 * 24 * 365,
  default: () => defaultFolder
})

const { data: iconData, status: iconStatus, refresh: refreshIcons } = await useFetch('/api/admin/github-icons', {
  query: {
    repo: githubRepoInput,
    folder: githubFolderInput
  }
})

const defaultPlaceholderUrl = computed(() =>
  iconData.value?.defaultPlaceholder || ''
)

const schema = z.object({
  name: z.string().min(2, 'Nama aplikasi wajib diisi'),
  image_url: z.string().optional(),
  promo_badge: z.string().optional(),
  is_active: z.boolean()
})

type Schema = z.output<typeof schema>

const state = reactive<Schema>({
  name: '',
  image_url: '',
  promo_badge: '',
  is_active: true
})

watch(
  () => [props.initialData, isOpen.value],
  () => {
    if (props.initialData) {
      state.name = props.initialData.name
      state.image_url = props.initialData.image_url || defaultPlaceholderUrl.value
      state.promo_badge = props.initialData.promo_badge || ''
      state.is_active = props.initialData.is_active
    } else {
      state.name = ''
      state.image_url = defaultPlaceholderUrl.value
      state.promo_badge = ''
      state.is_active = true
    }
  },
  { immediate: true }
)

const isSaving = ref(false)
const showRepoSettings = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  isSaving.value = true
  try {
    await $fetch('/api/admin/products', {
      method: 'POST',
      body: {
        id: props.initialData?.id,
        ...event.data,
        image_url: event.data.image_url?.trim() || defaultPlaceholderUrl.value
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
    description="Pilih nama dan icon aplikasi dari GitHub CDN. (Aturan & Tutorial diatur pada tiap paket)."
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

        <div class="p-3.5 rounded-xl bg-elevated/60 border border-default space-y-3">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <CommonAppIconImage
                :src="state.image_url"
                :alt="state.name || 'Preview Icon'"
                size-class="w-12 h-12"
                rounded-class="rounded-xl"
              />
              <div>
                <span class="text-xs font-bold text-highlighted block">
                  Pilih Icon Aplikasi (jsDelivr GitHub CDN)
                </span>
                <span class="text-[11px] text-muted block">
                  Otomatis memakai Default Image jika belum dipilih dari dropdown
                </span>
              </div>
            </div>

            <UButton
              size="xs"
              color="neutral"
              variant="outline"
              icon="i-lucide-settings-2"
              :label="showRepoSettings ? 'Tutup Repo' : 'Atur Repo GitHub'"
              @click="showRepoSettings = !showRepoSettings"
            />
          </div>

          <div
            v-if="showRepoSettings"
            class="p-3 rounded-lg bg-default border border-default space-y-2.5"
          >
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <UFormField label="Repo GitHub Public (username/repo)">
                <UInput
                  v-model="githubRepoInput"
                  size="xs"
                  placeholder="Azhriler7/Azhriler7-my-public-assets"
                  class="w-full font-mono"
                />
              </UFormField>
              <UFormField label="Nama Folder Icon di Repo">
                <UInput
                  v-model="githubFolderInput"
                  size="xs"
                  placeholder="zxrsa-store-asset"
                  class="w-full font-mono"
                />
              </UFormField>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[11px] text-muted">
                Di-load cepat via <code>cdn.jsdelivr.net</code>
              </span>
              <UButton
                size="xs"
                color="primary"
                variant="subtle"
                icon="i-lucide-refresh-cw"
                label="Muat Ulang Daftar Icon"
                :loading="iconStatus === 'pending'"
                @click="refreshIcons()"
              />
            </div>
          </div>

          <UFormField label="Dropdown Pilih Icon">
            <select
              v-model="state.image_url"
              class="w-full rounded-md border border-default bg-default px-3 py-2 text-xs font-medium text-highlighted focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option
                v-for="item in iconData?.icons || []"
                :key="item.url"
                :value="item.url"
              >
                {{ item.label }}
              </option>
            </select>
          </UFormField>
        </div>

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
