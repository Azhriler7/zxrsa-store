<!-- ==========================================================================
 FILE: app/pages/admin/invoices.vue
 DESKRIPSI: Halaman Admin CRUD Invoice & History Pembelian Lengkap
=========================================================================== -->
<script setup lang="ts">
import type { TransactionStatus } from '~~/server/types/database'

definePageMeta({
  middleware: ['admin-auth'],
  layout: 'admin'
})

useSeoMeta({
  title: 'CRUD Invoice & History — ZXRSA Admin'
})

const toast = useToast()
const selectedStatusFilter = ref('all')

const { data, status, refresh } = await useFetch('/api/admin/invoices', {
  query: { status: selectedStatusFilter }
})

const isConfirmStatusOpen = ref(false)
const isUpdating = ref(false)
const pendingStatusChange = ref<{ invoiceId: string, newStatus: TransactionStatus } | null>(null)

const statusOptions: { label: string, value: TransactionStatus }[] = [
  { label: 'Lunas (Kirim Akun)', value: 'lunas' },
  { label: 'Pending', value: 'pending' },
  { label: 'Expired', value: 'expired' },
  { label: 'Dibatalkan', value: 'dibatalkan' },
  { label: 'Failed', value: 'failed' }
]

function promptStatusChange(invoiceId: string, newStatus: TransactionStatus) {
  pendingStatusChange.value = { invoiceId, newStatus }
  isConfirmStatusOpen.value = true
}

async function handleConfirmStatusChange() {
  if (!pendingStatusChange.value) return
  isUpdating.value = true

  try {
    await $fetch('/api/admin/invoices-status', {
      method: 'POST',
      body: {
        invoice_id: pendingStatusChange.value.invoiceId,
        status: pendingStatusChange.value.newStatus
      }
    })

    toast.add({
      title: 'Status Invoice Diperbarui',
      description: `Invoice ${pendingStatusChange.value.invoiceId} diubah menjadi ${pendingStatusChange.value.newStatus.toUpperCase()}.`,
      color: 'success',
      icon: 'i-lucide-check-circle'
    })

    isConfirmStatusOpen.value = false
    await refresh()
  } catch (err: unknown) {
    const msg = (err as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Gagal mengubah status invoice.'
    toast.add({ title: 'Kesalahan', description: msg, color: 'error' })
  } finally {
    isUpdating.value = false
  }
}

function formatRupiah(val: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}
</script>

<template>
  <div class="space-y-6">
    <!-- HEADER & FILTER STATUS -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-highlighted">
          CRUD Invoice & History Pembelian
        </h1>
        <p class="text-sm text-muted">
          Pantau seluruh transaksi masuk, validasi kode unik QRIS, dan kendalikan status pembayaran.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <select
          v-model="selectedStatusFilter"
          class="rounded-md border border-default bg-default px-3 py-1.5 text-sm text-highlighted"
        >
          <option value="all">
            Semua Status
          </option>
          <option value="lunas">
            Lunas
          </option>
          <option value="pending">
            Pending
          </option>
          <option value="expired">
            Expired
          </option>
          <option value="dibatalkan">
            Dibatalkan
          </option>
          <option value="failed">
            Failed
          </option>
        </select>

        <UButton
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="subtle"
          label="Refresh"
          :loading="status === 'pending'"
          @click="refresh()"
        />
      </div>
    </div>

    <!-- TABEL HISTORY INVOICE -->
    <UCard>
      <div
        v-if="!data?.invoices.length"
        class="py-10 text-center text-sm text-muted"
      >
        Belum ada riwayat transaksi yang sesuai dengan filter.
      </div>

      <div
        v-else
        class="overflow-x-auto"
      >
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="border-b border-default text-xs text-muted uppercase">
              <th class="py-2.5 px-3">
                ID Invoice
              </th>
              <th class="py-2.5 px-3">
                Pembeli (Gmail)
              </th>
              <th class="py-2.5 px-3">
                Produk & Paket
              </th>
              <th class="py-2.5 px-3">
                Total (+Kode Unik)
              </th>
              <th class="py-2.5 px-3">
                Status Bayar
              </th>
              <th class="py-2.5 px-3">
                Waktu Buat
              </th>
              <th class="py-2.5 px-3 text-right">
                Ubah Status (CRUD)
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr
              v-for="inv in data.invoices"
              :key="inv.id"
              class="hover:bg-elevated/40"
            >
              <td class="py-3 px-3 font-mono text-xs font-bold text-highlighted">
                {{ inv.id }}
              </td>
              <td class="py-3 px-3">
                <div class="font-medium text-highlighted">
                  {{ inv.customer_email }}
                </div>
                <div
                  v-if="inv.custom_gmail_account"
                  class="text-xs text-warning"
                >
                  Target Gmail: {{ inv.custom_gmail_account }}
                </div>
              </td>
              <td class="py-3 px-3">
                <div class="font-semibold">
                  {{ inv.product_name }}
                </div>
                <div class="text-xs text-muted">
                  {{ inv.variant_name }} ({{ inv.duration }})
                </div>
              </td>
              <td class="py-3 px-3 font-mono">
                <div class="font-bold text-primary">
                  {{ formatRupiah(inv.total_amount) }}
                </div>
                <div class="text-xs text-muted">
                  Kode Unik: +{{ inv.unique_code }}
                </div>
              </td>
              <td class="py-3 px-3">
                <CommonInvoiceStatusBadge :status="inv.status" />
              </td>
              <td class="py-3 px-3 font-mono text-xs text-muted">
                {{ inv.created_at }}
              </td>
              <td class="py-3 px-3 text-right">
                <select
                  :value="inv.status"
                  class="rounded border border-default bg-default px-2 py-1 text-xs text-highlighted"
                  @change="promptStatusChange(inv.id, ($event.target as HTMLSelectElement).value as TransactionStatus)"
                >
                  <option
                    v-for="opt in statusOptions"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- DIALOG KONFIRMASI UBAH STATUS INVOICE -->
    <CommonConfirmDialog
      v-model:open="isConfirmStatusOpen"
      title="Konfirmasi Perubahan Status Invoice"
      :description="`Apakah Anda yakin ingin mengubah status invoice ${pendingStatusChange?.invoiceId} menjadi '${pendingStatusChange?.newStatus.toUpperCase()}'? Jika diubah ke LUNAS, sistem akan langsung mengambil stok dan mengirim email ke pembeli.`"
      confirm-label="Ya, Ubah Status"
      confirm-color="primary"
      :loading="isUpdating"
      @confirm="handleConfirmStatusChange"
    />
  </div>
</template>
