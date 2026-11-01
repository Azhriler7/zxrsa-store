<!-- ==========================================================================
 FILE: app/pages/admin/stocks.vue
 DESKRIPSI: Halaman Admin Input Stok File .txt & Pemisahan Akun Massal
=========================================================================== -->
<script setup lang="ts">
definePageMeta({
  middleware: ['admin-auth'],
  layout: 'admin'
})

useSeoMeta({
  title: 'Input Stok .txt — ZXRSA Admin'
})

const { data, refresh } = await useFetch('/api/admin/products')

// Daftar varian paket yang menggunakan stok otomatis (bukan Custom Gmail)
const stockVariantOptions = computed(() => {
  const list: { id: string, label: string, availableStock: number }[] = []
  for (const prod of data.value?.products || []) {
    for (const v of prod.variants) {
      if (!v.is_custom_gmail) {
        list.push({
          id: v.id,
          label: `${prod.name} — ${v.name}`,
          availableStock: v.available_stock
        })
      }
    }
  }
  return list
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-highlighted">
        Manajemen & Input Stok Akun (.txt)
      </h1>
      <p class="text-sm text-muted">
        Unggah file `.txt` berisi banyak akun sekaligus. Sistem otomatis memisahkan setiap baris dan mengenkripsinya dengan AES-256-GCM.
      </p>
    </div>

    <!-- KOMPONEN LEGO TXT STOCK UPLOADER -->
    <AdminTxtStockUploader
      :variant-options="stockVariantOptions"
      @uploaded="refresh()"
    />
  </div>
</template>
