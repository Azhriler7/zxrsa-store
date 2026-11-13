<!-- ==========================================================================
 FILE: app/pages/admin/invoices.vue
 DESKRIPSI: Halaman Admin CRUD Invoice & History Transaksi (Dilengkapi Fitur
            Search Instan, Filter Status, & Scroll View Card).
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
const statusFilter = ref<string>('all')
const searchQuery = ref<string>('')

const { data, status, refresh } = await useFetch('/api/admin/invoices', {
  query: {
    status: statusFilter
  }
})

const statusOptions = [
  { label: 'Semua Status', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Lunas', value: 'lunas' },
  { label: 'Expired', value: 'expired' },
  { label: 'Dibatalkan', value: 'dibatalkan' }
]

// Filter pencarian instan berdasarkan No. Invoice, Email, Custom Gmail, Aplikasi, Paket, atau Nominal
const filteredInvoices = computed(() => {
  const list = data.value?.invoices || []
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return list

  return list.filter((inv) => {
    return (
      inv.id.toLowerCase().includes(q)
      || inv.customer_email.toLowerCase().includes(q)
      || (inv.custom_gmail_account || '').toLowerCase().includes(q)
      || inv.product_name.toLowerCase().includes(q)
      || inv.variant_name.toLowerCase().includes(q)
      || String(inv.total_amount).includes(q)
    )
  })
})

const isProcessingId = ref<string | null>(null)
const isDeleteOpen = ref(false)
const deleteTargetId = ref<string | null>(null)

async function handleStatusChange(invoiceId: string, newStatus: TransactionStatus) {
  isProcessingId.value = invoiceId
  try {
    await $fetch('/api/admin/invoices-status', {
      method: 'POST',
      body: {
        action: 'update_status',
        id: invoiceId,
        transaction_id: invoiceId,
        status: newStatus
      }
    })

    toast.add({
      title: 'Status Invoice Diperbarui',
      description: `Invoice ${invoiceId} diubah menjadi ${newStatus.toUpperCase()}.`,
      color: 'success',
      icon: 'i-lucide-check-circle'
    })

    await refresh()
  } catch (err: unknown) {
    const msg = (err as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Gagal mengubah status invoice.'
    toast.add({ title: 'Kesalahan', description: msg, color: 'error' })
  } finally {
    isProcessingId.value = null
  }
}

async function handleResendEmail(invoiceId: string) {
  isProcessingId.value = invoiceId
  try {
    await $fetch('/api/admin/invoices-status', {
      method: 'POST',
      body: {
        action: 'resend_email',
        id: invoiceId,
        transaction_id: invoiceId
      }
    })

    toast.add({
      title: 'Email Berhasil Dikirim Ulang!',
      description: `Salinan Invoice ${invoiceId} telah dikirim kembali ke Gmail pembeli.`,
      color: 'success',
      icon: 'i-lucide-mail-check'
    })

    await refresh()
  } catch (err: unknown) {
    const msg = (err as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Gagal mengirim ulang email.'
    toast.add({ title: 'Gagal Kirim Email', description: msg, color: 'error' })
  } finally {
    isProcessingId.value = null
  }
}

function promptDeleteInvoice(invoiceId: string) {
  deleteTargetId.value = invoiceId
  isDeleteOpen.value = true
}

async function confirmDeleteInvoice() {
  if (!deleteTargetId.value) return
  isProcessingId.value = deleteTargetId.value

  try {
    await $fetch('/api/admin/invoices-status', {
      method: 'POST',
      body: {
        action: 'delete',
        id: deleteTargetId.value,
        transaction_id: deleteTargetId.value
      }
    })

    toast.add({
      title: 'Invoice Dihapus',
      description: `Invoice ${deleteTargetId.value} telah dihapus dari riwayat.`,
      color: 'success',
      icon: 'i-lucide-trash-2'
    })

    isDeleteOpen.value = false
    await refresh()
  } catch (err: unknown) {
    const msg = (err as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Gagal menghapus invoice.'
    toast.add({ title: 'Kesalahan', description: msg, color: 'error' })
  } finally {
    isProcessingId.value = null
  }
}

function formatRupiah(val: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-highlighted">
          Manajemen CRUD Invoice &amp; History Transaksi
        </h1>
        <p class="text-sm text-muted">
          Cari transaksi, ubah status lunas manual, atau kirim ulang email kredensial ke pembeli.
        </p>
      </div>

      <UButton
        icon="i-lucide-refresh-cw"
        color="neutral"
        variant="subtle"
        label="Muat Ulang"
        :loading="status === 'pending'"
        @click="refresh()"
      />
    </div>

    <UCard>
      <template #header>
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <!-- FILTER TAB STATUS -->
          <div class="flex flex-wrap items-center gap-1.5">
            <UButton
              v-for="opt in statusOptions"
              :key="opt.value"
              size="xs"
              :color="statusFilter === opt.value ? 'primary' : 'neutral'"
              :variant="statusFilter === opt.value ? 'solid' : 'subtle'"
              :label="opt.label"
              @click="statusFilter = opt.value"
            />
          </div>

          <!-- FITUR SEARCH INVOICE & HISTORY -->
          <div class="flex items-center gap-2 w-full lg:w-96">
            <UInput
              v-model="searchQuery"
              icon="i-lucide-search"
              placeholder="Cari ID Invoice, Email, Paket, atau Nominal..."
              size="sm"
              class="flex-1"
            />
            <UBadge
              color="neutral"
              variant="subtle"
              size="xs"
              class="shrink-0"
            >
              {{ filteredInvoices.length }} Data
            </UBadge>
          </div>
        </div>
      </template>

      <div
        v-if="!filteredInvoices.length"
        class="py-10 text-center text-sm text-muted"
      >
        {{ searchQuery ? 'Tidak ada invoice yang cocok dengan kata kunci pencarian.' : 'Belum ada data transaksi pada filter ini.' }}
      </div>

      <!-- SCROLL VIEW CONTAINER AGAR HALAMAN TIDAK MEMANJANG -->
      <div
        v-else
        class="max-h-135 overflow-y-auto overflow-x-auto pr-1 border border-default rounded-xl"
      >
        <table class="w-full text-left border-collapse text-sm">
          <thead class="sticky top-0 z-10 bg-elevated border-b border-default text-xs text-muted uppercase">
            <tr>
              <th class="py-2.5 px-3">
                No. Invoice &amp; Waktu
              </th>
              <th class="py-2.5 px-3">
                Email Pembeli
              </th>
              <th class="py-2.5 px-3">
                Aplikasi &amp; Paket
              </th>
              <th class="py-2.5 px-3">
                Total Tagihan
              </th>
              <th class="py-2.5 px-3">
                Status
              </th>
              <th class="py-2.5 px-3">
                Ubah Status
              </th>
              <th class="py-2.5 px-3 text-right">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr
              v-for="inv in filteredInvoices"
              :key="inv.id"
              class="hover:bg-elevated/40"
            >
              <td class="py-3 px-3 whitespace-nowrap">
                <NuxtLink
                  :to="`/invoice/${inv.invoice_token}`"
                  target="_blank"
                  class="font-mono font-bold text-primary hover:underline block"
                >
                  {{ inv.id }}
                </NuxtLink>
                <span class="text-[11px] font-mono text-muted">{{ inv.created_at }}</span>
              </td>

              <td class="py-3 px-3">
                <div class="font-mono text-xs text-highlighted">
                  {{ inv.customer_email }}
                </div>
                <div
                  v-if="inv.custom_gmail_account"
                  class="text-[11px] font-mono text-warning"
                >
                  Target: {{ inv.custom_gmail_account }}
                </div>
              </td>

              <td class="py-3 px-3">
                <div class="font-bold text-highlighted">
                  {{ inv.product_name }}
                </div>
                <div class="text-xs text-muted">
                  {{ inv.variant_name }} ({{ inv.duration }})
                </div>
              </td>

              <td class="py-3 px-3 font-mono font-bold text-highlighted whitespace-nowrap">
                {{ formatRupiah(inv.total_amount) }}
              </td>

              <td class="py-3 px-3 whitespace-nowrap">
                <CommonInvoiceStatusBadge :status="inv.status" />
              </td>

              <td class="py-3 px-3 whitespace-nowrap">
                <select
                  :value="inv.status"
                  :disabled="isProcessingId === inv.id"
                  class="rounded-md border border-default bg-default px-2 py-1 text-xs font-semibold text-highlighted focus:outline-none focus:ring-2 focus:ring-primary"
                  @change="handleStatusChange(inv.id, ($event.target as HTMLSelectElement).value as TransactionStatus)"
                >
                  <option value="pending">
                    PENDING
                  </option>
                  <option value="lunas">
                    LUNAS (Kirim Akun)
                  </option>
                  <option value="expired">
                    EXPIRED
                  </option>
                  <option value="dibatalkan">
                    DIBATALKAN
                  </option>
                </select>
              </td>

              <td class="py-3 px-3 text-right whitespace-nowrap space-x-1">
                <UTooltip
                  v-if="inv.status === 'lunas'"
                  text="Kirim Ulang Email Invoice ke Gmail"
                >
                  <UButton
                    size="xs"
                    color="primary"
                    variant="subtle"
                    icon="i-lucide-mail"
                    :loading="isProcessingId === inv.id"
                    @click="handleResendEmail(inv.id)"
                  />
                </UTooltip>

                <UTooltip text="Buka Halaman Invoice Pembeli">
                  <UButton
                    size="xs"
                    color="neutral"
                    variant="ghost"
                    icon="i-lucide-external-link"
                    :to="`/invoice/${inv.invoice_token}`"
                    target="_blank"
                  />
                </UTooltip>

                <UTooltip text="Hapus Invoice">
                  <UButton
                    size="xs"
                    color="error"
                    variant="ghost"
                    icon="i-lucide-trash-2"
                    :loading="isProcessingId === inv.id"
                    @click="promptDeleteInvoice(inv.id)"
                  />
                </UTooltip>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <CommonConfirmDialog
      v-model:open="isDeleteOpen"
      title="Hapus Riwayat Invoice"
      :description="`Apakah Anda yakin ingin menghapus Invoice '${deleteTargetId}' secara permanen?`"
      confirm-label="Ya, Hapus Invoice"
      confirm-color="error"
      :loading="Boolean(isProcessingId)"
      @confirm="confirmDeleteInvoice"
    />
  </div>
</template>
