<!-- ==========================================================================
 FILE: app/pages/admin/testimonials.vue
 DESKRIPSI: Halaman Admin CRUD Testimoni (Moderasi Review Pembeli & Input Manual)
=========================================================================== -->
<script setup lang="ts">
import type { DbTestimonial } from '~~/server/types/database'

definePageMeta({
  middleware: ['admin-auth'],
  layout: 'admin'
})

useSeoMeta({
  title: 'CRUD Testimoni — ZXRSA Admin'
})

const toast = useToast()
const { data, refresh } = await useFetch('/api/admin/testimonials')

const isModalOpen = ref(false)
const isSaving = ref(false)
const isDeleteOpen = ref(false)
const deleteTargetId = ref('')

const form = reactive({
  id: '' as string | undefined,
  customer_email: '',
  product_package_name: '',
  rating: 5,
  comment: '',
  is_approved: true
})

function openAddModal() {
  form.id = undefined
  form.customer_email = ''
  form.product_package_name = 'Alight Motion Pro — Private 1 Tahun'
  form.rating = 5
  form.comment = ''
  form.is_approved = true
  isModalOpen.value = true
}

function openEditModal(item: DbTestimonial) {
  form.id = item.id
  form.customer_email = item.customer_email
  form.product_package_name = item.product_package_name
  form.rating = item.rating
  form.comment = item.comment
  form.is_approved = item.is_approved === 1
  isModalOpen.value = true
}

async function saveTestimonial() {
  isSaving.value = true
  try {
    await $fetch('/api/admin/testimonials', {
      method: 'POST',
      body: {
        action: 'upsert',
        ...form
      }
    })
    toast.add({
      title: 'Testimoni Disimpan',
      description: 'Data testimoni dan privasi email berhasil diperbarui.',
      color: 'success'
    })
    isModalOpen.value = false
    await refresh()
  } catch (err: unknown) {
    const msg = (err as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Gagal menyimpan testimoni.'
    toast.add({ title: 'Kesalahan', description: msg, color: 'error' })
  } finally {
    isSaving.value = false
  }
}

async function toggleApprove(item: DbTestimonial) {
  const newStatus = item.is_approved === 0
  await $fetch('/api/admin/testimonials', {
    method: 'POST',
    body: {
      action: 'toggle_approval',
      id: item.id,
      is_approved: newStatus
    }
  })
  toast.add({
    title: newStatus ? 'Ditampilkan di Homepage' : 'Disembunyikan dari Homepage',
    description: `Testimoni ${item.masked_email} berhasil diperbarui.`,
    color: newStatus ? 'success' : 'neutral'
  })
  await refresh()
}

function promptDelete(id: string) {
  deleteTargetId.value = id
  isDeleteOpen.value = true
}

async function confirmDelete() {
  await $fetch(`/api/admin/testimonials?id=${deleteTargetId.value}`, { method: 'DELETE' })
  toast.add({ title: 'Testimoni Dihapus', color: 'neutral' })
  isDeleteOpen.value = false
  await refresh()
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-highlighted">
          CRUD Testimoni & Moderasi Rating Pembeli
        </h1>
        <p class="text-sm text-muted">
          Pilih ulasan pembeli yang ingin ditampilkan di auto-slide halaman utama atau tambahkan testimoni secara manual.
        </p>
      </div>

      <UButton
        icon="i-lucide-plus"
        color="primary"
        label="Tambah Testimoni Manual"
        @click="openAddModal"
      />
    </div>

    <UCard>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="border-b border-default text-xs text-muted uppercase">
              <th class="py-2.5 px-3">
                Pembeli (Privasi)
              </th>
              <th class="py-2.5 px-3">
                Paket Dibeli
              </th>
              <th class="py-2.5 px-3">
                Bintang
              </th>
              <th class="py-2.5 px-3">
                Ulasan
              </th>
              <th class="py-2.5 px-3">
                Sumber
              </th>
              <th class="py-2.5 px-3">
                Tampil di Web?
              </th>
              <th class="py-2.5 px-3 text-right">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr
              v-for="item in data?.testimonials"
              :key="item.id"
            >
              <td class="py-3 px-3">
                <div class="font-mono font-bold text-highlighted">
                  {{ item.masked_email }}
                </div>
                <div class="text-xs text-muted">
                  {{ item.customer_email }}
                </div>
              </td>
              <td class="py-3 px-3 font-medium">
                {{ item.product_package_name }}
              </td>
              <td class="py-3 px-3">
                <CommonStarRating
                  :model-value="item.rating"
                  size="sm"
                />
              </td>
              <td class="py-3 px-3 max-w-xs">
                <p class="text-xs text-highlighted line-clamp-2">
                  "{{ item.comment }}"
                </p>
              </td>
              <td class="py-3 px-3">
                <UBadge
                  :color="item.source === 'customer' ? 'success' : 'neutral'"
                  variant="subtle"
                  size="xs"
                >
                  {{ item.source === 'customer' ? 'Asli Pembeli' : 'Input Admin' }}
                </UBadge>
              </td>
              <td class="py-3 px-3">
                <UButton
                  size="xs"
                  :color="item.is_approved ? 'success' : 'warning'"
                  variant="subtle"
                  :icon="item.is_approved ? 'i-lucide-eye' : 'i-lucide-eye-off'"
                  :label="item.is_approved ? 'Tampil (Aktif)' : 'Sembunyi (Draft)'"
                  @click="toggleApprove(item)"
                />
              </td>
              <td class="py-3 px-3 text-right space-x-1 whitespace-nowrap">
                <UButton
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-pencil"
                  @click="openEditModal(item)"
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

    <!-- MODAL INPUT / EDIT TESTIMONI OLEH ADMIN -->
    <UModal
      v-model:open="isModalOpen"
      :title="form.id ? 'Edit Testimoni' : 'Tambah Testimoni Manual'"
      description="Email akan otomatis disamarkan sebagian (contoh: abc***@gmail.com) saat ditampilkan di halaman pembeli."
    >
      <template #body>
        <div class="space-y-4">
          <UFormField
            label="Email Pembeli (Akan Disamarkan Otomatis)"
            required
          >
            <UInput
              v-model="form.customer_email"
              type="email"
              placeholder="contoh.pembeli@gmail.com"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Nama Aplikasi & Paket"
            required
          >
            <UInput
              v-model="form.product_package_name"
              placeholder="Wink VIP — Private 1 Bulan"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Jumlah Bintang (Klik Bintang)"
            required
          >
            <CommonStarRating
              v-model="form.rating"
              interactive
              size="lg"
            />
          </UFormField>

          <UFormField
            label="Isi Ulasan / Testimoni"
            required
          >
            <UTextarea
              v-model="form.comment"
              :rows="3"
              class="w-full"
              placeholder="Tulis isi testimoni..."
            />
          </UFormField>

          <UCheckbox
            v-model="form.is_approved"
            label="Langsung tampilkan di halaman utama (Homepage)"
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
            label="Simpan Testimoni"
            :loading="isSaving"
            @click="saveTestimonial"
          />
        </div>
      </template>
    </UModal>

    <CommonConfirmDialog
      v-model:open="isDeleteOpen"
      title="Hapus Testimoni"
      description="Apakah Anda yakin ingin menghapus testimoni ini secara permanen?"
      confirm-label="Ya, Hapus"
      confirm-color="error"
      @confirm="confirmDelete"
    />
  </div>
</template>
