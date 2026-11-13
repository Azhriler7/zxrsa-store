<!-- ==========================================================================
 FILE: app/pages/admin/faqs.vue
 DESKRIPSI: Halaman Admin CRUD Pertanyaan Umum (FAQ)
=========================================================================== -->
<script setup lang="ts">
import type { DbFaq } from '~~/server/types/database'

definePageMeta({
  middleware: ['admin-auth'],
  layout: 'admin'
})

useSeoMeta({
  title: 'CRUD FAQ — ZXRSA Admin'
})

const toast = useToast()
const { data, refresh } = await useFetch('/api/admin/faqs')

const isModalOpen = ref(false)
const isSaving = ref(false)
const isDeleteOpen = ref(false)
const deleteTargetId = ref('')

const form = reactive({
  id: '' as string | undefined,
  question: '',
  answer: '',
  sort_order: 1,
  is_active: true
})

function openAddFaq() {
  form.id = undefined
  form.question = ''
  form.answer = ''
  form.sort_order = (data.value?.faqs.length || 0) + 1
  form.is_active = true
  isModalOpen.value = true
}

function openEditFaq(item: DbFaq) {
  form.id = item.id
  form.question = item.question
  form.answer = item.answer
  form.sort_order = item.sort_order
  form.is_active = item.is_active === 1
  isModalOpen.value = true
}

async function saveFaq() {
  isSaving.value = true
  try {
    await $fetch('/api/admin/faqs', {
      method: 'POST',
      body: form
    })
    toast.add({ title: 'FAQ Berhasil Disimpan', color: 'success' })
    isModalOpen.value = false
    await refresh()
  } catch (err: unknown) {
    const msg = (err as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Gagal menyimpan FAQ.'
    toast.add({ title: 'Kesalahan', description: msg, color: 'error' })
  } finally {
    isSaving.value = false
  }
}

function promptDelete(id: string) {
  deleteTargetId.value = id
  isDeleteOpen.value = true
}

async function confirmDelete() {
  await $fetch(`/api/admin/faqs?id=${deleteTargetId.value}`, { method: 'DELETE' })
  toast.add({ title: 'FAQ Dihapus', color: 'neutral' })
  isDeleteOpen.value = false
  await refresh()
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-highlighted">
          Manajemen CRUD FAQ
        </h1>
        <p class="text-sm text-muted">
          Kelola daftar pertanyaan dan jawaban yang tampil pada akordion halaman utama pembeli.
        </p>
      </div>

      <UButton
        icon="i-lucide-plus"
        color="primary"
        label="Tambah FAQ Baru"
        @click="openAddFaq"
      />
    </div>

    <UCard>
      <div class="max-h-130 overflow-y-auto space-y-3 pr-1">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="border-b border-default text-xs text-muted uppercase">
              <th class="py-2.5 px-3">
                Urutan
              </th>
              <th class="py-2.5 px-3">
                Pertanyaan
              </th>
              <th class="py-2.5 px-3">
                Jawaban
              </th>
              <th class="py-2.5 px-3">
                Status
              </th>
              <th class="py-2.5 px-3 text-right">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr
              v-for="item in data?.faqs"
              :key="item.id"
            >
              <td class="py-3 px-3 font-mono font-bold">
                #{{ item.sort_order }}
              </td>
              <td class="py-3 px-3 font-semibold text-highlighted">
                {{ item.question }}
              </td>
              <td class="py-3 px-3 text-xs text-muted max-w-md">
                {{ item.answer }}
              </td>
              <td class="py-3 px-3">
                <UBadge
                  :color="item.is_active ? 'success' : 'neutral'"
                  variant="subtle"
                  size="sm"
                >
                  {{ item.is_active ? 'Aktif' : 'Nonaktif' }}
                </UBadge>
              </td>
              <td class="py-3 px-3 text-right space-x-1 whitespace-nowrap">
                <UButton
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-pencil"
                  @click="openEditFaq(item)"
                />
                <UButton
                  size="xs"
                  color="error"
                  variant="ghost"
                  icon="i-lucide-trash-2"
                  @click="promptDelete(item.id)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <UModal
      v-model:open="isModalOpen"
      :title="form.id ? 'Edit FAQ' : 'Tambah FAQ Baru'"
    >
      <template #body>
        <div class="space-y-4">
          <UFormField
            label="Pertanyaan"
            required
          >
            <UInput
              v-model="form.question"
              class="w-full"
              placeholder="Tulis pertanyaan..."
            />
          </UFormField>

          <UFormField
            label="Jawaban Lengkap"
            required
          >
            <UTextarea
              v-model="form.answer"
              :rows="4"
              class="w-full"
              placeholder="Tulis penjelasan jawaban..."
            />
          </UFormField>

          <UFormField label="Nomor Urut Tampil">
            <UInput
              v-model="form.sort_order"
              type="number"
              class="w-full"
            />
          </UFormField>

          <UCheckbox
            v-model="form.is_active"
            label="Tampilkan FAQ ini di halaman pembeli"
          />
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton
            color="neutral"
            variant="subtle"
            label="Batal"
            @click="isModalOpen = false"
          />
          <UButton
            color="primary"
            label="Simpan FAQ"
            :loading="isSaving"
            @click="saveFaq"
          />
        </div>
      </template>
    </UModal>

    <CommonConfirmDialog
      v-model:open="isDeleteOpen"
      title="Hapus FAQ"
      description="Apakah Anda yakin ingin menghapus item FAQ ini?"
      confirm-label="Ya, Hapus"
      confirm-color="error"
      @confirm="confirmDelete"
    />
  </div>
</template>
