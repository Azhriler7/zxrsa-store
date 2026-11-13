<!-- ==========================================================================
 FILE: app/pages/admin/index.vue
 DESKRIPSI: Halaman Utama Dashboard Admin (Kartu Ringkasan, Grafik Batang
            Arus Uang Interaktif, & Scrollable System Audit Log).
=========================================================================== -->
<script setup lang="ts">
definePageMeta({
  middleware: ['admin-auth'],
  layout: 'admin'
})

useSeoMeta({
  title: 'Dashboard & Arus Uang — ZXRSA Admin'
})

const { data, status, refresh } = await useFetch('/api/admin/stats')

function formatRupiah(val: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val || 0)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-highlighted">
          Ringkasan Toko &amp; Arus Uang (Cashflow)
        </h1>
        <p class="text-sm text-muted">
          Pantau pendapatan real-time, grafik arus uang harian/mingguan/bulanan/tahunan, dan log sistem.
        </p>
      </div>

      <UButton
        icon="i-lucide-refresh-cw"
        color="neutral"
        variant="subtle"
        label="Muat Ulang Data"
        :loading="status === 'pending'"
        @click="refresh()"
      />
    </div>

    <!-- 1. EMPAT KARTU INDIKATOR OPERASIONAL CEPAT -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <AdminStatCard
        title="Total Pendapatan Lunas"
        :value="formatRupiah(data?.stats?.totalRevenue || 0)"
        :subtitle="`${data?.stats?.paidTransactionsCount || 0} Transaksi Berhasil`"
        icon="i-lucide-wallet"
        color="success"
      />
      <AdminStatCard
        title="Menunggu Pembayaran"
        :value="String(data?.stats?.pendingTransactionsCount || 0)"
        subtitle="Invoice QRIS Aktif"
        icon="i-lucide-qr-code"
        color="warning"
      />
      <AdminStatCard
        title="Antrean Custom Gmail"
        :value="String(data?.stats?.waitingCustomGmailCount || 0)"
        subtitle="Wajib Diproses Admin"
        icon="i-lucide-mail-warning"
        color="primary"
      />
      <AdminStatCard
        title="Total Stok Akun Ready"
        :value="`${data?.stats?.availableStocksCount || 0} Akun`"
        subtitle="Tersedia di Database D1"
        icon="i-lucide-package-check"
        color="neutral"
      />
    </div>

    <!-- 2. DASHBOARD & GRAFIK BATANG ARUS UANG INTERAKTIF (DI ATAS LOG) -->
    <AdminCashflowAnalyticsCard
      :lifetime-revenue="data?.stats?.lifetimeRevenue || 0"
      :lifetime-paid-count="data?.stats?.lifetimePaidCount || 0"
      :today-revenue="data?.stats?.todayRevenue || 0"
      :this-month-revenue="data?.stats?.thisMonthRevenue || 0"
      :daily-series="data?.dailyCashflow || []"
    />

    <!-- 3. SYSTEM AUDIT LOG (SCROLL VIEW CARD) -->
    <AdminSystemLogViewer :logs="data?.logs || []" />
  </div>
</template>
