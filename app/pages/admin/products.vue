<!-- ==========================================================================
 FILE: app/pages/admin/products.vue
 DESKRIPSI: Halaman Admin CRUD Produk, Varian Paket, & Peringatan Hapus Stok
=========================================================================== -->
<script setup lang="ts">
import type { ProductFormInitialData } from '~/components/admin/ProductFormModal.vue'
import type { VariantModalInitialData } from '~/components/admin/VariantPromoModal.vue'

definePageMeta({
  middleware: ['admin-auth'],
  layout: 'admin'
})

useSeoMeta({
  title: 'CRUD Produk & Promo — ZXRSA Admin'
})

const toast = useToast()
const { data, refresh } = await useFetch('/api/admin/products')

const isProductModalOpen = ref(false)
const selectedProduct = ref<ProductFormInitialData | null>(null)

const isVariantModalOpen = ref(false)
const selectedVariant = ref<VariantModalInitialData | null>(null)

const isDeleteDialogOpen = ref(false)
const deleteTarget = ref<{ type: 'product' | 'variant', id: string, name: string } | null>(null)
const isDeleting = ref(false)

function openAddProduct() {
  selectedProduct.value = null
  isProductModalOpen.value = true
}

function openEditProduct(prod: {
  id: string
  name: string
  description: string | null
  usage_rules: string
  promo_badge: string | null
  is_active: 0 | 1
}) {
  selectedProduct.value = {
    ...prod,
    is_active: prod.is_active === 1
  }
  isProductModalOpen.value = true
}

function openAddVariant(productId: string, productName: string) {
  selectedVariant.value = {
    product_id: productId,
    product_name: productName,
    name: '',
    duration: '30 Hari',
    price: 20000,
    promo_price: null,
    promo_start_at: null,
    promo_end_at: null,
    is_custom_gmail: false,
    is_active: true
  }
  isVariantModalOpen.value = true
}

function openEditVariant(productName: string, v: {
  id: string
  product_id: string
  name: string
  duration: string
  price: number
  promo_price: number | null
  promo_start_at: string | null
  promo_end_at: string | null
  is_custom_gmail: 0 | 1
  is_active: 0 | 1
}) {
  selectedVariant.value = {
    ...v,
    product_name: productName,
    is_custom_gmail: v.is_custom_gmail === 1,
    is_active: v.is_active === 1
  }
  isVariantModalOpen.value = true
}

// ----------------------------------------------------------------------------
// [SECTION: CEK STOK SEBELUM MEMUNCULKAN DIALOG HAPUS]
// Memberi pemberitahuan langsung jika produk/paket masih punya stok > 0
// ----------------------------------------------------------------------------
function promptDeleteProduct(prod: {
  id: string
  name: string
  variants: { available_stock: number }[]
}) {
  const totalReadyStock = prod.variants.reduce((acc, v) => acc + (v.available_stock || 0), 0)
  if (totalReadyStock > 0) {
    toast.add({
      title: 'Tidak Dapat Menghapus Produk!',
      description: `Produk "${prod.name}" masih memiliki ${totalReadyStock} stok akun tersedia. Silakan kosongkan stok terlebih dahulu di menu Input Stok (.txt).`,
      color: 'error',
      icon: 'i-lucide-shield-alert'
    })
    return
  }

  deleteTarget.value = { type: 'product', id: prod.id, name: prod.name }
  isDeleteDialogOpen.value = true
}

