<!-- ==========================================================================
 FILE: app/pages/admin/index.vue
 DESKRIPSI: Halaman Utama Dashboard Admin (Menyatukan Komponen Lego StatCard
            dan SystemLogViewer).
=========================================================================== -->
<script setup lang="ts">
definePageMeta({
  middleware: ['admin-auth'],
  layout: 'admin'
})

useSeoMeta({
  title: 'Dashboard Admin — ZXRSA Store',
  robots: 'noindex, nofollow'
})

const { data, status, refresh } = await useFetch('/api/admin/stats')

// Helper format mata uang Rupiah (INTEGER)
function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount)
}
</script>

<template>
  <div class="space-y-6">
    <!-- HEADER DASHBOARD -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-highlighted">
          Ringkasan Toko & Keamanan
        </h1>
        <p class="text-sm text-muted">
          Pantau penjualan akun aplikasi premium, ketersediaan stok, dan aktivitas sistem.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          to="/admin/stocks"
          icon="i-lucide-upload"
          color="primary"
          label="Upload Stok .txt"
        />
      </div>
    </div>

    <!-- LEGO SECTION 1: KARTU STATISTIK -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <AdminStatCard
        title="Total Pendapatan"
        :value="formatRupiah(data?.metrics.totalRevenueLunas ?? 0)"
        :subtitle="`${data?.metrics.totalTransactionsLunas ?? 0} Transaksi Lunas`"
        icon="i-lucide-wallet"
        color="success"
        tooltip-text="Akumulasi nominal transaksi berstatus LUNAS"
      />

      <AdminStatCard
        title="Stok Akun Ready"
        :value="data?.metrics.availableStocksCount ?? 0"
        subtitle="Siap dikirim otomatis"
        icon="i-lucide-key-round"
        color="primary"
        tooltip-text="Jumlah akun berstatus 'available' di database D1"
      />

      <AdminStatCard
        title="Antrean Custom Gmail"
        :value="data?.metrics.waitingCustomGmailCount ?? 0"
        subtitle="Menunggu konfirmasi admin"
        icon="i-lucide-mail-warning"
        color="warning"
        tooltip-text="Pembelian paket Custom Gmail yang sudah LUNAS dan butuh diproses manual"
      />

      <AdminStatCard
        title="Menunggu Pembayaran"
        :value="data?.metrics.totalPendingTransactions ?? 0"
        subtitle="Invoice QRIS aktif"
        icon="i-lucide-clock"
        color="neutral"
        tooltip-text="Transaksi yang sedang mengunci stok sementara (Timer 10 menit)"
      />
    </div>

    <!-- LEGO SECTION 2: TABEL AUDIT LOG SISTEM -->
    <AdminSystemLogViewer
      :logs="data?.recentLogs ?? []"
      :loading="status === 'pending'"
      @refresh="refresh()"
    />
  </div>
</template>
