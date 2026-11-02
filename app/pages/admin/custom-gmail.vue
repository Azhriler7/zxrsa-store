<!-- ==========================================================================
 FILE: app/pages/admin/custom-gmail.vue
 DESKRIPSI: Halaman Admin Konfirmasi Paket Custom Gmail & Trigger Kirim Email
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

const isConfirmOpen = ref(false)
const isProcessing = ref(false)
const selectedOrder = ref<{ id: string, targetGmail: string } | null>(null)

function promptConfirmOrder(id: string, targetGmail: string) {
  selectedOrder.value = { id, targetGmail }
  isConfirmOpen.value = true
}

async function handleConfirmCustomGmail() {
  if (!selectedOrder.value) return
  isProcessing.value = true

  try {
    await $fetch('/api/admin/custom-gmail-confirm', {
      method: 'POST',
      body: {
        invoice_id: selectedOrder.value.id
      }
    })

    toast.add({
      title: 'Konfirmasi Terkirim ke Gmail Pembeli!',
      description: `Invoice selesai telah dikirim otomatis ke ${selectedOrder.value.targetGmail}.`,
      color: 'success',
      icon: 'i-lucide-mail-check'
    })

    isConfirmOpen.value = false
    await refresh()
  } catch (err: unknown) {
    const msg = (err as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Gagal mengirim konfirmasi.'
    toast.add({ title: 'Kesalahan', description: msg, color: 'error' })
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
          Antrean Konfirmasi Custom Gmail
        </h1>
        <p class="text-sm text-muted">
          Daftar pembeli paket Custom Gmail yang sudah LUNAS. Klik tombol Konfirmasi setelah Anda mengaktifkan akun mereka agar Invoice terkirim otomatis ke Gmail pembeli.
        </p>
      </div>

      <UButton
        icon="i-lucide-refresh-cw"
        color="neutral"
        variant="subtle"
        label="Refresh Antrean"
        :loading="status === 'pending'"
        @click="refresh()"
      />
    </div>

    <UCard>
      <div
        v-if="!data?.queue.length"
        class="py-10 text-center text-sm text-muted"
      >
        Tidak ada antrean paket Custom Gmail saat ini.
      </div>

      <div
        v-else
        class="overflow-x-auto"
      >
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="border-b border-default text-xs text-muted uppercase">
              <th class="py-2.5 px-3">
                Invoice
              </th>
              <th class="py-2.5 px-3">
                Aplikasi & Paket
              </th>
              <th class="py-2.5 px-3">
                Akun Gmail Pembeli (Target Premium)
              </th>
              <th class="py-2.5 px-3">
                Status Proses
              </th>
              <th class="py-2.5 px-3">
                Waktu Lunas
              </th>
              <th class="py-2.5 px-3 text-right">
                Aksi Admin
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr
              v-for="item in data.queue"
              :key="item.id"
              class="hover:bg-elevated/40"
            >
              <td class="py-3 px-3 font-mono text-xs font-bold">
                {{ item.id }}
              </td>
              <td class="py-3 px-3">
                <div class="font-semibold text-highlighted">
                  {{ item.product_name }}
                </div>
                <div class="text-xs text-muted">
                  {{ item.variant_name }} ({{ item.duration }})
                </div>
              </td>
              <td class="py-3 px-3">
                <div class="font-mono font-bold text-primary">
                  {{ item.custom_gmail_account || item.customer_email }}
                </div>
                <div class="text-xs text-muted">
                  Email Penerima Invoice: {{ item.customer_email }}
                </div>
              </td>
              <td class="py-3 px-3">
                <UBadge
                  :color="item.custom_gmail_status === 'completed' ? 'success' : 'warning'"
                  variant="subtle"
                  size="sm"
                  :icon="item.custom_gmail_status === 'completed' ? 'i-lucide-check-check' : 'i-lucide-hourglass'"
                >
                  {{ item.custom_gmail_status === 'completed' ? 'Sudah Dikonfirmasi & Terkirim' : 'Menunggu Konfirmasi Admin' }}
                </UBadge>
              </td>
              <td class="py-3 px-3 font-mono text-xs text-muted">
                {{ item.paid_at || item.created_at }}
              </td>
              <td class="py-3 px-3 text-right">
                <UTooltip text="Kirim email konfirmasi selesai ke Gmail pembeli">
                  <UButton
                    size="xs"
                    :color="item.custom_gmail_status === 'completed' ? 'neutral' : 'success'"
                    :variant="item.custom_gmail_status === 'completed' ? 'subtle' : 'solid'"
                    icon="i-lucide-send"
                    :label="item.custom_gmail_status === 'completed' ? 'Kirim Ulang Email' : 'Konfirmasi & Kirim Gmail'"
                    @click="promptConfirmOrder(item.id, item.custom_gmail_account || item.customer_email)"
                  />
                </UTooltip>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- DIALOG KONFIRMASI CUSTOM GMAIL -->
    <CommonConfirmDialog
      v-model:open="isConfirmOpen"
      title="Konfirmasi Aktivasi Custom Gmail"
      :description="`Apakah akun Gmail '${selectedOrder?.targetGmail}' sudah selesai dijadikan Premium? Mengklik tombol di bawah akan langsung mengirimkan email Invoice resmi ke pembeli.`"
      confirm-label="Ya, Sudah Aktif & Kirim Email"
      confirm-color="success"
      :loading="isProcessing"
      @confirm="handleConfirmCustomGmail"
    />
  </div>
</template>
