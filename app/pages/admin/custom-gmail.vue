<!-- ==========================================================================
 FILE: app/pages/admin/custom-gmail.vue
 DESKRIPSI: Halaman Antrean Paket Custom Gmail Admin (Dilengkapi Fitur Search
            & Scroll View Card Agar Halaman Tidak Memanjang).
=========================================================================== -->
<script setup lang="ts">
definePageMeta({
  middleware: ['admin-auth'],
  layout: 'admin'
})

useSeoMeta({
  title: 'Antrean Custom Gmail — ZXRSA Admin'
})

const toast = useToast()
const { data, status, refresh } = await useFetch('/api/admin/custom-gmail')

const searchQuery = ref('')
const isConfirmOpen = ref(false)
const selectedOrder = ref<{
  id: string
  customer_email: string
  custom_gmail_account: string | null
  product_name: string
  variant_name: string
} | null>(null)
const isProcessing = ref(false)

const filteredQueue = computed(() => {
  const list = data.value?.queue || []
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return list

  return list.filter((item) => {
    return (
      item.id.toLowerCase().includes(q)
      || item.customer_email.toLowerCase().includes(q)
      || (item.custom_gmail_account || '').toLowerCase().includes(q)
      || item.product_name.toLowerCase().includes(q)
      || item.variant_name.toLowerCase().includes(q)
    )
  })
})

function promptConfirmOrder(item: {
  id: string
  customer_email: string
  custom_gmail_account: string | null
  product_name: string
  variant_name: string
}) {
  selectedOrder.value = item
  isConfirmOpen.value = true
}

async function handleConfirmCompleted() {
  if (!selectedOrder.value?.id) return
  isProcessing.value = true

  try {
    const res = await $fetch<{
      success: boolean
      emailSent?: boolean
      emailError?: string | null
    }>('/api/admin/custom-gmail-confirm', {
      method: 'POST',
      body: {
        id: selectedOrder.value.id,
        transaction_id: selectedOrder.value.id
      }
    })

    if (res.emailError) {
      toast.add({
        title: 'Status Selesai (Email Tertunda)',
        description: `Status pesanan berhasil diubah ke Selesai, namun Resend melaporkan: ${res.emailError}`,
        color: 'warning',
        icon: 'i-lucide-mail-warning'
      })
    } else {
      toast.add({
        title: 'Konfirmasi Berhasil & Email Terkirim!',
        description: `Notifikasi aktif telah dikirim ke ${selectedOrder.value.customer_email}.`,
        color: 'success',
        icon: 'i-lucide-mail-check'
      })
    }

    isConfirmOpen.value = false
    await refresh()
  } catch (err: unknown) {
    const msg = (err as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Gagal mengonfirmasi pesanan.'
    toast.add({
      title: 'Kesalahan',
      description: msg,
      color: 'error'
    })
  } finally {
    isProcessing.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-highlighted">
          Antrean Aktivasi Paket Custom Gmail
        </h1>
        <p class="text-sm text-muted">
          Daftar pesanan paket Custom Gmail yang sudah LUNAS dan riwayat yang telah dikonfirmasi.
        </p>
      </div>

      <UButton
        icon="i-lucide-refresh-cw"
        color="neutral"
        variant="subtle"
        label="Muat Ulang Antrean"
        :loading="status === 'pending'"
        @click="refresh()"
      />
    </div>

    <UCard>
      <template #header>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="text-sm font-bold text-highlighted">
              Daftar Antrean &amp; Riwayat ({{ filteredQueue.length }})
            </span>
            <UBadge
              color="neutral"
              variant="subtle"
              size="xs"
              icon="i-lucide-scroll-text"
            >
              Scroll View
            </UBadge>
          </div>

          <!-- FITUR SEARCH ANTREAN CUSTOM GMAIL -->
          <div class="w-full sm:w-80">
            <UInput
              v-model="searchQuery"
              icon="i-lucide-search"
              placeholder="Cari No. Invoice, Gmail, atau Paket..."
              size="sm"
              class="w-full"
            />
          </div>
        </div>
      </template>

      <div
        v-if="!filteredQueue.length"
        class="py-10 text-center text-sm text-muted"
      >
        {{ searchQuery ? 'Tidak ada antrean yang cocok dengan pencarian Anda.' : 'Tidak ada antrean paket Custom Gmail saat ini.' }}
      </div>

      <!-- SCROLL VIEW CONTAINER AGAR HALAMAN TIDAK MEMANJANG -->
      <div
        v-else
        class="max-h-130 overflow-y-auto overflow-x-auto pr-1 border border-default rounded-xl"
      >
        <table class="w-full text-left border-collapse text-sm">
          <thead class="sticky top-0 z-10 bg-elevated border-b border-default text-xs text-muted uppercase">
            <tr>
              <th class="py-2.5 px-3">
                No. Invoice
              </th>
              <th class="py-2.5 px-3">
                Paket Aplikasi
              </th>
              <th class="py-2.5 px-3">
                Target Custom Gmail (Upgrade)
              </th>
              <th class="py-2.5 px-3">
                Email Penerima Invoice
              </th>
              <th class="py-2.5 px-3">
                Status Proses
              </th>
              <th class="py-2.5 px-3 text-right">
                Aksi Admin
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr
              v-for="item in filteredQueue"
              :key="item.id"
              class="hover:bg-elevated/40"
            >
              <td class="py-3 px-3 font-mono font-bold text-highlighted whitespace-nowrap">
                {{ item.id }}
              </td>
              <td class="py-3 px-3">
                <div class="font-bold text-highlighted">
                  {{ item.product_name }}
                </div>
                <div class="text-xs text-muted">
                  {{ item.variant_name }} ({{ item.duration }})
                </div>
              </td>
              <td class="py-3 px-3">
                <span class="font-mono text-xs font-bold px-2.5 py-1 rounded bg-primary/10 text-primary">
                  {{ item.custom_gmail_account || item.customer_email }}
                </span>
              </td>
              <td class="py-3 px-3 font-mono text-xs text-muted">
                {{ item.customer_email }}
              </td>
              <td class="py-3 px-3 whitespace-nowrap">
                <UBadge
                  :color="item.custom_gmail_status === 'completed' ? 'success' : 'warning'"
                  variant="subtle"
                  size="sm"
                >
                  {{ item.custom_gmail_status === 'completed' ? 'Selesai Dikonfirmasi' : 'Menunggu Admin' }}
                </UBadge>
              </td>
              <td class="py-3 px-3 text-right whitespace-nowrap">
                <UButton
                  v-if="item.custom_gmail_status !== 'completed'"
                  size="xs"
                  color="primary"
                  icon="i-lucide-send"
                  label="Konfirmasi Selesai & Kirim Email"
                  @click="promptConfirmOrder(item)"
                />
                <span
                  v-else
                  class="text-xs text-success font-medium"
                >
                  ✓ Terkirim
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <CommonConfirmDialog
      v-model:open="isConfirmOpen"
      title="Konfirmasi Aktivasi Custom Gmail"
      :description="`Apakah Anda sudah mengaktifkan paket '${selectedOrder?.product_name} - ${selectedOrder?.variant_name}' untuk akun '${selectedOrder?.custom_gmail_account}'? Sistem akan langsung mengirim email konfirmasi selesai ke pembeli.`"
      confirm-label="Ya, Sudah Aktif & Kirim Email"
      confirm-color="primary"
      :loading="isProcessing"
      @confirm="handleConfirmCompleted"
    />
  </div>
</template>
