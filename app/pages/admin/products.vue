<!-- ==========================================================================
 FILE: app/pages/admin/products.vue
 DESKRIPSI: Halaman Admin CRUD Produk Aplikasi, Varian Paket, & Waktu Promo
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
  slug: string
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

function promptDelete(type: 'product' | 'variant', id: string, name: string) {
  deleteTarget.value = { type, id, name }
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
      color: 'neutral'
    })

    isDeleteDialogOpen.value = false
    await refresh()
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
          Kelola aplikasi premium (Wink, Alight Motion, CapCut), aturan garansi, dan harga promo kapan saja.
        </p>
      </div>

      <UButton
        icon="i-lucide-plus"
        color="primary"
        label="Tambah Aplikasi Baru"
        @click="openAddProduct"
      />
    </div>

    <!-- DAFTAR PRODUK & TABEL VARIAN PAKET -->
    <div class="space-y-6">
      <UCard
        v-for="prod in data?.products"
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
              <UButton
                size="xs"
                color="error"
                variant="ghost"
                icon="i-lucide-trash-2"
                @click="promptDelete('product', prod.id, prod.name)"
              />
            </div>
          </div>
        </template>

        <!-- TABEL PAKET DI DALAM PRODUK -->
        <div class="overflow-x-auto">
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
                  <UButton
                    size="xs"
                    color="error"
                    variant="ghost"
                    icon="i-lucide-trash-2"
                    @click="promptDelete('variant', v.id, v.name)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>

    <!-- KOMPONEN LEGO MODAL & CONFIRM DIALOG -->
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
      :description="`Apakah Anda yakin ingin menghapus '${deleteTarget?.name}' secara permanen?`"
      confirm-label="Ya, Hapus"
      confirm-color="error"
      :loading="isDeleting"
      @confirm="confirmDelete"
    />
  </div>
</template>