function promptDeleteVariant(v: { id: string, name: string, available_stock: number, is_custom_gmail: 0 | 1 }) {
  if (!v.is_custom_gmail && v.available_stock > 0) {
    toast.add({
      title: 'Tidak Dapat Menghapus Paket!',
      description: `Paket "${v.name}" masih memiliki ${v.available_stock} stok akun tersedia. Kosongkan stok terlebih dahulu di menu Input Stok (.txt).`,
      color: 'error',
      icon: 'i-lucide-shield-alert'
    })
    return
  }

  deleteTarget.value = { type: 'variant', id: v.id, name: v.name }
  isDeleteDialogOpen.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  isDeleting.value = true
  try {
    const endpoint = deleteTarget.value.type === 'product' ? '/api/admin/products' : '/api/admin/variants'
    await $fetch(`${endpoint}?id=${deleteTarget.value.id}`, { method: 'DELETE' })

    toast.add({
      title: 'Berhasil Dihapus',
      description: `${deleteTarget.value.name} telah dihapus.`,
      color: 'success',
      icon: 'i-lucide-trash-2'
    })

    isDeleteDialogOpen.value = false
    await refresh()
  } catch (err: unknown) {
    const msg = (err as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Gagal menghapus data.'
    toast.add({
      title: 'Gagal Menghapus',
      description: msg,
      color: 'error',
      icon: 'i-lucide-triangle-alert'
    })
  } finally {
    isDeleting.value = false
  }
}

function formatRupiah(val: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-highlighted">
          Manajemen Produk, Paket & Waktu Promo
        </h1>
        <p class="text-sm text-muted">
          Kelola aplikasi premium, aturan garansi, dan harga promo kapan saja. (Pastikan stok sudah 0 sebelum menghapus produk/paket).
        </p>
      </div>

      <UButton
        icon="i-lucide-plus"
        color="primary"
        label="Tambah Aplikasi Baru"
        @click="openAddProduct"
      />
    </div>

    <!-- EMPTY STATE JIKA SEMUA PRODUK DIHAPUS -->
    <UCard
      v-if="!data?.products?.length"
      class="text-center py-10"
    >
      <p class="text-sm text-muted">
        Belum ada aplikasi premium yang terdaftar. Klik tombol "Tambah Aplikasi Baru" di kanan atas.
      </p>
    </UCard>

    <!-- DAFTAR PRODUK & TABEL VARIAN PAKET -->
    <div
      v-else
      class="space-y-6"
    >
      <UCard
        v-for="prod in data.products"
        :key="prod.id"
      >
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <h2 class="text-lg font-bold text-highlighted">
                  {{ prod.name }}
                </h2>
                <UBadge
                  v-if="prod.promo_badge"
                  color="warning"
                  variant="subtle"
                  size="sm"
                >
                  {{ prod.promo_badge }}
                </UBadge>
                <UBadge
                  :color="prod.is_active ? 'success' : 'neutral'"
                  variant="subtle"
                  size="sm"
                >
                  {{ prod.is_active ? 'Aktif' : 'Nonaktif' }}
                </UBadge>
              </div>
              <p class="text-xs text-muted">
                {{ prod.description || 'Tanpa deskripsi tambahan' }}
              </p>
            </div>

            <div class="flex items-center gap-2">
              <UButton
                size="xs"
                color="primary"
                variant="subtle"
                icon="i-lucide-plus-circle"
                label="Tambah Paket"
                @click="openAddVariant(prod.id, prod.name)"
              />
              <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                icon="i-lucide-pencil"
                label="Edit Produk"
                @click="openEditProduct(prod)"
              />
              <UTooltip text="Hapus Produk (Stok wajib 0)">
                <UButton
                  size="xs"
                  color="error"
                  variant="ghost"
                  icon="i-lucide-trash-2"
                  @click="promptDeleteProduct(prod)"
                />
              </UTooltip>
            </div>
          </div>
        </template>

        <div
          v-if="!prod.variants.length"
          class="py-4 text-center text-xs text-muted"
        >
          Belum ada varian paket di aplikasi ini. Klik "Tambah Paket" di atas.
        </div>

        <div
          v-else
          class="overflow-x-auto"
        >
          <table class="w-full text-left border-collapse text-sm">
            <thead>
              <tr class="border-b border-default text-xs text-muted uppercase">
                <th class="py-2 px-3">
                  Nama Paket
                </th>
                <th class="py-2 px-3">
                  Durasi
                </th>
                <th class="py-2 px-3">
                  Harga Normal
                </th>
                <th class="py-2 px-3">
                  Harga Promo & Jadwal
                </th>
                <th class="py-2 px-3">
                  Tipe
                </th>
                <th class="py-2 px-3">
                  Stok Ready
                </th>
                <th class="py-2 px-3 text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr
                v-for="v in prod.variants"
                :key="v.id"
              >
                <td class="py-2.5 px-3 font-medium text-highlighted">
                  {{ v.name }}
                </td>
                <td class="py-2.5 px-3 text-muted">
                  {{ v.duration }}
                </td>
                <td class="py-2.5 px-3 font-mono">
                  {{ formatRupiah(v.price) }}
                </td>
                <td class="py-2.5 px-3">
                  <div
                    v-if="v.promo_price"
                    class="space-y-0.5"
                  >
                    <span class="font-mono font-bold text-success">{{ formatRupiah(v.promo_price) }}</span>
                    <p
                      v-if="v.promo_start_at || v.promo_end_at"
                      class="text-xs text-muted"
                    >
                      {{ v.promo_start_at || 'Sekarang' }} s/d {{ v.promo_end_at || 'Selamanya' }}
                    </p>
                  </div>
                  <span
                    v-else
                    class="text-xs text-muted"
                  >-</span>
                </td>
                <td class="py-2.5 px-3">
                  <UBadge
                    :color="v.is_custom_gmail ? 'warning' : 'primary'"
                    variant="subtle"
                    size="sm"
                  >
                    {{ v.is_custom_gmail ? 'Custom Gmail' : 'Stok .txt Otomatis' }}
                  </UBadge>
                </td>
                <td class="py-2.5 px-3 font-mono font-bold">
                  {{ v.is_custom_gmail ? '∞ Manual' : `${v.available_stock} Akun` }}
                </td>
                <td class="py-2.5 px-3 text-right space-x-1">
                  <UButton
                    size="xs"
                    color="neutral"
                    variant="ghost"
                    icon="i-lucide-pencil"
                    @click="openEditVariant(prod.name, v)"
                  />
                  <UTooltip text="Hapus Paket (Stok wajib 0)">
                    <UButton
                      size="xs"
                      color="error"
                      variant="ghost"
                      icon="i-lucide-trash-2"
                      @click="promptDeleteVariant(v)"
                    />
                  </UTooltip>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>

    <AdminProductFormModal
      v-model:open="isProductModalOpen"
      :initial-data="selectedProduct"
      @saved="refresh()"
    />

    <AdminVariantPromoModal
      v-model:open="isVariantModalOpen"
      :initial-data="selectedVariant"
      @saved="refresh()"
    />

    <CommonConfirmDialog
      v-model:open="isDeleteDialogOpen"
      title="Konfirmasi Penghapusan"
      :description="`Stok pada '${deleteTarget?.name}' sudah 0. Apakah Anda yakin ingin menghapusnya secara permanen?`"
      confirm-label="Ya, Hapus Permanen"
      confirm-color="error"
      :loading="isDeleting"
      @confirm="confirmDelete"
    />
  </div>
</template>
